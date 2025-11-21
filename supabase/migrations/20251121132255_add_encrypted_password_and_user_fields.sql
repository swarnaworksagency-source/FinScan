/*
  # Add Encrypted Password and User Fields to user_profiles

  1. New Columns
    - password_encrypted: text (stores 256-bit encrypted password)
    - encryption_key: text (stores encryption key)
    - full_name: text (user's full name)
    - user_type: text (personal, company, student)
    
  2. Purpose
    - Store encrypted passwords directly in user_profiles
    - Enable email/password authentication without Google Auth
    - Support both SSO and Google OAuth equally
    - Collect additional user information
    
  3. Security
    - Passwords encrypted with AES-256
    - Each password has unique encryption key
    - Admin can login with email/password from user_profiles
    - Google OAuth users have NULL password_encrypted
    
  4. User Types
    - personal: Individual users
    - company: Corporate users
    - student: Student users
*/

-- Install pgcrypto extension if not exists (for encryption)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add new columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS password_encrypted text,
ADD COLUMN IF NOT EXISTS encryption_key text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS user_type text CHECK (user_type IN ('personal', 'company', 'student'));

-- Update display_name to use full_name if exists
UPDATE user_profiles 
SET full_name = display_name 
WHERE full_name IS NULL AND display_name IS NOT NULL;

-- Create function to encrypt password with AES-256
CREATE OR REPLACE FUNCTION encrypt_password_256(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key text;
  encrypted_password text;
BEGIN
  -- Generate random 256-bit key (32 bytes = 256 bits)
  encryption_key := encode(gen_random_bytes(32), 'hex');
  
  -- Encrypt password using AES-256
  encrypted_password := encode(
    encrypt(
      password::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'hex'
  );
  
  RETURN jsonb_build_object(
    'encrypted_password', encrypted_password,
    'encryption_key', encryption_key
  );
END;
$$;

-- Create function to verify encrypted password
CREATE OR REPLACE FUNCTION verify_encrypted_password(
  input_password text,
  stored_encrypted_password text,
  stored_encryption_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  decrypted_password text;
BEGIN
  -- Decrypt stored password
  decrypted_password := convert_from(
    decrypt(
      decode(stored_encrypted_password, 'hex'),
      decode(stored_encryption_key, 'hex'),
      'aes'
    ),
    'UTF8'
  );
  
  -- Compare with input password
  RETURN decrypted_password = input_password;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Update admin user with encrypted password
DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'admin@fraud.com';
  admin_password text := '@Min1234';
  encryption_result jsonb;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM user_profiles
  WHERE email = admin_email;
  
  IF admin_user_id IS NOT NULL THEN
    -- Encrypt admin password
    encryption_result := encrypt_password_256(admin_password);
    
    -- Update admin profile
    UPDATE user_profiles
    SET 
      password_encrypted = encryption_result->>'encrypted_password',
      encryption_key = encryption_result->>'encryption_key',
      full_name = COALESCE(full_name, 'Admin User'),
      user_type = 'personal',
      auth_method = 'email',
      updated_at = now()
    WHERE id = admin_user_id;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Password Encryption Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Admin: %', admin_email;
    RAISE NOTICE 'Encryption: AES-256';
    RAISE NOTICE 'Key Length: 256 bits';
    RAISE NOTICE '';
  END IF;
END $$;

-- Update auth_method constraint to be more flexible
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_auth_method_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_auth_method_check 
  CHECK (auth_method IN ('google', 'email', 'sso'));

COMMENT ON COLUMN user_profiles.password_encrypted IS 'AES-256 encrypted password';
COMMENT ON COLUMN user_profiles.encryption_key IS '256-bit encryption key';
COMMENT ON COLUMN user_profiles.full_name IS 'User full name';
COMMENT ON COLUMN user_profiles.user_type IS 'User type: personal, company, student';