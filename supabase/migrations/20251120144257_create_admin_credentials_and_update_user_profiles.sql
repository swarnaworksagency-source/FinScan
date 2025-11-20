/*
  # Add SSO Authentication Support for Admin Users

  1. New Tables
    - `admin_credentials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles.id)
      - `email` (text, unique) - Admin email for SSO login
      - `password_hash` (text) - Bcrypt hashed password
      - `must_change_password` (boolean) - Force password change on first login
      - `last_password_change` (timestamptz) - Track password changes
      - `failed_login_attempts` (integer) - Track failed login attempts for rate limiting
      - `locked_until` (timestamptz, nullable) - Account lockout timestamp
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - `user_profiles`
      - Add `auth_method` column ('google' or 'sso') to track authentication method
      - Default to 'google' for existing users
      - Add index on auth_method for faster queries

  3. Security
    - Enable RLS on admin_credentials table
    - Policies:
      - Admins can view all admin credentials (for user management)
      - Users can only update their own credentials
      - Only authenticated users with admin role can insert new admin credentials
    - Add trigger for updated_at column
    
  4. Functions
    - Create function to hash passwords using pgcrypto extension
    - Create function to verify password hashes
    - Create function to check and update failed login attempts
    - Create function to lock/unlock accounts

  5. Important Notes
    - Passwords are hashed using bcrypt (via pgcrypto extension)
    - Account locks after 5 failed attempts for 15 minutes
    - Default admin will be inserted in next migration
    - SSO is exclusively for admin users initially
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add auth_method column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'auth_method'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN auth_method text NOT NULL DEFAULT 'google'
    CHECK (auth_method IN ('google', 'sso'));
  END IF;
END $$;

-- Create index on auth_method for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_method ON user_profiles(auth_method);

-- Create admin_credentials table
CREATE TABLE IF NOT EXISTS admin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  last_password_change timestamptz DEFAULT now(),
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_credentials_email ON admin_credentials(email);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_admin_credentials_user_id ON admin_credentials(user_id);

-- Enable RLS on admin_credentials
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_credentials

-- Admins can view all admin credentials (for user management)
CREATE POLICY "Admins can view all admin credentials"
  ON admin_credentials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Users can only update their own credentials
CREATE POLICY "Users can update own credentials"
  ON admin_credentials
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Only admins can insert new admin credentials
CREATE POLICY "Admins can insert admin credentials"
  ON admin_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can delete admin credentials
CREATE POLICY "Admins can delete admin credentials"
  ON admin_credentials
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_admin_credentials_updated_at
  BEFORE UPDATE ON admin_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to hash password using bcrypt
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify password
CREATE OR REPLACE FUNCTION public.verify_password(password text, password_hash text)
RETURNS boolean AS $$
BEGIN
  RETURN password_hash = crypt(password, password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment failed login attempts and lock account if needed
CREATE OR REPLACE FUNCTION public.increment_failed_login_attempts(user_email text)
RETURNS void AS $$
DECLARE
  current_attempts integer;
BEGIN
  -- Get current failed attempts
  SELECT failed_login_attempts INTO current_attempts
  FROM admin_credentials
  WHERE email = user_email;

  -- Increment failed attempts
  UPDATE admin_credentials
  SET 
    failed_login_attempts = failed_login_attempts + 1,
    locked_until = CASE 
      WHEN failed_login_attempts + 1 >= 5 
      THEN now() + interval '15 minutes'
      ELSE locked_until
    END,
    updated_at = now()
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset failed login attempts (call after successful login)
CREATE OR REPLACE FUNCTION public.reset_failed_login_attempts(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE admin_credentials
  SET 
    failed_login_attempts = 0,
    locked_until = NULL,
    updated_at = now()
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(user_email text)
RETURNS boolean AS $$
DECLARE
  lock_time timestamptz;
BEGIN
  SELECT locked_until INTO lock_time
  FROM admin_credentials
  WHERE email = user_email;

  -- If no lock time or lock time has passed, account is not locked
  IF lock_time IS NULL OR lock_time < now() THEN
    -- Clear the lock if it has expired
    IF lock_time IS NOT NULL AND lock_time < now() THEN
      UPDATE admin_credentials
      SET 
        locked_until = NULL,
        failed_login_attempts = 0,
        updated_at = now()
      WHERE email = user_email;
    END IF;
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;