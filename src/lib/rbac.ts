import { supabase } from './supabase';

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return getUserProfile(user.id);
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'admin';
}

export async function canUserPerformAnalysis(): Promise<{ allowed: boolean; reason?: string }> {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return { allowed: false, reason: 'User profile not found' };
  }

  if (profile.role === 'admin') {
    return { allowed: true };
  }

  if (profile.usage_limit === null) {
    return { allowed: true };
  }

  if (profile.usage_count >= profile.usage_limit) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${profile.usage_limit} analyses. Please upgrade your plan.`
    };
  }

  return { allowed: true };
}

export async function incrementUsageCount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_usage_count', { user_id: userId });

  if (error) {
    console.error('Error incrementing usage count:', error);
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`);
  }
}

export async function updateUserUsageLimit(userId: string, limit: number | null): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ usage_limit: limit })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update usage limit: ${error.message}`);
  }
}
