/*
  # Use Bcrypt for Password Hashing in user_profiles

  1. Changes
    - Replace AES encryption with bcrypt hashing
    - Rename password_encrypted to password_hash
    - Remove encryption_key column
    - Keep full_name and user_type fields
    
  2. Authentication
    - Email/Password: Check user_profiles.password_hash with bcrypt
    - Google OAuth: password_hash is NULL
*/

-- Drop old encryption functions
DROP FUNCTION IF EXISTS encrypt_password_256(text);
DROP FUNCTION IF EXISTS verify_encrypted_password(text, text, text);

-- Remove encryption_key and rename password_encrypted
ALTER TABLE user_profiles DROP COLUMN IF EXISTS encryption_key;

-- Check if password_encrypted exists, rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'password_encrypted'
  ) THEN
    ALTER TABLE user_profiles RENAME COLUMN password_encrypted TO password_hash;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN password_hash text;
  END IF;
END $$;

-- Create hash function
CREATE OR REPLACE FUNCTION hash_user_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 12));
END;
$$;

-- Create verification function
CREATE OR REPLACE FUNCTION verify_user_password(
  input_password text,
  stored_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN stored_hash = crypt(input_password, stored_hash);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Update admin with bcrypt hash
DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'admin@fraud.com';
  admin_password text := '@Min1234';
  hashed_pwd text;
BEGIN
  SELECT id INTO admin_user_id
  FROM user_profiles
  WHERE email = admin_email;
  
  IF admin_user_id IS NOT NULL THEN
    hashed_pwd := hash_user_password(admin_password);
    
    UPDATE user_profiles
    SET 
      password_hash = hashed_pwd,
      full_name = COALESCE(full_name, 'Admin User'),
      user_type = 'personal',
      auth_method = 'email',
      updated_at = now()
    WHERE id = admin_user_id;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Admin Password Updated!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: @Min1234';
    RAISE NOTICE 'Hash Algorithm: Bcrypt (12 rounds)';
    RAISE NOTICE '';
  END IF;
END $$;