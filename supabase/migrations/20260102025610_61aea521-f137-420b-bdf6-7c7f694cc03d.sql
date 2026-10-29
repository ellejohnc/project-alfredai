-- Add rejection email template
INSERT INTO public.email_templates (template_key, subject, heading, body_text, button_text, footer_text)
VALUES (
  'investor-rejection',
  'Update on Your Alfred AI Investor Access Request',
  'Thank You for Your Interest',
  'We appreciate your interest in Alfred AI. After careful review, we are unable to provide investor portal access at this time. This decision does not reflect on you personally, and we encourage you to stay connected with us for future opportunities.',
  'Visit Our Website',
  'Thank you for your understanding. — The Alfred AI Team'
)
ON CONFLICT (template_key) DO NOTHING;