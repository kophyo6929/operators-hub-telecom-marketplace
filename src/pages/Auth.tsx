import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/dashboard');
        }
      } catch (error) {
        // User not authenticated, stay on auth page
        console.log('Not authenticated');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if user profile exists, if not create one
        const { data: profile } = await supabase.
        from('user_profiles').
        select('id').
        eq('user_id', session.user.id).
        single();

        if (!profile) {
          // Create user profile
          await supabase.
          from('user_profiles').
          insert({
            user_id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            credits_balance: 0
          });
        }

        toast({
          title: 'Success',
          description: 'You have been successfully signed in'
        });
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Show loading spinner while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);

  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Please check your email to confirm your account'
      });

      // Clear form
      setEmail('');
      setPassword('');
      setName('');
    } catch (error: any) {
      toast({
        title: 'Sign Up Error',
        description: error.message || 'An error occurred during registration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      // Navigation will be handled by the auth state change listener
    } catch (error: any) {
      toast({
        title: 'Sign In Error',
        description: error.message || 'Invalid email or password',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Reset Email Sent',
        description: 'Please check your email for password reset instructions'
      });
      setIsResetMode(false);
    } catch (error: any) {
      toast({
        title: 'Reset Password Error',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (isResetMode) {
    return (
      <div className="min-h-[85vh] md:min-h-[90vh] w-full bg-background flex items-center justify-center overflow-hidden mesh-gradient py-8 md:py-12">
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        
        <div className="container mx-auto px-4 flex items-center justify-center relative z-10">
          <Card className="w-full max-w-sm sm:max-w-md glass-card">
            <CardHeader className="space-y-1 px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsResetMode(false)}
                  className="text-muted-foreground h-8 w-8 sm:h-10 sm:w-10">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary font-space-grotesk leading-tight">
                  OPERATORS HUB
                </h1>
              </div>
              <CardTitle className="text-xl sm:text-2xl text-center">Reset Password</CardTitle>
              <CardDescription className="text-center text-sm sm:text-base px-2">
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8">
              <form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="reset-email" className="text-sm">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 sm:h-11" />
                </div>
                <Button type="submit" className="w-full btn-premium h-10 sm:h-11" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>);

  }

  return (
    <div className="min-h-[85vh] md:min-h-[90vh] w-full bg-background flex items-center justify-center overflow-hidden mesh-gradient py-8 md:py-12">
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      
      <div className="container mx-auto px-4 flex items-center justify-center relative z-10">
        <Card className="w-full max-w-sm sm:max-w-md glass-card">
          <CardHeader className="space-y-1 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 sm:h-10 sm:w-10">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary font-space-grotesk leading-tight">
                OPERATORS HUB
              </h1>
            </div>
            <CardTitle className="text-xl sm:text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base px-2">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3 sm:mb-4 h-9 sm:h-10">
                <TabsTrigger value="signin" className="text-xs sm:text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-xs sm:text-sm">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-0">
                <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="signin-email" className="text-sm">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10 sm:h-11" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="signin-password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-10 sm:h-11 pr-10" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 sm:h-11 w-10 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ?
                        <EyeOff className="h-4 w-4 text-muted-foreground" /> :
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        }
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full btn-premium h-10 sm:h-11" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-muted-foreground text-sm h-8"
                    onClick={() => setIsResetMode(true)}>
                    Forgot your password?
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-0">
                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="signup-name" className="text-sm">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-10 sm:h-11" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="signup-email" className="text-sm">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10 sm:h-11" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="signup-password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-10 sm:h-11 pr-10" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 sm:h-11 w-10 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ?
                        <EyeOff className="h-4 w-4 text-muted-foreground" /> :
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        }
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full btn-premium h-10 sm:h-11" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>);

};

export default Auth;