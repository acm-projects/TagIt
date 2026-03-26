import React, { useState } from "react";
import AppNavbar from "../components/AppNavbar";
import DateHeader from "../components/DateHeader";

type TaskItem = {
  label: string;
  done: boolean;
};

const initialTasks: TaskItem[] = [
  { label: "GOV 2306 review", done: false },
  { label: "PHYS review", done: false },
  { label: "Math Ch.2 practice", done: false },
  { label: "Bash scripting exercises", done: false },
  { label: "Next GOVT 2306 chapter", done: false },
  { label: "Group project work", done: false },
  { label: "Check/reply emails", done: false },
  { label: "Return library book", done: false },
  { label: "Organize notes", done: false },
];

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);

  const toggleTask = (index: number) => {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === index ? { ...task, done: !task.done } : task,
      ),
    );
  };

  return (
    <div className="min-h-full bg-[#FFF2E9] p-4">
      <div className="flex min-h-[calc(100vh-2rem)] w-full rounded-3xl bg-[#FFFBF8]">
        <AppNavbar />

        {/* Main content */}
        <main className="flex-1 px-8 py-6 text-[#A34712]">
          <header className="border-b border-[#E6C7B3] pb-4">
            <DateHeader />
          </header>

          {/* Deadlines */}
          <section className="mt-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-base">⏳</span>
              <span>Deadlines</span>
            </div>

            <div className="mt-3 space-y-3">
              {[
                { title: "PHYS 2425 - Lab", color: "#CC635A" },
                { title: "GOV Unit Test", color: "#A34712" },
                { title: "PHYS 2425 - Lab", color: "#CC635A" },
                { title: "MATH Test", color: "#E3B13E", date: "03/04" },
                { title: "CS Midterm", color: "#5DAA62", date: "03/20" },
                { title: "Interview", color: "#4DA86C", date: "03/22" },
              ].map((item, idx) => (
                <div
                  key={item.title + idx}
                  className="flex items-stretch gap-3 rounded-xl bg-[#FBE7D7] px-3 py-2 shadow-sm"
                >
                  <span
                    className="mt-1 w-1 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex flex-1 items-center justify-between text-sm text-[#4E3C34]">
                    <span className="pr-3">{item.title}</span>
                    <span className="text-xs font-medium text-[#7A4A2D]">
                      {item.date ?? ""}
                    </span>
                  </div>
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
            <div className="mt-3 space-y-2 text-sm text-[#5A3A2A]">
              {tasks.map((task, index) => (
                <label
                  key={task.label}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(index)}
                    className="h-4 w-4 rounded border-[#C9A07D] text-[#A34712] focus:ring-[#D3753D]"
                  />
                  <span className={task.done ? "line-through opacity-70" : ""}>
                    {task.label}
                  </span>
                </label>
              ))}
            </div>

            <button className="mt-6 inline-flex items-center justify-center rounded-full bg-[#D3753D] px-6 py-2 text-sm font-semibold text-white">
              Done
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default TasksPage;
