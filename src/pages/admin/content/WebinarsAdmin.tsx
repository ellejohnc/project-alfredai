import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { resolveImageUrl } from '@/lib/imageUtils';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { ContentTable } from '@/components/admin/ContentTable';
import { ContentForm, FormField } from '@/components/admin/ContentForm';
import { AdminContentFilters } from '@/components/admin/AdminContentFilters';
import { AdminFilters } from '@/components/admin/adminFilters';
import { getDefaultFilters, filterItems } from '@/components/admin/adminFilters';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminMetricsStrip, type AdminMetric } from '@/components/admin/AdminMetricsStrip';
import { Video } from 'lucide-react';
import { useAdminContent } from '@/hooks/useAdminContent';
import { supabase } from '@/integrations/supabase/client';
import { shortenLinksInContent } from '@/lib/linkShortener';
import { toast } from 'sonner';
import { LivePreviewPanel } from '@/components/admin/LivePreviewPanel';
import { useAdminFormatting } from '@/hooks/useAdminFormatting';

interface Webinar {
  id: string;
  title: string;
  description: string;
  content: string;
  event_date: string;
  event_type: string;
  registration_url: string;
  featured_image_url: string;
  presenter_name: string;
  presenter_title: string;
  presenter_image_url: string;
  video_url: string;
  is_featured: boolean;
  show_registration: boolean;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

const formFields: FormField[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter webinar title' },
  { name: 'is_featured', label: 'Feature this event (show in Featured Sessions carousel)', type: 'checkbox' },
  { name: 'show_registration', label: 'Show registration button (enable for users to register)', type: 'checkbox' },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Brief description of the event' },
  { name: 'content', label: 'Full Content', type: 'richtext', placeholder: 'Detailed content or agenda' },
  { name: 'event_date', label: 'Event Date & Time', type: 'datetime-local' },
  { 
    name: 'event_type', 
    label: 'Event Type', 
    type: 'select',
    options: [
      { value: 'webinar', label: 'Webinar' },
      { value: 'workshop', label: 'Workshop' },
      { value: 'conference', label: 'Conference' },
      { value: 'meetup', label: 'Meetup' },
      { value: 'summit', label: 'Summit' },
      { value: 'masterclass', label: 'Masterclass' },
      { value: 'live_demo', label: 'Live Demo' }
    ]
  },
  { name: 'presenter_name', label: 'Presenter Name', type: 'text', placeholder: 'e.g. John Smith' },
  { name: 'presenter_title', label: 'Presenter Title', type: 'text', placeholder: 'e.g. CEO, alfred ai' },
  { name: 'presenter_image_url', label: 'Presenter Image URL', type: 'url', placeholder: 'https://...' },
  { name: 'join_url', label: 'Live Session URL (for Join Live button)', type: 'url', placeholder: 'https://zoom.us/j/... or https://meet.google.com/...' },
  { name: 'video_url', label: 'Recording URL (YouTube/Vimeo/Loom)', type: 'url', placeholder: 'https://youtube.com/watch?v=...' },
  { name: 'registration_url', label: 'External Registration URL (optional - overrides built-in form)', type: 'url', placeholder: 'https://...' },
  { name: 'featured_image_url', label: 'Featured Image URL', type: 'url', placeholder: 'https://...' }
];

// Webinar Preview Component
function WebinarPreview({ item, itemId, isOpen, onClose }: { item: Partial<Webinar> | null; itemId?: string; isOpen: boolean; onClose: () => void }) {
  const { getTypeBadge } = useAdminFormatting();
  if (!item) return null;

  const publicUrl = itemId ? `/resources/webinars?event=${itemId}` : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Event Preview
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
                ? 'This is how the event appears on the public page.' 
                : 'This is how the event will appear when published.'}
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
              {item.event_type && (
                <Badge variant="secondary" className={getTypeBadge(item.event_type).color}>
                  {getTypeBadge(item.event_type).label}
                </Badge>
              )}
              {item.is_featured && (
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Featured</Badge>
              )}
              {item.show_registration && (
                <Badge variant="outline" className="text-xs">Registration Open</Badge>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {item.title || 'Your title will appear here'}
            </h2>
            
            {item.event_date && (
              <p className="text-primary font-medium mb-2">
                {format(new Date(item.event_date), 'PPP p')}
              </p>
            )}
            
            {item.presenter_name && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                {item.presenter_image_url && (
                  <img 
                    src={item.presenter_image_url} 
                    alt={item.presenter_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-foreground">{item.presenter_name}</p>
                  {item.presenter_title && (
                    <p className="text-sm text-muted-foreground">{item.presenter_title}</p>
                  )}
                </div>
              </div>
            )}
            
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
                This event is not yet visible on the public page
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WebinarsAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { items, isLoading, getItem, createItem, updateItem, deleteItem, updateStatus } = useAdminContent<Webinar>('webinars_events');
  const [editingItem, setEditingItem] = useState<Webinar | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [tile, setTile] = useState<'all' | 'upcoming' | 'broken-signup'>('all');
  const [filters, setFilters] = useState<AdminFilters>(getDefaultFilters());
  const [previewItem, setPreviewItem] = useState<{ data: Partial<Webinar>; id?: string } | null>(null);
  const [liveFormData, setLiveFormData] = useState<Partial<Webinar>>({});

  // Fetch registration counts for all webinars
  useEffect(() => {
    const fetchRegistrationCounts = async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('event_id');
      
      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach(reg => {
          counts[reg.event_id] = (counts[reg.event_id] || 0) + 1;
        });
        setRegistrationCounts(counts);
      }
    };
    fetchRegistrationCounts();
  }, [items]);

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
    let savedItem: Webinar | null = null;
    if (isEditing && id) {
      savedItem = await updateItem(id, data as Partial<Webinar>, status);
    } else {
      savedItem = await createItem(data as Partial<Webinar>, status);
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
          'webinar'
        );
        if (count > 0) {
          await updateItem(savedItem.id, { content: updatedHtml } as Partial<Webinar>);
          toast.success(`Published! ${count} link${count > 1 ? 's were' : ' was'} auto-shortened.`);
        }
      } catch (err) {
        console.error('[WebinarsAdmin] Link shortening failed:', err);
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
    const currentPreviewData = { ...editingItem, ...liveFormData } as Partial<Webinar>;
    const isPublished = currentPreviewData.status === 'published';
    const publicUrl = isPublished && id ? `/resources/webinars?event=${id}` : null;
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Panel */}
        <div>
          <ContentForm
            contentType="webinar"
            key={isCreating ? 'new' : (id || 'edit')}
            title={isCreating ? 'Create Webinar/Event' : 'Edit Webinar/Event'}
            fields={formFields}
            initialData={isCreating ? {} : (editingItem || {})}
            onSubmit={handleSubmit}
            onValuesChange={(data) => setLiveFormData(data)}
            backPath="/admin/webinars"
            isLoading={isLoadingItem}
          />
        </div>
        
        {/* Live Preview Panel */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <LivePreviewPanel 
              type="webinar" 
              data={currentPreviewData} 
              publicUrl={publicUrl}
            />
          </div>
        </div>
      </div>
    );
  }

  // Build extra badges for registration counts
  const extraBadges: Record<string, React.ReactNode> = {};
  items.forEach(item => {
    const count = registrationCounts[item.id] || 0;
    if (count > 0) {
      extraBadges[item.id] = (
        <Badge variant="outline" className="gap-1 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <Users className="h-3 w-3" />
          {count}
        </Badge>
      );
    }
  });

  // Apply filters
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
   * These two tiles are the page's actual problems rather than statistics.
   *
   * "Still ahead of us" reads ZERO, and that is the point — every one of the 21
   * published events has already happened, which is why both registration
   * tables read zero as a consequence rather than as a bug. A tile that always
   * showed a healthy number would hide that; this one states it.
   *
   * "Sign-up shown, no link" is worse and had never been surfaced anywhere:
   * NINE events render a registration call to action with no registration_url
   * behind it. Somebody clicking through on the public site gets nothing.
   */
  const isUpcoming = (w: Webinar) => !!w.event_date && new Date(w.event_date).getTime() >= Date.now();
  const hasBrokenSignup = (w: Webinar) => !!w.show_registration && !w.registration_url?.trim();

  const upcomingCount = items.filter(isUpcoming).length;
  const brokenSignupCount = items.filter(hasBrokenSignup).length;

  const metrics: AdminMetric[] = [
    { value: items.length, label: 'All events', onClick: () => setTile('all'), active: tile === 'all' },
    { value: upcomingCount, label: 'Still ahead of us', tone: upcomingCount === 0 ? 'warn' : 'good', onClick: () => setTile('upcoming'), active: tile === 'upcoming' },
    { value: brokenSignupCount, label: 'Sign-up shown, no link', tone: brokenSignupCount > 0 ? 'warn' : 'default', onClick: () => setTile('broken-signup'), active: tile === 'broken-signup' },
  ];

  const byTile = (list: Webinar[]) =>
    tile === 'upcoming' ? list.filter(isUpcoming)
    : tile === 'broken-signup' ? list.filter(hasBrokenSignup)
    : list;

  const filteredItems = byTile(filterItems(items, filters));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Webinars & Events"
        description="Manage your webinars and events"
        icon={<Video className="h-5 w-5 text-primary" />}
        onAdd={() => {
          setEditingItem(null);
          setLiveFormData({});
          navigate('/admin/webinars/new');
        }}
        addLabel="Add New"
      />

      <AdminMetricsStrip metrics={metrics} />

      <AdminContentFilters filters={filters} onFiltersChange={setFilters} />

      <ContentTable
        items={filteredItems}
        onEdit={(id) => navigate(`/admin/webinars/${id}`)}
        onDelete={deleteItem}
        onStatusChange={updateStatus}
        onPreview={handlePreview}
        isLoading={isLoading}
        extraBadges={extraBadges}
      />

      <WebinarPreview 
        item={previewItem?.data || null}
        itemId={previewItem?.id}
        isOpen={!!previewItem} 
        onClose={() => setPreviewItem(null)} 
      />
    </div>
  );
}
