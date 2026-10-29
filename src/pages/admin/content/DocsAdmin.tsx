import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import DOMPurify from 'dompurify';
import { ContentTable } from '@/components/admin/ContentTable';
import { ContentForm, FormField } from '@/components/admin/ContentForm';
import { AdminContentFilters } from '@/components/admin/AdminContentFilters';
import { AdminFilters } from '@/components/admin/adminFilters';
import { getDefaultFilters, filterItems } from '@/components/admin/adminFilters';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { FileCode } from 'lucide-react';
import { useAdminContent } from '@/hooks/useAdminContent';
import { LivePreviewPanel } from '@/components/admin/LivePreviewPanel';

interface Documentation {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  parent_id: string | null;
  sort_order: number;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

const formFields: FormField[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Documentation page title' },
  { name: 'slug', label: 'URL Slug', type: 'text', placeholder: 'getting-started' },
  { name: 'content', label: 'Content', type: 'richtext', placeholder: 'Documentation content' },
  { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g., Getting Started, API Reference' },
  { name: 'sort_order', label: 'Sort Order', type: 'number', placeholder: '0' }
];

// Documentation Preview Component
function DocPreview({ item, isOpen, onClose }: { item: Partial<Documentation> | null; isOpen: boolean; onClose: () => void }) {
  if (!item) return null;

  const publicUrl = item.slug ? `/documentation/${item.slug}` : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Documentation Preview
            </div>
            {item.status === 'published' && publicUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(publicUrl, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {item.status === 'published' ? 'This is how the page appears publicly.' : 'This is how the page will appear when published.'}
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              {item.category && <Badge variant="secondary">{item.category}</Badge>}
              {item.slug && <Badge variant="outline" className="text-xs font-mono">/{item.slug}</Badge>}
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-4">{item.title || 'Your title will appear here'}</h2>
            
            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content || '<em>Your content will appear here</em>', { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'img', 'blockquote', 'code', 'pre'], ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class'] }) }} />
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={item.status === 'published' ? 'default' : 'secondary'} className={item.status === 'published' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                {item.status === 'published' ? 'Published' : item.status === 'draft' ? 'Draft' : 'Archived'}
              </Badge>
            </div>
            {item.status !== 'published' && <span className="text-muted-foreground italic">This page is not yet visible publicly</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DocsAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { items, isLoading, getItem, createItem, updateItem, deleteItem, updateStatus } = useAdminContent<Documentation>('documentation');
  const [editingItem, setEditingItem] = useState<Documentation | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [filters, setFilters] = useState<AdminFilters>(getDefaultFilters());
  const [previewItem, setPreviewItem] = useState<Partial<Documentation> | null>(null);
  const [liveFormData, setLiveFormData] = useState<Partial<Documentation>>({});

  const isCreating = location.pathname.endsWith('/new');
  const isEditing = !!id && !isCreating;

  // Reset form state when switching to create mode
  useEffect(() => {
    if (isCreating) {
      setEditingItem(null);
      setLiveFormData({});
    }
  }, [isCreating]);

  // Reset liveFormData when editing a different item
  useEffect(() => {
    if (editingItem) {
      setLiveFormData({});
    }
  }, [editingItem?.id]);

  useEffect(() => {
    if (id && isEditing) {
      setIsLoadingItem(true);
      getItem(id).then((item) => {
        setEditingItem(item);
        setIsLoadingItem(false);
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (data: Record<string, any>, status: 'draft' | 'published') => {
    // Auto-generate slug if not provided
    if (!data.slug && data.title) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    
    if (isEditing && id) {
      await updateItem(id, data as Partial<Documentation>, status);
    } else {
      await createItem(data as Partial<Documentation>, status);
    }
  };

  const handlePreview = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setPreviewItem(item);
    }
  };

  if (isCreating || isEditing) {
    const currentPreviewData = { ...editingItem, ...liveFormData } as Partial<Documentation>;
    const isPublished = currentPreviewData.status === 'published';
    const publicUrl = isPublished && currentPreviewData.slug ? `/documentation/${currentPreviewData.slug}` : null;
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Panel */}
        <div>
          <ContentForm
            contentType="documentation"
            key={isCreating ? 'new' : (id || 'edit')}
            title={isCreating ? 'Create Documentation' : 'Edit Documentation'}
            fields={formFields}
            initialData={isCreating ? {} : (editingItem || {})}
            onSubmit={handleSubmit}
            onValuesChange={(data) => setLiveFormData(data)}
            backPath="/admin/docs"
            isLoading={isLoadingItem}
          />
        </div>
        
        {/* Live Preview Panel */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <LivePreviewPanel 
              type="doc" 
              data={currentPreviewData} 
              publicUrl={publicUrl}
            />
          </div>
        </div>
      </div>
    );
  }

  const filteredItems = filterItems(items, filters);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Documentation"
        description="Manage documentation pages"
        icon={<FileCode className="h-5 w-5 text-primary" />}
        onAdd={() => {
          setEditingItem(null);
          setLiveFormData({});
          navigate('/admin/docs/new');
        }}
        addLabel="Add New"
      />

      <AdminContentFilters filters={filters} onFiltersChange={setFilters} />

      <ContentTable
        items={filteredItems}
        onEdit={(id) => navigate(`/admin/docs/${id}`)}
        onDelete={deleteItem}
        onStatusChange={updateStatus}
        onPreview={handlePreview}
        isLoading={isLoading}
      />

      <DocPreview 
        item={previewItem} 
        isOpen={!!previewItem} 
        onClose={() => setPreviewItem(null)} 
      />
    </div>
  );
}
