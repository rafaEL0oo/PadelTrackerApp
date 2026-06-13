# Padel Tracker

A production-ready Padel match tracking web application for private communities. Sign in with Google, create player groups, organize matches, track live scores in real time, and manage tournaments with automatic Elo ratings.

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Supabase** (Auth, PostgreSQL, Realtime)
- **Tailwind CSS** + **shadcn/ui** components
- **TanStack Query** for server state
- **React Router** for navigation
- **Zustand** for client state
- **Vite PWA** for installable mobile experience
- **Vercel** for deployment

## Features

- Google OAuth authentication with auto profile creation
- Groups with invite links
- Match creation (Best of 1/3/5 sets)
- Live scoring with tennis point logic (15-30-40, Deuce, Advantage)
- Full-screen scoring mode with Wake Lock, vibration, undo
- Real-time score sync via Supabase Realtime
- Public shareable match URLs (no auth required)
- Point-by-point timeline and replay
- Elo rating system with history
- Player and group statistics
- Tournaments: Round Robin, Americano, Mexicano
- Progressive Web App (installable on iOS/Android)

## Folder Structure

```
PadelWebApp/
├── public/
│   ├── favicon.svg
│   └── icons/                  # PWA icons
├── src/
│   ├── app/
│   │   └── router.tsx          # Route definitions
│   ├── components/
│   │   ├── layout/             # App, Auth, Score layouts
│   │   └── ui/                 # shadcn-style components
│   ├── features/
│   │   ├── groups/             # Group hooks & logic
│   │   ├── matches/            # Match components & hooks
│   │   ├── players/            # Player stats & rankings
│   │   └── scoring/            # Live score screen
│   ├── hooks/                  # useAuth, useMatchRealtime, useWakeLock
│   ├── lib/
│   │   ├── supabase/client.ts
│   │   └── utils.ts
│   ├── pages/                  # Route pages
│   ├── services/
│   │   ├── scoring.engine.ts   # Tennis scoring logic
│   │   ├── elo.service.ts      # Elo calculations
│   │   ├── match.service.ts    # Match CRUD & point registration
│   │   └── tournament.service.ts
│   ├── stores/                 # Zustand stores
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.example
├── vercel.json
└── vite.config.ts
```

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL Editor
3. Enable **Google OAuth** under Authentication → Providers
4. Add your site URL and redirect URL (`http://localhost:5173/dashboard`) under Authentication → URL Configuration
5. Enable **Realtime** for `matches`, `match_points`, `match_sets`, `match_games` (included in migration)

### 3. Environment variables

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deploy to Vercel

1. Push the repository to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

The included `vercel.json` configures SPA rewrites so client-side routing works.

### Post-deploy checklist

- Add your Vercel domain to Supabase Auth redirect URLs
- Add production URL to Google OAuth authorized origins
- Verify Realtime is enabled on production Supabase project

## Scoring Engine

The scoring engine (`src/services/scoring.engine.ts`) implements standard tennis/padel point progression:

| Points | Display |
|--------|---------|
| 0      | 0       |
| 1      | 15      |
| 2      | 30      |
| 3      | 40      |
| 4+     | Game    |

- **Deuce** at 40-40
- **Advantage** when leading by 1 after deuce
- **Game** when leading by 2 after 40, or winning from advantage
- **Set** at 6 games with 2-game lead (7-6 tiebreak simplified)
- **Match** based on format (BO1/BO3/BO5)

Every point is persisted to `match_points` with full score snapshot.

## Elo System

- Initial rating: **1000**
- K-factor: **32**
- Team Elo = average of both players
- Ratings updated after each completed match
- Full history stored in `elo_history`

## Realtime

Score updates propagate via Supabase Realtime postgres changes on:

- `matches` (UPDATE)
- `match_points` (INSERT/DELETE)

Connected clients see updates in under 1 second without refresh.

## PWA

The app is installable as a Progressive Web App:

- Web App Manifest with icons and theme
- Service Worker with offline shell caching
- Network-first caching for Supabase API
- Wake Lock API during live scoring
- Vibration feedback on point registration

**Install on iOS:** Safari → Share → Add to Home Screen  
**Install on Android:** Chrome → Install app prompt

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Google sign-in |
| `/dashboard` | Groups overview |
| `/groups/:id` | Group details, ranking, matches |
| `/groups/:id/matches/new` | Create match |
| `/groups/:id/tournaments` | Tournament management |
| `/matches/:id` | Match details & timeline |
| `/matches/:id/score` | Full-screen live scoring |
| `/m/:slug` | Public live match view |
| `/rankings` | Global Elo leaderboard |
| `/players/:id` | Player profile & stats |
| `/join/:code` | Join group via invite link |

## License

MIT
