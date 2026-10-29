
-- 1) alpha_digital_leads: split ALL policy so SELECT is full-admin only.
DROP POLICY IF EXISTS "Admins can manage alpha digital leads" ON public.alpha_digital_leads;
CREATE POLICY "Admins can insert alpha digital leads"
  ON public.alpha_digital_leads FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update alpha digital leads"
  ON public.alpha_digital_leads FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete alpha digital leads"
  ON public.alpha_digital_leads FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
-- SELECT already restricted by existing "Full admins can read alpha digital leads" policy.

-- 2) ghl_sync_history: restrict SELECT to full admins.
DROP POLICY IF EXISTS "Admin read access on ghl_sync_history" ON public.ghl_sync_history;
CREATE POLICY "Full admins can read ghl_sync_history"
  ON public.ghl_sync_history FOR SELECT
  USING (public.is_full_admin(auth.uid()));

-- 3) handover_requests: split manage policy; SELECT restricted to full admins.
DROP POLICY IF EXISTS "Admins can manage handover requests" ON public.handover_requests;
CREATE POLICY "Full admins can view handover requests"
  ON public.handover_requests FOR SELECT
  USING (public.is_full_admin(auth.uid()));
CREATE POLICY "Admins can insert handover requests"
  ON public.handover_requests FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update handover requests"
  ON public.handover_requests FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete handover requests"
  ON public.handover_requests FOR DELETE
  USING (public.is_admin(auth.uid()));

-- 4) job_applications: restrict SELECT to full admins.
DROP POLICY IF EXISTS "Admins can view job applications" ON public.job_applications;
CREATE POLICY "Full admins can view job applications"
  ON public.job_applications FOR SELECT
  USING (public.is_full_admin(auth.uid()));

-- 5) meeting_documents: restrict SELECT to full admins.
DROP POLICY IF EXISTS "Admins can view meeting documents" ON public.meeting_documents;
CREATE POLICY "Full admins can view meeting documents"
  ON public.meeting_documents FOR SELECT
  USING (public.is_full_admin(auth.uid()));

-- 6) partner_chat_sessions + partner_chat_messages: restrict SELECT to full admins.
DROP POLICY IF EXISTS "Admins can view partner chat sessions" ON public.partner_chat_sessions;
CREATE POLICY "Full admins can view partner chat sessions"
  ON public.partner_chat_sessions FOR SELECT
  USING (public.is_full_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view partner chat messages" ON public.partner_chat_messages;
CREATE POLICY "Full admins can view partner chat messages"
  ON public.partner_chat_messages FOR SELECT
  USING (public.is_full_admin(auth.uid()));

-- 7) proposal_pdf_downloads: restrict SELECT to full admins (INSERT stays open to admins).
DROP POLICY IF EXISTS "Admins can view pdf downloads" ON public.proposal_pdf_downloads;
CREATE POLICY "Full admins can view pdf downloads"
  ON public.proposal_pdf_downloads FOR SELECT TO authenticated
  USING (public.is_full_admin(auth.uid()));

-- 8) quote_notes: split ALL policy; SELECT restricted to full admins.
DROP POLICY IF EXISTS "Admins can manage quote notes" ON public.quote_notes;
CREATE POLICY "Full admins can view quote notes"
  ON public.quote_notes FOR SELECT TO authenticated
  USING (public.is_full_admin(auth.uid()));
CREATE POLICY "Admins can insert quote notes"
  ON public.quote_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update quote notes"
  ON public.quote_notes FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete quote notes"
  ON public.quote_notes FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 9) quote_payments: restrict SELECT to full admins, drop broad ALL policy.
DROP POLICY IF EXISTS "Admins can manage quote payments" ON public.quote_payments;
DROP POLICY IF EXISTS "Admins can view quote payments" ON public.quote_payments;
CREATE POLICY "Full admins can view quote payments"
  ON public.quote_payments FOR SELECT TO authenticated
  USING (public.is_full_admin(auth.uid()));
CREATE POLICY "Admins can delete quote payments"
  ON public.quote_payments FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
-- INSERT and UPDATE remain covered by existing "Admins can insert quote payments"
-- and "Admins can update quote payments" policies. Distributor SELECT preserved.
