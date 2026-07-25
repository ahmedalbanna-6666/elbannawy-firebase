declare module "plyr" {
  interface PlyrOptions {
    controls?: string[];
    youtube?: {
      noCookie?: boolean;
      rel?: number;
      iv_load_policy?: number;
      modestbranding?: number;
      controls?: number;
      fs?: number;
      cc_load_policy?: number;
    };
    poster?: string;
    ratio?: string;
    resetOnEnd?: boolean;
    clickToPlay?: boolean;
    hideControls?: boolean;
    tooltips?: {
      controls?: boolean;
      seek?: boolean;
    };
  }

  interface PlyrEvent {
    detail: { plyr: Plyr };
  }

  interface Plyr {
    play(): void;
    pause(): void;
    restart(): void;
    stop(): void;
    destroy(): void;
    currentTime: number;
    duration: number;
    on(event: string, callback: (event: PlyrEvent) => void): void;
    once(event: string, callback: (event: PlyrEvent) => void): void;
    off(event: string, callback: (event: PlyrEvent) => void): void;
  }

  interface PlyrStatic {
    new (target: string | HTMLElement, options?: PlyrOptions): Plyr;
    setup(target: string | HTMLElement, options?: PlyrOptions): Plyr[];
  }

  const Plyr: PlyrStatic;
  export default Plyr;
}
