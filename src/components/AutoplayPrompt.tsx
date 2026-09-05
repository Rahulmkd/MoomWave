'use client';

import React from 'react';
import { Play, Sparkles, Volume2 } from 'lucide-react';

interface AutoplayPromptProps {
  isVisible: boolean;
  onStart: () => void;
  trackTitle?: string;
  artistName?: string;
}

export default function AutoplayPrompt({
  isVisible,
  onStart,
  trackTitle,
  artistName,
}: AutoplayPromptProps) {
  if (!isVisible) return null;

  return (
    <div
      onClick={onStart}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-700 cursor-pointer p-4 animate-in fade-in select-none"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onStart();
        }}
        className="glass-panel relative max-w-md w-full p-8 rounded-3xl text-center flex flex-col items-center gap-5 border border-white/20 shadow-2xl hover:border-white/35 transition-all duration-300 hover:scale-[1.02] group"
      >
        {/* Ambient Glow */}
        <div className="absolute -top-12 inset-x-0 mx-auto w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Pulsing Play Button */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-white/10 group-hover:bg-white/20 border border-white/30 flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
            <Play className="w-8 h-8 text-white fill-white translate-x-0.5 group-hover:scale-110 transition-transform" />
          </div>
          <div className="absolute -inset-2 rounded-full border border-white/20 animate-ping opacity-30 pointer-events-none" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-emerald-300 tracking-wider uppercase">
            <Sparkles className="w-3 h-3" />
            <span>Cinematic Experience</span>
          </div>

          <h2 className="text-2xl font-light tracking-wide text-white text-glow">
            Begin Soundscape
          </h2>

          <p className="text-sm text-white/60 font-light leading-relaxed">
            Your browser requires a single touch to enable high-fidelity audio playback.
          </p>

          {trackTitle && (
            <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/50 flex items-center justify-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-white/40" />
              <span className="truncate max-w-[240px] text-white/70">
                {trackTitle} {artistName ? `• ${artistName}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Button */}
        <button
          onClick={onStart}
          className="w-full py-3.5 px-6 rounded-2xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-medium text-sm tracking-wider uppercase border border-white/30 transition-all duration-300 shadow-lg cursor-pointer"
        >
          Click Anywhere To Listen
        </button>
      </div>
    </div>
  );
}
