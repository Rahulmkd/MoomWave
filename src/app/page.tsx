"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Song, MusicMood, LyricLine, LyricsStatus } from "@/types";
import BackgroundView from "@/components/BackgroundView";
import LiveClock from "@/components/LiveClock";
import GlassPlayer from "@/components/GlassPlayer";
import AutoplayPrompt from "@/components/AutoplayPrompt";
import YouTubeAudioPlayer, {
  YouTubePlayerRef,
} from "@/components/YouTubeAudioPlayer";
import { Keyboard, HelpCircle } from "lucide-react";

const VIDEO_VISIBLE_STORAGE_KEY = "moonwave:isVideoVisible";
const LYRICS_VISIBLE_STORAGE_KEY = "moonwave:isLyricsVisible";

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

  // Time-synced lyrics
  const [isLyricsVisible, setIsLyricsVisible] = useState<boolean>(true);
  const [lyricsLines, setLyricsLines] = useState<LyricLine[] | null>(null);
  const [lyricsStatus, setLyricsStatus] = useState<LyricsStatus>("idle");
  const lyricsCacheRef = useRef<Map<string, LyricLine[] | null>>(new Map());

  // UI State
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

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

      const storedLyrics = window.localStorage.getItem(
        LYRICS_VISIBLE_STORAGE_KEY,
      );
      if (storedLyrics !== null) setIsLyricsVisible(storedLyrics === "true");
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

  // Initial load. This intentionally runs once on mount only: `mood` is read
  // through a ref so that changing the mood later (handled entirely by
  // handleChangeMood) doesn't also re-trigger this effect.
  const initialMoodRef = useRef(mood);
  useEffect(() => {
    fetchDynamicSongs(initialMoodRef.current);
  }, [fetchDynamicSongs]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

 
  const scheduleIdleHide = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsControlsVisible(false);
      setShowShortcuts(false);
    }, 5000);
  }, []);

  const resetIdleTimer = useCallback(() => {
    setIsControlsVisible(true);
    scheduleIdleHide();
  }, [scheduleIdleHide]);

  useEffect(() => {
    const onUserActivity = () => resetIdleTimer();
    window.addEventListener("mousemove", onUserActivity);
    window.addEventListener("mousedown", onUserActivity);
    window.addEventListener("keydown", onUserActivity);
    window.addEventListener("touchstart", onUserActivity);

    scheduleIdleHide();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", onUserActivity);
      window.removeEventListener("mousedown", onUserActivity);
      window.removeEventListener("keydown", onUserActivity);
      window.removeEventListener("touchstart", onUserActivity);
    };
  }, [resetIdleTimer, scheduleIdleHide]);

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


  useEffect(() => {
    if (!currentSong?.title) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting to the idle baseline when there's no track, not a fetch; see fetch branch below for the standard react.dev pattern.
      setLyricsLines(null);
      setLyricsStatus("idle");
      return;
    }

    const cacheKey = `${currentSong.title}|${currentSong.artist || ""}`;
    const cached = lyricsCacheRef.current.get(cacheKey);
    if (cached !== undefined) {
      setLyricsLines(cached);
      setLyricsStatus(cached && cached.length > 0 ? "found" : "not_found");
      return;
    }

    let ignore = false;
    setLyricsStatus("loading");
    setLyricsLines(null);

    const params = new URLSearchParams({ title: currentSong.title });
    if (currentSong.artist) params.set("artist", currentSong.artist);
    if (currentSong.duration)
      params.set("duration", String(currentSong.duration));

    fetch(`/api/lyrics?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        const lines: LyricLine[] | null =
          data.success && data.lines ? data.lines : null;
        lyricsCacheRef.current.set(cacheKey, lines);
        setLyricsLines(lines);
        setLyricsStatus(lines && lines.length > 0 ? "found" : "not_found");
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Error loading lyrics:", err);
        lyricsCacheRef.current.set(cacheKey, null);
        setLyricsLines(null);
        setLyricsStatus("not_found");
      });

    return () => {
      ignore = true;
    };
  }, [currentSong?.title, currentSong?.artist, currentSong?.duration]);

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

  // Lyrics ticker visibility toggle (also persisted, same reasoning as above)
  const handleToggleLyrics = useCallback(() => {
    setIsLyricsVisible((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(LYRICS_VISIBLE_STORAGE_KEY, String(next));
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

  // Fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
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
        case "KeyF":
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case "KeyL":
          e.preventDefault();
          handleToggleLyrics();
          break;
        case "KeyH":
        case "Slash":
          e.preventDefault();
          setShowShortcuts((prev) => !prev);
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
    handleToggleFullscreen,
    handleToggleLyrics,
  ]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Modern "Now Playing" background: blurred album art + drifting color glow */}
      <BackgroundView song={currentSong} />

      {/* Top Bar: Live Clock, Shortcuts */}
      <header
        className={`fixed top-0 inset-x-0 z-30 p-4 sm:p-6 flex items-center justify-between transition-all duration-700 pointer-events-none ${
          isControlsVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-8"
        }`}
      >
        {/* Left spacer for perfect clock centering */}
        <div className="w-9 pointer-events-none" />

        {/* Minimalist Live Clock */}
        <div className="pointer-events-auto">
          <LiveClock />
        </div>

        {/* Shortcuts / Info Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowShortcuts((p) => !p)}
            title="Keyboard Shortcuts (Press /)"
            className="glass-button w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white cursor-pointer shadow-lg"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          onClick={() => setShowShortcuts(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel p-6 rounded-3xl max-w-sm w-full space-y-4 border border-white/20 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Keyboard className="w-4 h-4 text-emerald-400" />
                <span>Shortcuts</span>
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                Moonwave
              </span>
            </div>

            <div className="space-y-2 text-xs text-white/80">
              <div className="flex justify-between items-center py-1">
                <span>Play / Pause</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">
                  Space
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Next Track</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">
                  Right Arrow
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Previous Track</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">
                  Left Arrow
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Toggle Video</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">
                  V
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Toggle Lyrics</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">
                  L
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Mute / Unmute</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">
                  M
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Fullscreen</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">
                  F
                </kbd>
              </div>
            </div>

            <button
              onClick={() => setShowShortcuts(false)}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Floating YouTube Video Frame with IFrame Player */}
      <YouTubeAudioPlayer
        ref={playerRef}
        currentSong={currentSong}
        isPlaying={isPlaying}
        isMuted={isMuted}
        volume={volume}
        isVideoVisible={isVideoVisible}
        isControlsVisible={isControlsVisible}
        onPlayingChange={setIsPlaying}
        onSongEnded={handleSongEnded}
        onErrorSong={handleErrorSong}
        onProgress={handleProgress}
      />

      {/* Prompt for the browser-required user gesture before unmuted audio can play */}
      <AutoplayPrompt
        isVisible={showAutoplayPrompt}
        onStart={handleStartExperience}
        trackTitle={currentSong?.title}
        artistName={currentSong?.artist}
      />

      {/* Glassmorphic Bottom Music Player, with the time-synced lyrics ticker built in */}
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
        isControlsVisible={isControlsVisible}
        isFullscreen={isFullscreen}
        isLyricsVisible={isLyricsVisible}
        lyricsLines={lyricsLines}
        lyricsStatus={lyricsStatus}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextSong}
        onPrevious={handlePrevSong}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleLyrics={handleToggleLyrics}
        onChangeMood={handleChangeMood}
        onToggleFullscreen={handleToggleFullscreen}
      />
    </main>
  );
}
