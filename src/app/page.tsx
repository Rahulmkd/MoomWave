"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Song, MusicMood } from "@/types";
import BackgroundView from "@/components/BackgroundView";
import LiveClock from "@/components/LiveClock";
import GlassPlayer from "@/components/GlassPlayer";
import AutoplayPrompt from "@/components/AutoplayPrompt";
import SearchBar from "@/components/SearchBar";
import YouTubeAudioPlayer, {
  YouTubePlayerRef,
} from "@/components/YouTubeAudioPlayer";

const VIDEO_VISIBLE_STORAGE_KEY = "moonwave:isVideoVisible";

export default function Home() {
  // Songs and Audio State
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoadingSong, setIsLoadingSong] = useState<boolean>(true);
  const [mood, setMood] = useState<MusicMood>("mix"); // Defaults to dynamic mix
  const [isVideoVisible, setIsVideoVisible] = useState<boolean>(true);
  const playedVideoIdsRef = useRef<Set<string>>(new Set());

  // UI State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  const playerRef = useRef<YouTubePlayerRef>(null);

  const currentSong = songs[currentIndex] || null;

  const showAutoplayPrompt = !hasInteracted && !isPlaying && !isLoadingSong;

  useEffect(() => {
    try {
      const storedVideo = window.localStorage.getItem(
        VIDEO_VISIBLE_STORAGE_KEY,
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a preference from an external system (localStorage) on mount and syncing it into state is exactly what effects are for.
      if (storedVideo !== null) setIsVideoVisible(storedVideo === "true");
    } catch {
      // Ignore (e.g. private browsing modes that block storage access)
    }
  }, []);

  // Fetch dynamic songs online. Returns the number of songs that were
  // actually added, so callers that depend on the result (e.g. advancing to
  // a freshly-fetched batch) don't have to guess from stale closure state.
  const fetchDynamicSongs = useCallback(
    async (selectedMood: MusicMood, append = false): Promise<number> => {
      try {
        if (!append) setIsLoadingSong(true);
        const excludeList = Array.from(playedVideoIdsRef.current).join(",");
        const res = await fetch(
          `/api/songs?mood=${encodeURIComponent(selectedMood)}&exclude=${encodeURIComponent(excludeList)}`,
        );
        const data = await res.json();

        if (data.success && data.songs && data.songs.length > 0) {
          if (append) {
            setSongs((prev) => [...prev, ...data.songs]);
          } else {
            setSongs(data.songs);
            setCurrentIndex(0);
          }
          return data.songs.length as number;
        }
        return 0;
      } catch (err) {
        console.error("Error loading songs:", err);
        return 0;
      } finally {
        setIsLoadingSong(false);
      }
    },
    [],
  );

  const initialMoodRef = useRef(mood);
  useEffect(() => {
    fetchDynamicSongs(initialMoodRef.current);
  }, [fetchDynamicSongs]);

  // Next Track
  const handleNextSong = useCallback(() => {
    if (songs.length === 0) return;

    const nextIdx = currentIndex + 1;
    if (nextIdx < songs.length) {
      setCurrentIndex(nextIdx);
      setCurrentTime(0);
    } else {
      const startOfNewBatch = songs.length;
      fetchDynamicSongs(mood, true).then((appendedCount) => {
        setCurrentIndex(appendedCount > 0 ? startOfNewBatch : 0);
        setCurrentTime(0);
      });
    }
  }, [songs, currentIndex, mood, fetchDynamicSongs]);

  // Previous Track
  const handlePrevSong = useCallback(() => {
    if (songs.length === 0) return;
    if (currentTime > 4) {
      playerRef.current?.seekTo(0);
      setCurrentTime(0);
    } else {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
      setCurrentTime(0);
    }
  }, [songs.length, currentTime]);

  useEffect(() => {
    if (currentSong?.videoId) {
      playedVideoIdsRef.current.add(currentSong.videoId);
    }
  }, [currentSong?.videoId]);

  // Song Ended
  const handleSongEnded = useCallback(() => {
    handleNextSong();
  }, [handleNextSong]);

  // Error during song playback
  const handleErrorSong = useCallback(() => {
    console.warn("Song restricted or unavailable; advancing dynamically");
    handleNextSong();
  }, [handleNextSong]);

  // Play/Pause toggle
  const handleTogglePlay = useCallback(() => {
    playerRef.current?.togglePlay();
  }, []);

  const handleStartExperience = useCallback(() => {
    setHasInteracted(true);
    playerRef.current?.play();
  }, []);

  const handleProgress = useCallback((curr: number, dur: number) => {
    setCurrentTime(curr);
    setDuration((prev) => (dur > 0 && dur !== prev ? dur : prev));
  }, []);

  // Seek
  const handleSeek = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    playerRef.current?.seekTo(seconds);
  }, []);

  // Volume
  const handleVolumeChange = useCallback(
    (vol: number) => {
      setVolume(vol);
      if (isMuted && vol > 0) setIsMuted(false);
      playerRef.current?.setVolume(vol);
    },
    [isMuted],
  );

  // Mute toggle
  const handleToggleMute = useCallback(() => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    playerRef.current?.setMuted(nextMute);
  }, [isMuted]);

  const handleToggleVideo = useCallback(() => {
    setIsVideoVisible((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(VIDEO_VISIBLE_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors (e.g. private browsing)
      }
      return next;
    });
  }, []);

  // Mood / Genre change
  const handleChangeMood = useCallback(
    (newMood: MusicMood) => {
      setMood(newMood);
      fetchDynamicSongs(newMood, false);
    },
    [fetchDynamicSongs],
  );

  // Search songs
  const handleSearch = useCallback((query: string) => {
    setIsLoadingSong(true);
    fetch(`/api/songs?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.songs && data.songs.length > 0) {
          setSongs(data.songs);
          setCurrentIndex(0);
          setCurrentTime(0);
          setHasInteracted(true);
        }
      })
      .catch((err) => console.error("Search error:", err))
      .finally(() => setIsLoadingSong(false));
  }, []);

  const handleToggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handleTogglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNextSong();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrevSong();
          break;
        case "KeyM":
          e.preventDefault();
          handleToggleMute();
          break;
        case "KeyV":
          e.preventDefault();
          handleToggleVideo();
          break;
        case "KeyS":
          e.preventDefault();
          handleToggleSearch();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleTogglePlay,
    handleNextSong,
    handlePrevSong,
    handleToggleMute,
    handleToggleVideo,
    handleToggleSearch,
  ]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Modern "Now Playing" background: blurred album art + drifting color glow */}
      <BackgroundView song={currentSong} />

      {/* Top Bar: Live Clock & Search (Always visible) */}
      <header className="fixed top-0 inset-x-0 z-30 p-4 sm:p-6 flex items-center justify-between pointer-events-none">
        {/* Left spacer for perfect clock centering */}
        <div className="w-9 pointer-events-none" />

        {/* Minimalist Live Clock */}
        <div className="pointer-events-auto">
          <LiveClock />
        </div>

        {/* Search Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <SearchBar
            isOpen={isSearchOpen}
            onToggle={handleToggleSearch}
            onSearch={handleSearch}
          />
        </div>
      </header>

      {/* Floating YouTube Video Frame with IFrame Player */}
      <YouTubeAudioPlayer
        ref={playerRef}
        currentSong={currentSong}
        isPlaying={isPlaying}
        isMuted={isMuted}
        volume={volume}
        isVideoVisible={isVideoVisible}
        isControlsVisible={true}
        onPlayingChange={setIsPlaying}
        onSongEnded={handleSongEnded}
        onErrorSong={handleErrorSong}
        onProgress={handleProgress}
      />

      {/* Prompt for the browser-required user gesture before unmuted audio can play */}
      <AutoplayPrompt
        isVisible={showAutoplayPrompt}
        onStart={handleStartExperience}
      />

      {/* Glassmorphic Bottom Music Player (Always visible) */}
      <GlassPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        isMuted={isMuted}
        volume={volume}
        currentTime={currentTime}
        duration={duration}
        isLoading={isLoadingSong}
        mood={mood}
        isVideoVisible={isVideoVisible}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextSong}
        onPrevious={handlePrevSong}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onChangeMood={handleChangeMood}
      />
    </main>
  );
}
