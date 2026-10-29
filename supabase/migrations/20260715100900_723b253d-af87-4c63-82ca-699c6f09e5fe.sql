
DROP POLICY IF EXISTS "Admins can view meeting documents storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload meeting documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update meeting documents storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete meeting documents storage" ON storage.objects;

CREATE POLICY "Full admins can view meeting documents storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'meeting-documents' AND public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can upload meeting documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'meeting-documents' AND public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can update meeting documents storage" ON storage.objects
  FOR UPDATE USING (bucket_id = 'meeting-documents' AND public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can delete meeting documents storage" ON storage.objects
  FOR DELETE USING (bucket_id = 'meeting-documents' AND public.is_full_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view resumes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update resumes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete resumes" ON storage.objects;

CREATE POLICY "Full admins can view resumes" ON storage.objects
  FOR SELECT USING (bucket_id = 'resumes' AND public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can update resumes" ON storage.objects
  FOR UPDATE USING (bucket_id = 'resumes' AND public.is_full_admin(auth.uid()))
  WITH CHECK (bucket_id = 'resumes' AND public.is_full_admin(auth.uid()));
CREATE POLICY "Full admins can delete resumes" ON storage.objects
  FOR DELETE USING (bucket_id = 'resumes' AND public.is_full_admin(auth.uid()));
