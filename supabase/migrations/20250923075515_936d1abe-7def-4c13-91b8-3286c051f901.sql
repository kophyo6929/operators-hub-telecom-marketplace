-- Storage policies for payment proof uploads
-- Ensure authenticated users can manage files only in their own folder inside the 'payment-proofs' bucket

-- Clean up if previously created
DROP POLICY IF EXISTS "Users can upload payment proofs to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own payment proofs" ON storage.objects;

-- INSERT (upload)
CREATE POLICY "Users can upload payment proofs to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- SELECT (view)
CREATE POLICY "Users can view own payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin()
  )
);

-- UPDATE (replace)
CREATE POLICY "Users can update own payment proofs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE
CREATE POLICY "Users can delete own payment proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);
