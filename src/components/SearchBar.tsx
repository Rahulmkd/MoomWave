"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSearch: (query: string) => void;
}

export default function SearchBar({ isOpen, onToggle, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Small delay so the expanding animation has started before we focus
      const timer = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      onSearch(trimmed);
      setQuery("");
      onToggle(); // close after search
    },
    [query, onSearch, onToggle],
  );

  const handleClose = useCallback(() => {
    setQuery("");
    onToggle();
  }, [onToggle]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleClose]);

  return (
    <div className="relative flex items-center">
      {/* Expandable search input */}
      <div
        className={`flex items-center overflow-hidden transition-all duration-300 ease-out ${
          isOpen
            ? "w-48 sm:w-64 opacity-100"
            : "w-0 opacity-0 pointer-events-none"
        }`}
      >
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-pill">
            <Search className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs..."
              className="w-full bg-transparent text-xs text-white placeholder-white/40 outline-none font-light tracking-wide"
            />
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Search toggle button — visible when search is closed */}
      <button
        onClick={onToggle}
        title="Search Songs (Press S)"
        className={`glass-button w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all ${
          isOpen
            ? "text-emerald-300 border-emerald-400/40 bg-emerald-500/15"
            : "text-white/70 hover:text-white"
        }`}
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  );
}
