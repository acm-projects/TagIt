import React, { useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import DateHeader from "../components/DateHeader";

/**
 * A single actionable task item for the Today page.
 * This shape is backend-ready: API responses can map directly into it.
 */
type TodayTask = {
  id: number;
  title: string;
  completed: boolean;
};

/**
 * Simple event preview used by the "Upcoming Events" section.
 * Backend calendar extraction can populate this structure later.
 */
type TodayEvent = {
  time: string;
  title: string;
};

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

const EVENTS: TodayEvent[] = [
  { time: "03:00 - 03:30", title: "Exam Prep" },
  { time: "04:00 - 05:30", title: "Government Class" },
  { time: "08:30 - 10:00", title: "ACM Meeting @ SLC" },
];

const TodayPage: React.FC = () => {
  const [tasks, setTasks] = useState<TodayTask[]>(() =>
    INITIAL_TASK_TITLES.map((title, index) => ({
      id: index,
      title,
      completed: false,
    })),
  );

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const progressPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  /**
   * Task container grows/shrinks based on the number of tasks so the box
   * naturally fits the list length while still keeping sane min/max bounds.
   */
  const taskCardHeightRem = useMemo(() => {
    const rowHeightRem = 1.7;
    const basePaddingRem = 2.5;
    const computedHeight = tasks.length * rowHeightRem + basePaddingRem;
    return Math.min(Math.max(computedHeight, 11), 23);
  }, [tasks.length]);

  const handleToggleTaskCompletion = (taskId: number) => {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-[#F8E7DD] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-[30px] bg-[#FFFBF8]">
        <AppNavbar />

        <main className="flex flex-1 flex-col overflow-auto px-8 py-6 text-[#913c14]">
          <DateHeader date="02/18/2026" />

          <section className="mt-8 max-w-xl">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#913c14]">
                workspace_premium
              </span>
              <span>Progress</span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="relative h-2 flex-1 rounded-full bg-[#FFF0E5]">
                <div
                  className="h-2 rounded-full bg-[#BA4500] transition-[width] duration-200 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-[#BA4500]">
                {progressPercentage}%
              </span>
            </div>
          </section>

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

            <div
              className="mt-3 overflow-y-auto rounded-xl bg-[#FFD6B8] px-4 py-3 shadow-sm"
              style={{ height: `${taskCardHeightRem}rem` }}
            >
              <ul className="space-y-1.5">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 text-sm text-[#6D2F12]"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTaskCompletion(task.id)}
                      className="h-4 w-4 flex-none rounded-[3px] border border-[#6D2F12] accent-[#BA4500]"
                      aria-label={`Mark "${task.title}" as completed`}
                    />
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

          <section className="mt-10 max-w-xl">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px] text-[#913c14]">
                event_note
              </span>
              <span>Upcoming Events</span>
            </div>

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
