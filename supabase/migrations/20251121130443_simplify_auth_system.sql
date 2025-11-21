/*
  # Simplify Authentication System

  1. Problem
    - Too complex with admin_credentials table
    - Password stored in 2 places
    - Confusing authentication flow

  2. Solution
    - DROP admin_credentials table completely
    - Use ONLY Supabase Auth for authentication
    - Use user_profiles.role to check admin status
    - Simple and clean architecture

  3. Changes
    - Drop admin_credentials table
    - Drop all related functions
    - Update auth_method constraint to allow 'email' or just use existing values
    - Keep user_profiles with role field

  4. New Flow
    - Login: supabase.auth.signInWithPassword()
    - Check role: SELECT role FROM user_profiles WHERE id = user.id
    - Route based on role
*/

-- Drop all admin_credentials related functions
DROP FUNCTION IF EXISTS public.is_account_locked(text);
DROP FUNCTION IF EXISTS public.increment_failed_login_attempts(text);
DROP FUNCTION IF EXISTS public.reset_failed_login_attempts(text);
DROP FUNCTION IF EXISTS public.verify_password(text, text);
DROP FUNCTION IF EXISTS public.hash_password(text);

-- Drop admin_credentials table
DROP TABLE IF EXISTS public.admin_credentials CASCADE;

-- Update auth_method constraint to allow 'email' as well
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_auth_method_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_auth_method_check 
  CHECK (auth_method IN ('google', 'sso', 'email'));

-- Create or update admin user
DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'admin@fraud.com';
  admin_password text := '@Min1234';
BEGIN
  -- Check if admin user exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    -- Create new admin user
    admin_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin User"}'::jsonb,
      false,
      'authenticated'
    );
    
    -- Create profile
    INSERT INTO user_profiles (
      id,
      email,
      display_name,
      role,
      auth_method,
      usage_limit,
      usage_count
    ) VALUES (
      admin_user_id,
      admin_email,
      'Admin User',
      'admin',
      'email',
      NULL,
      0
    );
      
  ELSE
    -- Update existing admin user password
    UPDATE auth.users
    SET 
      encrypted_password = crypt(admin_password, gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now()
    WHERE id = admin_user_id;
    
    -- Update profile to ensure role is admin
    UPDATE user_profiles
    SET 
      role = 'admin',
      auth_method = 'email',
      updated_at = now()
    WHERE id = admin_user_id;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓✓✓ Authentication System Simplified!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin Login:';
  RAISE NOTICE '  Email: admin@fraud.com';
  RAISE NOTICE '  Password: @Min1234';
  RAISE NOTICE '';
  RAISE NOTICE 'Clean Architecture:';
  RAISE NOTICE '  ✓ No admin_credentials table';
  RAISE NOTICE '  ✓ Supabase Auth handles passwords';
  RAISE NOTICE '  ✓ user_profiles.role determines access';
  RAISE NOTICE '';
  
END $$;