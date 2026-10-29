import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Upload, CheckCircle, AlertCircle, FileText, X } from 'lucide-react';
import { JobOpening } from '@/hooks/useJobOpenings';
import { Checkbox } from '@/components/ui/checkbox';
import { getApplicationChecklist, checklistComplete } from './applicationChecklist';

const applicationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  linkedin_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  cover_letter: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface JobApplicationFormProps {
  job: JobOpening;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobApplicationForm({ job, open, onOpenChange }: JobApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const checklist = getApplicationChecklist(job.slug);
  const [ticked, setTicked] = useState<boolean[]>([]);
  const cvRequired = checklist.length > 0;
  const allTicked = checklistComplete(ticked, checklist.length);
  const canSubmit = allTicked && (!cvRequired || !!resumeUrl);
  const toggleItem = (i: number, value: boolean) => {
    setTicked((prev) => {
      const next = checklist.map((_, idx) => !!prev[idx]);
      if (value) next[i] = true; else for (let k = i; k < next.length; k++) next[k] = false;
      return next;
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
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
      const filePath = `applications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL (or signed URL for private bucket)
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      setResumeUrl(urlData.publicUrl || filePath);
      toast.success('Resume uploaded successfully');
    } catch (err) {
      console.error('Error uploading resume:', err);
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

  const onSubmit = async (data: ApplicationFormData) => {
    if (!canSubmit) {
      toast.error(cvRequired && !resumeUrl ? 'Please upload your CV.' : 'Please tick every item in the checklist.');
      return;
    }
    setIsSubmitting(true);

    try {
      const applicationId = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from('job_applications')
        .insert({
          id: applicationId,
          job_id: job.id,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          linkedin_url: data.linkedin_url || null,
          portfolio_url: data.portfolio_url || null,
          cover_letter: [data.cover_letter, checklist.length ? `Confirmed checklist:\n- ${checklist.join('\n- ')}` : '']
            .filter(Boolean).join('\n\n') || null,
          resume_url: resumeUrl,
          status: 'new',
        });

      if (insertError) throw insertError;

      // Emails to the hiring team and the applicant; never block the success screen.
      supabase.functions
        .invoke('notify-job-application', { body: { application_id: applicationId } })
        .catch((e) => console.error('Application email failed:', e));

      setSubmitSuccess(true);
      toast.success('Application submitted successfully!');
      
      // Reset form after brief delay
      setTimeout(() => {
        reset();
        setResumeFile(null);
        setResumeUrl(null);
        setSubmitSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      console.error('Error submitting application:', err);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  // Reset ticks whenever the dialog closes
  if (!open && ticked.length) setTimeout(() => setTicked([]), 0);

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setResumeFile(null);
      setResumeUrl(null);
      setSubmitSuccess(false);
      onOpenChange(false);
    }
  };

  if (submitSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Application Submitted!</h3>
            <p className="text-muted-foreground">
              Thank you for applying for {job.title}. We'll review your application and get back to you soon.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            {job.department} • {job.location} • {job.employment_type} • Start: Late Jan 2027
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              {...register('phone')}
            />
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <Label>{cvRequired ? 'CV *' : 'Resume'}</Label>
            {resumeFile ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm truncate max-w-[200px]">{resumeFile.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeResume}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <label
                  htmlFor="resume"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {isUploading ? 'Uploading...' : 'Upload PDF or Word document (max 5MB)'}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* LinkedIn URL */}
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
            <Input
              id="linkedin_url"
              type="url"
              placeholder="https://linkedin.com/in/johndoe"
              {...register('linkedin_url')}
              className={errors.linkedin_url ? 'border-destructive' : ''}
            />
            {errors.linkedin_url && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.linkedin_url.message}
              </p>
            )}
          </div>

          {/* Portfolio URL */}
          <div className="space-y-2">
            <Label htmlFor="portfolio_url">Portfolio / Website</Label>
            <Input
              id="portfolio_url"
              type="url"
              placeholder="https://your-portfolio.com"
              {...register('portfolio_url')}
              className={errors.portfolio_url ? 'border-destructive' : ''}
            />
            {errors.portfolio_url && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.portfolio_url.message}
              </p>
            )}
          </div>

          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="cover_letter">Cover Letter</Label>
            <Textarea
              id="cover_letter"
              placeholder="Tell us why you'd be a great fit for this role..."
              rows={4}
              {...register('cover_letter')}
            />
          </div>

          {checklist.length > 0 && (
            <fieldset className="space-y-2 rounded-lg border border-border p-4">
              <legend className="px-1 text-sm font-semibold">Before you submit — tick each item in order *</legend>
              {checklist.map((item, i) => {
                const enabled = i === 0 || !!ticked[i - 1];
                return (
                  <label key={item} htmlFor={`chk-${i}`} className={`flex items-start gap-3 min-h-[44px] py-1 text-sm ${enabled ? 'cursor-pointer' : 'opacity-50'}`}>
                    <Checkbox id={`chk-${i}`} className="mt-0.5 h-5 w-5" checked={!!ticked[i]} disabled={!enabled}
                      onCheckedChange={(v) => toggleItem(i, v === true)} />
                    <span>{item}</span>
                  </label>
                );
              })}
              <p className="text-xs text-muted-foreground">{ticked.filter(Boolean).length} of {checklist.length} confirmed</p>
            </fieldset>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading || !canSubmit}
              className="flex-1 min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
