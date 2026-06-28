# Booking Ledger

A realtime, multi-user **booking management** Progressive Web App for commodity / grain trading desks. Built with **Next.js (App Router) + React + TypeScript + Tailwind CSS + Supabase**.

- Spreadsheet-style dashboard (sort, search, and filter on any column) inspired by Google Sheets / Notion / Airtable.
- **Supabase Auth** — individual logins for 3–4 users (no public signup; admin creates accounts).
- **Supabase Realtime** — every user sees new and edited bookings instantly, no refresh.
- Each booking automatically records **who created it** and the **date/time**.
- **Role-based permissions** — only the booking's creator *or* an admin can edit/delete it.
- **Installable PWA** — Add to Home Screen on Android, iPhone, Windows, and macOS.
- Deploys free on **Vercel** + **Supabase** free tiers.

---

## 1. Folder structure

```
booking-ledger/
├─ public/                          # Static assets served as-is
│  ├─ icons/
│  │  ├─ apple-touch-icon.png       # iOS home-screen icon
│  │  ├─ favicon-32.png
│  │  ├─ icon-192.png               # PWA icon (Android)
│  │  ├─ icon-512.png               # PWA icon (splash/large)
│  │  └─ icon-512-maskable.png      # PWA maskable icon
│  ├─ favicon.ico
│  ├─ manifest.webmanifest          # PWA manifest (name, icons, theme)
│  ├─ offline.html                  # Offline fallback page
│  └─ sw.js                         # Service worker (offline + caching)
│
├─ src/
│  ├─ app/                          # Next.js App Router
│  │  ├─ auth/
│  │  │  └─ signout/route.ts        # POST: clears session, redirects to /login
│  │  ├─ dashboard/
│  │  │  ├─ DashboardClient.tsx     # Client: realtime table + modals state
│  │  │  └─ page.tsx                # Server: auth guard + load profile
│  │  ├─ login/
│  │  │  └─ page.tsx                # Sign-in screen
│  │  ├─ globals.css                # Tailwind + base styles
│  │  ├─ layout.tsx                 # Root layout, fonts, metadata, providers
│  │  └─ page.tsx                   # Redirects to /dashboard or /login
│  │
│  ├─ components/
│  │  ├─ ui/
│  │  │  ├─ Button.tsx              # Reusable button (variants/sizes/loading)
│  │  │  └─ Field.tsx               # Input, Select, Textarea, Field wrapper
│  │  ├─ BookingFormModal.tsx       # Create + edit booking modal
│  │  ├─ BookingTable.tsx           # Core: toolbar, filters, sortable table, cards
│  │  ├─ ConfirmDialog.tsx          # Delete confirmation modal
│  │  ├─ Header.tsx                 # Top bar, user menu, sign out
│  │  ├─ PWARegister.tsx            # Registers the service worker
│  │  └─ Toast.tsx                  # Toast notifications provider
│  │
│  ├─ hooks/
│  │  └─ useBookings.ts             # Loads bookings + Realtime subscription
│  │
│  ├─ lib/
│  │  ├─ supabase/
│  │  │  ├─ client.ts               # Browser Supabase client
│  │  │  ├─ middleware.ts           # Session refresh + route protection
│  │  │  └─ server.ts               # Server Supabase client (cookies)
│  │  ├─ constants.ts               # App name, columns, quantity units
│  │  ├─ types.ts                   # TypeScript + Database types
│  │  └─ utils.ts                   # cn(), date/number formatting helpers
│  │
│  └─ middleware.ts                 # Root middleware (runs lib/supabase/middleware)
│
├─ supabase/
│  └─ schema.sql                    # Full DB schema: tables, RLS, triggers, realtime
│
├─ .env.example                     # Environment variable template
├─ .eslintrc.json
├─ .gitignore
├─ next-env.d.ts
├─ next.config.mjs
├─ package.json
├─ postcss.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
└─ vercel.json
```

---

## 2. Prerequisites

Install these once on your computer:

- **Node.js 18.18+** (or 20+) — <https://nodejs.org>
- **Git** — <https://git-scm.com>
- A free **GitHub** account — <https://github.com>
- A free **Supabase** account — <https://supabase.com>
- A free **Vercel** account — <https://vercel.com>

---

## 3. Supabase setup

### 3.1 Create the project
1. Go to <https://supabase.com/dashboard> and click **New project**.
2. Pick an organization, name it `booking-ledger`, set a strong **database password** (save it somewhere), choose a region close to you, and create the project. Wait ~2 minutes for it to finish provisioning.

### 3.2 Run the database schema
1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Open `supabase/schema.sql` from this project, copy **all** of it, paste into the editor.
3. Click **Run**. You should see `Success. No rows returned`.

This creates the `profiles` and `bookings` tables, all security policies (RLS), the triggers that auto-create a profile and stamp timestamps, and it enables Realtime on the `bookings` table.

### 3.3 Create your users (3–4 logins)
There is **no public signup** — you create each account by hand.

1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter an **email** and **password** (tell each person their password).
3. **Important:** expand **Auto Confirm User** and turn it **ON** (so they can log in immediately).
4. In the **User Metadata** box, paste JSON with the person's name:
   ```json
   { "full_name": "Rahul Sharma", "role": "user" }
   ```
   - Use `"role": "user"` for normal users.
   - Use `"role": "admin"` for anyone who should edit/delete **everyone's** bookings.
5. Click **Create user**. Repeat for each of your 3–4 people.

> The `full_name` and `role` you put here are read automatically by a database trigger and copied into the `profiles` table the moment the user is created.

### 3.4 Promote an admin later (optional)
If you forgot to set `role: admin` at creation, run this once in **SQL Editor** (replace the email):

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@company.com');
```

### 3.5 Get your API keys
Go to **Project Settings → API** and copy:
- **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
- **Project API keys → anon / public** → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

You'll use these in the next step and again on Vercel.

---

## 4. Environment variables

Copy `.env.example` to `.env.local` and fill in the two values from step 3.5:

```bash
cp .env.example .env.local
```

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

> Both keys are **public** by design (the `anon` key is safe in the browser — your data is protected by Row Level Security). Never paste your **service_role** key or database password into this app.

---

## 5. Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to **/login**. Sign in with one of the users you created in step 3.3.

To test realtime: open the app in two browser windows, sign in as two different users, add a booking in one — it appears instantly in the other.

---

## 6. Push to GitHub

1. Create a new **empty** repository on GitHub (no README/license) named `booking-ledger`.
2. In the project folder run:

```bash
git init
git add .
git commit -m "Initial commit: Booking Ledger"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/booking-ledger.git
git push -u origin main
```

> `.env.local` is already in `.gitignore`, so your keys will **not** be uploaded. Good.

---

## 7. Deploy on Vercel

1. Go to <https://vercel.com/new> and sign in with GitHub.
2. Click **Import** next to your `booking-ledger` repository.
3. Vercel auto-detects **Next.js** — leave Framework Preset, Build Command, and Output as-is.
4. Expand **Environment Variables** and add the same two from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` → your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your anon key
5. Click **Deploy**. After ~1–2 minutes you'll get a live URL like `https://booking-ledger-xxxx.vercel.app`.

Every future `git push` to `main` redeploys automatically.

### 7.1 Point Supabase at your live URL (recommended)
In Supabase → **Authentication → URL Configuration**, set **Site URL** to your Vercel URL so auth emails/links resolve correctly.

---

## 8. Install the app (Add to Home Screen)

Open your live Vercel URL on the device first, then:

### Android (Chrome)
1. Tap the **⋮** menu (top-right).
2. Tap **Install app** (or **Add to Home screen**).
3. Confirm — the icon lands on your home screen and opens full-screen like a native app.

### iPhone / iPad (Safari — must be Safari)
1. Tap the **Share** button (the square with an up-arrow).
2. Scroll down and tap **Add to Home Screen**.
3. Tap **Add** (top-right). The icon appears on your home screen.

> On iOS the install option **only** appears in Safari, not Chrome or other browsers.

### Windows / macOS (Chrome or Edge)
1. Look for the **install icon** (a monitor with a down-arrow) at the right edge of the address bar.
2. Click it → **Install**. The app opens in its own window and is added to your apps/Start menu/Dock.

---

## 9. How permissions work

- Any signed-in user can **view all** bookings and **create** their own.
- **Edit / Delete** buttons only appear on a row if you are the **creator** of that booking **or** an **admin**.
- This is enforced twice: in the UI (buttons hidden) and in the database (RLS policies), so it can't be bypassed.

---

## 10. Tech notes & troubleshooting

- **Realtime not updating?** In Supabase → **Database → Replication**, confirm the `bookings` table is in the `supabase_realtime` publication (the schema adds it automatically).
- **Can't log in?** Make sure the user was created with **Auto Confirm User** ON, or confirm them via **Authentication → Users**.
- **Name shows as blank?** The user was created without `full_name` metadata — edit the user's metadata, or update `public.profiles.full_name` directly in SQL.
- **Service worker / stale cache during development:** the SW caches static assets only and never caches Supabase or auth requests; do a hard refresh if you swap accounts.

---

### Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Start local dev server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run lint` | Run ESLint |

Built to be deployed directly with minimal modifications. Enjoy your ledger.
