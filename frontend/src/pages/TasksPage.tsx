import React, { useEffect, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import DateHeader from "../components/DateHeader";
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

const formatDisplayDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
};

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadTasks());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(2026, 1, 18));
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingDate, setEditingDate] = useState("");

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
  };

  const addTask = () => {
    const trimmedLabel = newTaskLabel.trim();
    if (!trimmedLabel) return;

    const nextId =
      tasks.length === 0 ? 1 : Math.max(...tasks.map((task) => task.id)) + 1;

    setTasks((previousTasks) => [
      ...previousTasks,
      { id: nextId, label: trimmedLabel, done: false, date: formatIsoDate(selectedDate) },
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
    setIsAddingTask(false);
    setNewTaskLabel("");
  };

  const saveEditedTask = (taskId: number) => {
    const trimmedLabel = editingLabel.trim();
    if (!trimmedLabel || !editingDate) return;

    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId
          ? { ...task, label: trimmedLabel, date: editingDate }
          : task,
      ),
    );
    setEditingTaskId(null);
    setEditingLabel("");
    setEditingDate("");
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingLabel("");
    setEditingDate("");
  };

  const deleteTask = (taskId: number) => {
    setTasks((previousTasks) => previousTasks.filter((task) => task.id !== taskId));
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
      setEditingLabel("");
      setEditingDate("");
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FFF2E9] p-4">
      <div className="flex min-h-0 flex-1 w-full overflow-hidden rounded-[30px] bg-[#FFFBF8]">
        <AppNavbar />

        <main className="min-h-0 flex flex-1 flex-col overflow-auto px-8 py-6 text-[#A34712]">
          <DateHeader date="02/18/2026" onDateChange={setSelectedDate} />

          <section className="mt-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              <span>Tasks</span>
            </div>

            <div className="mt-3 space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl bg-[#FBE7D7] px-4 py-2 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 text-sm text-[#4E3C34]">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => toggleTask(task.id)}
                        className="h-4 w-4 rounded-[3px] border border-[#6D2F12] accent-[#BA4500]"
                        aria-label={`Mark "${task.label}" as completed`}
                      />

                      {editingTaskId === task.id ? (
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <input
                            type="text"
                            value={editingLabel}
                            onChange={(event) => setEditingLabel(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") saveEditedTask(task.id);
                              if (event.key === "Escape") cancelEditingTask();
                            }}
                            className="min-w-0 flex-1 rounded-md border border-[#D8B29A] bg-[#FFF8F2] px-2 py-1 text-sm text-[#4E3C34] focus:outline-none focus:ring-2 focus:ring-[#D3753D]"
                            aria-label={`Edit task ${task.label}`}
                            autoFocus
                          />
                          <input
                            type="date"
                            value={editingDate}
                            onChange={(event) => setEditingDate(event.target.value)}
                            className="rounded-md border border-[#D8B29A] bg-[#FFF8F2] px-2 py-1 text-sm text-[#4E3C34] focus:outline-none focus:ring-2 focus:ring-[#D3753D]"
                            aria-label={`Edit date for ${task.label}`}
                          />
                        </div>
                      ) : (
                        <span className={`truncate pr-3 ${task.done ? "line-through opacity-70" : ""}`}>
                          {task.label}
                        </span>
                      )}
                    </div>

                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      <span className="text-xs font-medium text-[#7A4A2D]">
                        {formatDisplayDate(parseIsoDate(task.date) ?? selectedDate)}
                      </span>

                      {editingTaskId === task.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEditedTask(task.id)}
                            className="inline-flex h-8 items-center justify-center rounded-full bg-[#D3753D] px-3 text-xs font-semibold text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingTask}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#E8D3C4] text-[#7A4023]"
                            aria-label={`Cancel editing ${task.label}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditingTask(task)}
                            className="inline-flex h-8 w-8 items-center justify-center text-[#7A4023] hover:text-[#A34712]"
                            aria-label={`Edit ${task.label}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            className="inline-flex h-8 w-8 items-center justify-center text-[#7A4023] hover:text-[#A34712]"
                            aria-label={`Delete ${task.label}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isAddingTask ? (
              <div className="mt-6 rounded-2xl bg-[#FBE7D7] p-4 shadow-sm">
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#7A4A2D]">
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
                  className="mt-2 w-full rounded-xl border border-[#D8B29A] bg-[#FFF8F2] px-4 py-3 text-sm text-[#4E3C34] focus:outline-none focus:ring-2 focus:ring-[#D3753D]"
                  placeholder="Add a task"
                  aria-label="Add a task"
                  autoFocus
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={addTask}
                    className="inline-flex items-center justify-center rounded-full bg-[#D3753D] px-5 py-2 text-sm font-semibold text-white"
                  >
                    Save Task
                  </button>
                  <button
                    type="button"
                    onClick={cancelAddingTask}
                    className="inline-flex items-center justify-center rounded-full bg-[#E8D3C4] px-5 py-2 text-sm font-semibold text-[#7A4023]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={startAddingTask}
                  className="inline-flex items-center justify-center rounded-full bg-[#D3753D] px-6 py-2 text-sm font-semibold text-white"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={removeCompletedTasks}
                  className="inline-flex items-center justify-center rounded-full bg-[#E8D3C4] px-6 py-2 text-sm font-semibold text-[#7A4023]"
                >
                  Clear Completed
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default TasksPage;
