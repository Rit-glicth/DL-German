import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ProficiencyScore({ settings, isDark }) {
  const vocab = settings?.vocab_retention_score || 0;
  const grammar = settings?.grammar_accuracy_score || 0;
  const pronunciation = settings?.pronunciation_score || 0;

  const score = Math.round(0.4 * vocab + 0.35 * grammar + 0.25 * pronunciation);

  const metrics = [
    { label: "Vocabulary", value: vocab, color: "bg-blue-500" },
    { label: "Grammar", value: grammar, color: "bg-violet-500" },
    { label: "Pronunciation", value: pronunciation, color: "bg-amber-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={cn(
        "rounded-2xl p-6 ring-1 transition-colors duration-300",
        isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      )}
    >
      <h3 className={cn("text-sm font-semibold mb-6", isDark ? "text-slate-300" : "text-slate-700")}>
        Proficiency Score
      </h3>
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="42"
              stroke={isDark ? "#1e293b" : "#f1f5f9"}
              strokeWidth="8" fill="none"
            />
            <motion.circle
              cx="50" cy="50" r="42"
              stroke="#3b82f6"
              strokeWidth="8" fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - score / 100) }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>
              {score}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="flex justify-between mb-1">
                <span className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
                  {m.label}
                </span>
                <span className={cn("text-xs font-semibold", isDark ? "text-slate-300" : "text-slate-700")}>
                  {m.value}%
                </span>
              </div>
              <div className={cn("h-1.5 rounded-full", isDark ? "bg-slate-800" : "bg-slate-100")}>
                <motion.div
                  className={cn("h-full rounded-full", m.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}