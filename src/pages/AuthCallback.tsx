import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Authenticating...');
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Set timeout fallback (10 seconds)
    const timeout = setTimeout(() => {
      if (mounted) {
        console.error('Authentication timeout');
        setTimeoutReached(true);
        setStatus('Authentication timeout - redirecting to login');
        setTimeout(() => navigate('/login?error=timeout'), 2000);
      }
    }, 10000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthCallback] Auth event:', event);
      console.log('[AuthCallback] Session:', session);

      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        clearTimeout(timeout);
        setStatus('Signed in - loading profile...');

        try {
          const userId = session.user.id;
          const userEmail = session.user.email;
          console.log('[AuthCallback] User ID:', userId);
          console.log('[AuthCallback] User Email:', userEmail);

          // Wait for potential trigger to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Get existing profile
          let { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          console.log('[AuthCallback] Profile:', profile);
          console.log('[AuthCallback] Profile error:', profileError);

          // If no profile found, create one
          if (!profile) {
            console.log('[AuthCallback] Creating new profile');
            setStatus('Creating profile...');

            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: userId,
                email: userEmail!,
                full_name: session.user.user_metadata?.full_name || userEmail?.split('@')[0] || 'User',
                display_name: session.user.user_metadata?.full_name || userEmail?.split('@')[0] || 'User',
                role: 'user', // Default role for new users
                auth_method: 'google',
                onboarding_completed: false,
                onboarding_step: 0,
              })
              .select()
              .single();

            if (createError) {
              console.error('[AuthCallback] Create profile error:', createError);
              throw new Error(`Failed to create profile: ${createError.message}`);
            }

            profile = newProfile;
            console.log('[AuthCallback] Profile created:', profile);
          }

          if (!mounted) return;

          // Route based on profile role and onboarding status
          setStatus('Redirecting...');
          
          const userRole = profile.role;
          const onboardingCompleted = profile.onboarding_completed;

          console.log('[AuthCallback] User Role:', userRole);
          console.log('[AuthCallback] Onboarding Completed:', onboardingCompleted);

          // ADMIN: Direct to admin dashboard (no onboarding required)
          if (userRole === 'admin') {
            console.log('[AuthCallback] Admin user - redirecting to admin dashboard');
            navigate('/admin', { replace: true });
            return;
          }

          // REGULAR USER: Check onboarding status
          if (onboardingCompleted) {
            console.log('[AuthCallback] User completed onboarding - redirecting to dashboard');
            navigate('/dashboard', { replace: true });
          } else {
            console.log('[AuthCallback] User needs onboarding - redirecting to onboarding');
            navigate('/onboarding', { replace: true });
          }

        } catch (error: any) {
          console.error('[AuthCallback] Error:', error);
          setStatus(`Error: ${error.message}`);
          setTimeout(() => navigate('/login?error=profile_error'), 2000);
        }
      } else if (event === 'SIGNED_OUT') {
        clearTimeout(timeout);
        console.log('[AuthCallback] User signed out');
        navigate('/login', { replace: true });
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center max-w-md px-6">
        {timeoutReached ? (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border-2 border-red-500/20">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">Authentication Timeout</h2>
              <p className="text-slate-400 text-sm">Taking too long to authenticate. Please try again.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-emerald-500 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 animate-pulse"></div>
              </div>
            </div>
            <div>
              <p className="text-slate-300 text-xl font-semibold mb-2">{status}</p>
              <p className="text-slate-500 text-sm">Please wait...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}