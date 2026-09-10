"use client";

import React from "react";
import { Play } from "lucide-react";

interface AutoplayPromptProps {
  isVisible: boolean;
  onStart: () => void;
}

export default function AutoplayPrompt({
  isVisible,
  onStart,
}: AutoplayPromptProps) {
  if (!isVisible) return null;

  return (
    <div
      onClick={onStart}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 cursor-pointer animate-in fade-in duration-700 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel relative w-full max-w-sm rounded-3xl border border-white/20 bg-white/5 p-6 text-center shadow-2xl transition-all duration-300 hover:border-white/35 hover:scale-[1.02]"
      >
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -top-12 inset-x-0 mx-auto h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl" />

        {/* Play Button */}
        <button
          onClick={onStart}
          className="group relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 hover:bg-white/20 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
        >
          <Play className="ml-1 h-8 w-8 fill-white text-white transition-transform group-hover:scale-110" />

          {/* Pulse Effect */}
          <div className="pointer-events-none absolute -inset-2 rounded-full border border-white/20 animate-ping opacity-30" />
        </button>

        {/* Text */}
        <h2 className="mt-5 text-xl font-light tracking-wide text-white sm:text-2xl">
          Begin Listening
        </h2>

        <p className="mt-2 text-sm font-light leading-relaxed text-white/60">
          Click once to start the music.
        </p>

        {/* Button */}
        <button
          onClick={onStart}
          className="mt-5 w-full cursor-pointer rounded-2xl border border-white/30 bg-white/15 px-6 py-3.5 text-sm font-medium uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:bg-white/25 active:bg-white/30"
        >
          Start Listening
        </button>
      </div>
    </div>
  );
}
