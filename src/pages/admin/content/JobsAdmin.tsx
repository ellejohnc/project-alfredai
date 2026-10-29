import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAdminContent } from '@/hooks/useAdminContent';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Briefcase, Clock, DollarSign, Globe } from 'lucide-react';
import DOMPurify from 'dompurify';
import { ContentForm, type FormField } from '@/components/admin/ContentForm';
import { ContentTable } from '@/components/admin/ContentTable';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminContentFilters } from '@/components/admin/AdminContentFilters';
import { type AdminFilters } from '@/components/admin/adminFilters';
import { getDefaultFilters, filterItems } from '@/components/admin/adminFilters';
import { LivePreviewPanel } from '@/components/admin/LivePreviewPanel';

interface JobOpening {
  id: string;
  title: string;
  slug: string | null;
  department: string;
  location: string;
  employment_type: string;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  salary_range: string | null;
  is_remote: boolean;
  is_featured: boolean;
  application_url: string | null;
  sort_order: number;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

const departmentOptions = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Product', label: 'Product' },
  { value: 'Design', label: 'Design' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Customer Success', label: 'Customer Success' },
  { value: 'Operations', label: 'Operations' },
  { value: 'HR', label: 'Human Resources' },
  { value: 'Finance', label: 'Finance' },
];

const employmentTypeOptions = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Internship', label: 'Internship' },
];

const formFields: FormField[] = [
  { name: 'title', label: 'Job Title', type: 'text', required: true, placeholder: 'e.g., Senior AI/ML Engineer' },
  { name: 'slug', label: 'URL Slug', type: 'text', placeholder: 'auto-generated-from-title' },
  { name: 'department', label: 'Department', type: 'select', required: true, options: departmentOptions },
  { name: 'location', label: 'Location', type: 'text', required: true, placeholder: 'e.g., Remote (US)' },
  { name: 'employment_type', label: 'Employment Type', type: 'select', required: true, options: employmentTypeOptions },
  { name: 'salary_range', label: 'Salary Range', type: 'text', placeholder: 'e.g., $120k - $180k (optional)' },
  { name: 'description', label: 'Short Description', type: 'textarea', placeholder: 'Brief overview of the role (1-2 sentences)' },
  { name: 'responsibilities', label: 'Responsibilities', type: 'richtext', placeholder: 'What the candidate will do...' },
  { name: 'requirements', label: 'Requirements', type: 'richtext', placeholder: 'What we are looking for...' },
  { name: 'application_url', label: 'Application URL', type: 'text', placeholder: 'https://careers.example.com/apply/...' },
  { name: 'is_remote', label: 'Remote Position', type: 'checkbox' },
  { name: 'is_featured', label: 'Featured Job', type: 'checkbox' },
  { name: 'sort_order', label: 'Sort Order', type: 'number', placeholder: '0' },
];

function JobPreview({ item, isOpen, onClose }: { item: Partial<JobOpening> | null; isOpen: boolean; onClose: () => void }) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Job Preview</span>
            {item.status === 'published' && item.slug && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/company/careers/${item.slug}`} target="_blank" rel="noopener noreferrer">
                  View Live <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Header */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {item.department && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {item.department}
                </Badge>
              )}
              {item.location && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {item.location}
                </Badge>
              )}
              {item.employment_type && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.employment_type}
                </Badge>
              )}
              {item.is_remote && (
                <Badge className="bg-primary/10 text-primary flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Remote
                </Badge>
              )}
              {item.is_featured && (
                <Badge className="bg-secondary/10 text-secondary">Featured</Badge>
              )}
            </div>
            <h2 className="text-2xl font-bold text-foreground">{item.title || 'Untitled Position'}</h2>
            {item.salary_range && (
              <p className="text-muted-foreground flex items-center gap-1 mt-2">
                <DollarSign className="w-4 h-4" />
                {item.salary_range}
              </p>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">About This Role</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          )}

          {/* Responsibilities */}
          {item.responsibilities && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Responsibilities</h3>
              <div 
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.responsibilities) }}
              />
            </div>
          )}

          {/* Requirements */}
          {item.requirements && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Requirements</h3>
              <div 
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.requirements) }}
              />
            </div>
          )}

          {/* Status */}
          <div className="pt-4 border-t">
            <Badge variant={item.status === 'published' ? 'default' : item.status === 'archived' ? 'secondary' : 'outline'}>
              {item.status || 'draft'}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function JobsAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isCreating = searchParams.get('new') === 'true';
  
  const { items, isLoading, createItem, updateItem, deleteItem, updateStatus, getItem } = useAdminContent<JobOpening>('job_openings');
  
  const [editingItem, setEditingItem] = useState<JobOpening | null>(null);
  const [liveFormData, setLiveFormData] = useState<Partial<JobOpening>>({});
  const [previewItem, setPreviewItem] = useState<Partial<JobOpening> | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [filters, setFilters] = useState<AdminFilters>(getDefaultFilters());

  // Load item for editing
  useEffect(() => {
    if (id && !isCreating) {
      getItem(id).then(item => {
        if (item) {
          setEditingItem(item);
          setLiveFormData(item);
        } else {
          toast.error('Job not found');
          navigate('/admin/jobs');
        }
      });
    } else if (isCreating) {
      setEditingItem(null);
      setLiveFormData({});
    }
  }, [id, isCreating, getItem, navigate]);

  const handleSubmit = async (data: Record<string, any>, status: 'draft' | 'published') => {
    try {
      // Auto-generate slug if not provided
      if (!data.slug && data.title) {
        data.slug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      if (editingItem) {
        await updateItem(editingItem.id, data as Partial<JobOpening>, status);
        toast.success('Job updated successfully');
      } else {
        await createItem(data as Partial<JobOpening>, status);
        toast.success('Job created successfully');
      }
      navigate('/admin/jobs');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save job');
    }
  };

  const handlePreview = (item: JobOpening) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  };

  const handleFormChange = (data: Record<string, any>) => {
    setLiveFormData(data);
  };

  // Filter items using the standard filter function
  const filteredItems = filterItems(items, filters);

  if (id || isCreating) {
    return (
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <ContentForm
            contentType="job"
            title={editingItem ? 'Edit Job Opening' : 'New Job Opening'}
            fields={formFields}
            initialData={editingItem || {}}
            onSubmit={handleSubmit}
            backPath="/admin/jobs"
            onValuesChange={handleFormChange}
          />
        </div>
        <div className="w-96 flex-shrink-0">
          <LivePreviewPanel
            type="guide"
            data={{
              ...liveFormData,
              title: liveFormData.title || 'Job Title',
              description: liveFormData.description,
              content: `
                ${liveFormData.responsibilities ? `<h3>Responsibilities</h3>${liveFormData.responsibilities}` : ''}
                ${liveFormData.requirements ? `<h3>Requirements</h3>${liveFormData.requirements}` : ''}
              `,
              category: liveFormData.department,
              difficulty_level: liveFormData.employment_type,
              is_featured: liveFormData.is_featured,
              status: editingItem?.status || 'draft',
            }}
            publicUrl={editingItem?.status === 'published' && editingItem?.slug ? `/company/careers/${editingItem.slug}` : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Job Openings"
        description="Manage career opportunities displayed on the Careers page"
        onAdd={() => navigate('/admin/jobs?new=true')}
        addLabel="Add Job"
      />

      <AdminContentFilters
        filters={filters}
        onFiltersChange={setFilters}
        showStatusFilter={true}
        showSearch={true}
        searchPlaceholder="Search jobs..."
      />

      <ContentTable
        items={filteredItems}
        isLoading={isLoading}
        onEdit={(id) => navigate(`/admin/jobs/${id}`)}
        onDelete={deleteItem}
        onStatusChange={updateStatus}
        onPreview={(id) => {
          const item = items.find(i => i.id === id);
          if (item) handlePreview(item);
        }}
      />

      <JobPreview
        item={previewItem}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}
