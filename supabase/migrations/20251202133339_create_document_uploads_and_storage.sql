/*
  # Document Uploads Schema - Google OCR Integration

  1. New Tables
    - `document_uploads`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `file_name` (text)
      - `file_type` (text: 'pdf', 'docx', 'xlsx')
      - `file_size` (bigint)
      - `storage_path` (text - Supabase Storage path)
      - `ocr_text` (text - raw extracted text)
      - `extracted_data` (jsonb - parsed financial data)
      - `confidence_score` (numeric - overall extraction quality)
      - `status` (text: 'processing', 'completed', 'failed')
      - `error_message` (text, nullable)
      - `created_at` (timestamptz)
      - `processed_at` (timestamptz, nullable)
      
  2. Storage Bucket
    - Create `financial-documents` bucket for file uploads
    
  3. Security
    - Enable RLS on document_uploads table
    - Users can only access their own documents
    - Service role has full access for processing
*/

-- Create document_uploads table
CREATE TABLE IF NOT EXISTS document_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'docx', 'xlsx')),
  file_size bigint NOT NULL CHECK (file_size > 0 AND file_size <= 52428800), -- Max 50MB
  storage_path text NOT NULL,
  ocr_text text,
  extracted_data jsonb DEFAULT '{}'::jsonb,
  confidence_score numeric(5,2) DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_uploads_user_id ON document_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_status ON document_uploads(status);
CREATE INDEX IF NOT EXISTS idx_document_uploads_created_at ON document_uploads(created_at DESC);

-- Enable RLS
ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_uploads
DROP POLICY IF EXISTS "Users can view own documents" ON document_uploads;
DROP POLICY IF EXISTS "Users can insert own documents" ON document_uploads;
DROP POLICY IF EXISTS "Users can update own documents" ON document_uploads;
DROP POLICY IF EXISTS "Users can delete own documents" ON document_uploads;
DROP POLICY IF EXISTS "Service role has full access" ON document_uploads;

CREATE POLICY "Users can view own documents" ON document_uploads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON document_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON document_uploads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON document_uploads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access" ON document_uploads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for financial documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'financial-documents',
  'financial-documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

-- Storage policies for financial-documents bucket
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role has full access" ON storage.objects;

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'financial-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'financial-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'financial-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'financial-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'financial-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Service role has full access" ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'financial-documents')
  WITH CHECK (bucket_id = 'financial-documents');

-- Function to auto-update processed_at timestamp
CREATE OR REPLACE FUNCTION update_document_processed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed') AND OLD.status = 'processing' THEN
    NEW.processed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update processed_at
DROP TRIGGER IF EXISTS trigger_update_processed_at ON document_uploads;
CREATE TRIGGER trigger_update_processed_at
  BEFORE UPDATE ON document_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_document_processed_at();

-- Success notification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Document Uploads Schema Created';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  ✓ document_uploads (with RLS)';
  RAISE NOTICE '';
  RAISE NOTICE 'Storage Bucket:';
  RAISE NOTICE '  ✓ financial-documents (50MB limit)';
  RAISE NOTICE '';
  RAISE NOTICE 'Accepted File Types:';
  RAISE NOTICE '  ✓ PDF (.pdf)';
  RAISE NOTICE '  ✓ Word (.docx)';
  RAISE NOTICE '  ✓ Excel (.xlsx)';
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  ✓ RLS enabled on all resources';
  RAISE NOTICE '  ✓ Users can only access their own files';
  RAISE NOTICE '  ✓ Service role has full access';
  RAISE NOTICE '========================================';
END $$;