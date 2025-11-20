/*
  # User Roles and Management System

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `display_name` (text)
      - `role` (text, enum: 'admin' or 'user')
      - `usage_limit` (integer, null for admin = unlimited)
      - `usage_count` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `pricing_settings`
      - `id` (uuid, primary key)
      - `plan_name` (text, e.g., 'monthly', 'yearly')
      - `base_price` (numeric)
      - `discount_percentage` (numeric, default 0)
      - `final_price` (numeric, computed)
      - `features` (jsonb, array of features)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `testimonials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `user_name` (text)
      - `user_company` (text, nullable)
      - `rating` (integer, 1-5)
      - `content` (text)
      - `status` (text, enum: 'pending', 'approved', 'rejected')
      - `is_featured` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `fraud_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `company_name` (text)
      - `analysis_data` (jsonb, stores all metrics and results)
      - `m_score` (numeric)
      - `risk_level` (text, enum: 'low', 'moderate', 'high')
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admin policies: full access to everything
    - User policies: 
      - Can read own profile
      - Can create fraud analyses (with usage limit check)
      - Can create testimonials
      - Can read approved testimonials
    - Public policies:
      - Can read approved & featured testimonials for landing page

  3. Important Notes
    - Admin users have unlimited access (usage_limit = NULL)
    - Regular users have usage limits
    - First user will be set as admin via trigger
    - Testimonials require admin approval before being displayed
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  usage_limit integer DEFAULT 10,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pricing_settings table
CREATE TABLE IF NOT EXISTS pricing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL UNIQUE,
  base_price numeric NOT NULL,
  discount_percentage numeric DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  final_price numeric GENERATED ALWAYS AS (base_price * (1 - discount_percentage / 100)) STORED,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_company text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fraud_analyses table
CREATE TABLE IF NOT EXISTS fraud_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  analysis_data jsonb NOT NULL,
  m_score numeric NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high')),
  created_at timestamptz DEFAULT now()
);

-- Create function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_count integer;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  
  -- Insert new user profile
  INSERT INTO public.user_profiles (id, email, display_name, role, usage_limit)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    CASE WHEN user_count = 0 THEN 'admin' ELSE 'user' END,
    CASE WHEN user_count = 0 THEN NULL ELSE 10 END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pricing_settings_updated_at ON pricing_settings;
CREATE TRIGGER update_pricing_settings_updated_at
  BEFORE UPDATE ON pricing_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_analyses ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for pricing_settings
CREATE POLICY "Everyone can view active pricing"
  ON pricing_settings FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage pricing"
  ON pricing_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for testimonials
CREATE POLICY "Users can create testimonials"
  ON testimonials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own testimonials"
  ON testimonials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view approved testimonials"
  ON testimonials FOR SELECT
  TO authenticated
  USING (status = 'approved');

CREATE POLICY "Public can view approved testimonials"
  ON testimonials FOR SELECT
  TO anon
  USING (status = 'approved');

CREATE POLICY "Admins can manage all testimonials"
  ON testimonials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for fraud_analyses
CREATE POLICY "Users can create fraud analyses"
  ON fraud_analyses FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      -- Admin has unlimited access
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
      OR
      -- Regular user must be within usage limit
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() 
        AND role = 'user' 
        AND (usage_limit IS NULL OR usage_count < usage_limit)
      )
    )
  );

CREATE POLICY "Users can view own analyses"
  ON fraud_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analyses"
  ON fraud_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default pricing plans
INSERT INTO pricing_settings (plan_name, base_price, discount_percentage, features) VALUES
  ('free', 0, 0, '["10 analyses per month", "Basic reports", "Email support"]'::jsonb),
  ('monthly', 29.99, 0, '["Unlimited analyses", "Advanced reports", "PDF export", "Priority support", "API access"]'::jsonb),
  ('yearly', 299.99, 20, '["Unlimited analyses", "Advanced reports", "PDF export", "Priority support", "API access", "20% discount"]'::jsonb)
ON CONFLICT (plan_name) DO NOTHING;
