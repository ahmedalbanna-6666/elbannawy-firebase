"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import "./plyr-player.css";
import { Skeleton } from "@/components/ui/skeleton";

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

    if (startAt > 0) {
      player.once("ready", () => {
        try {
          player.currentTime = startAt;
        } catch {
          /* ignore */
        }
      });
    }

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

  const posterUrl = `https://img.youtube.com/vi/${providerVideoId}/maxresdefault.jpg`;

  return (
    <div
      className="aspect-video w-full overflow-hidden rounded-2xl bg-cover bg-center"
      style={{ backgroundImage: `url(${posterUrl})` }}
    >
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
