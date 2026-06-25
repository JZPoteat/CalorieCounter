# Calorie Counter — Design Document

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Infrastructure & Deployment](#infrastructure--deployment)
5. [Authentication](#authentication)
6. [Database Schema](#database-schema)
7. [Food Data Source](#food-data-source)
8. [API Design](#api-design)
9. [Frontend Structure](#frontend-structure)
10. [Component Breakdown](#component-breakdown)
11. [Implementation Plan](#implementation-plan)

---

## Overview

A multi-user, web-based calorie and macro tracker. Users create an account, set daily calorie/macro goals, search for foods using a public food database or create custom foods, log meals throughout the day, and view a running daily total. A history view shows past days at a glance.

### In-Scope (v1)
- User authentication (signup / login / logout)
- Personal daily goals (calories, protein, carbs, fat)
- Food search backed by the USDA FoodData Central API
- Custom food creation per user
- Daily food log with running macro totals
- Basic history view (past logged days)

### Out-of-Scope (v1)
- Barcode scanning
- Weight / body composition tracking
- Exercise / activity logging
- Social or sharing features
- Native mobile app

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | **Next.js 15 (App Router)** | First-class Vercel support, server components for fast data loads, built-in API routes |
| Language | **TypeScript** | Type safety across client and server code |
| Styling | **Tailwind CSS** | Utility-first, pairs well with component libraries, great DX |
| Component library | **shadcn/ui** | Unstyled Radix UI primitives styled with Tailwind; copy-paste, no bundle overhead |
| Backend / DB | **Supabase** | Managed Postgres + Row Level Security + Auth in one platform |
| Auth | **Supabase Auth** | Email/password out of the box; optional OAuth (Google, GitHub) later |
| Supabase client | **@supabase/ssr** | Official SSR-compatible package for Next.js App Router |
| Food database API | **USDA FoodData Central** | Free, no monthly cost, 1,000 req/hr, CC0 licensed data |
| Hosting | **Vercel** | Zero-config Next.js deploys, preview URLs, edge network |
| Package manager | **npm** | Ships with Node.js, no additional tooling required |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    Browser                      │
│          Next.js React Client Components        │
└───────────────────┬─────────────────────────────┘
                    │ HTTPS
┌───────────────────▼─────────────────────────────┐
│              Vercel (Edge / Node)               │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │       Next.js App Router                │   │
│  │  • Server Components (SSR data fetch)   │   │
│  │  • Server Actions (mutations)           │   │
│  │  • /api/food/search  (proxy route)      │   │
│  └──────────┬──────────────────────────────┘   │
└─────────────┼───────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼
┌────────────┐   ┌─────────────────────┐
│  Supabase  │   │ USDA FoodData API   │
│            │   │ api.nal.usda.gov    │
│ • Postgres │   │ (food search only,  │
│ • Auth     │   │  server-side only)  │
│ • RLS      │   └─────────────────────┘
└────────────┘
```

**Key architectural decisions:**

- **Supabase is called directly from Server Components and Server Actions** — no separate REST API layer is needed. RLS ensures users only access their own rows.
- **The USDA API key is server-side only**, proxied through a Next.js API route (`/api/food/search`). It is never exposed to the browser.
- **Server Components** handle initial page data loads (dashboard, history). **Client Components** handle interactive UI (search bar, forms).
- **Server Actions** handle all database writes (add entry, delete entry, save goals, create custom food).

---

## Infrastructure & Deployment

### Vercel

- Connect the GitHub repo to Vercel; every push to `main` triggers a production deploy.
- Pull Requests automatically get preview deployment URLs.
- Environment variables are set in the Vercel dashboard (not committed to the repo):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `USDA_API_KEY` *(server-only)*

> **Note:** Do not add `SUPABASE_SERVICE_ROLE_KEY`. It bypasses RLS entirely and is not needed — all server-side operations use the anon key with the user's session, which RLS already scopes correctly.

### Supabase

- One project covers the database, auth, and storage (if needed later).
- **Two environments**: a local dev project (Supabase CLI + Docker) and a production cloud project.
- Database migrations are tracked as `.sql` files under `supabase/migrations/` and applied via the Supabase CLI.
- Email templates (password reset) are configured in the Supabase dashboard.
- Auth redirect URLs are allowlisted: `https://<your-vercel-domain>.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`.

### Local development

```
npm run dev       # starts Next.js dev server on :3000
supabase start    # starts local Supabase (Postgres on :54322, Studio on :54323)
```

---

## Authentication

Supabase Auth handles all identity. The flow uses **PKCE** (Proof Key for Code Exchange) which is the recommended flow for server-side apps.

> **Account creation**: Accounts are created directly via the Supabase dashboard. The `/signup` route exists but displays an "unavailable" message rather than a functional form.

### Flows

| Flow | Route |
|---|---|
| Sign up | `/signup` → shows "signup not currently available" message |
| Sign in | `/login` → redirect to `/dashboard` |
| Sign out | Server Action clears session → redirect to `/login` |
| Password reset | `/forgot-password` → email link → `/auth/callback?type=recovery` → `/reset-password` |

### Session management

- `@supabase/ssr` creates a Supabase client that reads/writes cookies.
- A Next.js **middleware** (`middleware.ts`) runs on every request to silently refresh expired tokens and protect routes.
- Protected routes: all routes under `/dashboard`, `/log`, `/history`, `/foods`, `/settings` redirect to `/login` if no valid session exists.

### Profile creation

A Supabase **database trigger** on `auth.users` automatically inserts a row into the `profiles` table with default goals when a new user signs up. This avoids a round-trip from the client.

```sql
-- Trigger: on new user created, insert default profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Database Schema

### `profiles`

Extends `auth.users` with app-specific user data and daily goals.

```sql
CREATE TABLE profiles (
  id             UUID    REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name   TEXT,
  calorie_goal   INTEGER NOT NULL DEFAULT 2000,
  protein_goal   INTEGER NOT NULL DEFAULT 150,   -- grams
  carbs_goal     INTEGER NOT NULL DEFAULT 250,   -- grams
  fat_goal       INTEGER NOT NULL DEFAULT 65,    -- grams
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `food_entries`

One row per logged food item per user per day. Macro values are stored as a **snapshot at time of logging** — editing a custom food later does not retroactively change past entries. This is intentional: a food log records what you actually ate, not a recalculation of current nutritional data.

```sql
CREATE TABLE food_entries (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  meal_type        TEXT        CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name        TEXT        NOT NULL,
  calories         NUMERIC(8,2) NOT NULL,
  protein          NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbs            NUMERIC(8,2) NOT NULL DEFAULT 0,
  fat              NUMERIC(8,2) NOT NULL DEFAULT 0,
  serving_size     TEXT,                          -- e.g. "100g", "1 slice"
  serving_qty      NUMERIC(8,2) NOT NULL DEFAULT 1,
  source           TEXT        NOT NULL CHECK (source IN ('api', 'custom')),
  external_food_id TEXT,                          -- fdcId from USDA (if source = 'api')
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX food_entries_user_date_idx ON food_entries (user_id, logged_date);
```

### `custom_foods`

User-defined foods that appear alongside API results in search.

```sql
CREATE TABLE custom_foods (
  id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                  TEXT         NOT NULL,
  calories_per_serving  NUMERIC(8,2) NOT NULL,
  protein_per_serving   NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbs_per_serving     NUMERIC(8,2) NOT NULL DEFAULT 0,
  fat_per_serving       NUMERIC(8,2) NOT NULL DEFAULT 0,
  serving_size          TEXT,                       -- e.g. "1 cup (240ml)"
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Row Level Security (RLS)

RLS is **enabled on all three tables**. Users can only read and write their own rows.

```sql
-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

-- food_entries
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own entries"
  ON food_entries FOR ALL USING (auth.uid() = user_id);

-- custom_foods
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own custom foods"
  ON custom_foods FOR ALL USING (auth.uid() = user_id);
```

---

## Food Data Source

### USDA FoodData Central (FDC)

- **Base URL**: `https://api.nal.usda.gov/fdc/v1`
- **Auth**: `?api_key=<key>` query parameter (free key, sign up at fdc.nal.usda.gov)
- **Rate limit**: 1,000 requests / hour per IP (plenty for a web app)
- **License**: CC0 1.0 — public domain, no attribution required
- **Key endpoints used**:
  - `GET /foods/search?query=chicken+breast&pageSize=10` — keyword search
  - `GET /food/{fdcId}` — full nutrient detail for a specific food

### Why FDC over alternatives

| Option | Cost | Rate limit | Notes |
|---|---|---|---|
| USDA FoodData Central | Free | 1,000/hr | Large database, public domain, no contract |
| Edamam Food DB | Free tier: 10K/month | Monthly cap | Requires app_id + app_key, richer NLP search |
| Open Food Facts | Free | No hard limit | Best for packaged/branded goods with barcodes |
| Nutritionix | Free tier: 500/day | Daily cap | Best NLP but free tier is very limited |

FDC is the best fit for v1 — no cost, no monthly caps, and a broad dataset. Edamam can be added later if users need better natural-language search ("1 bowl of oatmeal").

### Serving size normalization

FDC returns nutrients per 100g by default. When displaying to the user:
1. Check whether the food has a `servingSize` (grams) and `servingSizeUnit` field populated — FDC does not always include these.
2. If `servingSize` is present, use it as the reference weight and show it as the label (e.g. "1 serving = 85g").
3. If `servingSize` is absent, default to 100g = 1 serving.
4. Let the user input a `serving_qty` multiplier.
5. Scale all macros: `displayed_value = (per_100g_value / 100) * serving_size_in_grams * serving_qty`

---

## API Design

All user data reads happen in **Server Components** via the Supabase server client. All mutations go through **Server Actions**. The only traditional HTTP API route is the food search proxy.

### `GET /api/food/search`

Proxies USDA FDC to keep the API key server-side.

**Query params**: `q` (required), `page` (optional, default 1), `pageSize` (optional, default 10)

**Response shape**:
```json
{
  "foods": [
    {
      "fdcId": 171705,
      "description": "Chicken, broilers or fryers, breast, meat only, cooked, roasted",
      "brandOwner": null,
      "calories": 165,
      "protein": 31.0,
      "carbs": 0,
      "fat": 3.6,
      "servingSize": 100,
      "servingSizeUnit": "g"
    }
  ],
  "totalHits": 142,
  "currentPage": 1
}
```

### Server Actions (mutations)

| Action | Table | Description |
|---|---|---|
| `addFoodEntry(data)` | `food_entries` | Insert a new log entry for today (or a given date) |
| `deleteFoodEntry(id)` | `food_entries` | Delete a single entry owned by the current user |
| `updateGoals(data)` | `profiles` | Update daily calorie / macro goals |
| `createCustomFood(data)` | `custom_foods` | Create a new custom food |
| `updateCustomFood(id, data)` | `custom_foods` | Update an existing custom food |
| `deleteCustomFood(id)` | `custom_foods` | Delete a custom food |

---

## Frontend Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/         page.tsx
│   │   ├── signup/        page.tsx   ← shows "unavailable" message
│   │   └── auth/callback/ route.ts   ← Supabase PKCE callback handler (password reset)
│   ├── (app)/             ← protected layout with navbar
│   │   ├── layout.tsx
│   │   ├── dashboard/     page.tsx
│   │   ├── log/add/       page.tsx
│   │   ├── history/       page.tsx
│   │   ├── foods/custom/  page.tsx
│   │   └── settings/      page.tsx
│   ├── api/
│   │   └── food/search/   route.ts   ← USDA proxy
│   └── layout.tsx          (root layout)
├── middleware.ts             (session refresh, route protection)
├── components/
│   ├── ui/                 (shadcn/ui primitives)
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── dashboard/
│   │   ├── DailySummary.tsx
│   │   ├── MacroBar.tsx
│   │   └── FoodEntryList.tsx
│   ├── log/
│   │   ├── FoodSearch.tsx
│   │   ├── SearchResultCard.tsx
│   │   ├── ServingSelector.tsx
│   │   └── CustomFoodTab.tsx
│   ├── foods/
│   │   ├── CustomFoodList.tsx
│   │   └── CustomFoodForm.tsx
│   └── settings/
│       └── GoalsForm.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts       (server-side Supabase client factory)
│   │   └── client.ts       (browser-side Supabase client)
│   ├── usda.ts             (typed FDC API helpers)
│   └── utils.ts            (cn(), macro math helpers)
├── actions/
│   ├── food-entries.ts
│   ├── custom-foods.ts
│   └── profile.ts
└── types/
    └── index.ts            (shared TypeScript types)
```

---

## Component Breakdown

### Dashboard (`/dashboard`)

Server Component fetches today's `food_entries` and user `profile` (goals) in a single render. Passes data to:

- **`DailySummary`** — shows a circular progress ring for calories and three horizontal bars for protein/carbs/fat. Displays remaining vs. goal.
- **`FoodEntryList`** — lists each logged item with name, serving, and calorie count. Each row has a delete button (calls `deleteFoodEntry` Server Action).
- **`QuickAddButton`** — links to `/log/add`.

### Add Food (`/log/add`)

Client Component (needs interactivity):

- **`FoodSearch`** — debounced input, calls `/api/food/search`, renders `SearchResultCard` items. A tab switcher shows "Search" vs. "My Custom Foods".
- **`SearchResultCard`** — displays food name, brand, and per-100g macros. Click opens **`ServingSelector`**.
- **`ServingSelector`** — modal/drawer that lets the user enter a quantity and unit (defaults to food's own serving size). Confirms and calls `addFoodEntry`.

### Settings (`/settings`)

- **`GoalsForm`** — pre-filled with current goals from `profiles`. On submit calls `updateGoals` Server Action.

### Custom Foods (`/foods/custom`)

- **`CustomFoodList`** — table of user's custom foods with edit and delete actions.
- **`CustomFoodForm`** — form for creating or editing a custom food (name, serving size, calories, protein, carbs, fat).

---

## Implementation Plan

Each phase ends with a fully working, testable vertical slice — something you can actually use end-to-end, not just a layer of the stack.

### Phase 1 — Project Foundation
*End state: repo runs locally, database exists, auth middleware is wired up.*

| Step | Task |
|---|---|
| 1 | `npx create-next-app@latest calorie-counter --typescript --tailwind --app` |
| 2 | Install dependencies: `npm install @supabase/ssr @supabase/supabase-js zod react-hook-form @hookform/resolvers`, then `npx shadcn@latest init` |
| 3 | Create Supabase project (cloud). Save keys to `.env.local`. |
| 4 | Install Supabase CLI locally. Run `supabase init` and `supabase link` to link the local project. |
| 5 | Write and apply the first migration: create `profiles`, `food_entries`, `custom_foods` tables with RLS policies and the new-user trigger. |
| 6 | Create `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts` using `@supabase/ssr`. |
| 7 | Add `middleware.ts` to refresh session tokens on every request and redirect unauthenticated users to `/login`. |

### Phase 2 — Authentication
*End state: you can visit `/signup` (sees unavailable message), log in, land on a placeholder dashboard, and sign out. Account is created directly via the Supabase dashboard.*

| Step | Task |
|---|---|
| 8 | Build the protected `(app)/layout.tsx` with a top navbar (logo, nav links, user email + sign-out). Must exist before any redirect-after-login works. |
| 9 | Build `/signup` page — static message: "Public signup is not currently available." No form, no Supabase call. |
| 10 | Create `/auth/callback/route.ts` — exchanges the auth code for a session (PKCE callback, used for password reset). |
| 11 | Build `/login` page. Calls `supabase.auth.signInWithPassword()`. Redirect to `/dashboard` on success. |
| 12 | Add sign-out button in the navbar. Calls a Server Action that runs `supabase.auth.signOut()` and redirects to `/login`. |
| 13 | Add a placeholder `/dashboard` page (just a heading) so the post-login redirect lands somewhere. |

### Phase 3 — Core Logging Loop
*End state: the full core loop works — search for a food, set a serving size, log it, see it on the dashboard, delete it. This is the most important slice.*

| Step | Task |
|---|---|
| 13 | Create `/api/food/search/route.ts`. Verify a valid Supabase session first (return 401 if not). Fetch USDA FDC, map to internal shape, return JSON. |
| 14 | Build `FoodSearch` client component with debounced input (300ms) that calls `/api/food/search`. Show a loading skeleton while fetching. |
| 15 | Build `SearchResultCard` — show food name, brand (if any), and cal/protein/carbs/fat per 100g. |
| 16 | Build `ServingSelector` (sheet/drawer) — quantity input, live macro preview as the user types. On confirm, call `addFoodEntry` Server Action and redirect to `/dashboard`. |
| 17 | Build `/log/add` page composing the above components. |
| 18 | Replace the placeholder `/dashboard` with a real Server Component: fetch today's `food_entries`, render `FoodEntryList` with food name, serving, calories, macros, and a delete button wired to `deleteFoodEntry`. Show a "Add your first food" empty state. |

### Phase 4 — Goals & Macro Progress
*End state: you can set your calorie/macro goals and the dashboard shows real progress bars against them. The dashboard is now fully functional.*

| Step | Task |
|---|---|
| 19 | Build `/settings` page with `GoalsForm`. Pre-fill from the `profiles` row. On submit, call `updateGoals` Server Action. |
| 20 | Build `DailySummary` — fetch the user's goals alongside today's entries (already in the dashboard query). Display total calories vs. goal and three macro bars. Add to `/dashboard` above `FoodEntryList`. |

### Phase 5 — Custom Foods
*End state: you can create your own foods and log them through the same search flow.*

| Step | Task |
|---|---|
| 21 | Build `/foods/custom` page. Server Component fetches `custom_foods`. |
| 22 | Build `CustomFoodList` with edit and delete buttons. Delete wired to `deleteCustomFood` Server Action. |
| 23 | Build `CustomFoodForm` for create and edit. Fields: name, serving size, calories, protein, carbs, fat. Validated with Zod. Wired to `createCustomFood` / `updateCustomFood` Server Actions. |
| 24 | Add a "My Foods" tab to `/log/add`. Fetch the user's `custom_foods` and render them in the same `SearchResultCard` + `ServingSelector` flow. |

### Phase 6 — History & Polish
*End state: you can review past days and the app handles edge cases gracefully on all screen sizes.*

| Step | Task |
|---|---|
| 26 | Build `/history` page. Server Component queries `food_entries` grouped by `logged_date` (last 30 days). Show a card per day with total calories. Clicking a day expands to show that day's entries. |
| 27 | Add past-date logging — add a date picker to `ServingSelector` so you can log to a day other than today. |
| 28 | Add empty states, loading skeletons, and error boundaries throughout. |
| 29 | Audit mobile layout. Ensure all pages are usable on small screens. |

### Phase 7 — Production Deployment
*End state: the app is live on a public URL.*

| Step | Task |
|---|---|
| 30 | Push repo to GitHub. Connect to Vercel. Set all environment variables in the Vercel dashboard. |
| 31 | In the Supabase dashboard, set the **Site URL** and add the Vercel production URL to **Redirect URLs** (`https://your-app.vercel.app/auth/callback`). |
| 32 | Run `supabase db push` to apply migrations to the production Supabase project. |
| 33 | Smoke test the full user journey: sign up → confirm email → set goals → search food → log entry → view dashboard → view history → sign out. |
| 34 | Set up Vercel production branch protection (require PR reviews before merging to `main`). |

---

## Open Questions / Future Work

- **OAuth login** (Google/GitHub) — trivial to add with Supabase Auth; just enable the provider in the dashboard and add a button.
- **Better food search UX** — Edamam supports natural language queries ("2 scrambled eggs"), which is more user-friendly than FDC's keyword search.
- **Barcode scanning** — Open Food Facts has a barcode lookup endpoint (`https://world.openfoodfacts.org/api/v0/product/{barcode}.json`); could integrate via a camera input on mobile browsers.
- **Charts** — Replace the simple macro bars with `recharts` or `chart.js` charts on the history page.
- **PWA** — Add a Next.js PWA manifest so the app is installable on mobile.
