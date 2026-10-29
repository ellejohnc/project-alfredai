import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Star, ExternalLink, AlertTriangle, Mail, ArrowLeft } from 'lucide-react';
import { SUPPORT_EMAIL } from '@/lib/siteConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ContentTable } from '@/components/admin/ContentTable';
import { ContentForm, FormField } from '@/components/admin/ContentForm';
import { AdminContentFilters } from '@/components/admin/AdminContentFilters';
import { AdminFilters } from '@/components/admin/adminFilters';
import { getDefaultFilters, filterItems } from '@/components/admin/adminFilters';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminMetricsStrip, type AdminMetric } from '@/components/admin/AdminMetricsStrip';
import { MessageSquareQuote } from 'lucide-react';
import { useAdminContent } from '@/hooks/useAdminContent';
import { LivePreviewPanel } from '@/components/admin/LivePreviewPanel';
import { headshotOptions } from '@/lib/headshotMapping';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface Testimonial {
  id: string;
  client_name: string;
  client_title: string;
  client_company: string;
  client_avatar_url: string;
  quote: string;
  rating: number;
  industry: string;
  video_url: string;
  is_featured: boolean;
  headshot_key: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

// Synced with database and public testimonials page
const industryOptions = [
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Professional Services', label: 'Professional Services' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Hospitality', label: 'Hospitality' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Construction', label: 'Construction' },
];

const formFields: FormField[] = [
  { name: 'client_name', label: 'Client Name', type: 'text', required: true, placeholder: 'John Doe' },
  { name: 'client_title', label: 'Client Title', type: 'text', placeholder: 'CEO' },
  { name: 'client_company', label: 'Company', type: 'text', placeholder: 'Acme Corp' },
  { name: 'quote', label: 'Testimonial Quote', type: 'textarea', required: true, placeholder: 'What the client said about your product/service' },
  { 
    name: 'rating', 
    label: 'Rating (1-5)', 
    type: 'select',
    options: [
      { value: '5', label: '5 Stars' },
      { value: '4', label: '4 Stars' },
      { value: '3', label: '3 Stars' },
      { value: '2', label: '2 Stars' },
      { value: '1', label: '1 Star' }
    ]
  },
  { 
    name: 'industry', 
    label: 'Industry', 
    type: 'select',
    options: industryOptions
  },
  {
    name: 'headshot_key',
    label: 'Assigned Headshot',
    type: 'select',
    options: headshotOptions,
    placeholder: 'Auto-assign based on name'
  },
  { name: 'video_url', label: 'Video URL (YouTube/Vimeo)', type: 'url', placeholder: 'https://youtube.com/watch?v=...' },
  { name: 'client_avatar_url', label: 'Client Photo URL (overrides headshot)', type: 'url', placeholder: 'https://...' },
  { name: 'is_featured', label: 'Featured Testimonial', type: 'checkbox' }
];

// Testimonial Preview Component
function TestimonialPreview({ item, isOpen, onClose }: { item: Partial<Testimonial> | null; isOpen: boolean; onClose: () => void }) {
  if (!item) return null;

  const publicUrl = '/impact/testimonials';
  const rating = typeof item.rating === 'string' ? parseInt(item.rating) : item.rating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Testimonial Preview
            </div>
            {item.status === 'published' && (
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
              {item.status === 'published' ? 'This is how the testimonial appears on the public page.' : 'This is how the testimonial will appear when published.'}
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={item.client_avatar_url} alt={item.client_name} />
                <AvatarFallback className="text-lg">{item.client_name?.split(' ').map(n => n[0]).join('') || '?'}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {item.industry && <Badge variant="secondary">{item.industry}</Badge>}
                  {item.is_featured && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Featured</Badge>}
                </div>
                
                <h3 className="font-semibold text-foreground">{item.client_name || 'Client Name'}</h3>
                {(item.client_title || item.client_company) && (
                  <p className="text-sm text-muted-foreground">{item.client_title}{item.client_title && item.client_company ? ' at ' : ''}{item.client_company}</p>
                )}
                
                {rating && (
                  <div className="flex items-center gap-1 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <blockquote className="mt-4 text-lg text-foreground italic border-l-4 border-primary pl-4">"{item.quote || 'The testimonial quote will appear here'}"</blockquote>
            
            {item.video_url && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Video testimonial: <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{item.video_url}</a></p>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={item.status === 'published' ? 'default' : 'secondary'} className={item.status === 'published' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                {item.status === 'published' ? 'Published' : item.status === 'draft' ? 'Draft' : 'Archived'}
              </Badge>
            </div>
            {item.status !== 'published' && <span className="text-muted-foreground italic">This testimonial is not yet visible on the public page</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TestimonialsAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { items, isLoading, getItem, createItem, updateItem, deleteItem, updateStatus } = useAdminContent<Testimonial>('testimonials');
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tile, setTile] = useState<'all' | 'featured' | 'video'>('all');
  const [filters, setFilters] = useState<AdminFilters>(getDefaultFilters());
  const [previewItem, setPreviewItem] = useState<Partial<Testimonial> | null>(null);
  const [liveFormData, setLiveFormData] = useState<Partial<Testimonial>>({});

  const isCreating = location.pathname.endsWith('/new');
  const isEditing = !!id && !isCreating;

  // Reset form state when switching to create mode
  useEffect(() => {
    if (isCreating) {
      setEditingItem(null);
      setLiveFormData({});
      setLoadError(null);
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
      setLoadError(null);
      getItem(id).then((item) => {
        if (item) {
          setEditingItem(item);
        } else {
          setLoadError(`Testimonial with ID "${id}" not found. It may have been deleted or you may not have access.`);
        }
        setIsLoadingItem(false);
      }).catch((err) => {
        setLoadError(err?.message || 'Failed to load testimonial');
        setIsLoadingItem(false);
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (data: Record<string, any>, status: 'draft' | 'published') => {
    // Convert rating to number
    if (data.rating) {
      data.rating = parseInt(data.rating);
    }
    
    // Convert 'auto' headshot_key back to null for database storage
    if (data.headshot_key === 'auto') {
      data.headshot_key = null;
    }
    
    if (isEditing && id) {
      await updateItem(id, data as Partial<Testimonial>, status);
    } else {
      await createItem(data as Partial<Testimonial>, status);
    }
  };

  const handlePreview = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setPreviewItem(item);
    }
  };

  // Error state - show fallback with navigation options
  if (isEditing && loadError) {
    const currentUrl = window.location.href;
    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=Admin%20Error%20Report&body=Error%20loading%20testimonial%0A%0AURL:%20${encodeURIComponent(currentUrl)}%0A%0AError:%20${encodeURIComponent(loadError)}`;
    
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Failed to Load Testimonial</AlertTitle>
          <AlertDescription className="mt-2">
            {loadError}
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/testimonials')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Testimonials
          </Button>
          <Button variant="outline" asChild>
            <a href={mailtoLink}>
              <Mail className="w-4 h-4 mr-2" />
              Report This Issue
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (isCreating || isEditing) {
    // Show loading skeleton when editing but item hasn't loaded yet
    if (isEditing && !editingItem && !loadError) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      );
    }
    
    const currentPreviewData = { ...editingItem, ...liveFormData } as Partial<Testimonial>;
    const isPublished = currentPreviewData.status === 'published';
    const publicUrl = isPublished ? '/impact/testimonials' : null;
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Panel */}
        <div>
          <ContentForm
            contentType="testimonial"
            key={isCreating ? 'new' : (id || 'edit')}
            title={isCreating ? 'Create Testimonial' : 'Edit Testimonial'}
            fields={formFields}
            initialData={isCreating ? {} : (editingItem ? { ...editingItem, rating: String(editingItem.rating), headshot_key: editingItem.headshot_key || 'auto' } : {})}
            onSubmit={handleSubmit}
            onValuesChange={(data) => setLiveFormData(data)}
            backPath="/admin/testimonials"
            isLoading={isLoadingItem}
          />
        </div>
        
        {/* Live Preview Panel */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <LivePreviewPanel 
              type="testimonial" 
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
   * Featured decides what appears on the site, and video is the small set worth
   * treating differently, so both earn a filter. Nine of 29 are featured and
   * four carry video — neither is the whole list, which is the test.
   *
   * No staleness tile: all 29 are over six months old, so it would select
   * everything and say nothing.
   */
  const isFeatured = (t: Testimonial) => !!t.is_featured;
  const hasVideo = (t: Testimonial) => !!t.video_url?.trim();

  const metrics: AdminMetric[] = [
    { value: items.length, label: 'All testimonials', onClick: () => setTile('all'), active: tile === 'all' },
    { value: items.filter(isFeatured).length, label: 'Featured on the site', onClick: () => setTile('featured'), active: tile === 'featured' },
    { value: items.filter(hasVideo).length, label: 'With video', onClick: () => setTile('video'), active: tile === 'video' },
  ];

  const byTile = (list: Testimonial[]) =>
    tile === 'featured' ? list.filter(isFeatured)
    : tile === 'video' ? list.filter(hasVideo)
    : list;

  const filteredItems = byTile(filterItems(items, filters, ['client_name', 'client_company', 'quote']));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Testimonials"
        description="Manage client testimonials"
        icon={<MessageSquareQuote className="h-5 w-5 text-primary" />}
        onAdd={() => {
          setEditingItem(null);
          setLiveFormData({});
          navigate('/admin/testimonials/new');
        }}
        addLabel="Add New"
      />

      <AdminMetricsStrip metrics={metrics} />

      <AdminContentFilters filters={filters} onFiltersChange={setFilters} />

      <ContentTable
        items={filteredItems}
        onEdit={(id) => navigate(`/admin/testimonials/${id}`)}
        onDelete={deleteItem}
        onStatusChange={updateStatus}
        onPreview={handlePreview}
        titleKey="client_name"
        isLoading={isLoading}
      />

      <TestimonialPreview 
        item={previewItem} 
        isOpen={!!previewItem} 
        onClose={() => setPreviewItem(null)} 
      />
    </div>
  );
}
