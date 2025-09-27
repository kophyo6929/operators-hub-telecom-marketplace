import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function AuthSuccess() {
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const createUserProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (user) {
          // Check if profile already exists
          const { data: existingProfile, error: profileError } = await supabase.
          from('user_profiles').
          select('id').
          eq('user_id', user.id).
          single();

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { error: insertError } = await supabase.
            from('user_profiles').
            insert({
              user_id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || '',
              credits_balance: 0
            });

            if (insertError) {
              console.error('Failed to create user profile:', insertError);
              toast({
                title: 'Profile Setup Issue',
                description: 'There was an issue setting up your profile. Please contact support if problems persist.',
                variant: 'destructive'
              });
            } else {
              toast({
                title: 'Welcome!',
                description: 'Your profile has been set up successfully.'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in profile setup:', error);
      }
    };

    createUserProfile();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle>Email Verified!</CardTitle>
          <CardDescription>
            Your email has been successfully verified. You can now sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Redirecting you to the homepage in <span className="font-semibold text-blue-600">{countdown}</span> seconds...
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline">

            Click here to go now
          </button>
        </CardContent>
      </Card>
    </div>);

}