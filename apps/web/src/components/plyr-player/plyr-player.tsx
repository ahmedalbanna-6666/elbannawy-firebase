"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import "./plyr-player.css";
import { Skeleton } from "@/components/ui/skeleton";

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

export function PlyrVideoPlayer({
  providerVideoId,
  startAt = 0,
  onProgress,
  onComplete,
}: {
  readonly providerVideoId: string;
  readonly startAt?: number;
  readonly onProgress?: (currentTime: number, duration: number) => void;
  readonly onComplete?: (currentTime: number, duration: number) => void;
}): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const progressRef = useRef(onProgress);
  const completeRef = useRef(onComplete);
  const hasPlayedRef = useRef(false);
  progressRef.current = onProgress;
  completeRef.current = onComplete;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const player = new Plyr(container, {
      controls: ["play-large", "play", "progress", "current-time", "mute", "volume", "settings", "fullscreen"],
      youtube: {
        noCookie: true,
        rel: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        controls: 0,
        fs: 0,
        cc_load_policy: 0,
      },
      poster: `https://img.youtube.com/vi/${providerVideoId}/maxresdefault.jpg`,
      ratio: "16:9",
      resetOnEnd: true,
      clickToPlay: true,
      hideControls: true,
      tooltips: { controls: true, seek: true },
    });

    playerRef.current = player;

    if (startAt > 0) {
      player.once("ready", () => {
        try {
          player.currentTime = startAt;
        } catch {
          /* ignore */
        }
      });
    }

    player.on("playing", () => {
      hasPlayedRef.current = true;
    });

    player.on("ended", () => {
      setTimeout(() => {
        try {
          player.restart();
        } catch {
          /* ignore */
        }
      }, 500);
    });

    let ended = false;
    player.on("timeupdate", () => {
      try {
        progressRef.current?.(player.currentTime, player.duration);
      } catch {
        /* ignore */
      }
    });

    player.on("ended", () => {
      if (!ended) {
        ended = true;
        completeRef.current?.(player.currentTime, player.duration);
      }
    });

    return (): void => {
      player.destroy();
      playerRef.current = null;
    };
  }, [providerVideoId, startAt]);

  useEffect(() => {
    if (!isMobile()) return;

    let fullscreenLocked = false;

    const handleOrientation = (): void => {
      const plyrEl = containerRef.current?.closest(".plyr") as HTMLElement | null;
      if (!plyrEl) return;

      const isLandscape = window.innerWidth > window.innerHeight;

      if (isLandscape && !document.fullscreenElement && !fullscreenLocked) {
        fullscreenLocked = true;
        try {
          void plyrEl.requestFullscreen();
        } catch {
          fullscreenLocked = false;
        }
      }

      if (!isLandscape && document.fullscreenElement && fullscreenLocked) {
        fullscreenLocked = false;
        try {
          void document.exitFullscreen();
        } catch {
          /* ignore */
        }
      }
    };

    window.addEventListener("orientationchange", handleOrientation);
    window.addEventListener("resize", handleOrientation);

    return (): void => {
      window.removeEventListener("orientationchange", handleOrientation);
      window.removeEventListener("resize", handleOrientation);
    };
  }, []);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <div
        ref={containerRef}
        data-plyr-provider="youtube"
        data-plyr-embed-id={providerVideoId}
      />
    </div>
  );
}

export function VideoPlayerSkeleton(): ReactNode {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl">
      <Skeleton className="h-full w-full" />
    </div>
  );
}
