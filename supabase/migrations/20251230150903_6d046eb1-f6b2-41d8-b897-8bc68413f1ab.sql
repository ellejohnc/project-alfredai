-- Create email_templates table for storing editable email templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  heading TEXT NOT NULL,
  body_text TEXT NOT NULL,
  button_text TEXT,
  footer_text TEXT,
  custom_html TEXT,
  use_custom_html BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow admins to view templates
CREATE POLICY "Admins can view email templates"
ON public.email_templates
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Allow admins to update templates
CREATE POLICY "Admins can update email templates"
ON public.email_templates
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Allow admins to insert templates
CREATE POLICY "Admins can insert email templates"
ON public.email_templates
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Allow edge functions to read templates (service role or anon for public functions)
CREATE POLICY "Public can read email templates"
ON public.email_templates
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_visitor_session_timestamp();

-- Insert default templates
INSERT INTO public.email_templates (template_key, subject, heading, body_text, button_text, footer_text) VALUES
('invite', 'You''re Invited to Join Alfred AI Admin', 'You''re Invited!', 'You''ve been invited to join the Alfred AI admin panel. Click the button below to set up your account and get started.', 'Accept Invitation', 'This invitation will expire in 7 days.'),
('credentials', 'Your Alfred AI Login Credentials', 'Welcome to Alfred AI', 'Your admin account has been created. Below are your login credentials. Please change your password after your first login.', 'Login Now', 'Keep these credentials secure.'),
('password-reset', 'Reset Your Alfred AI Password', 'Password Reset Request', 'We received a request to reset your password. Click the button below to create a new password.', 'Reset Password', 'If you didn''t request this, you can safely ignore this email.'),
('guide-access', 'Your Guide is Ready', 'Your Download is Ready!', 'Thank you for your interest! Click the button below to access your guide.', 'Download Guide', 'We hope you find this resource valuable.'),
('registration', 'Registration Confirmed', 'You''re Registered!', 'Thank you for registering! We''re excited to have you join us. Mark your calendar and we''ll see you there.', 'Add to Calendar', 'We look forward to seeing you!'),
('reminder', 'Event Reminder', 'Event Starting Soon!', 'This is a friendly reminder about your upcoming event. Don''t forget to join us!', 'Join Event', 'See you there!');