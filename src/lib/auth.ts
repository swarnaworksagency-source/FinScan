import { supabase } from './supabase';

export interface LoginResult {
  success: boolean;
  error?: string;
  userId?: string;
  role?: 'admin' | 'user';
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  userType: 'personal' | 'company' | 'student';
}

export async function signInWithEmail(email: string, password: string): Promise<LoginResult> {
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

export async function registerWithEmail(data: RegisterData): Promise<LoginResult> {
  try {
    const { email, password, fullName, userType } = data;

    const { data: existing } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: 'Email already registered',
      };
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
        },
      },
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || 'Registration failed',
      };
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        display_name: fullName,
        role: 'user',
        auth_method: 'email',
        user_type: userType,
        usage_limit: 10,
        usage_count: 0,
      });

    if (profileError) {
      return {
        success: false,
        error: 'Failed to create profile',
      };
    }

    return {
      success: true,
      userId: authData.user.id,
      role: 'user',
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
