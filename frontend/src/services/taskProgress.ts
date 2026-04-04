export type SharedTask = {
  id: number;
  label: string;
  done: boolean;
  date?: string;
  time?: string;
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
];

const LEGACY_DEFAULT_TASK_LABEL_SETS = [
  [
    "GOV 2306 review",
    "PHYS review",
    "Math Ch.2 practice",
    "Bash scripting exercises",
    "Next GOVT 2306 chapter",
    "Group project work",
  ],
  [
    "GOV 2306 review",
    "PHYS review",
    "Math Ch.2 practice",
    "Bash scripting exercises",
    "Next GOVT 2306 chapter",
    "Group project work",
    "Check/reply emails",
    "Return library book",
    "Organize notes",
  ],
];

const TASKS_STORAGE_KEY = "tagit.tasks.v1";
const TASKS_UPDATED_EVENT = "tagit:tasks-updated";

const cloneTasks = (tasks: SharedTask[]): SharedTask[] =>
  tasks.map((task) => ({ ...task }));

const isIsoDateString = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isTimeString = (value: string): boolean => /^\d{2}:\d{2}$/.test(value);

const matchesLegacySeedTasks = (tasks: SharedTask[]): boolean =>
  LEGACY_DEFAULT_TASK_LABEL_SETS.some((labels) => {
    if (tasks.length !== labels.length) return false;

    return tasks.every(
      (task, index) =>
        task.label === labels[index] &&
        task.id === index + 1 &&
        task.done === false,
    );
  });

const isSharedTaskArray = (value: unknown): value is SharedTask[] => {
  if (!Array.isArray(value)) return false;

  return value.every((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const candidate = entry as Partial<SharedTask>;
    return (
      typeof candidate.id === "number" &&
      typeof candidate.label === "string" &&
      typeof candidate.done === "boolean" &&
      (candidate.date === undefined ||
        (typeof candidate.date === "string" && isIsoDateString(candidate.date))) &&
      (candidate.time === undefined ||
        (typeof candidate.time === "string" && isTimeString(candidate.time)))
    );
  });
};

export const loadTasks = (): SharedTask[] => {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return cloneTasks(DEFAULT_TASKS);

    const parsed: unknown = JSON.parse(raw);
    if (!isSharedTaskArray(parsed)) return cloneTasks(DEFAULT_TASKS);

    if (matchesLegacySeedTasks(parsed)) {
      return cloneTasks(DEFAULT_TASKS);
    }

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
