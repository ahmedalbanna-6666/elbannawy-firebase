"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import "./plyr-player.css";
import { Skeleton } from "@/components/ui/skeleton";

async function lockLandscape(): Promise<void> {
  try {
    const screen = window.screen as Screen & { orientation?: { lock?: (orientation: string) => Promise<void> } };
    if (screen.orientation?.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch {
    /* not supported */
  }
}

async function unlockOrientation(): Promise<void> {
  try {
    const screen = window.screen as Screen & { orientation?: { unlock?: () => Promise<void> } };
    if (screen.orientation?.unlock) {
      await screen.orientation.unlock();
    }
  } catch {
    /* not supported */
  }
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
  progressRef.current = onProgress;
  completeRef.current = onComplete;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const player = new Plyr(container, {
      controls: ["play-large", "play", "progress", "current-time", "mute", "volume", "fullscreen"],
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

    const handleFullscreen = (): void => {
      if (document.fullscreenElement) {
        void lockLandscape();
      } else {
        void unlockOrientation();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreen);

    if (startAt > 0) {
      player.once("ready", () => {
        try {
          player.currentTime = startAt;
        } catch {
          /* ignore */
        }
      });
    }

    const posterEl = container.querySelector<HTMLElement>(".plyr__poster");

    player.on("pause", () => {
      if (posterEl) {
        posterEl.style.display = "block";
        posterEl.style.opacity = "1";
      }
    });
    player.on("play", () => {
      if (posterEl) {
        posterEl.style.display = "";
        posterEl.style.opacity = "";
      }
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
      document.removeEventListener("fullscreenchange", handleFullscreen);
      void unlockOrientation();
      player.destroy();
      playerRef.current = null;
    };
  }, [providerVideoId, startAt]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <div className="plyr__video-embed relative" ref={containerRef}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${providerVideoId}?controls=0&rel=0&iv_load_policy=3&playsinline=1&modestbranding=1&enablejsapi=1`}
          allowFullScreen
          allowTransparency
          allow="autoplay"
          loading="lazy"
        />
      </div>
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
