import { supabase } from './supabase';

export interface LoginResult {
  success: boolean;
  error?: string;
  userId?: string;
  role?: 'admin' | 'user';
}

export async function signIn(email: string, password: string): Promise<LoginResult> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return {
        success: false,
        error: authError.message || 'Invalid email or password',
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Authentication failed',
      };
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();

    return {
      success: true,
      userId: authData.user.id,
      role: profile?.role || 'user',
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
