import { NextRequest, NextResponse } from "next/server";
import { Song } from "@/types";

export const dynamic = "force-dynamic";

// const ALL_MIX_QUERIES = [
//   "latest romantic bollywood songs 2026",
//   "latest hindi songs 2026",
//   "top billboard english pop songs 2026",
//   "latest hindi romantic songs 2026",
//   "new hindi indie songs 2026",
//   "latest punjabi songs 2026",
//   "latest bihari songs 2026",
//   "latest maithili songs 2026",
//   "best sharda sinha songs",
//   "latest coke studio songs 2026",
//   "latest haryanvi songs 2026",
//   "latest tamil telugu songs 2026",
//   "latest bengali songs 2026",
//   "latest relaxing songs 2026",
//   "latest hollywood movie songs 2026",
// ];

// const GENRE_QUERIES: Record<string, string[]> = {
//   mix: ALL_MIX_QUERIES,

//   bollywood: [
//     "latest bollywood songs 2026",
//     "latest hindi romantic songs 2026",
//     "top hindi songs 2026",
//     "latest hindi indie songs 2026",
//     "popular hindi songs 2026",
//   ],

//   regional: [
//     "latest bihari songs 2026",
//     "latest maithili songs 2026",
//     "latest punjabi songs 2026",
//     "latest haryanvi songs 2026",
//     "latest tamil songs 2026",
//     "latest telugu songs 2026",
//     "latest bengali songs 2026",
//   ],

//   hollywood: [
//     "latest english songs 2026",
//     "top billboard songs 2026",
//     "latest english pop hits 2026",
//     "popular hollywood songs 2026",
//     "latest movie songs 2026",
//   ],

//   cinematic: [
//     "latest movie background music 2026",
//     "latest film music 2026",
//     "best movie songs 2026",
//     "latest instrumental music 2026",
//     "popular soundtrack songs 2026",
//   ],
// };

const ALL_MIX_QUERIES = [
  "latest romantic bollywood songs",
  "top hindi songs",
  "top billboard english pop hits",
  "latest hindi romantic songs",
  "popular hindi indie songs",
  "latest punjabi songs",
  "popular bihari songs",
  "popular maithili songs",
  "best sharda sinha songs",
  "popular coke studio songs",
  "latest haryanvi songs",
  "latest tamil telugu songs",
  "popular bengali songs",
  "best relaxing songs",
  "popular hollywood movie songs",
];

const GENRE_QUERIES: Record<string, string[]> = {
  mix: ALL_MIX_QUERIES,

  bollywood: [
    "latest bollywood songs",
    "latest hindi romantic songs",
    "top hindi songs",
    "popular hindi indie songs",
    "best bollywood love songs",
  ],

  regional: [
    "popular bihari songs",
    "popular maithili songs",
    "latest punjabi songs",
    "latest haryanvi songs",
    "latest tamil songs",
    "latest telugu songs",
    "popular bengali songs",
  ],

  hollywood: [
    "latest english songs",
    "top billboard songs",
    "latest english pop hits",
    "popular hollywood songs",
    "latest movie songs",
  ],

  cinematic: [
    "best movie background music",
    "popular film music",
    "best movie songs",
    "popular instrumental music",
    "best soundtrack songs",
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
        songPoolCache.set(moodParam, {
          songs: allSongs,
          fetchedAt: Date.now(),
        });
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
