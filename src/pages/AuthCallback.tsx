import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      setStatus('Getting session...');
      
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        navigate('/login?error=auth_failed');
        return;
      }

      setStatus('Loading profile...');

      // Get or create profile
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      // If profile doesn't exist, create it
      if (!profile && (!profileError || profileError.code === 'PGRST116')) {
        setStatus('Creating profile...');
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || 'User',
            display_name: session.user.user_metadata?.full_name || 'User',
            role: 'user',
            auth_method: 'google',
            onboarding_completed: false,
          })
          .select()
          .single();

        if (createError) {
          console.error('Create profile error:', createError);
          navigate('/login?error=profile_creation_failed');
          return;
        }

        profile = newProfile;
      }

      if (!profile) {
        console.error('No profile after creation');
        navigate('/login?error=no_profile');
        return;
      }

      setStatus('Redirecting...');

      // Simple routing logic
      if (profile.role === 'admin') {
        // Admin always goes to admin dashboard (skip onboarding)
        navigate('/admin');
      } else if (profile.onboarding_completed) {
        // User with completed onboarding goes to dashboard
        navigate('/dashboard');
      } else {
        // User without completed onboarding goes to onboarding
        navigate('/onboarding');
      }

    } catch (err: any) {
      console.error('Callback error:', err);
      navigate('/login?error=unexpected');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-slate-300 text-lg">{status}</p>
      </div>
    </div>
  );
}