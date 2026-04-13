import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import {
  NullableConnectedDaysFilter,
  getDateForWeekdayInAnchorWeek,
  isSameLocalDay,
  useNullableDayFilter,
  useWeekAnchorWithSharedDayFilter,
} from "../components/DaysFilter";
import WeekHeader from "../components/WeekHeader";
import {
  loadTasks,
  saveTasks,
  type SharedTask,
} from "../services/taskProgress";
import {
  getUserTasks,
  dismissTask,
  type EmailTaskItem,
} from "../services/api";
import addIcon from "../assets/page_buttons/add.png";
import deleteIcon from "../assets/page_buttons/delete.png";
import FilterMenuButton, { type FilterOption } from "../components/FilterMenuButton";
import { loadConnectedEmails } from "../services/connectedUser";

/**
 * Represents a single task on the Tasks page.
 * These will eventually come from backend email/task extraction.
 */
type TaskItem = SharedTask;

const formatIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseIsoDate = (value?: string): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

/** Minutes from midnight for HH:MM; missing/invalid sorts after real times. */
const timeSortKey = (time?: string): number => {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time.trim())) {
    return 24 * 60 + 1;
  }
  const [h, m] = time.trim().split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 24 * 60 + 1;
  return h * 60 + m;
};

const compareTasksByHierarchy = (a: TaskItem, b: TaskItem): number => {
  if (a.done !== b.done) {
    return a.done ? 1 : -1;
  }

  const dateA = parseIsoDate(a.date);
  const dateB = parseIsoDate(b.date);
  if (dateA && dateB) {
    const diff = dateA.getTime() - dateB.getTime();
    if (diff !== 0) return diff;
  } else if (dateA && !dateB) {
    return -1;
  } else if (!dateA && dateB) {
    return 1;
  }

  const timeDiff = timeSortKey(a.time) - timeSortKey(b.time);
  if (timeDiff !== 0) return timeDiff;

  return a.id - b.id;
};

const formatDisplayTime = (value?: string): string => {
  if (!value) return "9:00 AM";

  const [hoursRaw, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hoursRaw) || Number.isNaN(minutes)) return "9:00 AM";

  const period = hoursRaw >= 12 ? "PM" : "AM";
  const hours = hoursRaw % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, "0")} ${period}`;
};

const formatDisplayDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
};

const iconMaskStyle = (src: string): React.CSSProperties => ({
  WebkitMaskImage: `url(${src})`,
  maskImage: `url(${src})`,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  maskSize: "contain",
});

const TasksPage: React.FC = () => {
  const editingTimeInputRef = useRef<HTMLInputElement | null>(null);
  const { nullableDay: taskDay, setNullableDay: setTaskDay } = useNullableDayFilter();
  const { weekAnchor, handleWeekDateChange } = useWeekAnchorWithSharedDayFilter();
  const [connectedEmails, setConnectedEmails] = useState<string[]>(() => loadConnectedEmails());
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadTasks().map((task, index) => ({
    ...task,
    accountEmail: task.accountEmail ?? loadConnectedEmails()[index % Math.max(loadConnectedEmails().length, 1)] ?? "primary@university.edu",
  })));
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [editingTime, setEditingTime] = useState("");
  const [isEditingTimeEnabled, setIsEditingTimeEnabled] = useState(true);

  // Email-extracted tasks & deadlines from backend
  const [emailItems, setEmailItems] = useState<EmailTaskItem[]>([]);
  const [isLoadingEmailItems, setIsLoadingEmailItems] = useState(false);

  const loadEmailItems = useCallback(async () => {
    setIsLoadingEmailItems(true);
    try {
      const resp = await getUserTasks();
      if (resp.success && resp.data?.items) {
        setEmailItems(resp.data.items);
      }
    } catch {
      // Silently fail — manual tasks are still shown
    } finally {
      setIsLoadingEmailItems(false);
    }
  }, []);

  useEffect(() => {
    void loadEmailItems();
  }, [loadEmailItems]);

  const handleDismissEmailItem = useCallback(async (key: string) => {
    // Optimistically remove from UI
    setEmailItems((prev) => prev.filter((item) => item.key !== key));
    await dismissTask(key);
  }, []);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const selectedCalendarDay = useMemo(
    () => (taskDay ? getDateForWeekdayInAnchorWeek(weekAnchor, taskDay) : null),
    [weekAnchor, taskDay],
  );

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const d = parseIsoDate(task.date);
      let matchesWeek: boolean;
      if (d) {
        // Always show the full current week (Mon–Sun) regardless of day selection
        const weekMon = getDateForWeekdayInAnchorWeek(weekAnchor, "mon");
        const weekSun = getDateForWeekdayInAnchorWeek(weekAnchor, "sun");
        weekSun.setHours(23, 59, 59, 999);
        matchesWeek = d >= weekMon && d <= weekSun;
      } else {
        matchesWeek = true;
      }
      const matchesAccount =
        selectedAccount === "all" ||
        (task.accountEmail ?? "Unknown account") === selectedAccount;
      return matchesWeek && matchesAccount;
    });
    return [...filtered].sort(compareTasksByHierarchy);
  }, [tasks, selectedAccount, weekAnchor]);

  const toggleTask = (taskId: number) => {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    );
  };

  const clearAllTasks = () => {
    if (!selectedCalendarDay) return;
    setTasks((previousTasks) =>
      previousTasks.filter((task) => {
        const taskDate = parseIsoDate(task.date);
        if (!taskDate) return true;
        return !isSameLocalDay(taskDate, selectedCalendarDay);
      }),
    );
  };

  const startAddingTask = () => {
    setIsAddingTask(true);
    setNewTaskLabel("");
    const defaultDate = selectedCalendarDay ?? new Date();
    setNewTaskDate(formatIsoDate(defaultDate));
    setNewTaskTime("");
    setEditingTaskId(null);
    setEditingLabel("");
    setEditingDate("");
    setEditingTime("");
    setIsEditingTimeEnabled(true);
  };

  const addTask = () => {
    const trimmedLabel = newTaskLabel.trim();
    if (!trimmedLabel) return;

    const nextId =
      tasks.length === 0 ? 1 : Math.max(...tasks.map((task) => task.id)) + 1;
    const accountEmail =
      selectedAccount !== "all"
        ? selectedAccount
        : connectedEmails[0] ?? "primary@university.edu";

    setTasks((previousTasks) => [
      ...previousTasks,
      {
        id: nextId,
        label: trimmedLabel,
        done: false,
        date: newTaskDate || formatIsoDate(selectedCalendarDay ?? new Date()),
        time: newTaskTime || undefined,
        accountEmail,
      },
    ]);
    setIsAddingTask(false);
    setNewTaskLabel("");
    setNewTaskDate("");
    setNewTaskTime("");
  };

  const cancelAddingTask = () => {
    setIsAddingTask(false);
    setNewTaskLabel("");
    setNewTaskDate("");
    setNewTaskTime("");
  };

  const startEditingTask = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditingLabel(task.label);
    setEditingDate(task.date ?? formatIsoDate((selectedCalendarDay ?? new Date())));
    setEditingTime(task.time ?? "09:00");
    setIsEditingTimeEnabled(Boolean(task.time));
    setIsAddingTask(false);
    setNewTaskLabel("");
  };

  const saveEditedTask = (taskId: number) => {
    const trimmedLabel = editingLabel.trim();
    if (!trimmedLabel || !editingDate) return;

    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              label: trimmedLabel,
              date: editingDate,
              time: isEditingTimeEnabled ? editingTime : undefined,
              accountEmail: task.accountEmail ?? (selectedAccount !== "all" ? selectedAccount : connectedEmails[0]),
            }
          : task,
      ),
    );
    setEditingTaskId(null);
    setEditingLabel("");
    setEditingDate("");
    setEditingTime("");
    setIsEditingTimeEnabled(true);
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingLabel("");
    setEditingDate("");
    setEditingTime("");
    setIsEditingTimeEnabled(true);
  };

  useEffect(() => {
    const emails = loadConnectedEmails();
    setConnectedEmails(emails);
    setTasks((prev) =>
      prev.map((task, index) => ({
        ...task,
        accountEmail: task.accountEmail ?? emails[index % Math.max(emails.length, 1)] ?? "primary@university.edu",
      })),
    );
  }, []);

  const accountOptions: FilterOption[] = [{ value: "all", label: "All" }].concat(
    (connectedEmails.length ? connectedEmails : Array.from(new Set(tasks.map((t) => t.accountEmail).filter(Boolean) as string[]))).map(
      (email) => ({ value: email, label: email })
    )
  );

  const deleteTask = (taskId: number) => {
    setTasks((previousTasks) => previousTasks.filter((task) => task.id !== taskId));
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
      setEditingLabel("");
      setEditingDate("");
      setEditingTime("");
      setIsEditingTimeEnabled(true);
    }
  };

  const openTimePicker = () => {
    const input = editingTimeInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  const toggleEditingTime = (enabled: boolean) => {
    if (!enabled) {
      setIsEditingTimeEnabled(false);
      setEditingTime("");
      return;
    }

    setIsEditingTimeEnabled(true);
    setEditingTime((previous) => previous || "09:00");

    window.requestAnimationFrame(() => {
      openTimePicker();
    });
  };

  const fieldClass =
    "rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111827] focus:border-[#f9ab7b] focus:outline-none focus:ring-2 focus:ring-[#fde6d7]";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F9F8F6] p-4">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <main className="app-main-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-auto px-3 py-2 text-[#1F2933] sm:px-6 sm:py-4 lg:px-8 lg:py-5">
          <WeekHeader showYear={false} onDateChange={handleWeekDateChange} />

          <div className="mt-2.5 space-y-4 sm:mt-3">
            <NullableConnectedDaysFilter className="!mt-0" value={taskDay} onChange={setTaskDay} />

            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 -960 960 960"
                      aria-hidden="true"
                      className="h-[24px] w-[24px] shrink-0 fill-[#f9ab7b]"
                    >
                      <path d="M268-240 42-466l57-56 170 170 56 56-57 56Zm226 0L268-466l56-57 170 170 368-368 56 57-424 424Zm0-226-57-56 198-198 57 56-198 198Z" />
                    </svg>
                    <span>Tasks</span>
                  </div>
                  <div className="flex items-center gap-2 pr-1">
                    <FilterMenuButton
                      options={accountOptions}
                      selectedValue={selectedAccount}
                      onSelect={setSelectedAccount}
                      ariaLabel="Filter tasks by account"
                      emptyMessage="No accounts yet"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  {tasks.length === 0 ? (
                    <p className="py-2 text-[12px] text-[#6B7280]">No tasks yet. Add one below.</p>
                  ) : visibleTasks.length === 0 ? (
                    <p className="py-2 text-[12px] text-[#6B7280]">No tasks for this day.</p>
                  ) : (
                    visibleTasks.map((task, index) => {
                      const isLast = index === visibleTasks.length - 1;
                      const rowDivider = {
                        borderBottom: isLast ? "none" : "0.5px solid #E5E7EB",
                      } as const;

                      if (editingTaskId === task.id) {
                        return (
                          <div
                            key={task.id}
                            className="group flex items-start py-3"
                            style={rowDivider}
                          >
                            <div className="flex min-w-0 flex-1 flex-col gap-3">
                              <input
                                type="text"
                                value={editingLabel}
                                onChange={(event) => setEditingLabel(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") saveEditedTask(task.id);
                                  if (event.key === "Escape") cancelEditingTask();
                                }}
                                className={`w-full ${fieldClass}`}
                                aria-label={`Edit task ${task.label}`}
                                autoFocus
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="date"
                                  value={editingDate}
                                  onChange={(event) => setEditingDate(event.target.value)}
                                  className={fieldClass}
                                  aria-label={`Edit date for ${task.label}`}
                                />
                                <label className={`inline-flex items-center gap-2 ${fieldClass}`}>
                                  <input
                                    type="checkbox"
                                    checked={isEditingTimeEnabled}
                                    onChange={(event) => toggleEditingTime(event.target.checked)}
                                    className="h-4 w-4 rounded border border-[#D1D5DB] accent-[#f9ab7b]"
                                  />
                                  <span className="text-[#374151]">
                                    {isEditingTimeEnabled ? formatDisplayTime(editingTime) : "Show time"}
                                  </span>
                                </label>
                                <input
                                  ref={editingTimeInputRef}
                                  type="time"
                                  value={editingTime}
                                  onChange={(event) => {
                                    setEditingTime(event.target.value);
                                    setIsEditingTimeEnabled(true);
                                  }}
                                  className="sr-only"
                                  tabIndex={-1}
                                  aria-label={`Edit time for ${task.label}`}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveEditedTask(task.id)}
                                  className="inline-flex h-8 items-center justify-center rounded-full bg-[#f9ab7b] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#e89960]"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditingTask}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280] transition-colors hover:bg-[#E5E7EB]"
                                  aria-label={`Cancel editing ${task.label}`}
                                >
                                  <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={task.id}
                          className="group grid grid-cols-[28px_minmax(0,1fr)_auto_auto] items-center gap-x-3 py-3"
                          style={rowDivider}
                        >
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => toggleTask(task.id)}
                              className="h-5 w-5 shrink-0 rounded-[4px] border border-[#D1D5DB] accent-[#f9ab7b]"
                              aria-label={`Mark "${task.label}" as completed`}
                            />
                          </div>

                          <div className="min-w-0 text-left">
                            <span
                              className={`block truncate text-sm font-normal text-[#111827] ${task.done ? "line-through opacity-70" : ""}`}
                            >
                              {task.label}
                            </span>
                          </div>

                          <span className="shrink-0 whitespace-nowrap text-[12px] font-medium tabular-nums text-[#6B7280] ml-[-40px] mr-2">
                              {formatDisplayDate(
                                parseIsoDate(task.date) ?? selectedCalendarDay ?? new Date(),
                              )}
                            {task.time ? ` · ${formatDisplayTime(task.time)}` : ""}
                          </span>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditingTask(task)}
                              className="inline-flex h-4 w-4 items-center justify-center text-[#f9ab7b] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                              aria-label={`Edit ${task.label}`}
                            >
                              <span className="material-symbols-outlined text-[12px] leading-none">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              className="inline-flex h-4 w-4 items-center justify-center text-[#f9ab7b] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                              aria-label={`Delete ${task.label}`}
                            >
                              <span className="material-symbols-outlined text-[12px] leading-none">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </section>

            {/* Email-extracted Tasks & Deadlines */}
            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                    <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">mail</span>
                    <span>From Emails</span>
                    {isLoadingEmailItems && (
                      <span className="ml-1 text-[11px] font-normal text-[#9CA3AF]">loading…</span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  {emailItems.length === 0 && !isLoadingEmailItems ? (
                    <p className="py-2 text-[12px] text-[#6B7280]">
                      No pending tasks or deadlines from your emails.
                    </p>
                  ) : (
                    emailItems.map((item, index) => {
                      const isLast = index === emailItems.length - 1;
                      const isDeadline = item.type === "deadline";
                      return (
                        <div
                          key={item.key}
                          className="group grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 py-3"
                          style={{
                            borderBottom: isLast ? "none" : "0.5px solid #E5E7EB",
                          }}
                        >
                          {/* Left icon: deadline = clock, task = checkbox-style dot */}
                          <div className="flex items-center justify-center">
                            <span
                              className={`material-symbols-outlined text-[18px] ${
                                isDeadline ? "text-[#ef4444]" : "text-[#f9ab7b]"
                              }`}
                            >
                              {isDeadline ? "schedule" : "task_alt"}
                            </span>
                          </div>

                          <div className="min-w-0 text-left">
                            <span className="block text-sm font-normal text-[#111827]">
                              {item.text}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-[#9CA3AF]">
                              {item.emailSubject}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                isDeadline
                                  ? "border border-[#fecdd3] bg-[#fee2e2] text-[#ef4444]"
                                  : "border border-[#fde6d7] bg-[#fff7ed] text-[#f9ab7b]"
                              }`}
                            >
                              {isDeadline ? "Deadline" : "Task"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDismissEmailItem(item.key)}
                              className="inline-flex h-6 items-center justify-center rounded-full border border-[#E5E7EB] px-2 text-[10px] font-semibold text-[#6B7280] opacity-0 transition-all duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-[#F3F4F6]"
                              aria-label={`Dismiss "${item.text}"`}
                              title="Done / Dismiss"
                            >
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={startAddingTask}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f9ab7b] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e89960]"
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 bg-white"
                  style={iconMaskStyle(addIcon)}
                />
                <span>Add Task</span>
              </button>
              <button
                type="button"
                onClick={clearAllTasks}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-6 py-2 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#F9FAFB]"
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 bg-[#374151]"
                  style={iconMaskStyle(deleteIcon)}
                />
                <span>Clear All Tasks</span>
              </button>
            </div>

            {isAddingTask && (
              <div className="rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] p-4 shadow-[0_6px_14px_rgba(17,24,39,0.05)]">
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
                  New Task
                </label>
                <input
                  type="text"
                  value={newTaskLabel}
                  onChange={(event) => setNewTaskLabel(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addTask();
                    if (event.key === "Escape") cancelAddingTask();
                  }}
                  className={`mt-2 w-full ${fieldClass}`}
                  placeholder="Task name"
                  aria-label="Task name"
                  autoFocus
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(event) => setNewTaskDate(event.target.value)}
                    className={fieldClass}
                    aria-label="Task date (optional)"
                  />
                  <input
                    type="time"
                    value={newTaskTime}
                    onChange={(event) => setNewTaskTime(event.target.value)}
                    className={fieldClass}
                    aria-label="Task time (optional)"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={addTask}
                    className="inline-flex items-center justify-center rounded-full bg-[#f9ab7b] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e89960]"
                  >
                    Save Task
                  </button>
                  <button
                    type="button"
                    onClick={cancelAddingTask}
                    className="inline-flex items-center justify-center rounded-full bg-[#F3F4F6] px-5 py-2 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#E5E7EB]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <AppNavbar />
      </div>
    </div>
  );
};

export default TasksPage;
