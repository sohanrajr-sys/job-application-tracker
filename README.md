# Job Application Tracker

A full-stack job application tracker with a Next.js dashboard and Chrome extension. The extension auto-detects job applications on major platforms and syncs them to your personal dashboard.

---

## Architecture

```
├── job-tracker-web/        # Next.js 16 web app (dashboard + API)
└── job-tracker-extension/  # Chrome Extension MV3 (auto-detection + manual tracking)
```

**Stack:**
- **Frontend:** Next.js 16 (App Router, Turbopack), `@base-ui/react`, Tailwind CSS, Recharts
- **Backend:** Supabase (Postgres + Auth + RLS), Vercel (hosting + cron)
- **Extension:** Chrome MV3, Vite + CRXJS plugin, TypeScript

---

## Web App (`job-tracker-web`)

### Features
- Dashboard with stats and charts (applications over time, platform breakdown, status funnel)
- Applications table with status filtering and sorting
- Bookmarks view
- Reminders with optional email delivery via Resend
- Extension token card for linking the Chrome extension
- Admin panel (overview, users table, activity log, platform-wide graphs)

### Setup

**1. Install dependencies**
```bash
cd job-tracker-web
npm install
```

**2. Create a Supabase project**

Go to [supabase.com](https://supabase.com), create a new project, then copy the keys.

**3. Environment variables**

Create `job-tracker-web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL (used for CORS and email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron job auth (any strong random string, 32+ chars)
CRON_SECRET=your-random-secret

# Optional — email reminders via Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=reminders@yourdomain.com
```

**4. Run database migrations**

Open **Supabase → SQL Editor** and run each file in order:

| File | Purpose |
|------|---------|
| `supabase/migrations/001_initial_schema.sql` | Tables: profiles, applications, reminders, application_events |
| `supabase/migrations/002_rls_policies.sql` | Row-level security policies |
| `supabase/migrations/003_functions_triggers.sql` | Auto-profile creation, audit triggers, extension token lookup |
| `supabase/migrations/004_security_hardening.sql` | Blocks role self-escalation, locks reminder email to user's own |
| `supabase/migrations/005_onboarding.sql` | Onboarding flag, `rotate_extension_token` and `complete_onboarding` RPCs |

**5. Run locally**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deployment (Vercel)

```bash
# From repo root
vercel --prod
```

Set all `.env.local` variables as Vercel environment variables. The cron job at `/api/reminders/send` runs daily at 9am UTC (configured in `vercel.json`).

### Admin access

After signing up, grant yourself admin in Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

Admin routes are at `/admin`, `/admin/users`, `/admin/activity`.

---

## Chrome Extension (`job-tracker-extension`)

### Features
- **Auto-detection:** Detects job applications submitted on LinkedIn, Greenhouse, Lever, Workday and syncs automatically
- **Manual tracking:** Click the extension icon → "Save current page as job" to log any page
- **Badge indicator:** Green dot on extension icon when on a supported job portal
- **In-page banner:** "🎯 Job Tracker active on [platform]" notification on recognized portals

### Supported platforms (auto-detect)
LinkedIn · Greenhouse · Lever · Workday · SmartRecruiters · Ashby · Wellfound · Handshake · Glassdoor · ZipRecruiter · Dice · iCIMS · Rippling · Jobvite · Taleo

### Build

```bash
cd job-tracker-extension
npm install
npm run build
```

Output goes to `job-tracker-extension/dist/`.

### Install in Chrome (Developer Mode)

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `job-tracker-extension/dist/` folder

Or download `extension.zip` from the dashboard `/setup` page and load the extracted `dist/` folder.

### Link to your account

1. Log in to the dashboard → copy your **Extension Token** from the dashboard
2. Click the extension icon → paste token → **Save & Connect**
3. The status dot turns green when connected

---

## New User Onboarding

New users are automatically redirected to `/setup` after signup. The page provides:
- One-click extension `.zip` download
- Step-by-step installation instructions
- Live extension detection (shows a green banner if the extension is already active)

Once setup is marked complete, users go directly to `/dashboard` on future logins.

---

## CI / CD

GitHub Actions runs on every push to `main`:

- **Web job:** TypeScript typecheck + Next.js build
- **Extension job:** Vite build + artifact upload

Secrets required in GitHub → Settings → Secrets:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## Security

- All tables have Row-Level Security (RLS) — users can only access their own data
- Admin routes protected at both middleware and layout level
- Extension sync endpoint validates UUID token format before any DB lookup
- Input length limits on all extension sync fields
- Timing-safe cron secret comparison
- Reminder `email_to` locked to user's own account email (DB trigger enforced)
- Role self-escalation blocked by DB trigger
- Security headers on all routes: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`

---

## Project Structure

```
job-tracker-web/
├── src/
│   ├── app/
│   │   ├── (app)/              # Authenticated app routes (dashboard, applications, etc.)
│   │   ├── (auth)/             # Login, signup, callback
│   │   ├── admin/              # Admin-only pages
│   │   ├── setup/              # New user onboarding
│   │   └── api/
│   │       ├── extension/sync/ # Extension sync endpoint
│   │       └── reminders/send/ # Cron-triggered email reminders
│   ├── components/
│   │   ├── applications/       # Applications table + add dialog
│   │   ├── charts/             # Recharts wrappers
│   │   ├── layout/             # Sidebar, extension token card
│   │   ├── reminders/          # Reminders client component
│   │   └── ui/                 # Base UI primitives
│   ├── lib/supabase/           # Server + client Supabase instances
│   └── types/                  # Shared TypeScript types
└── supabase/migrations/        # SQL migrations (run in order)

job-tracker-extension/
├── src/
│   ├── background/             # MV3 service worker
│   ├── content/                # Content scripts + platform scrapers
│   ├── popup/                  # Extension popup UI
│   └── types/                  # Shared message types
└── manifest.json
```
