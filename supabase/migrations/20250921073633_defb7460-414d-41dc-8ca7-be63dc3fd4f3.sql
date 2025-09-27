-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create site_settings table for admin to manage payment and support credentials
CREATE TABLE public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  
  -- Payment credentials
  kpay_account_name TEXT DEFAULT 'Hlaing Ko Phyo',
  kpay_account_number TEXT DEFAULT '09883249943',
  wave_pay_account_name TEXT DEFAULT 'Hlaing Ko Phyo', 
  wave_pay_account_number TEXT DEFAULT '09883249943',
  
  -- Support credentials
  support_email TEXT DEFAULT 'thewayofthedragg@gmail.com',
  support_telegram TEXT DEFAULT 'https://t.me/CEO_METAVERSE',
  support_phone TEXT DEFAULT '09789037037',
  
  -- System settings
  credit_rate_mmk INTEGER DEFAULT 100, -- MMK per credit
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure only one settings record
  CONSTRAINT single_settings_record CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policies for site_settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
USING (is_admin());

-- Insert default settings
INSERT INTO public.site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();