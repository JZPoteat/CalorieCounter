# Nibble

A calorie and macro tracker built with Next.js and Supabase. Search the USDA food database, log meals by day and meal type, track macros against daily goals, and manage a library of custom foods.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database / Auth | Supabase (Postgres + RLS + Auth) |
| Food data | USDA FoodData Central API |

## Features

- Email/password authentication with password reset
- Daily food log organized by meal (breakfast, lunch, dinner, snack)
- USDA food search with macro preview before logging
- Custom food library (create, edit, delete)
- Daily macro progress bars vs. configurable goals
- 30-day history view
- Dark mode

## Local Setup

### 1. Clone and install

```
git clone <repo-url>
cd calorie-counter
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Project Settings -> API**, copy your Project URL and anon public key.
3. In **Authentication -> URL Configuration**, add `http://localhost:3001/auth/callback` to Redirect URLs.

### 3. Apply database migrations

```
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This creates the `profiles`, `food_entries`, and `custom_foods` tables with Row Level Security policies and a trigger that auto-creates a profile on sign-up.

### 4. Get a USDA API key

Register for a free key at https://fdc.nal.usda.gov/api-guide. The free tier allows 1,000 requests/hour.

### 5. Set environment variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
USDA_API_KEY=<your-usda-key>
```

`USDA_API_KEY` is server-only and never exposed to the browser. Do NOT add `SUPABASE_SERVICE_ROLE_KEY` -- it is not needed and bypasses RLS entirely.

## Project Structure

```
app/
  page.tsx                  # Landing page (redirects to /dashboard if logged in)
  (auth)/                   # Login, signup, forgot/reset password, auth callback
  (app)/                    # Protected routes (dashboard, log, history, foods, settings)
  api/food/search/          # Server-side USDA food search proxy
actions/                    # Server Actions (food entries, custom foods, profile, auth)
components/
  auth/                     # Login and signup forms
  dashboard/                # Daily summary, food entry list
  foods/                    # Custom food list and form
  history/                  # History day cards
  layout/                   # Navbar, mobile nav, theme toggle, theme provider
  log/                      # Food search, serving selector
  settings/                 # Goals form
  ui/                       # shadcn components
lib/
  supabase/                 # Server and browser Supabase client factories
  usda.ts                   # USDA API helpers
  utils.ts                  # cn(), macro math
types/
  index.ts                  # Shared TypeScript types
supabase/
  migrations/               # SQL migration files
proxy.ts                    # Next.js middleware (session refresh + route protection)
```
