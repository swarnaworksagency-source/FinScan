/*
  # Insert Default Admin Account for SSO Authentication

  1. Creates Default Admin User
    - Email: swarnaworksagency@gmail.com
    - Password: SecureAdmin123! (hashed with bcrypt)
    - Role: admin
    - Auth method: sso
    - Must change password: true (forced on first login)
    - Usage limit: NULL (unlimited for admin)

  2. Process
    - First checks if admin already exists to prevent duplicates
    - Creates user in auth.users table (for Supabase authentication)
    - Creates profile in user_profiles table
    - Creates credentials in admin_credentials table with hashed password

  3. Security Notes
    - Password is hashed using bcrypt with 12 salt rounds
    - Account requires password change on first login
    - No failed login attempts initially
    - Account is not locked

  4. Important
    - This is a one-time setup migration
    - Admin should change password immediately after first login
    - Default password: SecureAdmin123!
    - This password meets all security requirements:
      * Minimum 8 characters
      * At least one uppercase letter (S, A)
      * At least one lowercase letter (ecure, dmin)
      * At least one number (123)
      * At least one special character (!)
*/

DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'swarnaworksagency@gmail.com';
  admin_password text := 'SecureAdmin123!';
  hashed_password text;
BEGIN
  -- Check if admin already exists in user_profiles
  SELECT id INTO admin_user_id
  FROM user_profiles
  WHERE email = admin_email;

  -- Only create if admin doesn't exist
  IF admin_user_id IS NULL THEN
    -- Generate a new UUID for the admin
    admin_user_id := gen_random_uuid();

    -- Hash the default password
    hashed_password := public.hash_password(admin_password);

    -- Insert into auth.users table (Supabase auth system)
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
      '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
      '{"full_name":"Admin User"}'::jsonb,
      false,
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert into user_profiles table
    INSERT INTO user_profiles (
      id,
      email,
      display_name,
      role,
      auth_method,
      usage_limit,
      usage_count,
      created_at,
      updated_at
    ) VALUES (
      admin_user_id,
      admin_email,
      'Admin User',
      'admin',
      'sso',
      NULL,
      0,
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert into admin_credentials table
    INSERT INTO admin_credentials (
      id,
      user_id,
      email,
      password_hash,
      must_change_password,
      last_password_change,
      failed_login_attempts,
      locked_until,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      admin_user_id,
      admin_email,
      hashed_password,
      true,
      now(),
      0,
      NULL,
      now(),
      now()
    )
    ON CONFLICT (email) DO NOTHING;

    RAISE NOTICE 'Default admin account created successfully';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Default Password: SecureAdmin123!';
    RAISE NOTICE 'IMPORTANT: Change password on first login';
  ELSE
    RAISE NOTICE 'Admin account already exists, skipping creation';
  END IF;
END $$;