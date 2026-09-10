"use client";

import { useState, useEffect } from "react";

export default function LiveClock() {
  const [timeStr, setTimeStr] = useState<string>("");
  const [secondsStr, setSecondsStr] = useState<string>("");
  const [use24Hour, setUse24Hour] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: !use24Hour,
      });

      setTimeStr(timeFormatter.format(now));
      setSecondsStr(String(now.getSeconds()).padStart(2, "0"));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [use24Hour]);

  if (!timeStr) {
    return (
      <div className="h-9 w-32 rounded-full glass-pill animate-pulse opacity-50" />
    );
  }

  return (
    <button
      onClick={() => setUse24Hour((prev) => !prev)}
      title="Click to toggle 12h/24h format"
      className="group flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-pill text-white/90 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-lg backdrop-blur-md"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-sm tracking-wider font-medium text-glow">
          {timeStr}
        </span>
        <span className="font-mono text-[10px] text-white/50 group-hover:text-white/75 transition-colors">
          :{secondsStr}
        </span>
      </div>
    </button>
  );
}
