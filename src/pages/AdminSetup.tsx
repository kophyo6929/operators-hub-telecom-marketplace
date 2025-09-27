import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Shield, Settings, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminSetup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkAdminStatus = async () => {
    try {
      setIsChecking(true);
      
      const { data: isAdminResult, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        toast({
          title: 'Error',
          description: 'Failed to check admin status',
          variant: 'destructive'
        });
        return;
      }

      if (isAdminResult) {
        toast({
          title: 'Success',
          description: 'You already have admin access!'
        });
        navigate('/admin');
      } else {
        toast({
          title: 'No Admin Access',
          description: 'You do not have admin privileges',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to check admin access',
        variant: 'destructive'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const setupAdmin = async () => {
    if (!adminEmail) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      // Check if user profile exists and create/update it with admin email
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile with admin email
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            email: adminEmail,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id);

        if (updateError) throw updateError;
      } else {
        // Create new admin profile
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: adminEmail,
            full_name: user.user_metadata?.full_name || adminEmail.split('@')[0],
            credits_balance: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) throw createError;
      }

      toast({
        title: 'Success',
        description: 'Admin setup completed successfully!'
      });

      // Check admin status again
      await checkAdminStatus();
      
    } catch (error) {
      console.error('Error setting up admin:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to setup admin',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <p className="text-muted-foreground text-sm">
            Set up your admin account to access the administrative features
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter an email containing 'admin' to get admin privileges
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={setupAdmin} 
              disabled={isLoading || !adminEmail}
              className="w-full"
            >
              {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
              <Settings className="w-4 h-4 mr-2" />
              Setup Admin Access
            </Button>

            <Button
              onClick={checkAdminStatus}
              disabled={isChecking}
              variant="outline"
              className="w-full"
            >
              {isChecking && <LoadingSpinner size="sm" className="mr-2" />}
              <Database className="w-4 h-4 mr-2" />
              Check Admin Status
            </Button>
          </div>

          <div className="text-center">
            <Button
              onClick={() => navigate('/auth')}
              variant="link"
              className="text-sm"
            >
              Back to Authentication
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;