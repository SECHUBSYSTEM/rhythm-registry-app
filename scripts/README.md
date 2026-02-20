# Scripts

## Database setup

1. In Supabase Dashboard, open **SQL Editor** and run the contents of `init-db.sql`.
2. Create a Storage bucket named `audio-files` (Dashboard > Storage). Set to public read if you want direct URLs, or use signed URLs from API.

## Seed admins

After at least two users have signed up, set in `.env.local`:

- `SEED_ADMIN_EMAIL_1` – email of first admin
- `SEED_ADMIN_EMAIL_2` – email of second admin

Then run:

```bash
pnpm run seed:admins
```

This sets `profiles.role = 'admin'` for those two users.
