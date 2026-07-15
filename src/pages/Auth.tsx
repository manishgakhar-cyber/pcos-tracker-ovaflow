import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const firstNameSchema = z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters');
const lastNameSchema = z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters');

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const assessmentCompleted = useMemo(() => {
    try {
      return localStorage.getItem('ovaflow_assessment_completed') === 'true';
    } catch {
      return false;
    }
  }, []);

  const requestedTab = searchParams.get('tab');
  // Sign Up is ONLY available when the user arrived via ?tab=signup after
  // completing the assessment. "Already have an account" (no param) is
  // strictly sign-in only.
  const signupAllowed = requestedTab === 'signup' && assessmentCompleted;
  const defaultTab = signupAllowed ? 'signup' : 'signin';

  useEffect(() => {
    // Password recovery links arrive with a hash fragment that supabase-js
    // parses into a session and then fires PASSWORD_RECOVERY.
    const type = searchParams.get('type');
    if (type === 'recovery' || window.location.hash.includes('type=recovery')) {
      setIsResetting(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsResetting(true);
    });
    return () => subscription.unsubscribe();
  }, [searchParams]);

  // Block direct access to signup when assessment hasn't been taken.
  useEffect(() => {
    if (requestedTab === 'signup' && !assessmentCompleted) {
      toast({
        title: 'Take the assessment first',
        description: 'Please complete the PCOS risk assessment before creating an account.',
      });
      navigate('/', { replace: true });
    }
  }, [requestedTab, assessmentCompleted, navigate, toast]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      firstNameSchema.parse(firstName);
      lastNameSchema.parse(lastName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = error.errors[0].message;
        toast({
          title: msg,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Account Already Exists',
            description: 'This email is already registered. Please sign in instead.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Check your email',
          description:
            'We sent a confirmation link to your email. Confirm it to finish creating your account.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Sign Up Error',
        description: error.message || 'An error occurred during sign up',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = error.errors[0].message;
        toast({
          title: msg,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Invalid Credentials',
            description: 'Email or password is incorrect. Please try again.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Welcome back!',
          description: 'Signed in successfully.',
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Sign In Error',
        description: error.message || 'An error occurred during sign in',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(resetEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      if (error) throw error;

      toast({
        title: 'Check your email',
        description: 'Password reset link has been sent to your email.',
      });
      setResetDialogOpen(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: 'Reset Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });
      setIsResetting(false);
      setNewPassword('');
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Update Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isResetting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <Helmet>
          <title>Reset Password OvaFlow</title>
          <meta name="description" content="Set a new password for your OvaFlow account." />
          <link rel="canonical" href="/auth" />
        </Helmet>
        <main className="w-full max-w-md">
        <h1 className="sr-only">Reset your OvaFlow password</h1>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-purple-800">Reset Password</CardTitle>
            <CardDescription>Enter your new password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-purple-600"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <Helmet>
        <title>Sign in OvaFlow</title>
        <meta name="description" content="Sign in or create a OvaFlow account to save your PCOS assessment, log cycles, and get personalized predictions." />
        <link rel="canonical" href="/auth" />
        <meta property="og:title" content="Sign in OvaFlow" />
        <meta property="og:url" content="/auth" />
      </Helmet>
      <main className="w-full max-w-md">
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-4 -ml-2 text-purple-700 hover:text-purple-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to assessment
      </Button>
      <h1 className="sr-only">Sign in to OvaFlow</h1>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-purple-800">OvaFlow</CardTitle>
          <CardDescription>Your comprehensive PCOS and cycle tracking companion</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList
              className={`grid w-full ${assessmentCompleted ? 'grid-cols-2' : 'grid-cols-1'}`}
            >
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              {assessmentCompleted && (
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-purple-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="link" className="w-full text-sm">
                      Forgot password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Enter your email address and we'll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetRequest} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="your@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </form>
            </TabsContent>
            
            {assessmentCompleted && (
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstname">First Name</Label>
                  <Input
                    id="signup-firstname"
                    type="text"
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-lastname">Last Name</Label>
                  <Input
                    id="signup-lastname"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-purple-600"
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
      </main>
    </div>
  );
};

export default Auth;
