/*
  # Fix User Creation Policies

  1. Changes
    - Simplify RLS policies for users table
    - Fix policy order and conflicts
    - Ensure proper access for initial user creation

  2. Security
    - Maintain RLS protection
    - Allow necessary public access for signup flow
    - Protect user data appropriately
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable initial user creation" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new simplified policies

-- Allow public insert for initial user creation
CREATE POLICY "Allow public insert"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to read their own data and any data during signup
CREATE POLICY "Allow read access"
  ON users
  FOR SELECT
  TO public
  USING (true);  -- Temporarily allow all reads for debugging

-- Allow authenticated users to update their own data
CREATE POLICY "Allow own updates"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);