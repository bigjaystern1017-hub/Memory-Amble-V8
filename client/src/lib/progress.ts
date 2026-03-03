import type { Assignment } from "@shared/schema";

export interface SessionRecord {
  date: string;
  level: number;
  category: "objects" | "names";
  score: number;
  totalItems: number;
  assignments: Assignment[];
  placeName: string;
  stops: string[];
}

export interface UserProgress {
  userName: string;
  currentLevel: number;
  currentCategory: "objects" | "names";
  dayCount: number;
  consecutiveObjectDays: number;
  sessions: SessionRecord[];
  hasSeenEducation: boolean;
}

const STORAGE_KEY = "memoryamble_progress";

const DEFAULT_PROGRESS: UserProgress = {
  userName: "",
  currentLevel: 3,
  currentCategory: "objects",
  dayCount: 0,
  consecutiveObjectDays: 0,
  sessions: [],
  hasSeenEducation: false,
};

export function loadProgress(): UserProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProgress;
  } catch {
    return null;
  }
}

export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getLastSession(progress: UserProgress): SessionRecord | null {
  if (progress.sessions.length === 0) return null;
  return progress.sessions[progress.sessions.length - 1];
}

export function getYesterdaySession(progress: UserProgress): SessionRecord | null {
  const last = getLastSession(progress);
  if (!last) return null;
  if (last.date === yesterdayStr()) return last;
  return null;
}

export function hasCompletedToday(progress: UserProgress): boolean {
  const last = getLastSession(progress);
  if (!last) return false;
  return last.date === todayStr();
}

export function computeNextLevel(progress: UserProgress): number {
  const last = getLastSession(progress);
  if (!last) return progress.currentLevel;
  if (last.score === last.totalItems) {
    return Math.min(last.level + 2, 9);
  }
  return last.level;
}

export function shouldSwitchCategory(progress: UserProgress): boolean {
  return progress.consecutiveObjectDays >= 7;
}

export function recordSession(
  progress: UserProgress,
  session: Omit<SessionRecord, "date">
): UserProgress {
  const record: SessionRecord = { ...session, date: todayStr() };
  const isPerfect = session.score === session.totalItems;
  const newLevel = isPerfect
    ? Math.min(session.level + 2, 9)
    : session.level;

  const newObjectDays =
    session.category === "objects"
      ? progress.consecutiveObjectDays + 1
      : 0;

  const newCategory = newObjectDays >= 7 ? "names" as const : progress.currentCategory;

  return {
    ...progress,
    currentLevel: newLevel,
    currentCategory: newCategory,
    dayCount: progress.dayCount + 1,
    consecutiveObjectDays: newObjectDays,
    sessions: [...progress.sessions, record],
  };
}

export function initProgress(userName: string): UserProgress {
  return {
    ...DEFAULT_PROGRESS,
    userName,
    hasSeenEducation: true,
  };
}
