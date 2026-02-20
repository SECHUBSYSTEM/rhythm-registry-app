# Rhythm Registry

A progressive web app (PWA) for streaming and discovering original audio. Creators can upload long-form audio (e.g. 1–6 hours); listeners can stream online, search, and download for **encrypted, device-bound offline playback**.

## Tech stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **UI:** React 19, Tailwind CSS 4, Shadcn-style components
- **Backend:** Next.js API routes, Supabase (PostgreSQL + Storage + Auth)
- **Audio:** Native `<audio>`, signed URLs for streaming
- **Offline:** IndexedDB (idb), Web Crypto API (AES-GCM), device fingerprinting
- **PWA:** `@ducanh2912/next-pwa` (Workbox)

## Roles

- **Admin** – Approve/reject creator applications, full access
- **Creator** – Upload and manage own tracks (after approval)
- **Listener** – Browse, stream, search, download for offline

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key  
- `SUPABASE_SERVICE_ROLE_KEY` – For admin/seed scripts (server only)  
- Optional: `SEED_ADMIN_EMAIL_1`, `SEED_ADMIN_EMAIL_2` for seeding admins (see [Scripts](#scripts))

### 3. Database and storage

1. In **Supabase Dashboard → SQL Editor**, run the SQL in **`scripts/init-db.sql`** (creates `profiles`, `tracks`, `offline_downloads`, `creator_applications`, RLS, trigger).
2. In **Storage**, create a bucket named **`audio-files`**. Use **authenticated** or **public** read as needed; uploads go through the API with auth.

### 4. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, then (optional) seed admins and log in as admin to approve a creator.

### 5. Seed admins (optional)

After at least two users have signed up, set `SEED_ADMIN_EMAIL_1` and `SEED_ADMIN_EMAIL_2` in `.env.local`, then:

```bash
pnpm run seed:admins
```

This sets `profiles.role = 'admin'` for those users. See **`scripts/README.md`** for details.

## Scripts

| Command            | Description                    |
|--------------------|--------------------------------|
| `pnpm dev`         | Start dev server               |
| `pnpm build`       | Production build (Turbopack)   |
| `pnpm run build:webpack`         | Build with webpack (for PWA)   |
| `pnpm start`       | Start production server        |
| `pnpm run seed:admins` | Promote seed emails to admin   |

Database and seed instructions: **`scripts/README.md`**.

## Project structure (high level)

- **`app/`** – Routes: landing, `(auth)/login`, `(auth)/signup`, `(dashboard)/dashboard/*`, `api/*`
- **`components/`** – Providers (Auth, AudioPlayer, Offline), layout (Navbar, Sidebar), audio (AudioPlayer, Waveform), upload, tracks, UI
- **`lib/`** – `api.ts` (axios + auth), `supabase/` (client, server, middleware, admin), `encryption/` (device-key, crypto), `api-mappers.ts`
- **`types/`** – Shared TypeScript types
- **`scripts/`** – `init-db.sql`, `seed-admins.ts`

## Next steps (after MVP)

- **Playlists** – Schema and UI for playlists and playlist tracks  
- **Analytics** – Plays, downloads, basic creator stats  
- **Profiles** – Bio, avatar, social links  
- **Search** – Filters (tags, format, date), full-text tuning  
- **Recommendations** – Based on tags or listening history  
- **HLS / transcoding** – Optional adaptive streaming for very long files  
- **Toasts** – Use `react-toastify` (e.g. `toast.error()`) for API/validation errors and success messages  
- **Tests** – Unit and e2e for auth, upload, stream, offline  
- **Rate limiting** – Per-user upload and API limits  

## Deploy

- **Vercel:** Connect the repo, add env vars, deploy. For PWA (service worker), set the build command to `pnpm run build:webpack` (or `next build --webpack`).
- **Supabase:** Ensure production URL is in auth redirect URLs; consider Pro for large files (50–200 MB).

## License

Private / as per your project.
