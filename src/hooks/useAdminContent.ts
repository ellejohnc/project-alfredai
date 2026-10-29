import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchAllRows } from '@/lib/supabasePaging';
import { useActivityLog } from './useActivityLog';

type TableName = 'webinars_events' | 'guides_playbooks' | 'blog_posts' | 'testimonials' | 'faqs' | 'documentation' | 'job_openings';
type ContentStatus = 'draft' | 'published' | 'archived';

const tableToResourceType: Record<TableName, 'blog_post' | 'webinar' | 'guide' | 'testimonial' | 'faq' | 'documentation' | 'job_opening'> = {
  blog_posts: 'blog_post',
  webinars_events: 'webinar',
  guides_playbooks: 'guide',
  testimonials: 'testimonial',
  faqs: 'faq',
  documentation: 'documentation',
  job_openings: 'job_opening',
};

export function useAdminContent<T extends { id: string; title?: string; question?: string; client_name?: string }>(tableName: TableName) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();

  // Paged, not because any content table is near the cap today — the largest
  // is blog_posts at 82 — but because this hook is shared by all seven admin
  // content pages, so whichever one grows past 1,000 first would silently show
  // the newest thousand and look completely normal doing it.
  //
  // That exact fault has now been found three times on this project: the GHL
  // sync tiles, the Bounce Dashboard reading 1,000 of 1,418 rows, and a third
  // before them. It is cheaper to page here once than to find it a fourth time
  // by noticing a number that looks slightly wrong.
  //
  // No status filter, deliberately: an admin list must show drafts. There are
  // none anywhere today, and that is a content fact rather than a bug — the
  // list would show them if they existed.
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await fetchAllRows<T>(tableName, (q) => q, '*', 'created_at');
      setItems(rows);
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      toast.error(`Failed to load ${tableName.replace('_', ' ')}`);
    } finally {
      setIsLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const getItem = async (id: string): Promise<T | null> => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching item:`, error);
      return null;
    }
    return data as unknown as T;
  };

  const createItem = async (data: Partial<T>, status: ContentStatus = 'draft'): Promise<T | null> => {
    const { data: user } = await supabase.auth.getUser();
    
    const insertData = {
      ...data,
      status,
      author_id: user.user?.id,
      published_at: status === 'published' ? new Date().toISOString() : null
    };

    const { data: newItem, error } = await supabase
      .from(tableName)
      .insert(insertData as any)
      .select()
      .single();

    if (error) {
      console.error(`Error creating item:`, error);
      throw new Error(error.message);
    }

    // Log activity
    const typedItem = newItem as unknown as T;
    const resourceName = (typedItem as any).title || (typedItem as any).question || (typedItem as any).client_name || 'Untitled';
    await logActivity({
      action: 'create',
      resourceType: tableToResourceType[tableName],
      resourceId: typedItem.id,
      resourceName,
    });

    await fetchItems();
    return typedItem;
  };

  const updateItem = async (id: string, data: Partial<T>, status?: ContentStatus): Promise<T | null> => {
    const updateData: Record<string, unknown> = { ...data };
    
    if (status) {
      updateData.status = status;
      if (status === 'published' && !updateData.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data: updatedItem, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating item:`, error);
      throw new Error(error.message);
    }

    // Log activity
    const typedItem = updatedItem as unknown as T;
    const resourceName = (typedItem as any).title || (typedItem as any).question || (typedItem as any).client_name || 'Untitled';
    await logActivity({
      action: 'update',
      resourceType: tableToResourceType[tableName],
      resourceId: typedItem.id,
      resourceName,
      details: status ? { statusChange: status } : undefined,
    });

    await fetchItems();
    return typedItem;
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    // Fetch item name before deleting for activity log
    const itemToDelete = items.find(item => item.id === id);
    const resourceName = itemToDelete 
      ? (itemToDelete as any).title || (itemToDelete as any).question || (itemToDelete as any).client_name || 'Untitled'
      : 'Unknown';

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting item:`, error);
      toast.error('Failed to delete item');
      return false;
    }

    // Log activity
    await logActivity({
      action: 'delete',
      resourceType: tableToResourceType[tableName],
      resourceId: id,
      resourceName,
    });

    toast.success('Item deleted successfully');
    await fetchItems();
    return true;
  };

  const updateStatus = async (id: string, status: ContentStatus): Promise<boolean> => {
    try {
      await updateItem(id, {} as Partial<T>, status);
      toast.success(`Item ${status === 'published' ? 'published' : status === 'archived' ? 'archived' : 'unpublished'}`);
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    items,
    isLoading,
    fetchItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    updateStatus
  };
}
