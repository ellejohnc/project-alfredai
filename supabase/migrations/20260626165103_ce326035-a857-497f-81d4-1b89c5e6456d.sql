CREATE POLICY "Partners manage own avatar - select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'partner-avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_partner_admin(auth.uid())));

CREATE POLICY "Partners manage own avatar - insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'partner-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Partners manage own avatar - update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'partner-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Partners manage own avatar - delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'partner-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);