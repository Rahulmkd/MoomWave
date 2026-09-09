# Moonwave

**A full-screen, modern music player experience** — pairs mood-based streaming audio with a "Now Playing"–style background driven by the current track's own album art, wrapped in a minimal glassmorphism UI. No accounts, no library management: pick a mood and it curates a soundtrack for you.

> **Note:** the browser tab title currently reads "Aetheria" (`src/app/layout.tsx`), a leftover from an earlier project name. It's cosmetic only — update the `metadata.title` in that file if you want it to say "Moonwave" instead.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Controls](#controls)
- [Known limitations](#known-limitations)
- [Deployment](#deployment)
- [License](#license)

---

## Features

- **Mood-based streaming playlists** — All Mix, Bollywood, Regional, Hollywood, and Cinematic, each backed by a rotating set of search queries so the playlist doesn't feel repetitive.
- **Modern "Now Playing" background** — a full-screen, softly blurred, slowly panning rendition of the current track's own album art, layered with drifting color glows — the background changes with every song, no unrelated stock photography involved.
- **Glass player bar** — play/pause, next/previous, seek, volume, mood picker, and fullscreen, all in a floating glassmorphism control bar that auto-hides when idle and adapts to phone-width screens.
- **Optional floating video** — the underlying YouTube player can be shown as a small draggable, floating video thumbnail instead of just audio. Hiding it is remembered across visits (saved to `localStorage`), so once you turn it off it stays off.
- **Time-synced lyrics, in the player bar** — a compact karaoke-style ticker built into the bottom player bar highlights the current line as the track plays, when synced lyrics are available. It quietly collapses when there's nothing to show, and its visibility is also remembered across visits.
- **Autoplay-safe** — shows a one-tap "Begin Listening" prompt on first load so playback reliably starts despite browser autoplay restrictions.
- **Keyboard shortcuts** — full control without touching the mouse (see [Controls](#controls)).
- **Live clock** overlay for an ambient "desk companion" feel.
- **No API keys required** to run — song and lyrics discovery both work out of the box with free, keyless sources.

## Tech stack

| | |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev) with the React Compiler enabled |
| Language | TypeScript (strict mode) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Icons | [lucide-react](https://lucide.dev) |
| Audio/Video | YouTube IFrame Player API |
| Linting | ESLint 9 + `eslint-config-next` |

## Getting started

**Prerequisites:** Node.js 20+ and npm (or yarn/pnpm/bun).

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app fetches an initial playlist automatically; no setup or sign-in is needed.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local dev server with Turbopack and hot reload. |
| `npm run build` | Create an optimized production build. |
| `npm run start` | Serve the production build (run `build` first). |
| `npm run lint` | Run ESLint across the project. |

## Environment variables

None. The app runs with zero configuration — songs come from a free YouTube search lookup and lyrics from a free, keyless lyrics database (see [How it works](#how-it-works)).

## Project structure

```
moonwave/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main app shell: state, playback logic, keyboard shortcuts
│   │   ├── layout.tsx            # Root layout, page metadata
│   │   ├── globals.css           # Global styles / Tailwind entry
│   │   └── api/
│   │       ├── songs/route.ts    # Finds streamable tracks for a mood (YouTube search)
│   │       └── lyrics/route.ts   # Finds & parses time-synced lyrics (lrclib.net)
│   ├── components/
│   │   ├── GlassPlayer.tsx       # Bottom playback control bar, incl. the lyrics ticker
│   │   ├── YouTubeAudioPlayer.tsx# Hidden/floating YouTube IFrame player + progress tracking
│   │   ├── BackgroundView.tsx    # Crossfading, blurred-album-art "Now Playing" background
│   │   ├── LiveClock.tsx         # Ambient clock overlay
│   │   └── AutoplayPrompt.tsx    # "Tap to start" gesture prompt for autoplay
│   └── types/index.ts            # Shared TypeScript types (Song, MusicMood, LyricLine)
├── public/                       # Static assets
├── next.config.ts
└── package.json
```

## How it works

**Songs (`/api/songs`)** — Given a `mood`, the route picks a random search query from a curated pool for that mood, scrapes YouTube's public search results page for matching videos (filtering out live streams), and returns a shuffled list of tracks. An `exclude` list of already-played video IDs keeps repeats to a minimum as you listen. Results are pooled in a short-lived in-memory cache per mood to avoid re-scraping on every request.

**Background** — `BackgroundView` takes the currently playing track's own artwork, blurs and scales it to fill the screen, and crossfades to the next track's artwork whenever the song changes — no separate image-fetching step, no unrelated stock photography, and no manual "change background" control needed. A drifting color-glow layer sits behind it for extra depth, with a permanent dark gradient wash underneath the player bar and clock for legibility.

**Playback** — `YouTubeAudioPlayer` drives a hidden (or optionally floating/draggable) YouTube IFrame player. It reports playback state, progress, and errors back up to the main page, which advances to the next track, fetches more songs when the queue runs low, and skips a track automatically if it fails to play.

**Lyrics (`/api/lyrics`)** — Whenever the current track changes, the app looks up synced lyrics on [lrclib.net](https://lrclib.net) (a free, keyless, community-sourced lyrics database) by title and artist, using duration to disambiguate between multiple matches when known, and parses the LRC timestamps server-side into a simple `{ time, text }[]` array. The `GlassPlayer` bar then shows whichever line's timestamp has most recently passed as a compact, single-line ticker — no separate sync mechanism needed. Results are cached both server-side (in-memory, per title+artist) and client-side, and if no synced lyrics exist for a track, the ticker just collapses instead of showing anything broken.

**Persisted preferences** — Whether the video and lyrics ticker are shown is saved to `localStorage`, so a preference (e.g. "always hide the video") sticks across page reloads and future visits, not just the current session.

## Controls

All primary actions are available both via the on-screen glass player bar and via keyboard shortcuts:

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `→` | Next track |
| `←` | Previous track |
| `M` | Mute / unmute |
| `V` | Show / hide the video |
| `L` | Show / hide the lyrics ticker |
| `F` | Toggle fullscreen (desktop/tablet only) |
| `H` or `/` | Toggle the shortcuts help overlay |

Shortcuts are ignored while typing in a text field.

## Known limitations

- **YouTube scraping is unofficial.** `/api/songs` parses YouTube's public search page rather than using the official Data API, since it requires no API key or quota. This is inherently fragile: YouTube can change its page structure, geo-restrict results, or rate-limit scraping at any time. For a production deployment with guaranteed reliability, consider switching to the [YouTube Data API v3](https://developers.google.com/youtube/v3) (requires an API key and is subject to daily quota limits).
- **Lyrics coverage varies.** `lrclib.net` is a community-contributed database, so coverage is strong for well-known Western/English tracks and patchier for Bollywood/regional songs. Matching also depends on how cleanly a track's title/artist were parsed from the (also scraped) YouTube video title, so some tracks won't find a match even if lyrics exist elsewhere. It's also a community database rather than an officially licensed lyrics provider — fine for personal/hobby use, worth checking the license terms before a large-scale public deployment.
- **In-memory caching is per server instance.** The song/lyrics pools cached in the API routes live in process memory, so on serverless platforms with multiple instances (e.g. Vercel) each instance keeps its own cache — this is a latency optimization, not a shared store.
- **No accounts or saved playlists.** Beyond the video/lyrics visibility preferences (which persist via `localStorage`), there's no history or library across sessions.

## Deployment

The app deploys like any standard Next.js app — [Vercel](https://vercel.com/new) is the simplest option:

```bash
npm run build
npm run start
```

The only outbound network requirements are access to `youtube.com` (song search, thumbnails/artwork + IFrame player) and `lrclib.net` (lyrics).

## License

No license file is currently included in this repository. Add one (e.g. MIT) before distributing or open-sourcing the project.
