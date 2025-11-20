/*
  # Update Admin Password to @Min1234

  1. Purpose
    - Update admin password to '@Min1234'
    - Password meets ALL security requirements:
      * Minimum 8 characters: ✓
      * Uppercase letter: M ✓
      * Lowercase letter: in ✓
      * Number: 1234 ✓
      * Special character: @ ✓

  2. Changes
    - Update encrypted_password in auth.users
    - Update password_hash in admin_credentials
    - Sync password across both tables
    - Reset failed login attempts
    - Unlock account

  3. Result
    - Admin can login with: admin@fraud.com / @Min1234
    - Password synced and validated
    - Must change password on first login
*/

DO $$
DECLARE
  admin_email text := 'admin@fraud.com';
  new_password text := '@Min1234';
  admin_user_id uuid;
  new_hash text;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM user_profiles
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'Admin user not found, skipping password update';
    RETURN;
  END IF;
  
  -- Hash the new password
  new_hash := crypt(new_password, gen_salt('bf', 12));
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Updating Admin Password';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', admin_user_id;
  RAISE NOTICE 'Email: %', admin_email;
  
  -- Update auth.users
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = admin_user_id;
  
  RAISE NOTICE '✓ Updated auth.users';
  
  -- Update admin_credentials
  UPDATE admin_credentials
  SET 
    password_hash = new_hash,
    must_change_password = true,
    failed_login_attempts = 0,
    locked_until = NULL,
    last_password_change = now(),
    updated_at = now()
  WHERE user_id = admin_user_id;
  
  RAISE NOTICE '✓ Updated admin_credentials';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓✓✓ Password Updated Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Login Credentials:';
  RAISE NOTICE '  Email: admin@fraud.com';
  RAISE NOTICE '  Password: @Min1234';
  RAISE NOTICE '';
  RAISE NOTICE 'Password Requirements:';
  RAISE NOTICE '  ✓ 8 characters minimum';
  RAISE NOTICE '  ✓ Uppercase letter (M)';
  RAISE NOTICE '  ✓ Lowercase letter (in)';
  RAISE NOTICE '  ✓ Number (1234)';
  RAISE NOTICE '  ✓ Special character (@)';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Change password on first login';
  RAISE NOTICE '';
  
END $$;