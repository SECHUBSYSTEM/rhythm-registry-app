-- Run this in Supabase SQL Editor (Dashboard > SQL Editor).
-- Creates schema for Rhythm Registry: profiles, tracks, offline_downloads, creator_applications, RLS, trigger.
-- Enable pg_trgm if you need text search: CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('admin', 'creator', 'listener');
CREATE TYPE creator_application_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role user_role NOT NULL DEFAULT 'listener',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  hls_path TEXT,
  duration INTEGER,
  format TEXT,
  bitrate INTEGER,
  file_size BIGINT,
  tags TEXT[],
  album_art_path TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offline_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  device_fingerprint_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ,
  UNIQUE(user_id, track_id, device_fingerprint_hash)
);

CREATE TABLE IF NOT EXISTS creator_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status creator_application_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  links TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_app_one_pending
  ON creator_applications (user_id) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_tracks_creator_id ON tracks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_tags ON tracks USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_tracks_is_public ON tracks(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_offline_downloads_user_track ON offline_downloads(user_id, track_id);
CREATE INDEX IF NOT EXISTS idx_offline_downloads_device_hash ON offline_downloads(device_fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_creator_applications_user_id ON creator_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_applications_status ON creator_applications(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert for creators" ON tracks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('creator', 'admin'))
);
CREATE POLICY "Allow select for public or owners" ON tracks FOR SELECT USING (
  (is_public = TRUE) OR (auth.uid() = creator_id)
);
CREATE POLICY "Allow update for owners" ON tracks FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Allow delete for owners" ON tracks FOR DELETE USING (auth.uid() = creator_id);

ALTER TABLE offline_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for owners" ON offline_downloads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own application" ON creator_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own application" ON creator_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all applications" ON creator_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can update applications" ON creator_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    'listener',
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
