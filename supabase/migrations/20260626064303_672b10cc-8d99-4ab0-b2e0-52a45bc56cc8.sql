DROP POLICY IF EXISTS "Partners can upload their own deal evidence" ON storage.objects;
CREATE POLICY "Partners can upload their own deal evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'deal-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Partners can view their own deal evidence" ON storage.objects;
CREATE POLICY "Partners can view their own deal evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'deal-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Partners can delete their own deal evidence" ON storage.objects;
CREATE POLICY "Partners can delete their own deal evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'deal-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins can view all deal evidence" ON storage.objects;
CREATE POLICY "Admins can view all deal evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'deal-evidence' AND public.is_admin(auth.uid()));