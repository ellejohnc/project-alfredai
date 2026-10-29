import { useState, useEffect, useMemo } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { PRODUCTION_URL } from '@/lib/siteConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Mail, Send, Eye, Loader2, UserPlus, KeyRound, BookOpen, Calendar, Bell, Save, RotateCcw, Code, Type, History, Clock, Palette, Undo2, Monitor, Smartphone, Tablet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@/components/admin/AccessDenied';

type EmailTemplate = string;

interface TemplateConfig {
  name: string;
  icon: typeof Mail;
  description: string;
  testFields: Array<{
    key: string;
    label: string;
    placeholder: string;
    type?: 'text' | 'email' | 'select';
    options?: Array<{ value: string; label: string }>;
  }>;
}

interface StoredTemplate {
  id: string;
  template_key: string;
  subject: string;
  heading: string;
  body_text: string;
  button_text: string | null;
  footer_text: string | null;
  custom_html: string | null;
  use_custom_html: boolean;
  updated_at: string;
  // Color fields
  header_bg_start: string;
  header_bg_end: string;
  button_bg_start: string;
  button_bg_end: string;
  body_bg_color: string;
  footer_bg_color: string;
  text_color: string;
  heading_color: string;
  button_text_color: string;
}

interface TemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  subject: string;
  heading: string;
  body_text: string;
  button_text: string | null;
  footer_text: string | null;
  custom_html: string | null;
  use_custom_html: boolean;
  created_at: string;
  header_bg_start: string;
  header_bg_end: string;
  button_bg_start: string;
  button_bg_end: string;
  body_bg_color: string;
  footer_bg_color: string;
  text_color: string;
  heading_color: string;
  button_text_color: string;
}

const templates: Record<string, TemplateConfig> = {
  invite: {
    name: 'Admin Invitation',
    icon: UserPlus,
    description: 'Invite a new admin user to join the panel',
    testFields: [
      { key: 'inviterName', label: 'Inviter Name', placeholder: 'John Doe' },
      { key: 'role', label: 'Role', type: 'select', placeholder: 'Select role', options: [
        { value: 'editor', label: 'Editor' },
        { value: 'admin', label: 'Admin' },
        { value: 'super_admin', label: 'Super Admin' },
      ]},
    ],
  },
  credentials: {
    name: 'Login Credentials',
    icon: KeyRound,
    description: 'Send login credentials to a new user',
    testFields: [
      { key: 'displayName', label: 'Display Name', placeholder: 'John Doe' },
      { key: 'password', label: 'Temporary Password', placeholder: 'TempPass123!' },
      { key: 'role', label: 'Role', type: 'select', placeholder: 'Select role', options: [
        { value: 'editor', label: 'Editor' },
        { value: 'admin', label: 'Admin' },
        { value: 'super_admin', label: 'Super Admin' },
      ]},
    ],
  },
  'password-reset': {
    name: 'Password Reset',
    icon: KeyRound,
    description: 'Password reset request email',
    testFields: [
      { key: 'userName', label: 'User Name', placeholder: 'John' },
    ],
  },
  'guide-access': {
    name: 'Guide Access',
    icon: BookOpen,
    description: 'Send guide download access to a user',
    testFields: [
      { key: 'name', label: 'Recipient Name', placeholder: 'John Doe' },
      { key: 'guideTitle', label: 'Guide Title', placeholder: 'AI Automation Playbook' },
      { key: 'guideDescription', label: 'Guide Description', placeholder: 'A comprehensive guide...' },
    ],
  },
  registration: {
    name: 'Event Registration',
    icon: Calendar,
    description: 'Confirm event registration',
    testFields: [
      { key: 'name', label: 'Attendee Name', placeholder: 'John Doe' },
      { key: 'eventTitle', label: 'Event Title', placeholder: 'AI in Business Webinar' },
      { key: 'eventType', label: 'Event Type', type: 'select', placeholder: 'Select type', options: [
        { value: 'webinar', label: 'Webinar' },
        { value: 'workshop', label: 'Workshop' },
        { value: 'conference', label: 'Conference' },
      ]},
    ],
  },
  reminder: {
    name: 'Event Reminder',
    icon: Bell,
    description: 'Remind user about upcoming event',
    testFields: [
      { key: 'recipientName', label: 'Recipient Name', placeholder: 'John' },
      { key: 'eventTitle', label: 'Event Title', placeholder: 'AI in Business Webinar' },
      { key: 'eventDescription', label: 'Event Description', placeholder: 'Join us for...' },
    ],
  },
  'investor-approval': {
    name: 'Investor Approval',
    icon: UserPlus,
    description: 'Notify investor their access request was approved',
    testFields: [
      { key: 'investorName', label: 'Investor Name', placeholder: 'John Doe' },
      { key: 'accessCode', label: 'Access Code', placeholder: '12345678' },
    ],
  },
  'investor-rejection': {
    name: 'Investor Rejection',
    icon: Mail,
    description: 'Notify investor their access request was not approved',
    testFields: [
      { key: 'investorName', label: 'Investor Name', placeholder: 'John Doe' },
      { key: 'rejectionReason', label: 'Rejection Reason', placeholder: 'Unable to verify credentials' },
    ],
  },
  'investor-booking-scheduled': {
    name: 'Investor Meeting Scheduled',
    icon: Calendar,
    description: 'Confirm a scheduled investor meeting',
    testFields: [
      { key: 'investorName', label: 'Investor Name', placeholder: 'John Doe' },
      { key: 'eventName', label: 'Event Name', placeholder: 'Investor Call' },
      { key: 'startTime', label: 'Start Time', placeholder: '2026-01-15 10:00 AM' },
    ],
  },
  'investor-booking-canceled': {
    name: 'Investor Meeting Canceled',
    icon: Calendar,
    description: 'Notify about a canceled investor meeting',
    testFields: [
      { key: 'investorName', label: 'Investor Name', placeholder: 'John Doe' },
      { key: 'eventName', label: 'Event Name', placeholder: 'Investor Call' },
    ],
  },
  'investor-booking-noshow': {
    name: 'Investor No-Show',
    icon: Calendar,
    description: 'Record when an investor misses a meeting',
    testFields: [
      { key: 'investorName', label: 'Investor Name', placeholder: 'John Doe' },
      { key: 'eventName', label: 'Event Name', placeholder: 'Investor Call' },
    ],
  },
  'investor-request-notification': {
    name: 'Admin: New Investor Request',
    icon: Bell,
    description: 'Notify admins when a new investor access request is submitted',
    testFields: [
      { key: 'investorName', label: 'Investor Name', placeholder: 'John Doe' },
      { key: 'firmName', label: 'Firm Name', placeholder: 'Acme Ventures' },
      { key: 'role', label: 'Role', placeholder: 'General Partner' },
      { key: 'email', label: 'Email', placeholder: 'investor@example.com' },
    ],
  },
  'new_lead_notification': {
    name: 'Admin: New Lead Alert',
    icon: Bell,
    description: 'Notify sales team when a new lead is captured',
    testFields: [
      { key: 'lead_name', label: 'Lead Name', placeholder: 'John Doe' },
      { key: 'lead_email', label: 'Lead Email', placeholder: 'john@company.com' },
      { key: 'lead_phone', label: 'Phone', placeholder: '+61 400 000 000' },
      { key: 'lead_company', label: 'Company', placeholder: 'Acme Corp' },
      { key: 'source', label: 'Source', placeholder: 'AI Chatbot' },
      { key: 'source_page', label: 'Source Page', placeholder: 'Homepage' },
      { key: 'timestamp', label: 'Timestamp', placeholder: 'Jan 19, 2026, 10:30 AM' },
    ],
  },
};

function humanizeTemplateKey(key: string) {
  return key
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function getTemplateConfig(key: string): TemplateConfig {
  return (
    templates[key] ?? {
      name: humanizeTemplateKey(key),
      icon: Mail,
      description: 'Custom email template',
      testFields: [],
    }
  );
}

function blankTemplateForKey(key: string): Omit<StoredTemplate, 'id' | 'updated_at'> {
  return {
    template_key: key,
    subject: humanizeTemplateKey(key),
    heading: humanizeTemplateKey(key),
    body_text: '',
    button_text: null,
    footer_text: null,
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  };
}

// alfred ai brand color presets
const colorPresets = [
  { name: 'Alfred Default', headerStart: '#1e293b', headerEnd: '#334155', buttonStart: '#3b82f6', buttonEnd: '#2563eb' },
  { name: 'Signal Pink', headerStart: '#831843', headerEnd: '#be185d', buttonStart: '#ec4899', buttonEnd: '#db2777' },
  { name: 'Mint Fresh', headerStart: '#065f46', headerEnd: '#047857', buttonStart: '#10b981', buttonEnd: '#059669' },
  { name: 'Deep Indigo', headerStart: '#312e81', headerEnd: '#4338ca', buttonStart: '#6366f1', buttonEnd: '#4f46e5' },
  { name: 'Warm Amber', headerStart: '#78350f', headerEnd: '#b45309', buttonStart: '#f59e0b', buttonEnd: '#d97706' },
  { name: 'Royal Purple', headerStart: '#4a044e', headerEnd: '#7e22ce', buttonStart: '#a855f7', buttonEnd: '#9333ea' },
];

// Default color values
const defaultColors = {
  header_bg_start: '#1e293b',
  header_bg_end: '#334155',
  button_bg_start: '#3b82f6',
  button_bg_end: '#2563eb',
  body_bg_color: '#ffffff',
  footer_bg_color: '#f1f5f9',
  text_color: '#475569',
  heading_color: '#ffffff',
  button_text_color: '#ffffff',
};

// Default templates for fallback
const defaultTemplates: Record<string, Omit<StoredTemplate, 'id' | 'updated_at'>> = {
  invite: {
    template_key: 'invite',
    subject: "You're Invited to Join alfred ai Admin",
    heading: "You're Invited!",
    body_text: "You've been invited to join the alfred ai admin panel. Click the button below to set up your account and get started.",
    button_text: 'Accept Invitation',
    footer_text: 'This invitation will expire in 7 days.',
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  credentials: {
    template_key: 'credentials',
    subject: 'Your alfred ai Login Credentials',
    heading: 'Welcome to alfred ai',
    body_text: 'Your admin account has been created. Below are your login credentials. Please change your password after your first login.',
    button_text: 'Login Now',
    footer_text: 'Keep these credentials secure.',
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'password-reset': {
    template_key: 'password-reset',
    subject: 'Reset Your alfred ai Password',
    heading: 'Password Reset Request',
    body_text: 'We received a request to reset your password. Click the button below to create a new password.',
    button_text: 'Reset Password',
    footer_text: "If you didn't request this, you can safely ignore this email.",
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'guide-access': {
    template_key: 'guide-access',
    subject: 'Your Guide is Ready',
    heading: 'Your Download is Ready!',
    body_text: 'Thank you for your interest! Click the button below to access your guide.',
    button_text: 'Download Guide',
    footer_text: 'We hope you find this resource valuable.',
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  registration: {
    template_key: 'registration',
    subject: 'Registration Confirmed',
    heading: "You're Registered!",
    body_text: "Thank you for registering! We're excited to have you join us. Mark your calendar and we'll see you there.",
    button_text: 'Add to Calendar',
    footer_text: 'We look forward to seeing you!',
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  reminder: {
    template_key: 'reminder',
    subject: 'Event Reminder',
    heading: 'Event Starting Soon!',
    body_text: "This is a friendly reminder about your upcoming event. Don't forget to join us!",
    button_text: 'Join Event',
    footer_text: 'See you there!',
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'investor-approval': {
    template_key: 'investor-approval',
    subject: 'Your alfred ai Investor Portal Access Code',
    heading: 'Access Approved',
    body_text: 'Your request to access the alfred ai Investor Portal has been approved. Use the access code below to view our investor materials.',
    button_text: 'Access Investor Portal',
    footer_text: 'This access code is valid for 12 months.',
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'investor-rejection': {
    template_key: 'investor-rejection',
    subject: 'Update on Your alfred ai Investor Access Request',
    heading: 'Thank You for Your Interest',
    body_text: 'Thank you for your interest in alfred ai. After reviewing your request, we are unable to provide investor portal access at this time.',
    button_text: null,
    footer_text: 'If you have questions, please contact us.',
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'investor-booking-scheduled': {
    template_key: 'investor-booking-scheduled',
    subject: 'New Investor Meeting Scheduled',
    heading: 'Meeting Scheduled',
    body_text: 'Your investor meeting has been scheduled. We look forward to speaking with you.',
    button_text: 'View Meeting Details',
    footer_text: 'Add this to your calendar.',
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'investor-booking-canceled': {
    template_key: 'investor-booking-canceled',
    subject: 'Investor Meeting Canceled',
    heading: 'Meeting Canceled',
    body_text: 'Your scheduled investor meeting has been canceled.',
    button_text: 'Reschedule Meeting',
    footer_text: 'We hope to connect with you soon.',
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'investor-booking-noshow': {
    template_key: 'investor-booking-noshow',
    subject: 'Investor No-Show',
    heading: 'No-Show Recorded',
    body_text: 'We noticed you were unable to attend the scheduled investor meeting.',
    button_text: 'Reschedule Meeting',
    footer_text: 'Please reschedule at your convenience.',
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'investor-request-notification': {
    template_key: 'investor-request-notification',
    subject: '🔔 New Investor Access Request: {{investorName}} from {{firmName}}',
    heading: 'New Investor Access Request',
    body_text: 'A new investor has submitted an access request for the Investor Portal. Please review and approve or reject from the admin panel.',
    button_text: 'Review in Admin Panel',
    footer_text: 'This is an automated notification from alfred ai Investor Relations.',
    custom_html: null,
    use_custom_html: false,
    header_bg_start: '#dc2626',
    header_bg_end: '#991b1b',
    button_bg_start: '#3b82f6',
    button_bg_end: '#2563eb',
    body_bg_color: '#ffffff',
    footer_bg_color: '#f1f5f9',
    text_color: '#475569',
    heading_color: '#ffffff',
    button_text_color: '#ffffff',
  },
  'new_lead_notification': {
    template_key: 'new_lead_notification',
    subject: '🎯 New Lead: {{lead_name}} from {{source}}',
    heading: 'New Lead Alert',
    body_text: 'A new lead has been captured through the alfred ai website. Review the details below and follow up promptly.',
    button_text: 'View in Admin',
    footer_text: 'This is an automated notification from alfred ai.',
    custom_html: null,
    use_custom_html: false,
    header_bg_start: '#059669',
    header_bg_end: '#047857',
    button_bg_start: '#3b82f6',
    button_bg_end: '#2563eb',
    body_bg_color: '#ffffff',
    footer_bg_color: '#f1f5f9',
    text_color: '#475569',
    heading_color: '#ffffff',
    button_text_color: '#ffffff',
  },
};

// Color picker component
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-border"
        />
      </div>
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export default function EmailTemplatesAdmin() {
  const { canManageEmailTemplates } = usePermissions();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('invite');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testFormData, setTestFormData] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState<'fields' | 'colors' | 'html'>('fields');
  const [showHistory, setShowHistory] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Template editing state
  const [storedTemplates, setStoredTemplates] = useState<Record<string, StoredTemplate>>({});

  const [editedTemplate, setEditedTemplate] = useState<StoredTemplate | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Version history state
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const currentConfig = getTemplateConfig(selectedTemplate);

  const availableTemplateKeys = useMemo(() => {
    const keys = new Set<string>([...Object.keys(defaultTemplates), ...Object.keys(storedTemplates)]);
    // Ensure the currently-selected key always stays available
    keys.add(selectedTemplate);
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [selectedTemplate, storedTemplates]);

  // Fetch templates from database
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch versions when template changes
  useEffect(() => {
    if (storedTemplates[selectedTemplate]?.id) {
      fetchVersions(storedTemplates[selectedTemplate].id);
    } else {
      setVersions([]);
    }
  }, [selectedTemplate, storedTemplates]);

  // Update edited template when selection changes
  useEffect(() => {
    const stored = storedTemplates[selectedTemplate];
    if (stored) {
      setEditedTemplate({ ...stored });
    } else {
      const defaultTpl = defaultTemplates[selectedTemplate] ?? blankTemplateForKey(selectedTemplate);
      setEditedTemplate({
        id: '',
        updated_at: new Date().toISOString(),
        ...defaultTpl,
      });
    }
    setHasChanges(false);
  }, [selectedTemplate, storedTemplates]);

  // Guard AFTER every hook. This return sat in the middle of the hook list, so
  // eight hooks below it ran only once the permission resolved — React throws
  // "rendered more hooks than during the previous render" at that moment, which
  // is a crash on a slow auth check rather than a theoretical risk.
  if (!canManageEmailTemplates) {
    return <AccessDenied message="Only admins can manage email templates." requiredRole="Admin or Super Admin" />;
  }

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*');

      if (error) throw error;

      const templatesMap: Record<string, StoredTemplate> = {};
      data?.forEach((tpl: any) => {
        templatesMap[tpl.template_key] = {
          ...tpl,
          header_bg_start: tpl.header_bg_start || defaultColors.header_bg_start,
          header_bg_end: tpl.header_bg_end || defaultColors.header_bg_end,
          button_bg_start: tpl.button_bg_start || defaultColors.button_bg_start,
          button_bg_end: tpl.button_bg_end || defaultColors.button_bg_end,
          body_bg_color: tpl.body_bg_color || defaultColors.body_bg_color,
          footer_bg_color: tpl.footer_bg_color || defaultColors.footer_bg_color,
          text_color: tpl.text_color || defaultColors.text_color,
          heading_color: tpl.heading_color || defaultColors.heading_color,
          button_text_color: tpl.button_text_color || defaultColors.button_text_color,
        } as StoredTemplate;
      });
      setStoredTemplates(templatesMap);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async (templateId: string) => {
    setLoadingVersions(true);
    try {
      const { data, error } = await supabase
        .from('email_template_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false })
        .limit(20);

      if (error) throw error;
      setVersions((data || []) as TemplateVersion[]);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleTemplateFieldChange = (field: keyof StoredTemplate, value: string | boolean) => {
    if (!editedTemplate) return;
    setEditedTemplate({ ...editedTemplate, [field]: value });
    setHasChanges(true);
  };

  const handleApplyPreset = (preset: typeof colorPresets[0]) => {
    if (!editedTemplate) return;
    setEditedTemplate({
      ...editedTemplate,
      header_bg_start: preset.headerStart,
      header_bg_end: preset.headerEnd,
      button_bg_start: preset.buttonStart,
      button_bg_end: preset.buttonEnd,
    });
    setHasChanges(true);
    toast.success(`Applied "${preset.name}" color preset`);
  };

  const handleRevertToVersion = (version: TemplateVersion) => {
    if (!editedTemplate) return;
    
    setEditedTemplate({
      ...editedTemplate,
      subject: version.subject,
      heading: version.heading,
      body_text: version.body_text,
      button_text: version.button_text,
      footer_text: version.footer_text,
      custom_html: version.custom_html,
      use_custom_html: version.use_custom_html,
      header_bg_start: version.header_bg_start || defaultColors.header_bg_start,
      header_bg_end: version.header_bg_end || defaultColors.header_bg_end,
      button_bg_start: version.button_bg_start || defaultColors.button_bg_start,
      button_bg_end: version.button_bg_end || defaultColors.button_bg_end,
      body_bg_color: version.body_bg_color || defaultColors.body_bg_color,
      footer_bg_color: version.footer_bg_color || defaultColors.footer_bg_color,
      text_color: version.text_color || defaultColors.text_color,
      heading_color: version.heading_color || defaultColors.heading_color,
      button_text_color: version.button_text_color || defaultColors.button_text_color,
    });
    setHasChanges(true);
    toast.success(`Reverted to version ${version.version_number}. Save to apply.`);
  };

  const handleSaveTemplate = async () => {
    if (!editedTemplate) return;

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const templateData = {
        subject: editedTemplate.subject,
        heading: editedTemplate.heading,
        body_text: editedTemplate.body_text,
        button_text: editedTemplate.button_text,
        footer_text: editedTemplate.footer_text,
        custom_html: editedTemplate.custom_html,
        use_custom_html: editedTemplate.use_custom_html,
        header_bg_start: editedTemplate.header_bg_start,
        header_bg_end: editedTemplate.header_bg_end,
        button_bg_start: editedTemplate.button_bg_start,
        button_bg_end: editedTemplate.button_bg_end,
        body_bg_color: editedTemplate.body_bg_color,
        footer_bg_color: editedTemplate.footer_bg_color,
        text_color: editedTemplate.text_color,
        heading_color: editedTemplate.heading_color,
        button_text_color: editedTemplate.button_text_color,
        updated_by: userData.user?.id,
      };
      
      if (editedTemplate.id) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', editedTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert({ template_key: selectedTemplate, ...templateData });
        if (error) throw error;
      }

      toast.success('Template saved successfully');
      setHasChanges(false);
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleResetTemplate = () => {
    const defaultTpl = defaultTemplates[selectedTemplate] ?? blankTemplateForKey(selectedTemplate);
    const stored = storedTemplates[selectedTemplate];
    setEditedTemplate({
      id: stored?.id || '',
      updated_at: stored?.updated_at || new Date().toISOString(),
      ...defaultTpl,
    });
    setHasChanges(true);
    toast.info('Template reset to defaults. Save to apply.');
  };

  // Build HTML from template fields with colors
  const generatePreviewHtml = () => {
    if (!editedTemplate) return '';
    
    const t = editedTemplate;
    
    if (t.use_custom_html && t.custom_html) {
      let html = t.custom_html;
      Object.entries(testFormData).forEach(([key, value]) => {
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      return html;
    }

    const data = testFormData;
    let additionalContent = '';

    switch (selectedTemplate) {
      case 'invite':
        additionalContent = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;"><tr><td style="background-color:${t.footer_bg_color};border-radius:8px;padding:16px 24px;"><p style="margin:0 0 4px 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:500;">Invited by</p><p style="margin:0;font-size:18px;font-weight:600;color:#1e293b;">${data.inviterName || 'Admin User'}</p></td></tr></table>`;
        break;
      case 'credentials':
        additionalContent = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;"><tr><td style="background-color:${t.footer_bg_color};border:1px solid #e2e8f0;border-radius:12px;padding:8px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="padding:16px 0;border-bottom:1px solid #e2e8f0;"><p style="margin:0 0 4px 0;font-size:11px;color:#64748b;text-transform:uppercase;">Email</p><p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;">${testEmail || 'user@example.com'}</p></td></tr><tr><td style="padding:16px 0;"><p style="margin:0 0 4px 0;font-size:11px;color:#64748b;text-transform:uppercase;">Password</p><p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;font-family:monospace;background-color:#fef3c7;padding:8px 12px;border-radius:6px;display:inline-block;">${data.password || 'TempPass123!'}</p></td></tr></table></td></tr></table>`;
        break;
      case 'guide-access':
        additionalContent = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;"><tr><td style="background:linear-gradient(135deg,${t.footer_bg_color} 0%,#f1f5f9 100%);border:1px solid #e2e8f0;border-radius:12px;padding:24px;"><h3 style="margin:0 0 8px 0;font-size:18px;font-weight:600;color:#1e293b;"><span style="margin-right:8px;">📘</span>${data.guideTitle || 'Guide Title'}</h3>${data.guideDescription ? `<p style="margin:12px 0 0 0;font-size:14px;color:#64748b;line-height:1.5;">${data.guideDescription}</p>` : ''}</td></tr></table>`;
        break;
      case 'registration':
      case 'reminder': {
        const eventTitle = data.eventTitle || 'AI in Business Webinar';
        const eventDate = new Date().toLocaleString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
        });
        additionalContent = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;"><tr><td style="background-color:${t.footer_bg_color};border:1px solid #e2e8f0;border-radius:12px;padding:24px;"><h3 style="margin:0 0 12px 0;font-size:20px;font-weight:600;color:#1e293b;">${eventTitle}</h3><p style="margin:0;font-size:14px;color:${t.text_color};"><span style="color:${t.button_bg_start};margin-right:8px;">📅</span>${eventDate}</p></td></tr></table>`;
        break;
      }
    }

    const LOGO_URL = `${PRODUCTION_URL}/alfred-ai-logo.png`;
    
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${t.subject}</title></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;"><tr><td style="padding:48px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;"><tr><td style="background:linear-gradient(135deg,${t.header_bg_start} 0%,${t.header_bg_end} 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;"><img src="${LOGO_URL}" alt="alfred ai" width="120" height="auto" style="display:block;margin:0 auto 16px auto;max-width:120px;" /><p style="margin:0;font-size:13px;color:${t.heading_color};opacity:0.8;text-transform:uppercase;letter-spacing:2px;font-weight:500;">${t.heading}</p></td></tr><tr><td style="background-color:${t.body_bg_color};padding:40px;"><p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${t.text_color};">${t.body_text}</p>${additionalContent}${t.button_text ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align:center;padding:24px 0;"><a href="#" style="display:inline-block;background:linear-gradient(135deg,${t.button_bg_start} 0%,${t.button_bg_end} 100%);color:${t.button_text_color};text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 14px ${t.button_bg_start}66;">${t.button_text}</a></td></tr></table>` : ''}</td></tr>${t.footer_text ? `<tr><td style="background-color:${t.footer_bg_color};padding:20px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${t.footer_text}</p></td></tr>` : ''}<tr><td style="background-color:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:#1e293b;">alfred ai</p><p style="margin:0;font-size:12px;color:#94a3b8;">Intelligent Business Automation</p></td></tr></table></td></tr></table></body></html>`;
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setSending(true);
    try {
      // Use the unified send-test-email function for all templates
      const { error } = await supabase.functions.invoke('send-test-email', { 
        body: {
          templateKey: selectedTemplate,
          recipientEmail: testEmail,
          testData: testFormData,
        }
      });
      
      if (error) throw error;
      toast.success(`Test email sent to ${testEmail}`, {
        description: 'Check your inbox to preview the template.',
      });
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast.error('Failed to send test email', { description: error.message });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* The shared title band. This page is an editor, not a list: there is
          nothing to filter, so it has no tiles and no toolbar. History, Reset
          and Save act on the template open below, so they sit with the title. */}
      <AdminPageHeader
        title="Email Templates"
        description="Edit, preview and test email templates with full colour customisation"
        icon={<Mail className="h-4 w-4" />}
        actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
            <History className="h-4 w-4 mr-2" />
            {showHistory ? 'Hide' : 'Show'} History
          </Button>
          <Button variant="outline" onClick={handleResetTemplate} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSaveTemplate} disabled={saving || !hasChanges}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Template Editor */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Template Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedTemplate} onValueChange={(v) => {
              if (hasChanges && !window.confirm('Discard unsaved changes?')) return;
              setSelectedTemplate(v);
              setTestFormData({});
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTemplateKeys.map((key) => {
                  const config = getTemplateConfig(key);
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Tabs value={editMode} onValueChange={(v) => setEditMode(v as 'fields' | 'colors' | 'html')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="fields" className="text-xs"><Type className="h-3 w-3 mr-1" />Text</TabsTrigger>
                <TabsTrigger value="colors" className="text-xs"><Palette className="h-3 w-3 mr-1" />Colors</TabsTrigger>
                <TabsTrigger value="html" className="text-xs"><Code className="h-3 w-3 mr-1" />HTML</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px] mt-4">
                <TabsContent value="fields" className="space-y-3 m-0">
                  {editedTemplate && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Subject</Label>
                        <Input value={editedTemplate.subject} onChange={(e) => handleTemplateFieldChange('subject', e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Header Text</Label>
                        <Input value={editedTemplate.heading} onChange={(e) => handleTemplateFieldChange('heading', e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Body Text</Label>
                        <Textarea value={editedTemplate.body_text} onChange={(e) => handleTemplateFieldChange('body_text', e.target.value)} rows={4} className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Button Text</Label>
                        <Input value={editedTemplate.button_text || ''} onChange={(e) => handleTemplateFieldChange('button_text', e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Footer Text</Label>
                        <Textarea value={editedTemplate.footer_text || ''} onChange={(e) => handleTemplateFieldChange('footer_text', e.target.value)} rows={2} className="text-sm" />
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="colors" className="space-y-4 m-0">
                  {editedTemplate && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Quick Presets</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {colorPresets.map((preset) => (
                            <Button
                              key={preset.name}
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs justify-start"
                              onClick={() => handleApplyPreset(preset)}
                            >
                              <div className="w-4 h-4 rounded mr-2" style={{ background: `linear-gradient(135deg, ${preset.headerStart}, ${preset.headerEnd})` }} />
                              {preset.name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label className="text-xs font-medium">Header Gradient</Label>
                        <ColorInput label="Start" value={editedTemplate.header_bg_start} onChange={(v) => handleTemplateFieldChange('header_bg_start', v)} />
                        <ColorInput label="End" value={editedTemplate.header_bg_end} onChange={(v) => handleTemplateFieldChange('header_bg_end', v)} />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-medium">Button Gradient</Label>
                        <ColorInput label="Start" value={editedTemplate.button_bg_start} onChange={(v) => handleTemplateFieldChange('button_bg_start', v)} />
                        <ColorInput label="End" value={editedTemplate.button_bg_end} onChange={(v) => handleTemplateFieldChange('button_bg_end', v)} />
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label className="text-xs font-medium">Background Colors</Label>
                        <ColorInput label="Body" value={editedTemplate.body_bg_color} onChange={(v) => handleTemplateFieldChange('body_bg_color', v)} />
                        <ColorInput label="Footer" value={editedTemplate.footer_bg_color} onChange={(v) => handleTemplateFieldChange('footer_bg_color', v)} />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-medium">Text Colors</Label>
                        <ColorInput label="Body Text" value={editedTemplate.text_color} onChange={(v) => handleTemplateFieldChange('text_color', v)} />
                        <ColorInput label="Header Text" value={editedTemplate.heading_color} onChange={(v) => handleTemplateFieldChange('heading_color', v)} />
                        <ColorInput label="Button Text" value={editedTemplate.button_text_color} onChange={(v) => handleTemplateFieldChange('button_text_color', v)} />
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="html" className="space-y-3 m-0">
                  {editedTemplate && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Use Custom HTML</Label>
                        <Switch checked={editedTemplate.use_custom_html} onCheckedChange={(c) => handleTemplateFieldChange('use_custom_html', c)} />
                      </div>
                      {editedTemplate.use_custom_html && (
                        <Textarea
                          value={editedTemplate.custom_html || ''}
                          onChange={(e) => handleTemplateFieldChange('custom_html', e.target.value)}
                          rows={16}
                          className="font-mono text-xs"
                          placeholder="Enter full HTML..."
                        />
                      )}
                      {!editedTemplate.use_custom_html && (
                        <p className="text-xs text-muted-foreground py-4">Enable custom HTML to override the template with your own code.</p>
                      )}
                    </>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>

        {/* Version History */}
        {showHistory && (
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History
              </CardTitle>
              <CardDescription>Revert to previous versions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[550px]">
                {loadingVersions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No version history yet. Save changes to create versions.</p>
                ) : (
                  <div className="space-y-2">
                    {versions.map((v) => (
                      <div key={v.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">v{v.version_number}</Badge>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleRevertToVersion(v)}>
                            <Undo2 className="h-3 w-3 mr-1" />
                            Revert
                          </Button>
                        </div>
                        <p className="text-xs font-medium truncate">{v.subject}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(v.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                        <div className="flex gap-1 mt-2">
                          <div className="w-4 h-4 rounded" style={{ background: `linear-gradient(135deg, ${v.header_bg_start || '#1e293b'}, ${v.header_bg_end || '#334155'})` }} title="Header" />
                          <div className="w-4 h-4 rounded" style={{ background: `linear-gradient(135deg, ${v.button_bg_start || '#3b82f6'}, ${v.button_bg_end || '#2563eb'})` }} title="Button" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        <Card className={showHistory ? 'lg:col-span-2 xl:col-span-1' : 'lg:col-span-1 xl:col-span-2'}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setPreviewMode('desktop')}
                  title="Desktop (600px)"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setPreviewMode('tablet')}
                  title="Tablet (768px)"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setPreviewMode('mobile')}
                  title="Mobile (375px)"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-3 border-b">
              {currentConfig.testFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  {field.type === 'select' ? (
                    <Select value={testFormData[field.key] || ''} onValueChange={(v) => setTestFormData(p => ({ ...p, [field.key]: v }))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue placeholder={field.placeholder} /></SelectTrigger>
                      <SelectContent>
                        {field.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input placeholder={field.placeholder} value={testFormData[field.key] || ''} onChange={(e) => setTestFormData(p => ({ ...p, [field.key]: e.target.value }))} className="h-7 text-xs" />
                  )}
                </div>
              ))}
            </div>

            <div className="border rounded-lg overflow-hidden bg-muted/30 flex justify-center p-4">
              <div 
                className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
                  previewMode === 'mobile' ? 'w-[375px]' : previewMode === 'tablet' ? 'w-[768px] max-w-full' : 'w-full max-w-[600px]'
                }`}
              >
                <iframe 
                  srcDoc={generatePreviewHtml()} 
                  className="w-full h-[650px] border-0" 
                  title="Email Preview" 
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t">
              <Input type="email" placeholder="Enter email to send test..." value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="flex-1" />
              <Button onClick={handleSendTest} disabled={sending || !testEmail}>
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Send Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
