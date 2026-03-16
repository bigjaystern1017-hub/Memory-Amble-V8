import type { Assignment } from "@shared/schema";
import { BOOTCAMP_CURRICULUM } from "@shared/curriculum";

export interface LessonConfig {
  itemCount: number;
  category: "objects" | "names";
  cleaning: boolean;
  reverse: boolean;
  focus: string;
  title: string;
}

export interface SessionData {
  date: string;
  level: number;
  category: string;
  score: number;
  totalItems: number;
  assignments: Assignment[];
  placeName: string;
  stops: string[];
}

export interface ProgressData {
  currentDay: number;
  currentLevel: number;
  currentCategory: "objects" | "names";
  dayCount: number;
  streak: number;
  lastLogin: string | null;
  subscriptionStatus?: string;
}

export function getNextLevel(currentLevel: number, lastScore: number, lastTotal: number): number {
  if (lastTotal > 0 && lastScore === lastTotal) {
    return Math.min(currentLevel + 2, 9);
  }
  return currentLevel;
}

export function shouldSwitchCategory(dayCount: number, currentCategory: "objects" | "names"): "objects" | "names" {
  if (currentCategory === "objects" && dayCount >= 7) {
    return "names";
  }
  return currentCategory;
}

export function getGuestProgressFromDay(day: number): ProgressData {
  const map: Record<number, { currentLevel: number; dayCount: number }> = {
    1: { currentLevel: 3, dayCount: 0 },
    2: { currentLevel: 5, dayCount: 1 },
    3: { currentLevel: 5, dayCount: 2 },
    4: { currentLevel: 8, dayCount: 3 },
    5: { currentLevel: 10, dayCount: 4 },
  };
  const clampedDay = Math.max(1, Math.min(day, 5));
  const entry = map[clampedDay] || map[5];
  return {
    currentDay: day,
    currentLevel: entry.currentLevel,
    currentCategory: "objects",
    dayCount: entry.dayCount,
    streak: 0,
    lastLogin: null,
  };
}

export function getLessonConfig(level: number, dayCount: number, category: "objects" | "names"): LessonConfig {
  const day = dayCount + 1;
  const curriculumDay = BOOTCAMP_CURRICULUM.find(c => c.day === day) || BOOTCAMP_CURRICULUM[0];

  return {
    itemCount: curriculumDay.itemCount,
    category,
    cleaning: curriculumDay.cleaning,
    reverse: curriculumDay.reverse,
    focus: curriculumDay.focus,
    title: curriculumDay.title,
  };
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function levelLabel(level: number): string {
  if (level <= 3) return "1";
  if (level <= 5) return "2";
  if (level <= 7) return "3";
  return "4";
}
