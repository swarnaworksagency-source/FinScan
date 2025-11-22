import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get session from URL hash
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        navigate('/login?error=auth_failed');
        return;
      }

      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile check error:', profileError);
        navigate('/login?error=unexpected');
        return;
      }

      // If profile exists and onboarding completed
      if (profile && profile.onboarding_completed) {
        if (profile.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        // New user or incomplete onboarding - redirect to onboarding
        navigate('/onboarding');
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      setError('Authentication failed');
      navigate('/login?error=unexpected');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <p className="text-red-400 text-lg">{error}</p>
            <button 
              onClick={() => navigate('/login')} 
              className="text-blue-400 hover:underline"
            >
              Return to login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-300 text-lg">Completing authentication...</p>
            <p className="text-slate-500 text-sm">Please wait while we set up your account</p>
          </div>
        )}
      </div>
    </div>
  );
}