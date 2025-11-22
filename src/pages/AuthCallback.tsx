import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      console.log('Session:', session);

      setStatus(`Event: ${event}`);

      if (event === 'SIGNED_IN' && session) {
        setStatus('Signed in - checking profile...');
        
        try {
          // Check profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile error:', profileError);
            setError('Failed to load profile');
            setStatus(`Error: ${profileError.message}`);
            return;
          }

          if (profile) {
            setStatus(`Profile found - ${profile.role}`);
            
            // Route based on role and onboarding
            if (profile.role === 'admin') {
              setStatus('Redirecting to admin...');
              navigate('/admin', { replace: true });
            } else if (profile.onboarding_completed) {
              setStatus('Redirecting to dashboard...');
              navigate('/dashboard', { replace: true });
            } else {
              setStatus('Redirecting to onboarding...');
              navigate('/onboarding', { replace: true });
            }
          } else {
            setStatus('New user - redirecting to onboarding...');
            navigate('/onboarding', { replace: true });
          }
        } catch (err: any) {
          console.error('Error:', err);
          setError(err.message);
          setStatus(`Error: ${err.message}`);
        }
      } else if (event === 'SIGNED_OUT') {
        setStatus('Signed out - redirecting...');
        navigate('/login', { replace: true });
      } else if (event === 'TOKEN_REFRESHED') {
        setStatus('Token refreshed');
      } else if (event === 'USER_UPDATED') {
        setStatus('User updated');
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center max-w-md px-6">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 text-lg font-semibold">Authentication Error</p>
            <p className="text-slate-400 text-sm">{error}</p>
            <button 
              onClick={() => navigate('/login')} 
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20"></div>
              </div>
            </div>
            <p className="text-slate-300 text-lg font-semibold">Processing authentication...</p>
            <p className="text-slate-500 text-sm">Setting up your account</p>
            <p className="text-slate-600 text-xs mt-4 font-mono">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}