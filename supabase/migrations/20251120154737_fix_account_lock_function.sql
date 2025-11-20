/*
  # Fix is_account_locked Function

  1. Problem
    - Function has race condition with lock expiry checking
    - Can return true even for expired locks
    - Causes "0 minutes" error message

  2. Solution
    - Clear expired locks FIRST before checking
    - Always return accurate lock status
    - Handle NULL locked_until properly

  3. Logic Flow
    - Get locked_until timestamp
    - If NULL, return false (not locked)
    - If timestamp < now(), clear lock and return false
    - If timestamp >= now(), return true (still locked)
*/

CREATE OR REPLACE FUNCTION public.is_account_locked(user_email text)
RETURNS boolean AS $$
DECLARE
  lock_time timestamptz;
  time_now timestamptz;
BEGIN
  time_now := now();
  
  -- Get lock time
  SELECT locked_until INTO lock_time
  FROM admin_credentials
  WHERE email = user_email;

  -- If no lock time, account is not locked
  IF lock_time IS NULL THEN
    RETURN false;
  END IF;

  -- If lock has expired, clear it and return false
  IF lock_time <= time_now THEN
    UPDATE admin_credentials
    SET 
      locked_until = NULL,
      failed_login_attempts = 0,
      updated_at = time_now
    WHERE email = user_email;
    
    RETURN false;
  END IF;

  -- Lock is still active
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;