import type { Assignment } from "@shared/schema";

export interface LessonDay {
  day: number;
  title: string;
  itemCount: number;
  focus: string;
  coachNote: string;
}

export const curriculum: LessonDay[] = [
  { day: 1, title: "The Spark", itemCount: 3, focus: "Vivid Colors", coachNote: "Focus on high-contrast colors. Keep it very encouraging." },
  { day: 2, title: "The Sensory Hub", itemCount: 5, focus: "Smell and Sound", coachNote: "Ask what the object smells like. Add 2 new stops." },
  { day: 3, title: "The Action Move", itemCount: 5, focus: "Motion", coachNote: "Make the objects move! A spinning pizza, a dancing duck." },
  { day: 4, title: "The Scale Up", itemCount: 8, focus: "Spatial Detail", coachNote: "Start moving into a second room of the house." },
  { day: 5, title: "The Master Walk", itemCount: 10, focus: "Reverse Recall", coachNote: "The big challenge: Walk through all 10 items backwards." },
  { day: 6, title: "The Palace Wipe", itemCount: 0, focus: "Clearing Space", coachNote: "Teach the fresh breeze technique to clear the palace for new memories." },
  { day: 7, title: "Real World Utility", itemCount: 5, focus: "Shopping Lists", coachNote: "Use the palace for a real 5-item grocery list." },
];

export function getLessonDay(dayNumber: number): LessonDay {
  const idx = Math.min(dayNumber, curriculum.length) - 1;
  if (idx < 0) return curriculum[0];
  return curriculum[idx];
}

export interface SessionRecord {
  date: string;
  day: number;
  score: number;
  totalItems: number;
  assignments: Assignment[];
  placeName: string;
  stops: string[];
}

export interface UserProgress {
  userName: string;
  currentDay: number;
  sessions: SessionRecord[];
  hasSeenEducation: boolean;
}

const STORAGE_KEY = "memoryamble_progress";

const DEFAULT_PROGRESS: UserProgress = {
  userName: "",
  currentDay: 1,
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

export function recordSession(
  progress: UserProgress,
  session: Omit<SessionRecord, "date">
): UserProgress {
  const record: SessionRecord = { ...session, date: todayStr() };
  const nextDay = Math.min(progress.currentDay + 1, curriculum.length);

  return {
    ...progress,
    currentDay: nextDay,
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
