import React, { useState } from "react";
import AppNavbar from "../components/AppNavbar";
import DateHeader from "../components/DateHeader";

/**
 * Represents a single task on the Tasks page.
 * These will eventually be created from the user's emails via backend
 * processing instead of being hard-coded here.
 */
type TaskItem = {
  id: number;
  label: string;
  done: boolean;
};

/**
 * Represents a deadline entry in the "Deadlines" section.
 * The `dueDate` field is used to automatically determine priority
 * colour (red / yellow / green) from how soon the deadline is.
 */
type DeadlineItem = {
  id: string;
  title: string;
  /** ISO‑ish string used only for computing how close the deadline is. */
  dueDate: string;
  /** Short human‑readable date shown in the UI, e.g. "03/04". */
  displayDate: string;
};

/**
 * Static initial tasks mirroring the Figma design.
 * The backend will eventually override this with tasks inferred from
 * the user's email.
 */
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

/**
 * Example deadlines. The colours for the vertical line on the left
 * are not hard-coded: they are derived from how close `dueDate` is.
 * When backend data plugs in, it just needs to provide titles and
 * due dates and this logic will still work.
 */
const initialDeadlines: DeadlineItem[] = [
  {
    id: "phys-lab-1",
    title: "PHYS 2425 - Lab",
    dueDate: "2026-02-20",
    displayDate: "02/20",
  },
  {
    id: "gov-test",
    title: "GOV Unit Test",
    dueDate: "2026-02-22",
    displayDate: "02/22",
  },
  {
    id: "phys-lab-2",
    title: "PHYS 2425 - Lab",
    dueDate: "2026-02-25",
    displayDate: "02/25",
  },
  {
    id: "math-test",
    title: "MATH Test",
    dueDate: "2026-03-04",
    displayDate: "03/04",
  },
  {
    id: "cs-midterm",
    title: "CS Midterm",
    dueDate: "2026-03-20",
    displayDate: "03/20",
  },
  {
    id: "interview",
    title: "Interview",
    dueDate: "2026-03-22",
    displayDate: "03/22",
  },
];

/**
 * Convert a short `YYYY-MM-DD` string into a `Date` instance.
 * This is intentionally tiny and only for this page's demo data.
 */
const parseDateString = (value: string): Date | null => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

/**
 * Given a deadline, choose a colour representing its urgency.
 *
 * - Red (close)   → less than or equal to 3 days away, or overdue.
 * - Yellow (mid)  → between 4 and 7 days away.
 * - Green (far)   → more than 7 days away.
 *
 * This keeps the UI behaviour‑driven so that future backend data will
 * automatically be visualised according to how close the due dates are.
 */
const getDeadlinePriorityColor = (deadline: DeadlineItem): string => {
  const due = parseDateString(deadline.dueDate);
  if (!due) {
    // Fall back to a neutral orange if parsing failed.
    return "#A34712";
  }

  // Compare against "today". For demo purposes we could use the actual
  // current date; if you prefer the date in the Today page, this could
  // be passed down as a prop instead.
  const today = new Date();

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffInMs = due.getTime() - today.getTime();
  const diffInDays = Math.floor(diffInMs / msPerDay);

  if (diffInDays <= 3) {
    // Very soon or overdue → red
    return "#CC635A";
  }

  if (diffInDays <= 7) {
    // Coming up soon → yellow
    return "#E3B13E";
  }

  // Further out in the future → green
  return "#4DA86C";
};

/**
 * Tasks page for managing study/work tasks and upcoming deadlines.
 *
 * - Deadlines show a coloured priority bar on the left that reflects
 *   how soon each due date is.
 * - Tasks use square checkboxes on the left (matching the Today page).
 * - Clicking the "Done" button at the bottom removes all checked tasks
 *   from the list.
 * - All sample data is temporary and ready to be replaced by backend
 *   logic that reads the user's emails.
 */
const TasksPage: React.FC = () => {
  // Local state for tasks derived from the initial static list.
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);

  // Deadlines are read‑only for now, but kept in state so it is easy
  // to make them editable later if needed.
  const [deadlines] = useState<DeadlineItem[]>(initialDeadlines);

  // Toggle the "done" state of an individual task when its checkbox
  // is clicked.
  const toggleTask = (taskId: number) => {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    );
  };

  // Remove all tasks that the user has marked as done.
  const removeCompletedTasks = () => {
    setTasks((previousTasks) => previousTasks.filter((task) => !task.done));
  };

  return (
    <div className="min-h-full bg-[#FFF2E9] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full rounded-3xl bg-[#FFFBF8]">
        {/* Shared left navigation bar */}
        <AppNavbar />

        {/* Main content: same header strip as other pages */}
        <main className="flex-1 flex flex-col overflow-auto px-8 py-6 text-[#A34712]">
          <DateHeader />

          {/* Deadlines */}
          <section className="mt-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-base">⏳</span>
              <span>Deadlines</span>
            </div>

            {/* Each deadline card shows a coloured strip, title and date.
                The strip's colour is derived from how close the due date is. */}
            <div className="mt-3 space-y-3">
              {deadlines.map((item) => (
                <div
                  key={item.id}
                  className="flex items-stretch gap-3 rounded-xl bg-[#FBE7D7] px-3 py-2 shadow-sm"
                >
                  {/* Priority indicator on the left */}
                  <span
                    className="mt-1 w-1 rounded-full"
                    style={{ backgroundColor: getDeadlinePriorityColor(item) }}
                  />

                  {/* Deadline title and short date */}
                  <div className="flex flex-1 items-center justify-between text-sm text-[#4E3C34]">
                    <span className="pr-3">{item.title}</span>
                    <span className="text-xs font-medium text-[#7A4A2D]">
                      {item.displayDate}
                    </span>
                  </div>

                  {/* Placeholder "Done" button for future behaviour (e.g.
                      snoozing / dismissing deadlines). */}
                  <button className="ml-2 inline-flex items-center justify-center rounded-full bg-[#D3753D] px-3 py-1 text-xs font-semibold text-white">
                    Done
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Tasks list */}
          <section className="mt-8">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-base">✅</span>
              <span>Tasks</span>
            </div>

            {/* Checkboxes aligned on the left, matching the Today page
                styling so the experience feels consistent. */}
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

            {/* When clicked, this removes all tasks that have their
                checkbox checked from the list. */}
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
