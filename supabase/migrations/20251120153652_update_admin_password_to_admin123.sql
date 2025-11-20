/*
  # Update Admin Password to admin123

  1. Purpose
    - Update existing admin account password to: admin123
    - Sync password across auth.users and admin_credentials
    - Change auth_method to 'sso'

  2. Changes
    - Update password_hash in admin_credentials
    - Update encrypted_password in auth.users
    - Update auth_method in user_profiles to 'sso'
    - Reset must_change_password to true
    - Reset failed login attempts

  3. Result
    - Admin can login with: swarnaworksagency@gmail.com / admin123
    - Will be forced to change password on first login
    - SSO authentication will work properly
*/

DO $$
DECLARE
  admin_email text := 'swarnaworksagency@gmail.com';
  admin_password text := 'admin123';
  hashed_password text;
  admin_user_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id 
  FROM user_profiles 
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;
  
  -- Hash the new password
  hashed_password := crypt(admin_password, gen_salt('bf', 12));
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Updating Admin Password';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Admin ID: %', admin_user_id;
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'New Password: %', admin_password;
  
  -- Update auth.users password
  UPDATE auth.users
  SET 
    encrypted_password = hashed_password,
    email_confirmed_at = now(),
    updated_at = now()
  WHERE id = admin_user_id;
  
  RAISE NOTICE '✓ Updated auth.users';
  
  -- Update user_profiles auth_method
  UPDATE user_profiles
  SET 
    auth_method = 'sso',
    updated_at = now()
  WHERE id = admin_user_id;
  
  RAISE NOTICE '✓ Updated user_profiles';
  
  -- Update admin_credentials
  UPDATE admin_credentials
  SET 
    password_hash = hashed_password,
    must_change_password = true,
    last_password_change = now(),
    failed_login_attempts = 0,
    locked_until = NULL,
    updated_at = now()
  WHERE user_id = admin_user_id;
  
  RAISE NOTICE '✓ Updated admin_credentials';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓✓✓ Password Updated Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Login Credentials:';
  RAISE NOTICE '  Email: swarnaworksagency@gmail.com';
  RAISE NOTICE '  Password: admin123';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT:';
  RAISE NOTICE '  - Password synchronized across all tables';
  RAISE NOTICE '  - Must change password after first login';
  RAISE NOTICE '  - SSO authentication ready';
  RAISE NOTICE '';
  
END $$;