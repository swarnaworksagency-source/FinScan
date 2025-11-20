import { supabase } from './supabase';

export interface SSOLoginResult {
  success: boolean;
  error?: string;
  userId?: string;
  mustChangePassword?: boolean;
  lockedUntil?: Date;
}

export interface PasswordChangeResult {
  success: boolean;
  error?: string;
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*',
};

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecial) {
    const specialCharsRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push(`Password must contain at least one special character (${PASSWORD_REQUIREMENTS.specialChars})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*]/.test(password)) strength++;

  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
}

export async function signInWithSSO(email: string, password: string): Promise<SSOLoginResult> {
  try {
    console.log('[SSO] Starting login for:', email);

    const { data: isLocked, error: lockCheckError } = await supabase
      .rpc('is_account_locked', { user_email: email });

    if (lockCheckError) {
      console.error('[SSO] Lock check error:', lockCheckError);
    }

    if (isLocked) {
      console.log('[SSO] Account is locked');
      const { data: credentials } = await supabase
        .from('admin_credentials')
        .select('locked_until')
        .eq('email', email)
        .maybeSingle();

      const lockedUntil = credentials?.locked_until ? new Date(credentials.locked_until) : new Date();
      const minutesRemaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000 / 60);

      return {
        success: false,
        error: `Account is locked. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
        lockedUntil,
      };
    }

    console.log('[SSO] Fetching credentials...');
    const { data: credentials, error: credError } = await supabase
      .from('admin_credentials')
      .select('user_id, password_hash, must_change_password')
      .eq('email', email)
      .maybeSingle();

    if (credError) {
      console.error('[SSO] Credentials fetch error:', credError);
      await supabase.rpc('increment_failed_login_attempts', { user_email: email });
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    if (!credentials) {
      console.log('[SSO] No credentials found for email');
      await supabase.rpc('increment_failed_login_attempts', { user_email: email });
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    console.log('[SSO] Verifying password...');
    const { data: passwordValid, error: verifyError } = await supabase
      .rpc('verify_password', {
        password,
        password_hash: credentials.password_hash,
      });

    if (verifyError) {
      console.error('[SSO] Password verification error:', verifyError);
      await supabase.rpc('increment_failed_login_attempts', { user_email: email });
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    if (!passwordValid) {
      console.log('[SSO] Password verification failed');
      await supabase.rpc('increment_failed_login_attempts', { user_email: email });
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    console.log('[SSO] Password verified, resetting failed attempts...');
    await supabase.rpc('reset_failed_login_attempts', { user_email: email });

    console.log('[SSO] Signing in with Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('[SSO] Supabase auth error:', authError);
      return {
        success: false,
        error: authError.message || 'Authentication failed',
      };
    }

    if (!authData.user) {
      console.error('[SSO] No user data returned from Supabase auth');
      return {
        success: false,
        error: 'Authentication failed',
      };
    }

    console.log('[SSO] Login successful!');
    return {
      success: true,
      userId: authData.user.id,
      mustChangePassword: credentials.must_change_password,
    };
  } catch (error) {
    console.error('[SSO] Unexpected error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
    };
  }
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<PasswordChangeResult> {
  try {
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors[0],
      };
    }

    const { data: credentials } = await supabase
      .from('admin_credentials')
      .select('email, password_hash')
      .eq('user_id', userId)
      .maybeSingle();

    if (!credentials) {
      return {
        success: false,
        error: 'User credentials not found',
      };
    }

    const { data: passwordValid } = await supabase
      .rpc('verify_password', {
        password: oldPassword,
        password_hash: credentials.password_hash,
      });

    if (!passwordValid) {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    if (oldPassword === newPassword) {
      return {
        success: false,
        error: 'New password must be different from current password',
      };
    }

    const { data: newHash } = await supabase
      .rpc('hash_password', { password: newPassword });

    if (!newHash) {
      return {
        success: false,
        error: 'Failed to hash new password',
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    const { error: credUpdateError } = await supabase
      .from('admin_credentials')
      .update({
        password_hash: newHash,
        must_change_password: false,
        last_password_change: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (credUpdateError) {
      return {
        success: false,
        error: 'Failed to update credentials',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Password change error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
    };
  }
}

export async function checkMustChangePassword(userId: string): Promise<boolean> {
  try {
    const { data: credentials } = await supabase
      .from('admin_credentials')
      .select('must_change_password')
      .eq('user_id', userId)
      .maybeSingle();

    return credentials?.must_change_password || false;
  } catch (error) {
    console.error('Error checking must_change_password:', error);
    return false;
  }
}

export async function getAccountLockInfo(email: string): Promise<{
  isLocked: boolean;
  lockedUntil?: Date;
  failedAttempts: number;
} | null> {
  try {
    const { data: credentials } = await supabase
      .from('admin_credentials')
      .select('locked_until, failed_login_attempts')
      .eq('email', email)
      .maybeSingle();

    if (!credentials) {
      return null;
    }

    const lockedUntil = credentials.locked_until ? new Date(credentials.locked_until) : undefined;
    const isLocked = lockedUntil ? lockedUntil > new Date() : false;

    return {
      isLocked,
      lockedUntil,
      failedAttempts: credentials.failed_login_attempts,
    };
  } catch (error) {
    console.error('Error getting account lock info:', error);
    return null;
  }
}
