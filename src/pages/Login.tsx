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
import {
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
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
      if (profile.role === 'admin') {
        navigate('/admin');
        return;
      }
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

      const { data: fullProfile } = await supabase
        .from('user_profiles')
        .select('role, onboarding_completed')
        .eq('id', result.userId)
        .single();

      if (fullProfile?.role === 'admin') {
        navigate('/admin');
        return;
      }

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left/marketing panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative z-10">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/10 mb-8">
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
            <h2 className="text-4xl font-bold leading-tight">Detect Financial Fraud with Confidence</h2>
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

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mb-48 -mr-48" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl" />
      </div>

      {/* Right / auth panel */}
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

          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 border-2 border-slate-300 space-y-6">
            <div className="text-center">
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
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

            {/* Google sign-in placed after the email form, styled white with Google logo and text "Sign in" */}
            <div>
              <Separator />
              <div className="mt-4 text-center">
                <h4 className="text-sm text-gray-600 mb-3">Or</h4>

                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-11 bg-white text-gray-700 border border-slate-200 hover:bg-gray-50 flex items-center justify-center space-x-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    <>
                      {/* Inline Google logo SVG */}
                      <span className="inline-flex items-center">
                        <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
                          <path d="M533.5 278.4c0-18.3-1.6-36-4.6-53.2H272v100.8h147.4c-6.4 34.6-25.9 63.9-55.1 83.5v69.5h88.8c52.1-48 82.4-118.6 82.4-200.6z" fill="#4285f4"/>
                          <path d="M272 544.3c73.7 0 135.6-24.4 180.8-66.2l-88.8-69.5c-24.7 16.6-56.3 26.5-92 26.5-70.7 0-130.6-47.7-152-111.7H30.1v70.2C75 485.9 167.3 544.3 272 544.3z" fill="#34a853"/>
                          <path d="M120 327.4c-11.4-34.1-11.4-70.6 0-104.7V152.5H30.1C-3.2 214.7-3.2 329.7 30.1 391.9L120 327.4z" fill="#fbbc04"/>
                          <path d="M272 107.7c39.9 0 75.9 13.7 104.2 40.6l78-78C405.6 24.2 343.7 0 272 0 167.3 0 75 58.4 30.1 152.5l89.9 70.2C141.4 155.4 201.3 107.7 272 107.7z" fill="#ea4335"/>
                        </svg>
                      </span>
                      <span className="text-sm font-medium">Sign in</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            <Button variant="link" onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-700">
              Back to landing page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}