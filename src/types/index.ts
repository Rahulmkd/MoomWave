export interface Song {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  artwork: string;
  duration?: number;
  mood?: string;
}

export interface ScenicImage {
  id: string;
  url: string;
  blurUrl?: string;
  title: string;
  author: string;
  location?: string;
  category: 'mountain' | 'valley' | 'sunset' | 'travel';
}

export type MusicMood =
  | 'mix'
  | 'bollywood'
  | 'regional'
  | 'hollywood'
  | 'cinematic';
