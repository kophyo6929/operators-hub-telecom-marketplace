import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Shield, Zap, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const QuickAdminSetup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const quickSetupAdmin = async () => {
    try {
      setIsLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      // Create admin email by modifying current email
      const adminEmail = user.email?.includes('admin') 
        ? user.email 
        : `admin.${user.email}`;

      // Check if user profile exists and create/update it
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
        title: 'Success!',
        description: 'Quick admin setup completed successfully!'
      });

      // Redirect to admin dashboard
      setTimeout(() => {
        navigate('/admin');
      }, 1500);

    } catch (error) {
      console.error('Error in quick setup:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to setup admin access',
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
          <div className="mx-auto w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
            <Zap className="w-6 h-6 text-orange-500" />
          </div>
          <CardTitle className="text-2xl">Quick Admin Setup</CardTitle>
          <p className="text-muted-foreground text-sm">
            Instantly set up admin access for your current account
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUserEmail && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium">Current Email:</p>
              <p className="text-muted-foreground">{currentUserEmail}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Grants full administrative access</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <ArrowRight className="w-4 h-4" />
              <span>Redirects to admin dashboard</span>
            </div>
          </div>

          <Button 
            onClick={quickSetupAdmin} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            <Zap className="w-4 h-4 mr-2" />
            Quick Setup Admin Access
          </Button>

          <div className="text-center space-y-2">
            <Button
              onClick={() => navigate('/admin-setup')}
              variant="outline"
              className="w-full"
            >
              Custom Admin Setup
            </Button>
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

export default QuickAdminSetup;