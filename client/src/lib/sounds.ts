type SoundName = "click" | "send" | "transition" | "magic-transition" | "correct" | "practice-correct" | "complete" | "penguin" | "incorrect" | "wisdom" | "celebration";

interface SoundConfig {
  url: string;
  volume: number;
  extra?: { url: string; volume: number };
}

const SOUND_MAP: Partial<Record<SoundName, SoundConfig>> = {
  click:              { url: "/sounds/Click.mp3",        volume: 0.4 },
  send:               { url: "/sounds/Click.mp3",        volume: 0.3 },
  transition:         { url: "/sounds/Wind-clear.mp3",   volume: 0.35 },
  "magic-transition": { url: "/sounds/Magic-wind.mp3",   volume: 0.45 },
  correct:            { url: "/sounds/correct-bell.mp3", volume: 0.4,  extra: { url: "/sounds/kids-cheer.mp3", volume: 0.3 } },
  "practice-correct": { url: "/sounds/correct-bell.mp3", volume: 0.4,  extra: { url: "/sounds/kids-cheer.mp3", volume: 0.3 } },
  complete:           { url: "/sounds/correct-bell.mp3", volume: 0.5 },
  penguin:            { url: "/sounds/pengiun-cry.mp3",  volume: 0.35 },
};

const preloaded: Map<string, HTMLAudioElement> = new Map();

function preload(url: string): void {
  if (preloaded.has(url)) return;
  try {
    const audio = new Audio(url);
    audio.preload = "auto";
    preloaded.set(url, audio);
  } catch {
    // fail silently
  }
}

// Pre-load all audio files immediately on module load
const allUrls = new Set(
  Object.values(SOUND_MAP).flatMap((cfg) =>
    cfg ? (cfg.extra ? [cfg.url, cfg.extra.url] : [cfg.url]) : []
  )
);
allUrls.add("/sounds/hawaiian-guitar.mp3");
allUrls.forEach(preload);

function playUrl(url: string, volume: number): void {
  try {
    const base = preloaded.get(url);
    const audio = base ? (base.cloneNode() as HTMLAudioElement) : new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {});
  } catch {
    // fail silently
  }
}

export function playSound(name: SoundName): void {
  if (name === "celebration") {
    try {
      const base = preloaded.get("/sounds/hawaiian-guitar.mp3");
      const clone = base ? (base.cloneNode() as HTMLAudioElement) : new Audio("/sounds/hawaiian-guitar.mp3");
      clone.volume = 0.25;
      clone.play().catch(() => {});
      setTimeout(() => {
        const fadeOut = setInterval(() => {
          if (clone.volume > 0.05) {
            clone.volume = Math.max(0, clone.volume - 0.05);
          } else {
            clearInterval(fadeOut);
            clone.pause();
            clone.currentTime = 0;
          }
        }, 50);
      }, 2500);
    } catch {
      // fail silently
    }
    return;
  }
  const cfg = SOUND_MAP[name];
  if (!cfg) return;
  playUrl(cfg.url, cfg.volume);
  if (cfg.extra) {
    playUrl(cfg.extra.url, cfg.extra.volume);
  }
}

export function initSounds(): void {
  // No-op — files are pre-loaded on module import
}

export function playSoundFile(url: string, volume = 0.3): void {
  try {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch {
    // fail silently
  }
}
