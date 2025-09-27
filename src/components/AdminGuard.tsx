import React, { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          throw new Error(userError.message);
        }

        if (!user) {
          throw new Error('Please log in to access the admin panel');
        }

        // Check if user has admin privileges by checking email or user_profiles table
        const { data: profile, error: profileError } = await supabase.
        from('user_profiles').
        select('email').
        eq('user_id', user.id).
        single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw new Error('Failed to check admin status');
        }

        // Check if user is admin (either from profile email or auth email)
        const userEmail = profile?.email || user.email || '';
        const isAdminUser = userEmail.toLowerCase().includes('admin') ||
        userEmail.toLowerCase() === 'admin@example.com' ||
        userEmail.toLowerCase() === 'admin@admin.com' ||
        userEmail.toLowerCase() === 'thewayofthedragg@gmail.com';

        if (!isAdminUser) {
          throw new Error('Access denied. Admin privileges required. Only users with admin email addresses can access this panel.');
        }

        setIsAdmin(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Access denied');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, []);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>);

  }

  if (error || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Access denied. Admin privileges required.'}
          </AlertDescription>
        </Alert>
      </div>);

  }

  return <>{children}</>;
}