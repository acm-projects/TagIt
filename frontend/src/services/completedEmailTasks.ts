/**
 * Tracks which email-extracted tasks the user has checked off.
 * Completed tasks are stored per-user in localStorage with the date they were
 * completed.  On load, any task completed on a previous day is automatically
 * evicted ("after the next day comes, the finished tasks will go away forever").
 */

import { getCurrentUsername } from "./currentUser";

export type CompletedEmailTask = {
  key: string;
  text: string;
  emailSubject: string;
  priorityLevel?: number;
  completedDate: string; // YYYY-MM-DD local date
};

const getStorageKey = () =>
  `tagit.completed-email-tasks.v1.${getCurrentUsername()}`;

const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const save = (tasks: CompletedEmailTask[]): void => {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(tasks));
  } catch {
    // ignore
  }
};

/** Load completed tasks, auto-evicting any from a previous day. */
export const loadCompletedEmailTasks = (): CompletedEmailTask[] => {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompletedEmailTask[];
    const today = todayStr();
    const current = parsed.filter((t) => t.completedDate === today);
    if (current.length !== parsed.length) save(current);
    return current;
  } catch {
    return [];
  }
};

/** Mark a task as completed today. */
export const markEmailTaskCompleted = (
  task: Omit<CompletedEmailTask, "completedDate">
): void => {
  const tasks = loadCompletedEmailTasks();
  if (tasks.some((t) => t.key === task.key)) return;
  save([...tasks, { ...task, completedDate: todayStr() }]);
};

/** Un-complete a task (move it back to the active list). */
export const unmarkEmailTaskCompleted = (key: string): void => {
  save(loadCompletedEmailTasks().filter((t) => t.key !== key));
};

/** Permanently remove a completed task (after the user explicitly dismisses it). */
export const removeCompletedEmailTask = (key: string): void => {
  save(loadCompletedEmailTasks().filter((t) => t.key !== key));
};

/** How many tasks were completed today — used by the progress bar. */
export const getCompletedEmailTaskCount = (): number =>
  loadCompletedEmailTasks().length;
