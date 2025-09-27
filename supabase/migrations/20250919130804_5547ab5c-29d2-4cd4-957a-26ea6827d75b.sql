-- Drop existing policies first
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can create payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

-- Create helper function for admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND email ILIKE '%admin%'
  );
$$;

-- USER_PROFILES policies
CREATE POLICY "Users can create own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can delete profiles" ON public.user_profiles
    FOR DELETE USING (public.is_admin());

-- PRODUCTS policies
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert products" ON public.products
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products" ON public.products
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete products" ON public.products
    FOR DELETE USING (public.is_admin());

-- ORDERS policies
CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin());

-- PAYMENT_REQUESTS policies
CREATE POLICY "Users can create payment requests" ON public.payment_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own payment requests" ON public.payment_requests
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own payment requests" ON public.payment_requests
    FOR UPDATE USING (
        (user_id = auth.uid() AND status = 'pending') OR 
        public.is_admin()
    );

CREATE POLICY "Admins can delete payment requests" ON public.payment_requests
    FOR DELETE USING (public.is_admin());

-- CREDIT_TRANSACTIONS policies
CREATE POLICY "Admins can create transactions" ON public.credit_transactions
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can update transactions" ON public.credit_transactions
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete transactions" ON public.credit_transactions
    FOR DELETE USING (public.is_admin());

-- APPROVAL_WORKFLOWS policies
CREATE POLICY "System can create workflows" ON public.approval_workflows
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view related workflows" ON public.approval_workflows
    FOR SELECT USING (
        user_id = auth.uid() OR 
        admin_user_id = auth.uid() OR 
        public.is_admin()
    );

CREATE POLICY "Admins can update workflows" ON public.approval_workflows
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete workflows" ON public.approval_workflows
    FOR DELETE USING (public.is_admin());

-- ADMIN_AUDIT_LOGS policies
CREATE POLICY "Admins can create audit logs" ON public.admin_audit_logs
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update audit logs" ON public.admin_audit_logs
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete audit logs" ON public.admin_audit_logs
    FOR DELETE USING (public.is_admin());