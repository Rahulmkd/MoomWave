export interface Song {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  artwork: string;
  duration?: number;
  mood?: string;
}

export type MusicMood =
  "mix" | "bollywood" | "regional" | "hollywood" | "cinematic";
