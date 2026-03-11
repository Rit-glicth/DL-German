import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const levels = ["A1", "A2", "B1", "B2"];

export default function CEFRProgress({ currentLevel, isDark }) {
  const currentIndex = levels.indexOf(currentLevel || "A1");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn(
        "rounded-2xl p-6 ring-1 transition-colors duration-300",
        isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      )}
    >
      <h3 className={cn("text-sm font-semibold mb-6", isDark ? "text-slate-300" : "text-slate-700")}>
        CEFR Progression
      </h3>
      <div className="flex items-center gap-3">
        {levels.map((level, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <React.Fragment key={level}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-500",
                    isCurrent
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-110"
                      : isCompleted
                      ? isDark
                        ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                        : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                      : isDark
                      ? "bg-slate-800 text-slate-500 ring-1 ring-slate-700"
                      : "bg-slate-100 text-slate-400 ring-1 ring-slate-200"
                  )}
                >
                  {level}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider",
                    isCurrent
                      ? "text-blue-500"
                      : isCompleted
                      ? "text-emerald-500"
                      : isDark
                      ? "text-slate-600"
                      : "text-slate-400"
                  )}
                >
                  {isCurrent ? "Current" : isCompleted ? "Done" : "Locked"}
                </span>
              </div>
              {i < levels.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 rounded-full -mt-5",
                    i < currentIndex
                      ? "bg-emerald-500"
                      : isDark
                      ? "bg-slate-800"
                      : "bg-slate-200"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </motion.div>
  );
}