# LifeHub

A personal command-center web app — **Dashboard · Life · Finance · Splitwise · Profile** —
built with React (Vite) and Supabase. Fully responsive: sidebar on desktop, an
app-style bottom tab bar on mobile.

This is a rebuild of your PHP "DevPanel" project on React + Supabase, with a new
**Splitwise** section added for group expense splitting.

## 1. Set up Supabase

1. Open your project: https://supabase.com/dashboard/project/ixjdjvkktlzgiyojnsto
2. Go to **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, and click **Run**.
   This creates all tables (profiles, tasks, notes, goals, reminders, ideas, expenses, budgets,
   and the Splitwise tables), a trigger that auto-creates a profile on signup, and all
   Row Level Security policies so users only ever see their own data (and Splitwise data
   shared with their group).
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key
4. Go to **Authentication → Providers** and confirm **Email** is enabled.
   For quicker local testing you can turn off "Confirm email" under
   **Authentication → Settings** (otherwise new users must click the link Supabase emails them).

## 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env` and paste your anon key:

```
VITE_SUPABASE_URL=https://ixjdjvkktlzgiyojnsto.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon public key>
```

## 3. Run it

```bash
npm install
npm run dev
```

Open the printed local URL, sign up with an email + password, and you're in.

Build for production with `npm run build` (outputs to `dist/`), preview with `npm run preview`.

## App structure

| Section | What it does |
|---|---|
| **Dashboard** | At-a-glance stats: pending tasks, active goals, this month's savings, Splitwise net balance, plus recent goals/transactions. |
| **Life** | Tabs for Tasks, Notes, Goals, Reminders, Ideas — each with full create/edit/delete. |
| **Finance** | Income/expense log, category pie chart, monthly budgets with progress bars. |
| **Splitwise** | Create groups, add members by email, log shared expenses split equally, view live balances per member, and record settlements. |
| **Profile** | Edit name/avatar, change password, sign out. |

### How Splitwise works
- Add a member to a group by their email — they must already have a LifeHub account
  (the `profiles` table is readable by all signed-in users so members can be looked up by email).
- Adding an expense records who paid and splits the amount equally across the members
  you select (uncheck anyone who wasn't part of that expense).
- Balances are computed live per group: `amount paid − share owed + settlements`.
  Positive = the person is owed money; negative = they owe money.
- "Settle up" records a payment between two members, which updates balances immediately.

## Tech stack

- React 19 + Vite, React Router
- Supabase (Postgres + Auth + Row Level Security) — `@supabase/supabase-js`
- Tailwind CSS v4 (theme tokens in `src/index.css`)
- Recharts for the finance category chart, Lucide for icons

## Folder guide

```
src/
  lib/supabaseClient.js     Supabase client (reads .env)
  context/AuthContext.jsx   session/profile state, sign in/up/out
  components/               Layout (sidebar + mobile bottom nav), ui.jsx primitives
  pages/                    Dashboard, Life, Finance, Splitwise, Profile
  features/life/*           Tasks/Notes/Goals/Reminders/Ideas tabs
  features/splitwise/*      Group detail (balances, expenses, settle up)
supabase/schema.sql          Full DB schema + RLS — run this in Supabase SQL Editor
```

## Notes on migrating your old data

Your old MySQL `devpanel.sql` used the same fields for tasks/notes/goals/reminders/ideas/
expenses/budgets — column names match on purpose, so exporting rows from MySQL as CSV
and importing them into the matching Supabase table (Table Editor → Insert → Import
data from CSV) should work with just the `user_id` values remapped to the new Supabase
Auth UUIDs.
