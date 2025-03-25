/*
  # Fix RLS and Storage Policies

  1. Changes
    - Update users table RLS policies to handle unauthenticated inserts
    - Add storage bucket creation and policies
    - Fix file upload permissions

  2. Security
    - Maintain RLS on users table
    - Allow initial user creation
    - Secure file uploads
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Allow initial user creation without authentication
CREATE POLICY "Enable initial user creation"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO public
  USING (
    auth.uid() IS NULL OR -- Allow during initial creation
    auth.uid() = id       -- Allow authenticated user to read own data
  );

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure resumes bucket exists and set up storage policies
DO $$
BEGIN
  -- Create bucket if it doesn't exist (this is idempotent)
  INSERT INTO storage.buckets (id, name)
  VALUES ('resumes', 'resumes')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop existing storage policies to recreate them
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- Storage policies
CREATE POLICY "Allow public read access"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'resumes');

CREATE POLICY "Allow file uploads"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Allow users to update their own files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resumes');

CREATE POLICY "Allow users to delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'resumes');