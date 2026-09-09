"use client";

import React, { useState } from "react";
import { Song } from "@/types";

interface BackgroundViewProps {
  song: Song | null;
}

function artworkKey(song: Song | null): string | null {
  return song ? `${song.videoId}|${song.artwork}` : null;
}

export default function BackgroundView({ song }: BackgroundViewProps) {
  const [activeLayer, setActiveLayer] = useState<"A" | "B">("A");
  const [layerA, setLayerA] = useState<Song | null>(song);
  const [layerB, setLayerB] = useState<Song | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(artworkKey(song));

  const nextKey = artworkKey(song);
  if (nextKey !== null && nextKey !== lastKey) {
    setLastKey(nextKey);
    if (activeLayer === "A") {
      setLayerB(song);
      setActiveLayer("B");
    } else {
      setLayerA(song);
      setActiveLayer("A");
    }
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none bg-[#05070d] select-none">
      <div className="absolute inset-0 bg-linear-to-br from-[#0f1c2e] via-[#0a0f1c] to-[#05070d]" />

      {/* Slowly drifting color glows for a modern "now playing" feel */}
      <div className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full bg-emerald-500/20 blur-[120px] animate-drift-1" />
      <div className="absolute -bottom-1/4 -right-1/4 w-[65vw] h-[65vw] rounded-full bg-teal-400/15 blur-[120px] animate-drift-2" />
      <div className="absolute top-1/3 right-0 w-[45vw] h-[45vw] rounded-full bg-fuchsia-500/10 blur-[110px] animate-drift-3" />

      {/* Layer A: blurred album artwork */}
      <div
        className={`absolute -inset-10 transition-opacity duration-1000 ease-in-out ${
          activeLayer === "A" ? "opacity-100" : "opacity-0"
        }`}
      >
        {layerA?.artwork && (
          // eslint-disable-next-line @next/next/no-img-element -- artwork comes from scraped YouTube thumbnail URLs, which vary too much for a static next/image remotePatterns allowlist.
          <img
            src={layerA.artwork}
            alt=""
            className="w-full h-full object-cover object-center blur-3xl scale-110 opacity-60 animate-kenburns"
          />
        )}
      </div>

      {/* Layer B: blurred album artwork */}
      <div
        className={`absolute -inset-10 transition-opacity duration-1000 ease-in-out ${
          activeLayer === "B" ? "opacity-100" : "opacity-0"
        }`}
      >
        {layerB?.artwork && (
          // eslint-disable-next-line @next/next/no-img-element -- see note above
          <img
            src={layerB.artwork}
            alt=""
            className="w-full h-full object-cover object-center blur-3xl scale-110 opacity-60 animate-kenburns"
          />
        )}
      </div>

      {/* Dark wash so foreground text/controls stay legible over any artwork */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Bottom Vignette for Player Controls Legibility */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-black/85 via-black/30 to-transparent pointer-events-none z-10" />

      {/* Top Vignette for Live Clock */}
      <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/60 to-transparent pointer-events-none z-10" />
    </div>
  );
}
