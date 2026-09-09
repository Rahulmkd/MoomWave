import { NextRequest, NextResponse } from "next/server";
import { LyricLine } from "@/types";

// lrclib.net is a free, open, community-sourced lyrics database. It needs no
// API key and has no rate limiting, which is why it's used here instead of a
// commercial lyrics API — but its coverage is community-contributed, so not
// every track (especially Bollywood/regional tracks) will have a match.
// https://lrclib.net/docs

interface LrcLibResult {
  id: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
}

const LYRICS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const lyricsCache = new Map<
  string,
  { lines: LyricLine[] | null; fetchedAt: number }
>();

// Strip noise that hurts lyrics-search matching but is common in scraped
// YouTube titles, e.g. "Song Name (Official Video) [4K]" -> "Song Name".
function cleanForSearch(value: string): string {
  return value
    .replace(/[([][^)\]]*[)\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSyncedLyrics(raw: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const timeTagPattern = /\[(\d{2}):(\d{2})[.:](\d{2,3})\]/g;

  for (const rawLine of raw.split("\n")) {
    const tags = [...rawLine.matchAll(timeTagPattern)];
    if (tags.length === 0) continue;

    const text = rawLine.replace(timeTagPattern, "").trim();
    for (const tag of tags) {
      const minutes = parseInt(tag[1], 10);
      const seconds = parseInt(tag[2], 10);
      const fraction = parseInt(tag[3].padEnd(3, "0"), 10) / 1000;
      lines.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

// Among several search results, prefer the one with synced lyrics whose
// duration is closest to the track we're actually playing (when we know it).
function pickBestResult(
  results: LrcLibResult[],
  targetDuration?: number,
): LrcLibResult | undefined {
  const synced = results.filter(
    (r) => r.syncedLyrics && r.syncedLyrics.trim().length > 0,
  );
  if (synced.length === 0) return undefined;
  if (!targetDuration) return synced[0];

  return synced.reduce((best, current) => {
    const bestDiff = Math.abs(
      (best.duration ?? targetDuration) - targetDuration,
    );
    const currentDiff = Math.abs(
      (current.duration ?? targetDuration) - targetDuration,
    );
    return currentDiff < bestDiff ? current : best;
  }, synced[0]);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTitle = searchParams.get("title") || "";
    const rawArtist = searchParams.get("artist") || "";
    const durationParam = searchParams.get("duration");
    const targetDuration = durationParam ? Number(durationParam) : undefined;

    const title = cleanForSearch(rawTitle);
    const artist = cleanForSearch(rawArtist);

    if (!title) {
      return NextResponse.json({
        success: false,
        lines: null,
        reason: "missing_title",
      });
    }

    const cacheKey = `${title.toLowerCase()}|${artist.toLowerCase()}`;
    const cached = lyricsCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < LYRICS_CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        lines: cached.lines,
        cached: true,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(
      title,
    )}&artist_name=${encodeURIComponent(artist)}`;

    let lines: LyricLine[] | null = null;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Moonwave/1.0 (https://github.com/)",
        },
        signal: controller.signal,
      });

      if (res.ok) {
        const results = (await res.json()) as LrcLibResult[];
        const best = pickBestResult(results, targetDuration);
        if (best?.syncedLyrics) {
          lines = parseSyncedLyrics(best.syncedLyrics);
        }
      }
    } finally {
      clearTimeout(timeout);
    }

    lyricsCache.set(cacheKey, { lines, fetchedAt: Date.now() });

    return NextResponse.json({ success: true, lines });
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    // A lookup failure just means "no lyrics available" from the caller's
    // perspective, not a hard error, so callers don't need special handling.
    return NextResponse.json({ success: true, lines: null });
  }
}
