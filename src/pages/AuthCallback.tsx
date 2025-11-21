import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');

        // Get session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          navigate('/?error=auth_failed');
          return;
        }

        if (!session) {
          console.log('⚠️ No session found');
          navigate('/');
          return;
        }

        console.log('✅ Session found for user:', session.user.email);

        // ✅ CRITICAL: Check role from user_profiles
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, email')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.warn('⚠️ Profile not found, creating default profile...');
          
          // Create default profile for new OAuth user
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              role: 'user',
              auth_method: 'google',
              display_name: session.user.user_metadata?.full_name || session.user.email,
            });

          if (insertError) {
            console.error('❌ Error creating profile:', insertError);
            // Continue anyway, redirect to dashboard
          } else {
            console.log('✅ Profile created successfully');
          }

          // Redirect to dashboard (default for new users)
          navigate('/dashboard');
          return;
        }

        console.log('✅ Profile found:', profile);

        // ✅ REDIRECT based on role
        if (profile.role === 'admin') {
          console.log('👑 Admin user detected, redirecting to /admin');
          navigate('/admin');
        } else {
          console.log('👤 Regular user detected, redirecting to /dashboard');
          navigate('/dashboard');
        }

      } catch (err) {
        console.error('❌ Unexpected error in auth callback:', err);
        navigate('/?error=unexpected');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-slate-700 font-semibold text-lg">Completing sign in...</p>
          <p className="text-slate-500 text-sm">Verifying your account</p>
        </div>
      </div>
    </div>
  );
}