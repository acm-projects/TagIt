export type SharedTask = {
  id: number;
  label: string;
  done: boolean;
};

export type TaskProgress = {
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
};

export const DEFAULT_TASKS: SharedTask[] = [
  { id: 1, label: "GOV 2306 review", done: false },
  { id: 2, label: "PHYS review", done: false },
  { id: 3, label: "Math Ch.2 practice", done: false },
  { id: 4, label: "Bash scripting exercises", done: false },
  { id: 5, label: "Next GOVT 2306 chapter", done: false },
  { id: 6, label: "Group project work", done: false },
  { id: 7, label: "Check/reply emails", done: false },
  { id: 8, label: "Return library book", done: false },
  { id: 9, label: "Organize notes", done: false },
];

const TASKS_STORAGE_KEY = "tagit.tasks.v1";
const TASKS_UPDATED_EVENT = "tagit:tasks-updated";

const cloneTasks = (tasks: SharedTask[]): SharedTask[] =>
  tasks.map((task) => ({ ...task }));

const isSharedTaskArray = (value: unknown): value is SharedTask[] => {
  if (!Array.isArray(value)) return false;

  return value.every((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const candidate = entry as Partial<SharedTask>;
    return (
      typeof candidate.id === "number" &&
      typeof candidate.label === "string" &&
      typeof candidate.done === "boolean"
    );
  });
};

export const loadTasks = (): SharedTask[] => {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return cloneTasks(DEFAULT_TASKS);

    const parsed: unknown = JSON.parse(raw);
    if (!isSharedTaskArray(parsed)) return cloneTasks(DEFAULT_TASKS);

    return cloneTasks(parsed);
  } catch {
    return cloneTasks(DEFAULT_TASKS);
  }
};

export const saveTasks = (tasks: SharedTask[]) => {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent(TASKS_UPDATED_EVENT));
  } catch {
    // Ignore storage errors so UI keeps working in restricted contexts.
  }
};

export const getTaskProgress = (tasks: SharedTask[]): TaskProgress => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.done).length;
  const progressPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return { totalTasks, completedTasks, progressPercentage };
};

export const subscribeToTaskUpdates = (onUpdate: () => void): (() => void) => {
  const storageListener = (event: StorageEvent) => {
    if (event.key === TASKS_STORAGE_KEY || event.key === null) {
      onUpdate();
    }
  };
  const customListener = () => onUpdate();

  window.addEventListener("storage", storageListener);
  window.addEventListener(TASKS_UPDATED_EVENT, customListener);

  return () => {
    window.removeEventListener("storage", storageListener);
    window.removeEventListener(TASKS_UPDATED_EVENT, customListener);
  };
};
