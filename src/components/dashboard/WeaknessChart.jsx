import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

export default function WeaknessChart({ errors, isDark }) {
  const errorTypes = [
    { key: "case_agreement", label: "Cases" },
    { key: "gender_mismatch", label: "Gender" },
    { key: "verb_conjugation", label: "Verbs" },
    { key: "verb_position", label: "V-Position" },
    { key: "word_order", label: "Word Order" },
    { key: "tense_error", label: "Tenses" },
  ];

  const data = errorTypes.map(({ key, label }) => {
    const count = errors.filter((e) => e.error_type === key).length;
    return { subject: label, value: Math.min(count * 10, 100), fullMark: 100 };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className={cn(
        "rounded-2xl p-6 ring-1 transition-colors duration-300",
        isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      )}
    >
      <h3 className={cn("text-sm font-semibold mb-4", isDark ? "text-slate-300" : "text-slate-700")}>
        Error Pattern Analysis
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid
              stroke={isDark ? "#334155" : "#e2e8f0"}
              strokeDasharray="3 3"
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
            />
            <Radar
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {errors.length === 0 && (
        <p className={cn("text-sm text-center -mt-8", isDark ? "text-slate-600" : "text-slate-400")}>
          No errors tracked yet. Start practicing!
        </p>
      )}
    </motion.div>
  );
}