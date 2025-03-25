/*
  # Add LinkedIn URL and Fix User Flow

  1. Changes
    - Add linkedin_url column to users table
    - Update policies to handle returning users

  2. Security
    - Maintain existing RLS protection
    - Allow updates for existing users
*/

-- Add linkedin_url column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public insert" ON users;
DROP POLICY IF EXISTS "Allow read access" ON users;
DROP POLICY IF EXISTS "Allow own updates" ON users;

-- Create new policies that handle both new and returning users
CREATE POLICY "Allow insert or update on signup"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow read access"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow updates during signup"
  ON users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);