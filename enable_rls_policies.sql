-- Enable Row Level Security (RLS) and create policies for all tables
-- This script addresses the security warnings by implementing proper access controls

-- ========================================
-- 1. Enable RLS on all public tables
-- ========================================

-- Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on payment_requests table
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on credit_transactions table
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on approval_workflows table
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin_audit_logs table
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. Create helper function for admin check
-- ========================================

-- Create function to check if current user is admin (if not exists)
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

-- ========================================
-- 3. USER_PROFILES policies
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;

-- Users can create their own profile
CREATE POLICY "Users can create own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view their own profile, admins can view all
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Users can update their own profile, admins can update all
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- Only admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
    FOR DELETE USING (public.is_admin());

-- ========================================
-- 4. PRODUCTS policies (read-only for users, full access for admins)
-- ========================================

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Anyone can view active products
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true OR public.is_admin());

-- Only admins can insert products
CREATE POLICY "Admins can insert products" ON public.products
    FOR INSERT WITH CHECK (public.is_admin());

-- Only admins can update products
CREATE POLICY "Admins can update products" ON public.products
    FOR UPDATE USING (public.is_admin());

-- Only admins can delete products
CREATE POLICY "Admins can delete products" ON public.products
    FOR DELETE USING (public.is_admin());

-- ========================================
-- 5. ORDERS policies
-- ========================================

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

-- Users can create their own orders
CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view their own orders, admins can view all
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Only admins can update orders
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin());

-- Only admins can delete orders
CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin());

-- ========================================
-- 6. PAYMENT_REQUESTS policies
-- ========================================

DROP POLICY IF EXISTS "Users can manage own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can manage all payment requests" ON public.payment_requests;

-- Users can create their own payment requests
CREATE POLICY "Users can create payment requests" ON public.payment_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view their own payment requests, admins can view all
CREATE POLICY "Users can view own payment requests" ON public.payment_requests
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Users can update their own pending requests, admins can update all
CREATE POLICY "Users can update own payment requests" ON public.payment_requests
    FOR UPDATE USING (
        (user_id = auth.uid() AND status = 'pending') OR 
        public.is_admin()
    );

-- Only admins can delete payment requests
CREATE POLICY "Admins can delete payment requests" ON public.payment_requests
    FOR DELETE USING (public.is_admin());

-- ========================================
-- 7. CREDIT_TRANSACTIONS policies
-- ========================================

DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.credit_transactions;

-- Only admins and the system can create credit transactions
CREATE POLICY "Admins can create transactions" ON public.credit_transactions
    FOR INSERT WITH CHECK (public.is_admin());

-- Users can view their own transactions, admins can view all
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- Only admins can update transactions
CREATE POLICY "Admins can update transactions" ON public.credit_transactions
    FOR UPDATE USING (public.is_admin());

-- Only admins can delete transactions
CREATE POLICY "Admins can delete transactions" ON public.credit_transactions
    FOR DELETE USING (public.is_admin());

-- ========================================
-- 8. APPROVAL_WORKFLOWS policies
-- ========================================

DROP POLICY IF EXISTS "Users can view related workflows" ON public.approval_workflows;
DROP POLICY IF EXISTS "Admins can manage all workflows" ON public.approval_workflows;

-- Users can create workflows (system-generated)
CREATE POLICY "System can create workflows" ON public.approval_workflows
    FOR INSERT WITH CHECK (true);

-- Users can view workflows they're involved in, admins can view all
CREATE POLICY "Users can view related workflows" ON public.approval_workflows
    FOR SELECT USING (
        user_id = auth.uid() OR 
        admin_user_id = auth.uid() OR 
        public.is_admin()
    );

-- Only admins can update workflows
CREATE POLICY "Admins can update workflows" ON public.approval_workflows
    FOR UPDATE USING (public.is_admin());

-- Only admins can delete workflows
CREATE POLICY "Admins can delete workflows" ON public.approval_workflows
    FOR DELETE USING (public.is_admin());

-- ========================================
-- 9. ADMIN_AUDIT_LOGS policies (Admin only)
-- ========================================

DROP POLICY IF EXISTS "Admins can manage audit logs" ON public.admin_audit_logs;

-- Only admins can create audit logs
CREATE POLICY "Admins can create audit logs" ON public.admin_audit_logs
    FOR INSERT WITH CHECK (public.is_admin());

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
    FOR SELECT USING (public.is_admin());

-- Only admins can update audit logs
CREATE POLICY "Admins can update audit logs" ON public.admin_audit_logs
    FOR UPDATE USING (public.is_admin());

-- Only admins can delete audit logs
CREATE POLICY "Admins can delete audit logs" ON public.admin_audit_logs
    FOR DELETE USING (public.is_admin());

-- ========================================
-- 10. Grant necessary permissions
-- ========================================

-- Grant usage on sequences to authenticated users
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions for authenticated users to use the tables appropriately
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payment_requests TO authenticated;
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT SELECT ON public.approval_workflows TO authenticated;

-- Grant permissions for service role (for admin operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

COMMIT;

-- Note: After running this script, the Security Advisor warnings should be resolved.
-- The policies ensure that:
-- - Regular users can only access their own data
-- - Admins (identified by having 'admin' in their email) have full access
-- - Public data (like active products) is accessible to all authenticated users
-- - Sensitive operations are restricted to administrators only
