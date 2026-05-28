-- Copy and run this in your Supabase SQL Editor

CREATE TABLE profiles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text,
  phone text,
  skills jsonb,
  experience text,
  education text,
  summary text,
  resume_url text,
  parsed_data jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) if desirable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for demonstration (Update this in production)
CREATE POLICY "Allow public insert on profiles" 
ON profiles FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow public selects for demonstration
CREATE POLICY "Allow public select on profiles" 
ON profiles FOR SELECT 
TO public 
USING (true);

-- Migration: Add parsed_data column (run if upgrading from v0)
-- ALTER TABLE profiles ADD COLUMN parsed_data jsonb;

-- --- Storage: resume PDFs (required for apply / match upload) ---
-- Run after creating bucket "resumes" in Dashboard, or use this SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read resumes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');

CREATE POLICY "Public upload resumes"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'resumes');
