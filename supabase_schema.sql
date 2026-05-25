-- ============================================================
-- CricVAR Database Schema for Supabase
-- Run this SQL in your Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create a storage bucket for video clips
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-clips', 'video-clips', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public uploads and reads on the video-clips bucket
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'video-clips');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'video-clips');

-- 3. Main table: drs_reviews
-- Stores every DRS decision review taken by a user
CREATE TABLE IF NOT EXISTS public.drs_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Appeal details
  appeal_type TEXT NOT NULL CHECK (appeal_type IN ('Run Out', 'Stumping', 'Caught Behind')),
  batsman TEXT NOT NULL,
  bowler TEXT NOT NULL,

  -- Decision result
  ruling TEXT NOT NULL CHECK (ruling IN ('OUT', 'NOT OUT')),
  explanation TEXT,

  -- Calibration snapshot
  calibration_x INTEGER,
  decisive_frame INTEGER,

  -- Video clip reference (nullable — only set when user uploads a clip)
  video_url TEXT,
  video_filename TEXT,

  -- Source mode
  source_mode TEXT NOT NULL DEFAULT 'simulation' CHECK (source_mode IN ('simulation', 'upload'))
);

-- 4. Enable Row Level Security (required by Supabase best practices)
ALTER TABLE public.drs_reviews ENABLE ROW LEVEL SECURITY;

-- 5. Allow anonymous inserts and reads (hackathon demo — no auth required)
CREATE POLICY "Allow public inserts" ON public.drs_reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public reads" ON public.drs_reviews
  FOR SELECT TO anon, authenticated
  USING (true);
