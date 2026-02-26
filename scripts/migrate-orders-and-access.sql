-- Migration: listener orders, user_track_access, profile listener_access_granted_at
-- Run in Supabase SQL Editor after init-db.sql

-- 1. Add listener_access_granted_at to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS listener_access_granted_at TIMESTAMPTZ;

-- 2. Order status enum and listener_orders table
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'AWAITING_ASSIGNMENT',
    'ASSIGNMENT_PENDING',
    'ASSIGNED',
    'PLAYLIST_PENDING',
    'PREFERENCES_SUBMITTED',
    'PREVIEW_PLAYLIST_READY',
    'REVISION_REQUESTED',
    'PLAYLIST_APPROVED',
    'FINAL_DELIVERED',
    'PAYOUT_ELIGIBLE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS listener_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  vibe_tags TEXT[],
  rush BOOLEAN NOT NULL DEFAULT FALSE,
  status order_status NOT NULL DEFAULT 'AWAITING_ASSIGNMENT',
  assigned_creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  total_amount_cents INTEGER NOT NULL,
  rush_fee_cents INTEGER NOT NULL DEFAULT 0,
  spotify_playlist_url TEXT,
  must_play TEXT,
  do_not_play TEXT,
  special_moments TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listener_orders_user_id ON listener_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_listener_orders_assigned_creator ON listener_orders(assigned_creator_id);
CREATE INDEX IF NOT EXISTS idx_listener_orders_status ON listener_orders(status);
CREATE INDEX IF NOT EXISTS idx_listener_orders_stripe_session ON listener_orders(stripe_session_id);

-- 3. order_playlist (preview playlist + revision notes)
CREATE TABLE IF NOT EXISTS order_playlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES listener_orders(id) ON DELETE CASCADE,
  playlist_data JSONB NOT NULL DEFAULT '[]',
  revision_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_playlist_order_id ON order_playlist(order_id);

-- 4. user_track_access (which tracks a user can see/stream)
CREATE TABLE IF NOT EXISTS user_track_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'purchase',
  order_id UUID REFERENCES listener_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_user_track_access_user_id ON user_track_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_track_access_track_id ON user_track_access(track_id);

-- 5. Link tracks to order (for final mix)
ALTER TABLE tracks
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES listener_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tracks_order_id ON tracks(order_id) WHERE order_id IS NOT NULL;

-- 6. RLS for listener_orders
ALTER TABLE listener_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Listeners can view own orders" ON listener_orders;
CREATE POLICY "Listeners can view own orders" ON listener_orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Listeners can update own order preferences" ON listener_orders;
CREATE POLICY "Listeners can update own order preferences" ON listener_orders
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Creators can view assigned orders" ON listener_orders;
CREATE POLICY "Creators can view assigned orders" ON listener_orders
  FOR SELECT USING (
    assigned_creator_id IN (SELECT id FROM profiles WHERE id = auth.uid() AND role IN ('creator', 'admin'))
  );

DROP POLICY IF EXISTS "Creators can update assigned orders" ON listener_orders;
CREATE POLICY "Creators can update assigned orders" ON listener_orders
  FOR UPDATE
  USING (
    assigned_creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can do all on orders" ON listener_orders;
CREATE POLICY "Admins can do all on orders" ON listener_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Service role / API will insert orders (webhook); allow insert via service role or add policy for authenticated
-- For API routes using createClient() with user JWT: user cannot insert orders directly; webhook uses service role
-- So we need a policy that allows insert only from backend (e.g. service role). Supabase RLS: no policy = no access.
-- So we need INSERT policy: only allow if... we can't easily do "service role" in RLS. Alternative: use a database function with SECURITY DEFINER for creating orders, called from API with service role. For simplicity, allow insert for authenticated users where user_id = auth.uid() so that our API (which has user context) can create order on behalf of user - but order creation happens in webhook with service role. So webhook should use createAdminClient() or service role key to bypass RLS. So we don't need INSERT policy for anon/authenticated - webhook uses admin client. So no INSERT policy for listener_orders for authenticated users - only service role can insert. That's the default: no policy = only service role. So we're good.

-- 7. RLS for order_playlist
ALTER TABLE order_playlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order owner and assigned creator can view playlist" ON order_playlist;
CREATE POLICY "Order owner and assigned creator can view playlist" ON order_playlist
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listener_orders o
      WHERE o.id = order_playlist.order_id
      AND (o.user_id = auth.uid() OR o.assigned_creator_id IN (SELECT id FROM profiles WHERE id = auth.uid()))
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Assigned creator can insert/update playlist" ON order_playlist;
CREATE POLICY "Assigned creator can insert/update playlist" ON order_playlist
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM listener_orders o
      WHERE o.id = order_playlist.order_id
      AND o.assigned_creator_id IN (SELECT id FROM profiles WHERE id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 8. RLS for user_track_access
ALTER TABLE user_track_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own access" ON user_track_access;
CREATE POLICY "Users can view own access" ON user_track_access
  FOR SELECT USING (auth.uid() = user_id);

-- Insert: only service role (webhook/API with admin client) or creator when uploading final mix. So no INSERT for regular user - backend only.
-- Admins may need to manage: allow admin to insert/delete for support
DROP POLICY IF EXISTS "Admins can manage user_track_access" ON user_track_access;
CREATE POLICY "Admins can manage user_track_access" ON user_track_access
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 9. Update tracks RLS: allow select only for creator, user_track_access, or admin (catalog gated)
DROP POLICY IF EXISTS "Allow select for public or owners" ON tracks;
CREATE POLICY "Allow select for creator access or user_track_access or admin" ON tracks FOR SELECT USING (
  (auth.uid() = creator_id)
  OR EXISTS (SELECT 1 FROM user_track_access u WHERE u.track_id = tracks.id AND u.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
