"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { Song } from "@/types";
import { Film, GripHorizontal } from "lucide-react";

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface YTPlayerEvent {
  target: YTPlayerInstance;
  data: number;
}

interface YTNamespace {
  Player: new (
    elementId: string,
    options: {
      height: string | number;
      width: string | number;
      videoId: string;
      playerVars?: Record<string, number>;
      events?: {
        onReady?: (event: YTPlayerEvent) => void;
        onStateChange?: (event: YTPlayerEvent) => void;
        onError?: (event: YTPlayerEvent) => void;
      };
    },
  ) => YTPlayerInstance;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT: YTNamespace;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerRef {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  getDuration: () => number;
}

interface YouTubeAudioPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isVideoVisible: boolean;
  isControlsVisible: boolean;
  onSongEnded: () => void;
  onPlayingChange: (isPlaying: boolean) => void;
  onProgress: (currentTime: number, duration: number) => void;
  onErrorSong: () => void;
}

const YouTubeAudioPlayer = forwardRef<
  YouTubePlayerRef,
  YouTubeAudioPlayerProps
>(
  (
    {
      currentSong,
      isPlaying,
      isMuted,
      volume,
      isVideoVisible,
      isControlsVisible,
      onSongEnded,
      onPlayingChange,
      onProgress,
      onErrorSong,
    },
    ref,
  ) => {
    const playerRef = useRef<YTPlayerInstance | null>(null);
    const isPlayerReadyRef = useRef<boolean>(false);
    const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [isApiLoaded, setIsApiLoaded] = useState<boolean>(false);

    // Draggable floating position
    const [position, setPosition] = useState({ x: 16, y: -1 }); // y=-1 means "use default bottom"
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const [defaultBottom, setDefaultBottom] = useState(112);

    useEffect(() => {
      const updateDefaultBottom = () => {
        setDefaultBottom(window.innerWidth >= 640 ? 96 : 112);
      };
      updateDefaultBottom();
      window.addEventListener("resize", updateDefaultBottom);
      return () => window.removeEventListener("resize", updateDefaultBottom);
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
      // Only drag from the grip handle
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          startX: rect.left,
          startY: rect.top,
        };
      }
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback(
      (e: React.PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const newX = dragStartRef.current.startX + dx;
        const newY = dragStartRef.current.startY + dy;

        // Clamp to viewport
        const maxX =
          window.innerWidth - (containerRef.current?.offsetWidth || 280);
        const maxY =
          window.innerHeight - (containerRef.current?.offsetHeight || 160);
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      },
      [isDragging],
    );

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    useImperativeHandle(ref, () => ({
      play: () => {
        if (playerRef.current && isPlayerReadyRef.current) {
          try {
            playerRef.current.playVideo();
          } catch (e) {
            console.error("Play error", e);
          }
        }
      },
      pause: () => {
        if (playerRef.current && isPlayerReadyRef.current) {
          try {
            playerRef.current.pauseVideo();
          } catch (e) {
            console.error("Pause error", e);
          }
        }
      },
      togglePlay: () => {
        if (playerRef.current && isPlayerReadyRef.current) {
          try {
            const state = playerRef.current.getPlayerState();
            if (state === 1) {
              playerRef.current.pauseVideo();
            } else {
              playerRef.current.playVideo();
            }
          } catch (e) {
            console.error("Toggle error", e);
          }
        }
      },
      seekTo: (seconds: number) => {
        if (playerRef.current && isPlayerReadyRef.current) {
          try {
            playerRef.current.seekTo(seconds, true);
          } catch (e) {
            console.error("Seek error", e);
          }
        }
      },
      setVolume: (vol: number) => {
        if (playerRef.current && isPlayerReadyRef.current) {
          try {
            playerRef.current.setVolume(vol);
          } catch (e) {
            console.error("Set volume error", e);
          }
        }
      },
      setMuted: (muted: boolean) => {
        if (playerRef.current && isPlayerReadyRef.current) {
          try {
            if (muted) {
              playerRef.current.mute();
            } else {
              playerRef.current.unMute();
            }
          } catch (e) {
            console.error("Mute error", e);
          }
        }
      },
      getDuration: () => {
        if (playerRef.current && isPlayerReadyRef.current) {
          try {
            return playerRef.current.getDuration() || 0;
          } catch {
            return 0;
          }
        }
        return 0;
      },
    }));

    // Load YouTube IFrame API Script
    useEffect(() => {
      if (typeof window === "undefined") return;

      if (window.YT && window.YT.Player) {
        setIsApiLoaded(true);
        return;
      }

      const existingScript = document.getElementById("youtube-iframe-api");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        setIsApiLoaded(true);
      };
    }, []);

    // Initialize or re-create player when song changes
    useEffect(() => {
      if (!isApiLoaded || !currentSong?.videoId) return;

      const videoId = currentSong.videoId;

      const initPlayer = () => {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (e) {
            console.warn("Error destroying old player instance", e);
          }
          playerRef.current = null;
          isPlayerReadyRef.current = false;
        }

        try {
          playerRef.current = new window.YT.Player("youtube-audio-host", {
            height: "100%",
            width: "100%",
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              controls: 1, // Allow native video controls within centered frame
              disablekb: 0,
              fs: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              iv_load_policy: 3,
              playsinline: 1,
              enablejsapi: 1,
            },
            events: {
              onReady: (event: YTPlayerEvent) => {
                isPlayerReadyRef.current = true;
                try {
                  event.target.setVolume(volume);
                  if (isMuted) {
                    event.target.mute();
                  } else {
                    event.target.unMute();
                  }
                  event.target.playVideo();
                } catch (err) {
                  console.error("Play attempt error:", err);
                }
              },
              onStateChange: (event: YTPlayerEvent) => {
                const state = event.data;
                if (state === window.YT.PlayerState.PLAYING) {
                  onPlayingChange(true);
                } else if (state === window.YT.PlayerState.PAUSED) {
                  onPlayingChange(false);
                } else if (state === window.YT.PlayerState.ENDED) {
                  onPlayingChange(false);
                  onSongEnded();
                }
              },
              onError: (event: YTPlayerEvent) => {
                console.warn("YouTube Player error code:", event.data);
                onErrorSong();
              },
            },
          });
        } catch (err) {
          console.error("Failed to create YT player:", err);
        }
      };

      initPlayer();

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isApiLoaded, currentSong?.videoId]);

    // Volume updates
    useEffect(() => {
      if (playerRef.current && isPlayerReadyRef.current) {
        try {
          playerRef.current.setVolume(volume);
          if (isMuted) {
            playerRef.current.mute();
          } else {
            playerRef.current.unMute();
          }
        } catch (e) {
          console.error(e);
        }
      }
    }, [volume, isMuted]);

    // Progress tracker
    useEffect(() => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      if (isPlaying) {
        progressTimerRef.current = setInterval(() => {
          if (playerRef.current && isPlayerReadyRef.current) {
            try {
              const current = playerRef.current.getCurrentTime() || 0;
              const dur = playerRef.current.getDuration() || 0;
              onProgress(current, dur);
            } catch {
              // Ignore occasional race conditions
            }
          }
        }, 250);
      }

      return () => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      };
    }, [isPlaying, onProgress]);

    // Compute style: if y is -1 (initial), use bottom-anchored; otherwise use top-left from drag
    const floatingStyle: React.CSSProperties =
      position.y === -1
        ? { left: position.x, bottom: defaultBottom }
        : { left: position.x, top: position.y };

    return (
      <>
        {/* Floating Draggable Video Thumbnail */}
        <div
          ref={containerRef}
          className={`fixed z-40 pointer-events-auto ${
            isDragging ? "" : "transition-all duration-300 ease-out"
          } ${
            isVideoVisible
              ? "scale-100 opacity-100"
              : "scale-75 opacity-0 pointer-events-none"
          }`}
          style={floatingStyle}
        >
          {/* Subtle Ambient Glow */}
          {isVideoVisible && (
            <div
              className="absolute -inset-3 rounded-2xl blur-2xl opacity-30 pointer-events-none"
              style={{
                backgroundColor: "#10b981",
                backgroundImage: currentSong?.artwork
                  ? `url('${currentSong.artwork}')`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}

          {/* Compact Video Shell */}
          <div className="relative w-[200px] sm:w-[240px] md:w-[280px] aspect-video rounded-xl overflow-hidden glass-panel border border-white/20 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)] group">
            {/* Header: Drag Handle + Artist */}
            <div
              className={`absolute top-0 inset-x-0 z-10 flex items-center px-1.5 py-1 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${
                isControlsVisible
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {/* Drag Handle */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="flex items-center gap-1 cursor-grab active:cursor-grabbing touch-none select-none"
              >
                <GripHorizontal className="w-3.5 h-3.5 text-white/60" />
                <div className="px-1.5 py-0.5 rounded-full text-[9px] font-medium text-white/80 flex items-center gap-1">
                  <Film className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="truncate max-w-[80px] sm:max-w-[110px]">
                    {currentSong?.artist || "Video"}
                  </span>
                </div>
              </div>
            </div>

            {/* YouTube Iframe Host Container */}
            <div className="w-full h-full bg-black/80">
              <div id="youtube-audio-host" className="w-full h-full" />
            </div>
          </div>
        </div>
      </>
    );
  },
);

YouTubeAudioPlayer.displayName = "YouTubeAudioPlayer";

export default YouTubeAudioPlayer;
