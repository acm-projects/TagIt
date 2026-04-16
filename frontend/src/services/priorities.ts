import { useEffect, useState } from "react";
import { getCurrentUsername } from "./currentUser";

export type PriorityRule = {
  id: number;
  label: string;
};

const getPrioritiesKey = () => `tagit-settings-priorities.${getCurrentUsername()}`;
const PRIORITIES_UPDATED_EVENT = "tagit:priorities-updated";

export const DEFAULT_PRIORITIES: PriorityRule[] = [
  { id: 1, label: "Club Events" },
  { id: 2, label: "Class/Assignment Notifications" },
  { id: 3, label: "Job/Internship Opportunities" },
  { id: 4, label: "Deadlines" },
];

const clonePriorities = (priorities: PriorityRule[]): PriorityRule[] =>
  priorities.map((priority) => ({ ...priority }));

const isPriorityRuleArray = (value: unknown): value is PriorityRule[] => {
  if (!Array.isArray(value)) return false;

  return value.every((entry) => {
    if (!entry || typeof entry !== "object") return false;

    const candidate = entry as Partial<PriorityRule>;
    return typeof candidate.id === "number" && typeof candidate.label === "string";
  });
};

export const loadUserPriorities = (): PriorityRule[] => {
  try {
    const raw = localStorage.getItem(getPrioritiesKey());
    if (!raw) return clonePriorities(DEFAULT_PRIORITIES);

    const parsed: unknown = JSON.parse(raw);
    if (!isPriorityRuleArray(parsed) || parsed.length === 0) {
      return clonePriorities(DEFAULT_PRIORITIES);
    }

    return clonePriorities(parsed);
  } catch {
    return clonePriorities(DEFAULT_PRIORITIES);
  }
};

export const saveUserPriorities = (priorities: PriorityRule[]): void => {
  try {
    localStorage.setItem(getPrioritiesKey(), JSON.stringify(priorities));
    window.dispatchEvent(new Event(PRIORITIES_UPDATED_EVENT));
  } catch {
    // Ignore storage errors so the UI remains usable.
  }
};

export const subscribeToPriorityUpdates = (listener: () => void): (() => void) => {
  const storageListener = (event: StorageEvent) => {
    if (event.key === getPrioritiesKey() || event.key === null) {
      listener();
    }
  };

  window.addEventListener(PRIORITIES_UPDATED_EVENT, listener);
  window.addEventListener("storage", storageListener);

  return () => {
    window.removeEventListener(PRIORITIES_UPDATED_EVENT, listener);
    window.removeEventListener("storage", storageListener);
  };
};

export const useUserPriorities = (): PriorityRule[] => {
  const [priorities, setPriorities] = useState<PriorityRule[]>(() => loadUserPriorities());

  useEffect(() => {
    const refreshPriorities = () => {
      setPriorities(loadUserPriorities());
    };

    return subscribeToPriorityUpdates(refreshPriorities);
  }, []);

  return priorities;
};

export const getCategoryIdForPriority = (priorityId: number): string => `priority-${priorityId}`;
