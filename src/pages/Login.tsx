import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { signInWithEmail } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Shield, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading, profile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authLoading && profile) {
      // Admin: Direct to admin dashboard (no onboarding check)
      if (profile.role === 'admin') {
        navigate('/admin');
        return;
      }
      
      // Regular user: Check onboarding status
      if (profile.onboarding_completed) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, authLoading, profile, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setError('Failed to initiate Google sign-in. Please try again.');
        console.error('Google OAuth error:', error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
      console.error('Google sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithEmail(email, password);

      if (!result.success) {
        setError(result.error || 'Login failed');
        setLoading(false);
        return;
      }

      toast.success('Login successful!');

      // Fetch full profile to check onboarding status
      const { data: fullProfile } = await supabase
        .from('user_profiles')
        .select('role, onboarding_completed')
        .eq('id', result.userId)
        .single();

      // Admin: Direct to admin dashboard (no onboarding check)
      if (fullProfile?.role === 'admin') {
        navigate('/admin');
        return;
      }

      // Regular user: Check onboarding status
      if (fullProfile?.onboarding_completed) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }

    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
      console.error('Login error:', err);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative z-10">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10 mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">TruReport</h1>
              <p className="text-blue-100 text-sm">Financial Fraud Detection</p>
            </div>
          </div>

          <div className="space-y-6 mt-16">
            <h2 className="text-4xl font-bold leading-tight">
              Detect Financial Fraud with Confidence
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              Advanced M-Score analysis powered by machine learning to identify potential financial statement manipulation.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <span className="text-blue-50">Trusted by 10,000+ investors worldwide</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <span className="text-blue-50">98% accuracy in fraud detection</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <span className="text-blue-50">Real-time analysis and reporting</span>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mb-48 -mr-48"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to access your account</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
           

            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 border-2 border-slate-300">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Email Login</h3>
                </div>
                <p className="text-xs text-gray-600">Sign in with your email and password</p>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>


                <p className="text-sm text-center text-gray-600 mt-4">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Register here
                  </button>
                </p>
              </form>
            </div>
          </div>

                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>

           <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-medium border-2 bg-white hover:bg-gray-50 transition-colors"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

          <div className="text-center text-sm text-gray-600">
            <Button
              variant="link"
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700"
            >
              Back to landing page
            </Button>
            
          </div>
        </div>
      </div>
    </div>
  );
}