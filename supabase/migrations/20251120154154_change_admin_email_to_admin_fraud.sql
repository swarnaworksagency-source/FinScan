/*
  # Change Admin Email to admin@fraud.com

  1. Purpose
    - Update admin email from swarnaworksagency@gmail.com to admin@fraud.com
    - Update across all tables: auth.users, user_profiles, admin_credentials

  2. Changes
    - Update email in auth.users
    - Update email in user_profiles
    - Update email in admin_credentials
    - Keep password as admin123
    - Keep all other settings intact

  3. Result
    - Admin can login with: admin@fraud.com / admin123
    - All functionality remains the same
*/

DO $$
DECLARE
  old_email text := 'swarnaworksagency@gmail.com';
  new_email text := 'admin@fraud.com';
  admin_user_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM user_profiles
  WHERE email = old_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found with email: %', old_email;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Changing Admin Email';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', admin_user_id;
  RAISE NOTICE 'Old Email: %', old_email;
  RAISE NOTICE 'New Email: %', new_email;
  
  -- Update auth.users
  UPDATE auth.users
  SET 
    email = new_email,
    updated_at = now()
  WHERE id = admin_user_id;
  
  RAISE NOTICE '✓ Updated auth.users';
  
  -- Update user_profiles
  UPDATE user_profiles
  SET 
    email = new_email,
    updated_at = now()
  WHERE id = admin_user_id;
  
  RAISE NOTICE '✓ Updated user_profiles';
  
  -- Update admin_credentials
  UPDATE admin_credentials
  SET 
    email = new_email,
    updated_at = now()
  WHERE user_id = admin_user_id;
  
  RAISE NOTICE '✓ Updated admin_credentials';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓✓✓ Email Updated Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'New Login Credentials:';
  RAISE NOTICE '  Email: admin@fraud.com';
  RAISE NOTICE '  Password: admin123';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Password must be changed after first login';
  RAISE NOTICE '';
  
END $$;