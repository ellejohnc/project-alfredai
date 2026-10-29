import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { shortenLinksInContent } from '@/lib/linkShortener';
import { toast } from 'sonner';
import { resolveImageUrl } from '@/lib/imageUtils';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Eye, ExternalLink } from 'lucide-react';
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
import { BulkPdfUpload } from '@/components/admin/BulkPdfUpload';
import { AdminContentFilters } from '@/components/admin/AdminContentFilters';
import { AdminFilters } from '@/components/admin/adminFilters';
import { getDefaultFilters, filterItems } from '@/components/admin/adminFilters';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminMetricsStrip, type AdminMetric } from '@/components/admin/AdminMetricsStrip';
import { BookOpen } from 'lucide-react';
import { useAdminContent } from '@/hooks/useAdminContent';
import { LivePreviewPanel } from '@/components/admin/LivePreviewPanel';

interface Guide {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  difficulty_level: string;
  estimated_read_time: number;
  featured_image_url: string;
  file_url: string;
  is_gated: boolean;
  is_featured: boolean;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

const formFields: FormField[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter guide title' },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Brief description of the guide' },
  { name: 'content', label: 'Full Content', type: 'richtext', placeholder: 'Detailed guide content' },
  { 
    name: 'category', 
    label: 'Category', 
    type: 'select',
    options: [
      { value: 'Implementation', label: 'Implementation' },
      { value: 'Playbook', label: 'Playbook' },
      { value: 'Framework', label: 'Framework' },
      { value: 'Technical', label: 'Technical' },
      { value: 'Best Practices', label: 'Best Practices' },
      { value: 'Strategy', label: 'Strategy' }
    ]
  },
  { 
    name: 'difficulty_level', 
    label: 'Difficulty Level', 
    type: 'select',
    options: [
      { value: 'Beginner', label: 'Beginner' },
      { value: 'Intermediate', label: 'Intermediate' },
      { value: 'Advanced', label: 'Advanced' }
    ]
  },
  { name: 'estimated_read_time', label: 'Estimated Read Time (minutes)', type: 'number', placeholder: '10' },
  { name: 'featured_image_url', label: 'Featured Image', type: 'image', placeholder: 'Upload or enter image URL' },
  { name: 'file_url', label: 'Downloadable File (PDF)', type: 'file', placeholder: 'Upload PDF file' },
  { 
    name: 'is_featured', 
    label: 'Feature this Guide', 
    type: 'checkbox'
  },
  { 
    name: 'is_gated', 
    label: 'Require Email to Access', 
    type: 'checkbox'
  }
];

// Guide Preview Component
function GuidePreview({ item, itemId, isOpen, onClose }: { item: Partial<Guide> | null; itemId?: string; isOpen: boolean; onClose: () => void }) {
  if (!item) return null;

  const publicUrl = itemId ? `/resources/guides/${itemId}` : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Guide Preview
            </div>
            {item.status === 'published' && publicUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(publicUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {item.status === 'published' 
                ? 'This is how the guide appears on the public page.' 
                : 'This is how the guide will appear when published.'}
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-6">
            {item.featured_image_url && (
              <img 
                src={resolveImageUrl(item.featured_image_url)} 
                alt={item.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {item.category && (
                <Badge variant="secondary">{item.category}</Badge>
              )}
              {item.difficulty_level && (
                <Badge variant="outline">{item.difficulty_level}</Badge>
              )}
              {item.estimated_read_time && (
                <Badge variant="outline" className="text-xs">
                  {item.estimated_read_time} min read
                </Badge>
              )}
              {item.is_featured && (
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Featured</Badge>
              )}
              {item.is_gated && (
                <Badge variant="outline" className="text-xs">Gated</Badge>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {item.title || 'Your title will appear here'}
            </h2>
            
            {item.description && (
              <p className="text-muted-foreground mb-4">{item.description}</p>
            )}
            
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(item.content || '<em>Your content will appear here</em>', {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'img', 'blockquote'],
                  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt']
                })
              }}
            />
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <Badge 
                variant={item.status === 'published' ? 'default' : 'secondary'}
                className={item.status === 'published' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
              >
                {item.status === 'published' ? 'Published' : item.status === 'draft' ? 'Draft' : 'Archived'}
              </Badge>
            </div>
            {item.status !== 'published' && (
              <span className="text-muted-foreground italic">
                This guide is not yet visible on the public page
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function GuidesAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { items, isLoading, getItem, createItem, updateItem, deleteItem, updateStatus, fetchItems } = useAdminContent<Guide>('guides_playbooks');
  const [editingItem, setEditingItem] = useState<Guide | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [tile, setTile] = useState<'all' | 'featured' | 'gated'>('all');
  const [filters, setFilters] = useState<AdminFilters>(getDefaultFilters());
  const [previewItem, setPreviewItem] = useState<{ data: Partial<Guide>; id?: string } | null>(null);
  const [liveFormData, setLiveFormData] = useState<Partial<Guide>>({});

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
    let savedItem: Guide | null = null;
    if (isEditing && id) {
      savedItem = await updateItem(id, data as Partial<Guide>, status);
    } else {
      savedItem = await createItem(data as Partial<Guide>, status);
    }

    // Auto-shorten links when publishing
    if (status === 'published' && savedItem && data.content) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        const { updatedHtml, count } = await shortenLinksInContent(
          data.content,
          savedItem.id,
          userId,
          'guide'
        );
        if (count > 0) {
          await updateItem(savedItem.id, { content: updatedHtml } as Partial<Guide>);
          toast.success(`Published! ${count} link${count > 1 ? 's were' : ' was'} auto-shortened.`);
        }
      } catch (err) {
        console.error('[GuidesAdmin] Link shortening failed:', err);
      }
    }
  };

  const handlePreview = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setPreviewItem({ data: item, id: itemId });
    }
  };

  if (isCreating || isEditing) {
    const currentPreviewData = { ...editingItem, ...liveFormData } as Partial<Guide>;
    const isPublished = currentPreviewData.status === 'published';
    const publicUrl = isPublished && id ? `/resources/guides/${id}` : null;
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Panel */}
        <div>
          <ContentForm
            contentType="guide"
            key={isCreating ? 'new' : (id || 'edit')}
            title={isCreating ? 'Create Guide/Playbook' : 'Edit Guide/Playbook'}
            fields={formFields}
            initialData={isCreating ? {} : (editingItem || {})}
            onSubmit={handleSubmit}
            onValuesChange={(data) => setLiveFormData(data)}
            backPath="/admin/guides"
            isLoading={isLoadingItem}
            autoDetectCategory={isCreating}
          />
        </div>
        
        {/* Live Preview Panel */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <LivePreviewPanel 
              type="guide" 
              data={currentPreviewData} 
              publicUrl={publicUrl}
            />
          </div>
        </div>
      </div>
    );
  }

  /**
   * THE TILES BAND, which this page did not have.
   *
   * The Standard is five bands in order — title · tiles · toolbar · table ·
   * empty state — and every content page carried four. Tiles were missing on
   * all seven, which had never been written down anywhere.
   *
   * These are filters, not statistics: the Standard says a tile that does
   * nothing when clicked does not belong, and neither does one that selects
   * the whole list.
   *
   * Guides carry two flags that genuinely change what a reader gets — featured
   * puts one on the site's shelf, gated puts it behind a form — and both are
   * small minorities of the list, so both are worth being able to isolate.
   *
   * There is deliberately no "not touched in 6 months" tile here even though
   * Blog has one: ALL 17 guides are over six months old, so it would read 17 of
   * 17 and clicking it would select everything.
   */
  const isFeatured = (g: Guide) => !!g.is_featured;
  const isGated = (g: Guide) => !!g.is_gated;

  const metrics: AdminMetric[] = [
    { value: items.length, label: 'All guides', onClick: () => setTile('all'), active: tile === 'all' },
    { value: items.filter(isFeatured).length, label: 'Featured on the site', onClick: () => setTile('featured'), active: tile === 'featured' },
    { value: items.filter(isGated).length, label: 'Gated behind a form', onClick: () => setTile('gated'), active: tile === 'gated' },
  ];

  const byTile = (list: Guide[]) =>
    tile === 'featured' ? list.filter(isFeatured)
    : tile === 'gated' ? list.filter(isGated)
    : list;

  const filteredItems = byTile(filterItems(items, filters));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Guides & Playbooks"
        description="Manage your guides and playbooks"
        icon={<BookOpen className="h-5 w-5 text-primary" />}
        onAdd={() => {
          setEditingItem(null);
          setLiveFormData({});
          navigate('/admin/guides/new');
        }}
        addLabel="Add New"
        actions={
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowBulkUpload(true)}
            className="gap-1.5"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Bulk PDF Upload</span>
          </Button>
        }
      />

      {/* Bulk PDF Upload Panel */}
      {showBulkUpload && (
        <BulkPdfUpload
          guides={items.map(g => ({ id: g.id, title: g.title, file_url: g.file_url, category: g.category }))}
          onComplete={() => {
            fetchItems();
            setShowBulkUpload(false);
          }}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

      <AdminMetricsStrip metrics={metrics} />

      <AdminContentFilters filters={filters} onFiltersChange={setFilters} />

      <ContentTable
        items={filteredItems}
        onEdit={(id) => navigate(`/admin/guides/${id}`)}
        onDelete={deleteItem}
        onStatusChange={updateStatus}
        onPreview={handlePreview}
        isLoading={isLoading}
        showAttachmentColumn={true}
      />

      <GuidePreview 
        item={previewItem?.data || null}
        itemId={previewItem?.id}
        isOpen={!!previewItem} 
        onClose={() => setPreviewItem(null)} 
      />
    </div>
  );
}
