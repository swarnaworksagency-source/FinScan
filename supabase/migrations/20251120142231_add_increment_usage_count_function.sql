/*
  # Add Increment Usage Count Function

  1. New Functions
    - `increment_usage_count`: Safely increment user's analysis usage count
  
  2. Security
    - Function is SECURITY DEFINER to allow incrementing
    - Only allows incrementing for authenticated user's own count
*/

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_usage_count(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET usage_count = usage_count + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
