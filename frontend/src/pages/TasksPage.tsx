import React, { useState } from "react";
import AppNavbar from "../components/AppNavbar";
import DateHeader from "../components/DateHeader";

/**
 * Represents a single task on the Tasks page.
 * These will eventually come from backend email/task extraction.
 */
type TaskItem = {
  id: number;
  label: string;
  done: boolean;
};

/**
 * Represents a deadline entry in the "Deadlines" section.
 */
type DeadlineItem = {
  id: string;
  title: string;
  dueDate: string;
  displayDate: string;
};

const initialTasks: TaskItem[] = [
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

const initialDeadlines: DeadlineItem[] = [
  { id: "phys-lab-1", title: "PHYS 2425 - Lab", dueDate: "2026-02-20", displayDate: "02/20" },
  { id: "gov-test", title: "GOV Unit Test", dueDate: "2026-02-22", displayDate: "02/22" },
  { id: "phys-lab-2", title: "PHYS 2425 - Lab", dueDate: "2026-02-25", displayDate: "02/25" },
  { id: "math-test", title: "MATH Test", dueDate: "2026-03-04", displayDate: "03/04" },
  { id: "cs-midterm", title: "CS Midterm", dueDate: "2026-03-20", displayDate: "03/20" },
  { id: "interview", title: "Interview", dueDate: "2026-03-22", displayDate: "03/22" },
];

const parseDateString = (value: string): Date | null => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

/**
 * Priority colors by due-date proximity.
 */
const getDeadlinePriorityColor = (deadline: DeadlineItem): string => {
  const due = parseDateString(deadline.dueDate);
  if (!due) return "#A34712";

  const today = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffInMs = due.getTime() - today.getTime();
  const diffInDays = Math.floor(diffInMs / msPerDay);

  if (diffInDays <= 3) return "#CC635A";
  if (diffInDays <= 7) return "#E3B13E";
  return "#4DA86C";
};

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [deadlines] = useState<DeadlineItem[]>(initialDeadlines);

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

  return (
    <div className="min-h-screen bg-[#FFF2E9] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-[30px] bg-[#FFFBF8]">
        <AppNavbar />

        <main className="flex flex-1 flex-col overflow-auto px-8 py-6 text-[#A34712]">
          <DateHeader date="02/18/2026" />

          <section className="mt-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">hourglass_bottom</span>
              <span>Deadlines</span>
            </div>

            <div className="mt-3 space-y-3">
              {deadlines.map((item) => (
                <div
                  key={item.id}
                  className="flex items-stretch gap-3 rounded-xl bg-[#FBE7D7] px-3 py-2 shadow-sm"
                >
                  <span
                    className="mt-1 w-1 rounded-full"
                    style={{ backgroundColor: getDeadlinePriorityColor(item) }}
                  />

                  <div className="flex flex-1 items-center justify-between text-sm text-[#4E3C34]">
                    <span className="pr-3">{item.title}</span>
                    <span className="text-xs font-medium text-[#7A4A2D]">
                      {item.displayDate}
                    </span>
                  </div>

                  <button className="ml-2 inline-flex items-center justify-center rounded-full bg-[#D3753D] px-3 py-1 text-xs font-semibold text-white">
                    Done
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              <span>Tasks</span>
            </div>

            <div className="mt-3 space-y-2 text-sm text-[#5A3A2A]">
              {tasks.map((task) => (
                <label
                  key={task.id}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                    className="h-4 w-4 rounded-[3px] border border-[#6D2F12] accent-[#BA4500]"
                    aria-label={`Mark "${task.label}" as completed`}
                  />
                  <span className={task.done ? "line-through opacity-70" : ""}>
                    {task.label}
                  </span>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={removeCompletedTasks}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#D3753D] px-6 py-2 text-sm font-semibold text-white"
            >
              Done
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default TasksPage;
