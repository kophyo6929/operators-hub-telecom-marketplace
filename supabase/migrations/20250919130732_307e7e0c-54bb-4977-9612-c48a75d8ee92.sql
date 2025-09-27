-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MMK',
    operator VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    logo TEXT,
    is_active BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    validity_days INTEGER DEFAULT 30,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    credits_balance NUMERIC(10,2) DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    mmk_amount DECIMAL(10, 2),
    credit_amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'MMK',
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(100),
    payment_reference TEXT,
    previous_balance INTEGER DEFAULT 0,
    new_balance INTEGER DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    admin_notes TEXT,
    approval_notes TEXT
);

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    target_type VARCHAR(100),
    target_id VARCHAR(100),
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_requests table
CREATE TABLE IF NOT EXISTS public.payment_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_requested INTEGER NOT NULL,
    total_cost_mmk DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    payment_proof_file_id INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MMK',
    status VARCHAR(50) DEFAULT 'pending',
    phone_number VARCHAR(20),
    operator VARCHAR(50),
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

-- Create approval_workflows table
CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id SERIAL PRIMARY KEY,
    workflow_type VARCHAR(100) NOT NULL,
    target_id INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_products_operator ON public.products(operator);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Insert sample products
INSERT INTO public.products (name, description, price, currency, operator, category, logo, is_active, stock_quantity, validity_days, admin_notes) VALUES
('1GB Data Pack', 'High-speed 1GB data package valid for 7 days', 1500, 'MMK', 'MPT', 'Data', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop', true, 100, 7, 'Popular starter pack'),
('5GB Data Pack', 'Premium 5GB data package with high-speed connectivity', 5000, 'MMK', 'MPT', 'Data', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop', true, 50, 30, 'Best seller'),
('100 Minutes Voice Pack', '100 minutes local voice calls', 2000, 'MMK', 'OOREDOO', 'Minutes', 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=100&h=100&fit=crop', true, 75, 30, 'Voice package'),
('10GB Data Pack', 'Ultra high-speed 10GB data package', 8000, 'MMK', 'ATOM', 'Data', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop', true, 30, 30, 'Premium package'),
('500MB Data Pack', 'Basic 500MB data package for light usage', 800, 'MMK', 'MYTEL', 'Data', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop', true, 200, 7, 'Budget friendly');

-- Create admin functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, email, full_name, credits_balance)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
        0
    );
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payment_requests TO authenticated;
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT SELECT ON public.approval_workflows TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;