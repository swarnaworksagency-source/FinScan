import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing authentication...');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const addDebug = (msg: string) => {
    console.log(`[AuthCallback] ${msg}`);
    setDebugInfo(prev => [...prev, msg]);
  };

  const handleOAuthCallback = async () => {
    try {
      addDebug('Starting OAuth callback handler');
      setStatus('Exchanging authorization code...');

      // CRITICAL: Wait for Supabase to exchange the code for a session
      // This happens automatically when detectSessionInUrl is true
      await new Promise(resolve => setTimeout(resolve, 1500));

      addDebug('Checking for session');
      setStatus('Verifying authentication...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        addDebug(`Session error: ${sessionError.message}`);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!session) {
        addDebug('No session found - checking auth state');
        
        // Try getting user directly
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          addDebug('No user found - redirecting to login');
          setTimeout(() => navigate('/login?error=no_session'), 1000);
          return;
        }

        addDebug(`User found: ${user.email}`);
      } else {
        addDebug(`Session found: ${session.user.email}`);
      }

      const userId = session?.user?.id;
      if (!userId) {
        addDebug('No user ID - redirecting to login');
        setTimeout(() => navigate('/login?error=no_user_id'), 1000);
        return;
      }

      addDebug(`User ID: ${userId}`);
      setStatus('Loading user profile...');

      // Wait a bit more to ensure database trigger has completed
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try to get profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      addDebug(`Profile query result: ${profile ? 'found' : 'not found'}`);
      
      if (profileError && profileError.code !== 'PGRST116') {
        addDebug(`Profile error: ${profileError.message}`);
      }

      // If no profile, create one
      if (!profile) {
        addDebug('Creating new profile');
        setStatus('Creating your profile...');

        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: session?.user?.email || '',
            full_name: session?.user?.user_metadata?.full_name || 'User',
            display_name: session?.user?.user_metadata?.full_name || 'User',
            role: 'user',
            auth_method: 'google',
            onboarding_completed: false,
            onboarding_step: 0,
          })
          .select()
          .single();

        if (createError) {
          addDebug(`Profile creation error: ${createError.message}`);
          throw new Error(`Failed to create profile: ${createError.message}`);
        }

        addDebug('Profile created successfully');
        setStatus('Redirecting to onboarding...');
        
        // New user - go to onboarding
        setTimeout(() => navigate('/onboarding', { replace: true }), 500);
        return;
      }

      addDebug(`Profile loaded - Role: ${profile.role}, Onboarding: ${profile.onboarding_completed}`);
      setStatus('Redirecting...');

      // Route based on profile
      if (profile.role === 'admin') {
        addDebug('Redirecting to admin dashboard');
        setTimeout(() => navigate('/admin', { replace: true }), 500);
      } else if (profile.onboarding_completed) {
        addDebug('Redirecting to user dashboard');
        setTimeout(() => navigate('/dashboard', { replace: true }), 500);
      } else {
        addDebug('Redirecting to onboarding');
        setTimeout(() => navigate('/onboarding', { replace: true }), 500);
      }

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      addDebug(`Error: ${error.message}`);
      setStatus('Authentication failed');
      
      setTimeout(() => {
        navigate('/login?error=callback_failed');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center max-w-lg px-6">
        <div className="space-y-6">
          {/* Loading Animation */}
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-emerald-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 animate-pulse"></div>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-slate-300 text-xl font-semibold mb-2">{status}</p>
            <p className="text-slate-500 text-sm">Please wait, this may take a few seconds...</p>
          </div>

          {/* Debug Info (only in development) */}
          {import.meta.env.DEV && debugInfo.length > 0 && (
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 max-h-60 overflow-y-auto">
              <p className="text-xs text-slate-400 font-mono text-left space-y-1">
                {debugInfo.map((msg, idx) => (
                  <div key={idx}>• {msg}</div>
                ))}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}