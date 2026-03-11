import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format, subDays } from "date-fns";

export default function StudyStreakChart({ lessons, isDark }) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayLessons = lessons.filter(
      (l) => l.created_date && format(new Date(l.created_date), "yyyy-MM-dd") === dateStr
    );
    const minutes = dayLessons.reduce((sum, l) => sum + (l.time_spent_seconds || 0) / 60, 0);
    return {
      day: format(date, "EEE"),
      minutes: Math.round(minutes),
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className={cn(
        "rounded-2xl p-6 ring-1 transition-colors duration-300",
        isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      )}
    >
      <h3 className={cn("text-sm font-semibold mb-4", isDark ? "text-slate-300" : "text-slate-700")}>
        Study Activity (Last 7 Days)
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7Days}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: isDark ? "#64748b" : "#94a3b8" }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#1e293b" : "#fff",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                borderRadius: "12px",
                fontSize: 12,
                color: isDark ? "#f1f5f9" : "#1e293b"
              }}
              formatter={(value) => [`${value} min`, "Study Time"]}
            />
            <Bar
              dataKey="minutes"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}