import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns all unique categories from published blog posts (for public page)
 * or all blog posts (for admin).
 */
export function useBlogCategories(adminMode = false) {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('blog_posts')
      .select('category')
      .not('category', 'is', null);

    if (!adminMode) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;
    if (!error && data) {
      const unique = Array.from(
        new Set(
          data
            .map((r: any) => r.category as string)
            .filter(Boolean)
            .map((c) => c.trim())
        )
      ).sort();
      setCategories(unique);
    }
    setIsLoading(false);
  }, [adminMode]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, refetch: fetchCategories };
}

/**
 * Returns all unique tags from published blog posts (for public page)
 * or all blog posts (for admin).
 */
export function useBlogTags(adminMode = false) {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('blog_posts')
      .select('tags')
      .not('tags', 'is', null);

    if (!adminMode) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;
    if (!error && data) {
      const allTags = new Set<string>();
      data.forEach((r: any) => {
        if (Array.isArray(r.tags)) {
          r.tags.forEach((t: string) => {
            if (t) allTags.add(t.trim());
          });
        }
      });
      setTags(Array.from(allTags).sort());
    }
    setIsLoading(false);
  }, [adminMode]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return { tags, isLoading, refetch: fetchTags };
}
