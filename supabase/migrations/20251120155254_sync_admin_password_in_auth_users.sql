/*
  # Sync Admin Password in auth.users

  1. Problem
    - When email was changed, password in auth.users was not updated
    - This caused "Invalid email or password" error during SSO login
    - Password in admin_credentials was correct, but auth.users had old password

  2. Solution
    - Ensure password in auth.users matches password in admin_credentials
    - Both should be 'admin123' for current admin account
    - This migration fixes the sync issue

  3. Important
    - This is a one-time fix for existing admin account
    - Future password changes should update both tables
    - SSO login requires password match in both tables
*/

DO $$
DECLARE
  admin_email text := 'admin@fraud.com';
  admin_password text := 'admin123';
  admin_user_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM user_profiles
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'Admin user not found, skipping password sync';
    RETURN;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Syncing Admin Password in auth.users';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', admin_user_id;
  RAISE NOTICE 'Email: %', admin_email;
  
  -- Update password in auth.users to match admin_credentials
  UPDATE auth.users
  SET 
    encrypted_password = crypt(admin_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = admin_user_id;
  
  RAISE NOTICE '✓ Password synced in auth.users';
  
  -- Also reset any lock status
  UPDATE admin_credentials
  SET 
    failed_login_attempts = 0,
    locked_until = NULL,
    updated_at = now()
  WHERE user_id = admin_user_id;
  
  RAISE NOTICE '✓ Reset lock status';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓✓✓ Password Sync Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin can now login with:';
  RAISE NOTICE '  Email: admin@fraud.com';
  RAISE NOTICE '  Password: admin123';
  RAISE NOTICE '';
  
END $$;