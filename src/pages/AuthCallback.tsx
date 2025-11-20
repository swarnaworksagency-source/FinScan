import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/?error=auth_failed');
          return;
        }

        if (session) {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        navigate('/?error=unexpected');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="text-slate-600 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
