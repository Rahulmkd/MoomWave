"use client";

import React, { useState } from "react";
import { ScenicImage } from "@/types";

interface BackgroundViewProps {
  currentImage: ScenicImage | null;
}

function imageKey(image: ScenicImage | null): string | null {
  return image ? `${image.id}|${image.url}` : null;
}

export default function BackgroundView({ currentImage }: BackgroundViewProps) {
  const [activeLayer, setActiveLayer] = useState<"A" | "B">("A");
  const [layerA, setLayerA] = useState<ScenicImage | null>(currentImage);
  const [layerB, setLayerB] = useState<ScenicImage | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(imageKey(currentImage));

  const nextKey = imageKey(currentImage);
  if (nextKey !== null && nextKey !== lastKey) {
    setLastKey(nextKey);
    if (activeLayer === "A") {
      setLayerB(currentImage);
      setActiveLayer("B");
    } else {
      setLayerA(currentImage);
      setActiveLayer("A");
    }
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none bg-black select-none">
      {/* Layer A */}
      <div
        className={`absolute -inset-2 w-[calc(100%+1rem)] h-[calc(100%+1rem)] transition-opacity duration-1000 ease-in-out ${
          activeLayer === "A" ? "opacity-100" : "opacity-0"
        }`}
      >
        {layerA && (
          // eslint-disable-next-line @next/next/no-img-element -- source domains are dynamic/unpredictable (Unsplash, Wikimedia, etc.), so next/image's static remotePatterns allowlist isn't a good fit here.
          <img
            src={layerA.url}
            alt=""
            className="w-full h-full object-cover object-center animate-kenburns"
          />
        )}
      </div>

      {/* Layer B */}
      <div
        className={`absolute -inset-2 w-[calc(100%+1rem)] h-[calc(100%+1rem)] transition-opacity duration-1000 ease-in-out ${
          activeLayer === "B" ? "opacity-100" : "opacity-0"
        }`}
      >
        {layerB && (
          // eslint-disable-next-line @next/next/no-img-element -- see note above
          <img
            src={layerB.url}
            alt=""
            className="w-full h-full object-cover object-center animate-kenburns"
          />
        )}
      </div>

      {/* Subtle Gentle Bottom Vignette for Player Controls Legibility */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none z-10" />

      {/* Subtle Top Vignette for Live Clock */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
    </div>
  );
}
