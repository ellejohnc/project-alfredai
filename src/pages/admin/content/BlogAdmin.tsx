import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { shortenLinksInContent } from '@/lib/linkShortener';
import { toast } from 'sonner';
import { Eye, ExternalLink, FolderOpen, ImageIcon, Replace, Loader2 } from 'lucide-react';
import { resolveImageUrl } from '@/lib/imageUtils';
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
import { FileText } from 'lucide-react';
import { useAdminContent } from '@/hooks/useAdminContent';
import { LivePreviewPanel } from '@/components/admin/LivePreviewPanel';
import { AdminMetricsStrip, type AdminMetric } from '@/components/admin/AdminMetricsStrip';
import { ShortLinksPanel } from '@/components/admin/ShortLinksPanel';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { GoogleDriveImporter } from '@/components/admin/GoogleDriveImporter';
import { DriveImagePicker } from '@/components/admin/DriveImagePicker';
import { useBulkReplaceDriveImages } from '@/hooks/useBulkReplaceDriveImages';


interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featured_image_url: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

// Blog Preview Component
function BlogPreview({ item, isOpen, onClose }: { item: Partial<BlogPost> | null; isOpen: boolean; onClose: () => void }) {
  if (!item) return null;

  const publicUrl = item.slug ? `/resources/blog/${item.slug}` : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Blog Post Preview
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
                ? 'This is how the blog post appears on the public page.' 
                : 'This is how the blog post will appear when published.'}
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
              {/* Show ALL tags without slicing */}
              {item.tags?.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {item.title || 'Your title will appear here'}
            </h2>
            
            {item.excerpt && (
              <p className="text-muted-foreground mb-4">{item.excerpt}</p>
            )}
            
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(item.content || '<em>Your content will appear here</em>', {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'img', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'code'],
                  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'colspan', 'rowspan', 'scope']
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
                {item.status === 'published' ? 'Published' : item.status === 'archived' ? 'Archived' : 'Draft'}
              </Badge>
            </div>
            {item.status !== 'published' && (
              <span className="text-muted-foreground italic">
                This post is not yet visible on the public page
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BlogAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { items, isLoading, getItem, createItem, updateItem, deleteItem, updateStatus } = useAdminContent<BlogPost>('blog_posts');
  const [editingItem, setEditingItem] = useState<BlogPost | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [filters, setFilters] = useState<AdminFilters>(getDefaultFilters());
  const [previewItem, setPreviewItem] = useState<Partial<BlogPost> | null>(null);
  const [liveFormData, setLiveFormData] = useState<Partial<BlogPost>>({});
  const [tile, setTile] = useState<'all' | 'stale' | 'no-image'>('all');
  const [showDriveImporter, setShowDriveImporter] = useState(false);
  const [showDriveImagePicker, setShowDriveImagePicker] = useState(false);
  const [driveImageTarget, setDriveImageTarget] = useState<'featured' | 'content'>('featured');
  const { bulkReplace, isReplacing } = useBulkReplaceDriveImages();

  // Load categories dynamically from the database
  const { categories, refetch: refetchCategories } = useBlogCategories(true);

  const isCreating = location.pathname.endsWith('/new');
  const isEditing = !!id && !isCreating;

  // Build dynamic form fields with category dropdown
  const buildFormFields = (): FormField[] => {
    const categoryOptions = categories.map(c => ({ value: c, label: c }));

    return [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter blog post title' },
      { name: 'slug', label: 'URL Slug', type: 'text', placeholder: 'my-blog-post' },
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', placeholder: 'Brief summary for previews' },
      { name: 'content', label: 'Full Content', type: 'richtext', placeholder: 'Blog post content' },
      {
        name: 'category',
        label: 'Category',
        type: 'category-combobox',
        placeholder: 'Select or add a category',
        options: categoryOptions,
        onAddOption: () => refetchCategories(),
      },
      { name: 'tags', label: 'Tags (Topics)', type: 'tags', placeholder: 'Type and press Enter to add tags' },
      { name: 'featured_image_url', label: 'Featured Image URL', type: 'url', placeholder: 'https://...' }
    ];
  };

  // Clear auto-saved draft on status change (unpublish, archive) to prevent stale recovery dialogs
  const handleStatusChange = async (itemId: string, status: 'draft' | 'published' | 'archived'): Promise<boolean> => {
    const result = await updateStatus(itemId, status);
    // Remove any stored autosave for this item so the recovery dialog won't re-appear
    try {
      localStorage.removeItem(`alfred-autosave:blog:${itemId}`);
    } catch {
      // Nothing stored to clear, or storage is blocked. Either way the save stands.
    }
    return result;
  };

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

    let savedItem: BlogPost | null = null;

    if (isEditing && id) {
      savedItem = await updateItem(id, data as Partial<BlogPost>, status);
    } else {
      savedItem = await createItem(data as Partial<BlogPost>, status);
    }

    // Refetch categories so newly added ones appear immediately
    refetchCategories();

    // Auto-shorten links when publishing
    if (status === 'published' && savedItem && data.content) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        const { updatedHtml, count } = await shortenLinksInContent(
          data.content,
          savedItem.id,
          userId
        );

        if (count > 0) {
          // Save the content with shortened links
          await updateItem(savedItem.id, { content: updatedHtml } as Partial<BlogPost>);
          toast.success(`Published! ${count} link${count > 1 ? 's were' : ' was'} auto-shortened.`);
        }
      } catch (err) {
        // Non-fatal: publish succeeded, shortening failed silently
        console.error('[BlogAdmin] Link shortening failed:', err);
      }
    }
  };

  const handlePreview = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setPreviewItem(item);
    }
  };

  const handleDriveImport = (data: { title: string; slug: string; content: string; excerpt: string; tags: string[]; category: string; featured_image_url: string }) => {
    const newFormData: Partial<BlogPost> = {
      ...editingItem,
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      tags: data.tags,
      category: data.category,
      featured_image_url: data.featured_image_url,
    };
    setEditingItem(prev => prev ? { ...prev, ...newFormData } as BlogPost : null);
    setLiveFormData(newFormData);
    // Force re-mount the form with new initial data by navigating
    if (!isCreating && !id) {
      // We're in create mode already, just update formData
    }
  };

  if (isCreating || isEditing) {
    const currentPreviewData = { ...editingItem, ...liveFormData } as Partial<BlogPost>;
    const isPublished = currentPreviewData.status === 'published';
    const publicUrl = isPublished && currentPreviewData.slug ? `/resources/blog/${currentPreviewData.slug}` : null;

    // Use a stable storage key based on the post ID (or 'new')
    const storageKey = isEditing ? `blog:${id}` : 'blog:new';

    // Merge import data into initialData for the form
    const formInitialData = isCreating
      ? (Object.keys(liveFormData).length > 0 ? liveFormData : {})
      : (editingItem || {});
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Panel */}
        <div>
          <div className="flex items-center justify-end mb-3 gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDriveImageTarget('featured');
                setShowDriveImagePicker(true);
              }}
              className="flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Drive</span> Image
            </Button>
            {isEditing && id && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const result = await bulkReplace(id);
                  if (result && result.replacedCount > 0) {
                    // Reload the post to get updated content
                    const refreshed = await getItem(id);
                    if (refreshed) setEditingItem(refreshed);
                  }
                }}
                disabled={isReplacing}
                className="flex items-center gap-2"
              >
                {isReplacing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Replace className="w-4 h-4" />}
                <span className="hidden sm:inline">Replace Drive</span> Images
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDriveImporter(true)}
              className="flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Import from</span> Google Drive
            </Button>
          </div>
          <ContentForm
            contentType="blog"
            key={isCreating ? 'blog-new' : (id || 'edit')}
            title={isCreating ? 'Create Blog Post' : 'Edit Blog Post'}
            fields={buildFormFields()}
            initialData={formInitialData}
            onSubmit={handleSubmit}
            onValuesChange={(data) => setLiveFormData(data)}
            backPath="/admin/blog"
            isLoading={isLoadingItem}
            storageKey={storageKey}
          />
        </div>
        
        {/* Live Preview + Short Links Panel */}
        <div className="hidden lg:block">
          <div className="sticky top-4 space-y-4">
            <LivePreviewPanel 
              type="blog" 
              data={currentPreviewData} 
              publicUrl={publicUrl}
            />
            {isEditing && id && (
              <ShortLinksPanel postId={id} />
            )}
          </div>
        </div>

        <GoogleDriveImporter
          open={showDriveImporter}
          onClose={() => setShowDriveImporter(false)}
          onImport={handleDriveImport}
        />

        <DriveImagePicker
          open={showDriveImagePicker}
          onClose={() => setShowDriveImagePicker(false)}
          title={driveImageTarget === 'featured' ? 'Pick Featured Image from Drive' : 'Pick Image from Drive'}
          onSelect={(imageUrl, fileName) => {
            if (driveImageTarget === 'featured') {
              setLiveFormData(prev => ({ ...prev, featured_image_url: imageUrl }));
              setEditingItem(prev => prev ? { ...prev, featured_image_url: imageUrl } as BlogPost : null);
              toast.success(`Featured image set to "${fileName}"`);
            }
          }}
        />
      </div>
    );
  }

  /**
   * THE TILES BAND, which this page did not have at all.
   *
   * The Standard is five bands in order — title · tiles · toolbar · table ·
   * empty state — and every lead page has carried them since Stage C while the
   * seven content pages carried four. Tiles were the missing one.
   *
   * These are filters, not statistics, because the Standard says a tile that
   * does nothing when clicked does not belong. Which is also why there is no
   * "Published" tile: all 84 posts are published, so it would read 84 of 84 and
   * clicking it would select everything — the same reason "Reached GHL" was
   * taken off the Meta page when it read 1,521 of 1,521.
   *
   * The two that ARE here point at something worth acting on. Stale is the
   * blunt one: 13 posts have not been touched in six months and the oldest was
   * last edited on 30 December, which is the content problem already sitting
   * open on my list. Missing artwork is the one that shows on the public site.
   */
  const SIX_MONTHS_AGO = Date.now() - 1000 * 60 * 60 * 24 * 182;
  const isStale = (p: BlogPost) => new Date(p.updated_at).getTime() < SIX_MONTHS_AGO;
  const hasNoImage = (p: BlogPost) => !p.featured_image_url?.trim();

  const staleCount = items.filter(isStale).length;
  const noImageCount = items.filter(hasNoImage).length;

  const metrics: AdminMetric[] = [
    {
      value: items.length,
      label: 'All posts',
      onClick: () => setTile('all'),
      active: tile === 'all',
    },
    {
      value: staleCount,
      label: 'Not touched in 6 months',
      tone: staleCount > 0 ? 'warn' : 'default',
      onClick: () => setTile('stale'),
      active: tile === 'stale',
    },
    {
      value: noImageCount,
      label: 'No featured image',
      tone: noImageCount > 0 ? 'warn' : 'default',
      onClick: () => setTile('no-image'),
      active: tile === 'no-image',
    },
  ];

  const byTile = (list: BlogPost[]) =>
    tile === 'stale' ? list.filter(isStale)
    : tile === 'no-image' ? list.filter(hasNoImage)
    : list;

  const filteredItems = byTile(filterItems(items, filters));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Blog Posts"
        description="Manage your blog and insights"
        icon={<FileText className="h-5 w-5 text-primary" />}
        onAdd={() => {
          setEditingItem(null);
          setLiveFormData({});
          navigate('/admin/blog/new');
        }}
        addLabel="Add New"
      />


      <AdminMetricsStrip metrics={metrics} />

      <AdminContentFilters filters={filters} onFiltersChange={setFilters} />

      <ContentTable
        items={filteredItems}
        onEdit={(id) => navigate(`/admin/blog/${id}`)}
        onDelete={deleteItem}
        onStatusChange={handleStatusChange}
        onPreview={handlePreview}
        isLoading={isLoading}
      />

      <BlogPreview 
        item={previewItem} 
        isOpen={!!previewItem} 
        onClose={() => setPreviewItem(null)} 
      />
    </div>
  );
}
