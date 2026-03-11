import React from "react";
import { cn } from "@/lib/utils";
import { Users, BookOpen, AlertTriangle, Clock, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminStats({ users, allSettings, allLessons, allErrors, allVocab, isDark }) {
  const activeStudents = allSettings.filter(s => s.onboarding_complete).length;
  const totalMinutes = allLessons.reduce((s, l) => s + (l.time_spent_seconds || 0) / 60, 0);
  const masteredVocab = allVocab.filter(v => v.status === "mastered").length;
  const totalErrors = allErrors.length;

  const levelDist = { A1: 0, A2: 0, B1: 0, B2: 0 };
  allSettings.forEach(s => { if (s.cefr_level) levelDist[s.cefr_level]++; });
  const topLevel = Object.entries(levelDist).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const stats = [
    { label: "Total Students", value: users.length, icon: Users, color: "blue" },
    { label: "Onboarded", value: activeStudents, icon: Award, color: "emerald" },
    { label: "Study Minutes (Total)", value: Math.round(totalMinutes), icon: Clock, color: "violet" },
    { label: "Vocab Mastered", value: masteredVocab, icon: BookOpen, color: "amber" },
    { label: "Grammar Errors Logged", value: totalErrors, icon: AlertTriangle, color: "rose" },
    { label: "Most Common Level", value: topLevel, icon: TrendingUp, color: "sky" },
  ];

  const colors = {
    blue: isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600",
    emerald: isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    violet: isDark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600",
    amber: isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600",
    rose: isDark ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-600",
    sky: isDark ? "bg-sky-500/10 text-sky-400" : "bg-sky-50 text-sky-600",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={cn("rounded-2xl p-4 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}
        >
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", colors[s.color])}>
            <s.icon className="w-4 h-4" />
          </div>
          <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-slate-900")}>{s.value}</p>
          <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}