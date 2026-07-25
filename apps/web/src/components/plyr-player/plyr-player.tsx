"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import "./plyr-player.css";
import { Skeleton } from "@/components/ui/skeleton";

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
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
  const elementRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const progressRef = useRef(onProgress);
  const completeRef = useRef(onComplete);
  progressRef.current = onProgress;
  completeRef.current = onComplete;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const player = new Plyr(element, {
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
      poster: getYouTubeThumbnail(providerVideoId),
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

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl">
      <div
        ref={elementRef}
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
