import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, CheckCircle2, Loader2, Mail, Briefcase } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AREAS_OF_INTEREST = [
  'Engineering',
  'Product',
  'Design',
  'Sales',
  'Marketing',
  'Customer Success',
  'Operations',
  'Other',
] as const;

const applicationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  linkedin_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  cover_letter: z.string().min(50, 'Please tell us more about yourself (at least 50 characters)'),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface GeneralApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GeneralApplicationForm({ open, onOpenChange }: GeneralApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      linkedin_url: '',
      portfolio_url: '',
      cover_letter: '',
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setResumeFile(file);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `general/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      setResumeUrl(publicUrl);
      toast.success('Resume uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload resume. Please try again.');
      setResumeFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeUrl(null);
  };

  const toggleArea = (area: string) => {
    setSelectedAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const onSubmit = async (data: ApplicationFormData) => {
    if (selectedAreas.length === 0) {
      toast.error('Please select at least one area of interest');
      return;
    }

    setIsSubmitting(true);
    try {
      const applicationId = crypto.randomUUID();
      const { error } = await supabase
        .from('job_applications')
        .insert({
          id: applicationId,
          job_id: null,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          resume_url: resumeUrl,
          cover_letter: data.cover_letter,
          linkedin_url: data.linkedin_url || null,
          portfolio_url: data.portfolio_url || null,
          status: 'new',
          is_general_application: true,
          areas_of_interest: selectedAreas,
        });

      if (error) throw error;

      // Emails to the hiring team and the applicant; never block the success screen.
      supabase.functions
        .invoke('notify-job-application', { body: { application_id: applicationId } })
        .catch((e) => console.error('Application email failed:', e));

      setSubmitSuccess(true);
      form.reset();
      setResumeFile(null);
      setResumeUrl(null);
      setSelectedAreas([]);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isUploading) {
      form.reset();
      setResumeFile(null);
      setResumeUrl(null);
      setSelectedAreas([]);
      setSubmitSuccess(false);
      onOpenChange(false);
    }
  };

  // Success state
  if (submitSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="mb-2 text-xl">Application Submitted!</DialogTitle>
            <DialogDescription className="mb-6">
              Thank you for your interest in joining our team. We'll review your application and get back to you soon.
            </DialogDescription>
            <Button onClick={handleClose} className="min-h-[44px] min-w-[120px]">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-5 w-5 text-primary" />
            <DialogTitle>Join Our Team</DialogTitle>
          </div>
          <DialogDescription>
            Don't see a perfect fit? Tell us about yourself and we'll keep you in mind for future opportunities.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name & Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" className="min-h-[44px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" className="min-h-[44px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1 (555) 000-0000" className="min-h-[44px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Areas of Interest */}
            <div className="space-y-2">
              <FormLabel>Areas of Interest *</FormLabel>
              <div className="flex flex-wrap gap-2">
                {AREAS_OF_INTEREST.map((area) => (
                  <Badge
                    key={area}
                    variant={selectedAreas.includes(area) ? 'default' : 'outline'}
                    className="cursor-pointer min-h-[36px] px-3 transition-colors hover:bg-primary/10"
                    onClick={() => toggleArea(area)}
                  >
                    {area}
                  </Badge>
                ))}
              </div>
              {selectedAreas.length === 0 && (
                <p className="text-sm text-muted-foreground">Select one or more areas</p>
              )}
            </div>

            {/* LinkedIn & Portfolio */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/..." className="min-h-[44px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portfolio_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio / Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." className="min-h-[44px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <FormLabel>Resume</FormLabel>
              {resumeFile ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                  <span className="truncate text-sm">{resumeFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeResume}
                    disabled={isUploading}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-primary/50 hover:bg-muted/50">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Upload PDF or Word (max 5MB)
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* Cover Letter */}
            <FormField
              control={form.control}
              name="cover_letter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tell us about yourself *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What makes you excited about joining our team? Share your experience, skills, and what you're looking for..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting || isUploading}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
