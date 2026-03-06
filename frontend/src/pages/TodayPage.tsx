import React, { useState } from "react";
import AppNavbar from "../components/AppNavbar";
import DateHeader from "../components/DateHeader";

/**
 * Represents a single task on the Today page.
 * In a future iteration this list will be hydrated from the backend
 * by reading and analysing the user's email instead of using static data.
 */
type TodayTask = {
  id: number;
  title: string;
  completed: boolean;
};

/**
 * Simple structure representing an upcoming calendar event.
 * These events will also eventually be sourced from backend data.
 */
type TodayEvent = {
  time: string;
  title: string;
};

/**
 * Initial task titles that mimic the Figma design.
 * These are converted into `TodayTask` objects when the component mounts.
 */
const INITIAL_TASK_TITLES: string[] = [
  "GOV 2306 review",
  "PHYS review",
  "Math Ch.2 practice",
  "Bash scripting exercises",
  "Next GOVT 2306 chapter",
  "Group project work",
  "Check/reply emails",
  "Return library book",
  "Organize notes",
  "Attend ACM meeting",
];

/**
 * Temporary upcoming events data showing how the UI will look.
 * The backend can later replace this with events inferred from email.
 */
const EVENTS: TodayEvent[] = [
  { time: "03:00 - 03:30", title: "Exam Prep" },
  { time: "04:00 - 05:30", title: "Government Class" },
  { time: "08:30 - 10:00", title: "ACM Meeting @ SLC" },
];

/**
 * Today page that implements the Figma design.
 *
 * - The header bar's arrows are wired in `DateHeader` to move the date.
 * - Tasks are interactive checkboxes; completing them updates the
 *   progress bar and completed/total count in real time.
 * - Upcoming events are currently static and prepared for backend wiring.
 */
const TodayPage: React.FC = () => {
  // Local state for the list of tasks displayed on the Today page.
  // When the backend integration is built, this can be seeded from
  // server data instead of `INITIAL_TASK_TITLES`.
  const [tasks, setTasks] = useState<TodayTask[]>(() =>
    INITIAL_TASK_TITLES.map((title, index) => ({
      id: index,
      title,
      completed: false,
    })),
  );

  // Derive total and completed counts to drive both the numeric display
  // and the visual width of the progress bar.
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const progressPercentage =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  // Toggle a single task's completion state when its checkbox is clicked.
  const handleToggleTaskCompletion = (taskId: number) => {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  return (
    <div className="min-h-full bg-[#F8E7DD] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-[30px] bg-[#FFFBF8]">
        {/* Left‑hand navigation rail shared across pages */}
        <AppNavbar />

        {/* Main column: same header/content padding as other pages */}
        <main className="flex-1 flex flex-col border-l border-[#F3C5A5] overflow-auto px-8 py-6 text-[#913c14]">
          {/* The date header now manages its own date and day state */}
          <DateHeader date="02/18/2026" />

          {/* Progress */}
          <section className="mt-8 max-w-xl">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#913c14]">
                workspace_premium
              </span>
              <span>Progress</span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              {/* Background track for the progress bar */}
              <div className="relative h-2 flex-1 rounded-full bg-[#FFF0E5]">
                {/* Filled segment reflects the percentage of completed tasks */}
                <div
                  className="h-2 rounded-full bg-[#BA4500] transition-[width] duration-200 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {/* Numeric percentage label beside the bar */}
              <span className="text-sm font-semibold text-[#BA4500]">
                {progressPercentage}%
              </span>
            </div>
          </section>

          {/* Tasks */}
          <section className="mt-8 max-w-xl">
            <div className="flex items-baseline gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#913c14]">
                done_all
              </span>
              <span>Tasks</span>
              <span className="ml-4 text-xs text-[#BA4500]">completed</span>
              <span className="ml-1 text-base font-semibold text-[#BA4500]">
                {completedTasks}/{totalTasks}
              </span>
            </div>

            {/* Task card sized so ~10 items fit without scrolling; still scrolls if more */}
            <div className="mt-3 min-h-[20rem] overflow-y-auto rounded-xl bg-[#FFD6B8] px-4 py-3 shadow-sm">
              <ul className="space-y-1.5">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 text-sm text-[#6D2F12]"
                  >
                    {/* Checkbox that toggles task completion */}
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTaskCompletion(task.id)}
                      className="h-4 w-4 flex-none rounded-[3px] border border-[#6D2F12] accent-[#BA4500]"
                      aria-label={`Mark "${task.title}" as completed`}
                    />
                    {/* Strike through completed tasks for visual feedback */}
                    <span
                      className={task.completed ? "line-through opacity-70" : ""}
                    >
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Upcoming Events */}
          <section className="mt-10 max-w-xl">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#913c14]">
                event_note
              </span>
              <span>Upcoming Events</span>
            </div>

            {/* Static sample events; later these can be replaced with data
                pulled from the user's email or calendar service. */}
            <div className="mt-3 space-y-3">
              {EVENTS.map((event, index) => {
                const background =
                  index === 0
                    ? "bg-[#FFF0E5]"
                    : index === 1
                    ? "bg-[#FAE6D9]"
                    : "bg-[#FED3B4]";

                return (
                  <div
                    key={event.title}
                    className={`flex items-center justify-between rounded-xl px-4 py-2 text-sm text-[#6D2F12] ${background}`}
                  >
                    <span className="text-xs font-medium">{event.time}</span>
                    <span className="ml-6 flex-1 text-right md:text-left">
                      {event.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default TodayPage;

