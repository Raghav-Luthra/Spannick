/*
  # Create API Keys Table

  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key) - Unique identifier
      - `service_name` (text, unique) - Name of the service (e.g., 'gemini')
      - `api_key` (text) - The encrypted API key
      - `created_at` (timestamptz) - When the key was added
      - `updated_at` (timestamptz) - When the key was last updated
  
  2. Security
    - Enable RLS on `api_keys` table
    - Add policy to prevent public access (only service role can access)
    - This ensures API keys are never exposed to the client
*/

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text UNIQUE NOT NULL,
  api_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "API keys are only accessible by service role"
  ON api_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
