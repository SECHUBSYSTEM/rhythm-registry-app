-- Fix RLS so creators can decline (update listener_orders to set assigned_creator_id = null).
-- Run in Supabase SQL Editor if you get "new row violates row-level security policy" on decline.
-- The issue is multiple UPDATE policies interfering with each other. The "Listeners can update own order preferences"
-- policy also applies to creators and doesn't have WITH CHECK, so it uses USING for both, which fails when
-- the creator sets assigned_creator_id to null (auth.uid() != user_id).

-- Fix the listener policy to have explicit WITH CHECK
DROP POLICY IF EXISTS "Listeners can update own order preferences" ON listener_orders;
CREATE POLICY "Listeners can update own order preferences" ON listener_orders
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Keep the creator policy with WITH CHECK (true)
DROP POLICY IF EXISTS "Creators can update assigned orders" ON listener_orders;
CREATE POLICY "Creators can update assigned orders" ON listener_orders
  FOR UPDATE
  USING (
    assigned_creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (true);
