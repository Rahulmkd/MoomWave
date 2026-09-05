import { NextRequest, NextResponse } from "next/server";
import { Song } from "@/types";

export const dynamic = "force-dynamic";

const ALL_MIX_QUERIES = [
  "best romantic bollywood acoustic songs",
  "top billboard acoustic english pop hits",
  "soulful bollywood melodies arijit singh",
  "hindi indie acoustic songs anuv jain",
  "punjabi acoustic soulful melody songs",
  "bihari traditional songs soothing",
  "maithili traditional melody songs acoustic",
  "sharda sinha soothing melodies",
  "coke studio hindi soulful songs",
  "haryanvi songs acoustic melodies",
  "tamil telugu melody songs acoustic",
  "bengali acoustic baul songs",
  "cinematic ambient soundscape relaxing",
  "hollywood movie soundtrack emotional chill",
];

const GENRE_QUERIES: Record<string, string[]> = {
  mix: ALL_MIX_QUERIES,
  bollywood: [
    "best romantic bollywood songs acoustic",
    "bollywood acoustic unplugged melodies",
    "arijit singh soulful bollywood hits",
    "hindi indie acoustic songs anuv jain",
    "coke studio hindi soulful unplugged",
  ],
  regional: [
    "bihari traditional songs soothing",
    "maithili traditional melody songs acoustic",
    "punjabi acoustic soulful melody songs",
    "haryanvi songs acoustic melodies",
    "tamil telugu melody songs acoustic",
    "bengali acoustic baul songs",
  ],
  hollywood: [
    "top acoustic english pop songs billboard",
    "hollywood movie soundtrack emotional chill",
    "english chill melodic hits acoustic",
    "coldplay ed sheeran acoustic style",
  ],
  cinematic: [
    "cinematic ambient soundtrack music",
    "hans zimmer peaceful atmospheric",
    "cinematic emotional piano soundscape",
    "deep atmospheric ambient music",
  ],
};

function cleanTrackTitle(rawTitle: string): {
  title: string;
  cleanArtist?: string;
} {
  const title = rawTitle
    .replace(
      /\s*[\(\[]\s*(?:Official|HD|4K|HQ|Music Video|Audio|Video|Lyrics|Visualizer|Full Video|Lyrical Video|60FPS).*?[\)\]]/gi,
      "",
    )
    .replace(
      /\s*[\|•–-]\s*(?:Official Video|Lyrical|Full Song|T-Series|Zee Music|Sony Music|Speed Records).*$/gi,
      "",
    )
    .replace(/[★☆\u2728\u2764\u2665]/g, "")
    .trim();

  if (title.includes(" - ")) {
    const parts = title.split(" - ");
    if (parts.length >= 2 && parts[0].length < 40) {
      return {
        cleanArtist: parts[0].trim(),
        title: parts.slice(1).join(" - ").trim(),
      };
    }
  }

  return { title: title || rawTitle };
}

function parseDurationSeconds(durationStr?: string): number | undefined {
  if (!durationStr) return undefined;
  const parts = durationStr.split(":").map(Number);
  if (parts.some(isNaN)) return undefined;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return undefined;
}

// Minimal shape of the bits of YouTube's `ytInitialData` blob that we
// actually read, so we can avoid `any` without trying to model the entire
// (undocumented, unstable) payload.
interface YtBadge {
  metadataBadgeRenderer?: {
    style?: string;
    label?: string;
  };
}

interface YtVideoRenderer {
  videoId?: string;
  badges?: YtBadge[];
  title?: { runs?: { text?: string }[] };
  ownerText?: { runs?: { text?: string }[] };
  lengthText?: { simpleText?: string };
  thumbnail?: { thumbnails?: { url?: string }[] };
}

interface YtSearchInitialData {
  contents?: {
    twoColumnSearchResultsRenderer?: {
      primaryContents?: {
        sectionListRenderer?: {
          contents?: {
            itemSectionRenderer?: {
              contents?: { videoRenderer?: YtVideoRenderer }[];
            };
          }[];
        };
      };
    };
  };
}

async function searchYouTubeOnline(query: string): Promise<Song[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
      },
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (!match) return [];

    const data = JSON.parse(match[1]) as YtSearchInitialData;
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents;

    const songs: Song[] = [];

    for (const section of contents || []) {
      for (const item of section?.itemSectionRenderer?.contents || []) {
        const v = item.videoRenderer;
        if (!v || !v.videoId) continue;

        const isLive = v.badges?.some(
          (b: YtBadge) =>
            b.metadataBadgeRenderer?.style?.includes("LIVE") ||
            b.metadataBadgeRenderer?.label === "LIVE",
        );
        if (isLive) continue;

        const rawTitle = v.title?.runs?.[0]?.text || "";
        const channelName = v.ownerText?.runs?.[0]?.text || "Music";
        const durationText = v.lengthText?.simpleText;
        const durationSeconds = parseDurationSeconds(durationText);

        if (
          durationSeconds &&
          (durationSeconds < 40 || durationSeconds > 18000)
        ) {
          continue;
        }

        const { title, cleanArtist } = cleanTrackTitle(rawTitle);
        const thumbnails = v.thumbnail?.thumbnails || [];
        const bestThumbnail =
          thumbnails[thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

        songs.push({
          id: `yt_${v.videoId}`,
          videoId: v.videoId,
          title: title || rawTitle,
          artist: cleanArtist || channelName,
          artwork: bestThumbnail,
          duration: durationSeconds,
        });
      }
    }

    return songs;
  } catch (err) {
    console.warn(
      "YouTube search timed out or failed for query:",
      query,
      err instanceof Error ? err.message : err,
    );
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// Small in-memory pool cache, keyed by mood. Scraping YouTube's search page
// is by far the slowest and least reliable part of this route (up to the
// 6s fetch timeout), so repeated requests for the same mood within the TTL
// (e.g. the client polling for more songs, or several users picking the
// same mood) get served from this pool instead of re-scraping every time.
// Variety is preserved via the existing exclude-list filtering below. Note
// this cache is per server instance/process, which is fine here since it's
// purely a latency optimization, not a correctness requirement.
const SONG_POOL_TTL_MS = 5 * 60 * 1000;
const songPoolCache = new Map<string, { songs: Song[]; fetchedAt: number }>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moodParam = (searchParams.get("mood") || "mix").toLowerCase();
    const excludeParam = searchParams.get("exclude") || "";
    const queryParam = searchParams.get("q");

    const excludedIds = new Set(excludeParam.split(",").filter(Boolean));

    const queries = GENRE_QUERIES[moodParam] || ALL_MIX_QUERIES;
    // Pick random query from pool
    const randomQuery =
      queryParam || queries[Math.floor(Math.random() * queries.length)];

    const cached = songPoolCache.get(moodParam);
    const cacheIsFresh =
      !queryParam && cached && Date.now() - cached.fetchedAt < SONG_POOL_TTL_MS;

    let allSongs: Song[];
    if (cacheIsFresh && cached) {
      allSongs = cached.songs;
    } else {
      allSongs = await searchYouTubeOnline(randomQuery);

      if (allSongs.length === 0) {
        // Try secondary random query
        const secondary =
          queries[
            (Math.floor(Math.random() * queries.length) + 1) % queries.length
          ];
        allSongs = await searchYouTubeOnline(secondary);
      }

      if (!queryParam && allSongs.length > 0) {
        songPoolCache.set(moodParam, { songs: allSongs, fetchedAt: Date.now() });
      }
    }

    const filtered = allSongs.filter(
      (s) => !excludedIds.has(s.id) && !excludedIds.has(s.videoId),
    );
    const finalSongs = filtered.length > 0 ? filtered : allSongs;

    // Deduplicate by videoId
    const seen = new Set<string>();
    const uniqueSongs = finalSongs.filter((s) => {
      if (seen.has(s.videoId)) return false;
      seen.add(s.videoId);
      return true;
    });

    // Shuffle for fresh variety
    const shuffled = [...uniqueSongs].sort(() => Math.random() - 0.5);

    return NextResponse.json({
      success: true,
      mood: moodParam,
      query: randomQuery,
      count: shuffled.length,
      songs: shuffled,
    });
  } catch (error) {
    console.error("Error in /api/songs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch songs",
      },
      { status: 500 },
    );
  }
}
