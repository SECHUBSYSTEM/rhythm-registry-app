-- Run in Supabase SQL Editor if you already ran init-db.sql before.
-- Updates handle_new_user so new signups get display_name from user_metadata.
-- Existing users: use AuthProvider sync (user_metadata -> profile) or run:
--   UPDATE profiles p SET display_name = u.raw_user_meta_data->>'display_name'
--   FROM auth.users u WHERE p.id = u.id AND (p.display_name IS NULL OR p.display_name = '');

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
