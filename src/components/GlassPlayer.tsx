"use client";

import React, { useMemo, useState } from "react";
import { Song, MusicMood, LyricLine, LyricsStatus } from "@/types";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  Sparkles,
  Disc3,
  Video,
  VideoOff,
  Captions,
  CaptionsOff,
} from "lucide-react";

interface GlassPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  mood: MusicMood;
  isVideoVisible: boolean;
  isControlsVisible: boolean;
  isFullscreen: boolean;
  isLyricsVisible: boolean;
  lyricsLines: LyricLine[] | null;
  lyricsStatus: LyricsStatus;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleLyrics: () => void;
  onChangeMood: (mood: MusicMood) => void;
  onToggleFullscreen: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Lines are sorted by time; find the last line whose timestamp has passed.
function findActiveLyricIndex(lines: LyricLine[], currentTime: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= currentTime) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}

function LyricsTicker({
  lines,
  status,
  currentTime,
}: {
  lines: LyricLine[] | null;
  status: LyricsStatus;
  currentTime: number;
}) {
  const activeLine = useMemo(() => {
    if (status === "loading") return "Finding lyrics…";
    if (!lines || lines.length === 0) return null;
    const idx = findActiveLyricIndex(lines, currentTime);
    return idx >= 0 ? lines[idx].text || null : null;
  }, [lines, status, currentTime]);

  // Collapse entirely (no reserved space) when there's nothing to show, so
  // the player bar doesn't carry an empty gap for tracks without lyrics.
  if (!activeLine) return null;

  return (
    <div className="px-1 -mt-0.5 mb-0.5 overflow-hidden">
      <p
        key={activeLine}
        className="text-center text-[11px] sm:text-xs font-medium text-emerald-200/90 tracking-wide truncate animate-in fade-in duration-300"
      >
        {activeLine}
      </p>
    </div>
  );
}

export default function GlassPlayer({
  currentSong,
  isPlaying,
  isMuted,
  volume,
  currentTime,
  duration,
  isLoading,
  mood,
  isVideoVisible,
  isControlsVisible,
  isFullscreen,
  isLyricsVisible,
  lyricsLines,
  lyricsStatus,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleVideo,
  onToggleLyrics,
  onChangeMood,
  onToggleFullscreen,
}: GlassPlayerProps) {
  const [showMoodMenu, setShowMoodMenu] = useState(false);

  // Clean, uncluttered moods like previous type
  const moods: { id: MusicMood; label: string }[] = [
    { id: "mix", label: "All Mix" },
    { id: "bollywood", label: "Bollywood" },
    { id: "regional", label: "Regional" },
    { id: "hollywood", label: "Hollywood" },
    { id: "cinematic", label: "Cinematic" },
  ];

  const progressPercent =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const getVolumeIcon = () => {
    if (isMuted || volume === 0)
      return <VolumeX className="w-4 h-4 text-white/50" />;
    if (volume < 50) return <Volume1 className="w-4 h-4 text-white/80" />;
    return <Volume2 className="w-4 h-4 text-white/90" />;
  };

  const currentLabel = moods.find((m) => m.id === mood)?.label || "All Mix";

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 p-2.5 sm:p-5 transition-all duration-700 pointer-events-none flex justify-center ${
        isControlsVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
    >
      <div className="glass-panel w-full max-w-5xl rounded-2xl sm:rounded-3xl p-3 sm:px-6 sm:py-3.5 pointer-events-auto flex flex-col gap-1.5 sm:gap-2.5 transition-all duration-300 shadow-2xl">
        {/* Time-synced lyrics ticker, appears right in the player bar */}
        {isLyricsVisible && (
          <LyricsTicker
            lines={lyricsLines}
            status={lyricsStatus}
            currentTime={currentTime}
          />
        )}

        {/* Upper row: Track Details & Playback Controls & Ambient Tools */}
        <div className="flex items-center justify-between gap-2 sm:gap-6">
          {/* Left: Artwork and Track Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:max-w-xs">
            <div className="relative w-10 h-10 sm:w-13 sm:h-13 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/15 group">
              {currentSong?.artwork ? (
                // eslint-disable-next-line @next/next/no-img-element -- artwork comes from scraped YouTube thumbnail URLs, too varied for a static next/image allowlist.
                <img
                  src={currentSong.artwork}
                  alt={currentSong.title}
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                    isPlaying ? "scale-105" : "scale-100"
                  }`}
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <Disc3 className="w-6 h-6 text-white/40 animate-spin" />
                </div>
              )}

              {/* Soundwave overlay when playing */}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center gap-0.5">
                  <div className="w-1 bg-emerald-400 rounded-full animate-wave-1" />
                  <div className="w-1 bg-emerald-400 rounded-full animate-wave-2" />
                  <div className="w-1 bg-emerald-400 rounded-full animate-wave-3" />
                  <div className="w-1 bg-emerald-400 rounded-full animate-wave-4" />
                </div>
              )}
            </div>

            {/* Song title and artist */}
            <div className="min-w-0 flex-1">
              <h3
                className="text-white text-xs sm:text-sm font-medium tracking-wide truncate text-glow"
                title={currentSong?.title}
              >
                {isLoading
                  ? "Finding music..."
                  : currentSong?.title || "Playing Track"}
              </h3>
              <p
                className="text-white/60 text-[10px] sm:text-xs font-light truncate mt-0.5"
                title={currentSong?.artist}
              >
                {currentSong?.artist || "Music Stream"}
              </p>
            </div>
          </div>

          {/* Center: Main Playback Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0">
            <button
              onClick={onPrevious}
              title="Previous song"
              className="glass-button w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              title={isPlaying ? "Pause" : "Play"}
              disabled={isLoading}
              className="relative group w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 border border-white/40 flex items-center justify-center text-white cursor-pointer transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)]"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white translate-x-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              title="Next song"
              className="glass-button w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Right: Ambient actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Video Toggle */}
            <button
              onClick={onToggleVideo}
              title={isVideoVisible ? "Hide Video" : "Show Video"}
              className={`glass-button w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                isVideoVisible
                  ? "text-emerald-300 border-emerald-400/40 bg-emerald-500/15"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {isVideoVisible ? (
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <VideoOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>

            {/* Lyrics Toggle */}
            <button
              onClick={onToggleLyrics}
              title={isLyricsVisible ? "Hide Lyrics" : "Show Lyrics"}
              className={`glass-button w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                isLyricsVisible
                  ? "text-emerald-300 border-emerald-400/40 bg-emerald-500/15"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {isLyricsVisible ? (
                <Captions className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <CaptionsOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>

            {/* Volume Control (desktop/tablet only — a slider is impractical at phone widths) */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-full glass-pill">
              <button
                onClick={onToggleMute}
                title={isMuted ? "Unmute" : "Mute"}
                className="hover:scale-110 active:scale-95 transition-transform cursor-pointer"
              >
                {getVolumeIcon()}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  if (isMuted) onToggleMute();
                  onVolumeChange(Number(e.target.value));
                }}
                className="w-16 lg:w-20 h-1 accent-white"
                title={`Volume: ${isMuted ? 0 : volume}%`}
              />
            </div>

            {/* Clean, minimal mood pill like previous type */}
            <div className="relative">
              <button
                onClick={() => setShowMoodMenu((p) => !p)}
                title="Change Music Mix"
                className="glass-button px-2 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-white/90 hover:text-white cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline font-medium">
                  {currentLabel}
                </span>
              </button>

              {showMoodMenu && (
                <div className="absolute bottom-12 right-0 mb-2 w-44 glass-panel rounded-2xl p-1.5 shadow-2xl border border-white/20 flex flex-col gap-0.5 z-50 animate-in fade-in">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-semibold tracking-wider text-white/40">
                    Music Flow
                  </div>
                  {moods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onChangeMood(m.id);
                        setShowMoodMenu(false);
                      }}
                      className={`w-full px-3 py-1.5 text-xs rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between ${
                        mood === m.id
                          ? "bg-white/20 text-white font-medium"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>{m.label}</span>
                      {mood === m.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Toggle (hidden on phones — no room, and most mobile browsers handle fullscreen via their own UI) */}
            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="hidden sm:flex glass-button w-9 h-9 sm:w-10 sm:h-10 rounded-full items-center justify-center text-white/80 hover:text-white cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Lower row: Progress Slider and Timestamps */}
        <div className="flex items-center gap-2 sm:gap-3 px-1">
          <span className="font-mono text-[10px] sm:text-xs text-white/60 w-8 sm:w-9 text-right shrink-0">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 group flex items-center py-1">
            <div className="w-full h-1 sm:h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <input
              type="range"
              min="0"
              max={duration > 0 ? duration : 100}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title={`Seek: ${formatTime(currentTime)} / ${formatTime(duration)}`}
            />
          </div>

          <span className="font-mono text-[10px] sm:text-xs text-white/60 w-8 sm:w-9 text-left shrink-0">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
