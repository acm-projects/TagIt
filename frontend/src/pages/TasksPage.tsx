import React, { useEffect, useRef, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import WeekHeader from "../components/WeekHeader";
import {
  loadTasks,
  saveTasks,
  type SharedTask,
} from "../services/taskProgress";

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

const TasksPage: React.FC = () => {
  const editingTimeInputRef = useRef<HTMLInputElement | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadTasks());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(2026, 1, 18));
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [editingTime, setEditingTime] = useState("");
  const [isEditingTimeEnabled, setIsEditingTimeEnabled] = useState(true);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const toggleTask = (taskId: number) => {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    );
  };

  const removeCompletedTasks = () => {
    setTasks((previousTasks) => previousTasks.filter((task) => !task.done));
  };

  const startAddingTask = () => {
    setIsAddingTask(true);
    setNewTaskLabel("");
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

    setTasks((previousTasks) => [
      ...previousTasks,
      {
        id: nextId,
        label: trimmedLabel,
        done: false,
        date: formatIsoDate(selectedDate),
        time: "09:00",
      },
    ]);
    setIsAddingTask(false);
    setNewTaskLabel("");
  };

  const cancelAddingTask = () => {
    setIsAddingTask(false);
    setNewTaskLabel("");
  };

  const startEditingTask = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditingLabel(task.label);
    setEditingDate(task.date ?? formatIsoDate(selectedDate));
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
          <WeekHeader showYear={false} onDateChange={setSelectedDate} />

          <div className="mt-5 space-y-4 sm:mt-6">
            <section className="w-full max-w-4xl">
              <div className="rounded-2xl border border-[#EFE7DC] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2933]">
                  <span className="material-symbols-outlined text-[18px] text-[#f9ab7b]">task_alt</span>
                  <span>Tasks</span>
                </div>

                <div className="mt-3">
                  {tasks.length === 0 ? (
                    <p className="py-2 text-[12px] text-[#6B7280]">No tasks yet. Add one below.</p>
                  ) : (
                    tasks.map((task, index) => {
                      const isLast = index === tasks.length - 1;
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
                          className="group flex items-center gap-3 py-2"
                          style={rowDivider}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => toggleTask(task.id)}
                              className="h-4 w-4 shrink-0 rounded border border-[#D1D5DB] accent-[#f9ab7b]"
                              aria-label={`Mark "${task.label}" as completed`}
                            />
                            <span
                              className={`min-w-0 flex-1 truncate text-sm font-semibold text-[#111827] ${task.done ? "line-through opacity-70" : ""}`}
                            >
                              {task.label}
                            </span>
                            <span className="shrink-0 whitespace-nowrap text-[12px] font-medium tabular-nums text-[#6B7280]">
                              {formatDisplayDate(parseIsoDate(task.date) ?? selectedDate)}
                              {task.time ? ` · ${formatDisplayTime(task.time)}` : ""}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => startEditingTask(task)}
                              className="inline-flex h-7 w-7 items-center justify-center text-[#f9ab7b] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                              aria-label={`Edit ${task.label}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              className="inline-flex h-7 w-7 items-center justify-center text-[#f9ab7b] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                              aria-label={`Delete ${task.label}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {isAddingTask ? (
                  <div className="mt-4 rounded-xl border border-[#F0F0F0] bg-[#FBFBFB] p-4 shadow-[0_6px_14px_rgba(17,24,39,0.05)]">
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
                      placeholder="Add a task"
                      aria-label="Add a task"
                      autoFocus
                    />
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
                ) : (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={startAddingTask}
                      className="inline-flex items-center justify-center rounded-full bg-[#f9ab7b] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e89960]"
                    >
                      Add Task
                    </button>
                    <button
                      type="button"
                      onClick={removeCompletedTasks}
                      className="inline-flex items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-6 py-2 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                    >
                      Clear Completed
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>

        <AppNavbar />
      </div>
    </div>
  );
};

export default TasksPage;
