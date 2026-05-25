import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

const ensureSupabaseConfigured = () => {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment.'
    );
  }
};

/**
 * Upload a video file to Supabase Storage and return its public URL.
 */
export async function uploadVideoClip(file) {
  ensureSupabaseConfigured();

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `clips/${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage
    .from('video-clips')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('video-clips')
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    filename: file.name,
    path: filePath,
  };
}

/**
 * Save a DRS review record to the drs_reviews table.
 */
export async function saveDrsReview({
  appealType,
  batsman,
  bowler,
  ruling,
  explanation,
  calibrationX,
  decisiveFrame,
  videoUrl,
  videoFilename,
  sourceMode,
}) {
  ensureSupabaseConfigured();

  const { data, error } = await supabase
    .from('drs_reviews')
    .insert([
      {
        appeal_type: appealType,
        batsman,
        bowler,
        ruling,
        explanation,
        calibration_x: calibrationX,
        decisive_frame: decisiveFrame,
        video_url: videoUrl || null,
        video_filename: videoFilename || null,
        source_mode: sourceMode,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Save DRS review error:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch all past DRS reviews, most recent first.
 */
export async function fetchDrsReviews() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('drs_reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch reviews error:', error);
    throw error;
  }

  return data;
}
