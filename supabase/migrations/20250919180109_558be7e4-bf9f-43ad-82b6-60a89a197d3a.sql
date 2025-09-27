-- Update is_admin() to match AdminGuard and allow the current admin account
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid()
      AND (
        email ILIKE '%admin%'
        OR lower(email) IN (
          'admin@example.com',
          'admin@admin.com',
          'thewayofthedragg@gmail.com'
        )
      )
  );
$$;