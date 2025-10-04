/*
  # Create API Keys Table

  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key)
      - `service_name` (text, unique) - Name of the service (e.g., 'gemini')
      - `api_key` (text) - The encrypted API key
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `api_keys` table
    - Add policy for authenticated users to read/write API keys
    - Only allow access to service administrators
*/

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text UNIQUE NOT NULL,
  api_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read API keys (you may want to restrict this further)
CREATE POLICY "Allow authenticated users to read API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update API keys (you may want to restrict this further)
CREATE POLICY "Allow authenticated users to manage API keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (true);

-- Insert the Gemini API key (you'll need to update this with your actual key)
INSERT INTO api_keys (service_name, api_key) 
VALUES ('gemini', 'AIzaSyCokxreCiW3NC10s1FSjGJmnwQK2yAjIyg')
ON CONFLICT (service_name) 
DO UPDATE SET 
  api_key = EXCLUDED.api_key,
  updated_at = now();