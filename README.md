# Moonwave

**A full-screen, ambient cinematic music player** — pairs mood-based streaming audio with slow-zooming scenic landscape backgrounds, wrapped in a minimal glassmorphism UI. No accounts, no library management: pick a mood and it curates a soundtrack for you.


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
- **Cinematic scenic backgrounds** — full-screen, slow Ken Burns–style pans across mountain, valley, sunset, and travel photography, crossfading between shots.
- **Glass player bar** — play/pause, next/previous, seek, volume, mood picker, background cycling, and fullscreen, all in a floating glassmorphism control bar that auto-hides when idle.
- **Optional floating video** — the underlying YouTube player can be shown as a small draggable, floating video thumbnail instead of just audio.
- **Autoplay-safe** — shows a one-tap "Begin Soundscape" prompt on first load so playback reliably starts despite browser autoplay restrictions.
- **Keyboard shortcuts** — full control without touching the mouse (see [Controls](#controls)).
- **Live clock** overlay for an ambient "desk companion" feel.
- **No API keys required** to run — song and image discovery work out of the box; an Unsplash key is optional and only improves image quality/reliability.

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

Open [http://localhost:3000](http://localhost:3000) — the app fetches an initial playlist and background set automatically; no setup or sign-in is needed.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local dev server with Turbopack and hot reload. |
| `npm run build` | Create an optimized production build. |
| `npm run start` | Serve the production build (run `build` first). |
| `npm run lint` | Run ESLint across the project. |

## Environment variables

None are required to run the app. One optional variable improves the background-image source:

| Variable | Required | Purpose |
|---|---|---|
| `UNSPLASH_ACCESS_KEY` | No | If set, `/api/images` queries the official [Unsplash API](https://unsplash.com/developers) first for higher-quality, more relevant scenic photos. Without it, the app falls back to querying Wikimedia Commons directly, and finally to a small curated local image list — so it works with zero configuration. |

Create a `.env.local` file in the project root if you want to set it:

```bash
UNSPLASH_ACCESS_KEY=your_key_here
```

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
│   │       └── images/route.ts   # Finds scenic background images (Unsplash/Wikimedia)
│   ├── components/
│   │   ├── GlassPlayer.tsx       # Bottom playback control bar
│   │   ├── YouTubeAudioPlayer.tsx# Hidden/floating YouTube IFrame player + progress tracking
│   │   ├── BackgroundView.tsx    # Crossfading full-screen background layers
│   │   ├── LiveClock.tsx         # Ambient clock overlay
│   │   └── AutoplayPrompt.tsx    # "Tap to start" gesture prompt for autoplay
│   └── types/index.ts            # Shared TypeScript types (Song, ScenicImage, MusicMood)
├── public/                       # Static assets
├── next.config.ts
└── package.json
```

## How it works

**Songs (`/api/songs`)** — Given a `mood`, the route picks a random search query from a curated pool for that mood, scrapes YouTube's public search results page for matching videos (filtering out live streams), and returns a shuffled list of tracks. An `exclude` list of already-played video IDs keeps repeats to a minimum as you listen. Results are pooled in a short-lived in-memory cache per mood to avoid re-scraping on every request.

**Images (`/api/images`)** — Tries the official Unsplash API first (if `UNSPLASH_ACCESS_KEY` is set), then falls back to querying Wikimedia Commons for freely licensed landscape photography, and finally mixes in a small curated local list as a guaranteed baseline — so backgrounds always load even if both external sources fail.

**Playback** — `YouTubeAudioPlayer` drives a hidden (or optionally floating/draggable) YouTube IFrame player. It reports playback state, progress, and errors back up to the main page, which advances to the next track, fetches more songs when the queue runs low, and skips a track automatically if it fails to play.

## Controls

All primary actions are available both via the on-screen glass player bar and via keyboard shortcuts:

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `→` | Next track |
| `←` | Previous track |
| `M` | Mute / unmute |
| `V` | Show / hide the video |
| `F` | Toggle fullscreen |
| `B` | Change background image |
| `H` or `/` | Toggle the shortcuts help overlay |

Shortcuts are ignored while typing in a text field.

## Known limitations

- **YouTube scraping is unofficial.** `/api/songs` parses YouTube's public search page rather than using the official Data API, since it requires no API key or quota. This is inherently fragile: YouTube can change its page structure, geo-restrict results, or rate-limit scraping at any time. For a production deployment with guaranteed reliability, consider switching to the [YouTube Data API v3](https://developers.google.com/youtube/v3) (requires an API key and is subject to daily quota limits).
- **In-memory caching is per server instance.** The song/image pools cached in `/api/songs` and `/api/images` live in process memory, so on serverless platforms with multiple instances (e.g. Vercel) each instance keeps its own cache — this is a latency optimization, not a shared store.
- **No persistence.** There are no user accounts, saved playlists, or history beyond the current browser session.

## Deployment

The app deploys like any standard Next.js app — [Vercel](https://vercel.com/new) is the simplest option:

```bash
npm run build
npm run start
```

The only outbound network requirements are access to `youtube.com` (song search + IFrame player), `commons.wikimedia.org` (image fallback), and optionally `api.unsplash.com` if you've set `UNSPLASH_ACCESS_KEY`.

## License

No license file is currently included in this repository. Add one (e.g. MIT) before distributing or open-sourcing the project.
