CREATE POLICY "Admin roles can update webinar registrations"
ON public.webinar_registrations
FOR UPDATE
TO authenticated
USING (can_view_registrations(auth.uid()))
WITH CHECK (can_view_registrations(auth.uid()));

CREATE POLICY "Admin roles can delete webinar registrations"
ON public.webinar_registrations
FOR DELETE
TO authenticated
USING (can_view_registrations(auth.uid()));