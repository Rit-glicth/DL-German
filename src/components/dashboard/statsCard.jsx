import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, subtitle, icon: Icon, color, isDark }) {
  const colorMap = {
    blue: { bg: "bg-blue-500/10", icon: "text-blue-500", ring: "ring-blue-500/20" },
    green: { bg: "bg-emerald-500/10", icon: "text-emerald-500", ring: "ring-emerald-500/20" },
    purple: { bg: "bg-violet-500/10", icon: "text-violet-500", ring: "ring-violet-500/20" },
    orange: { bg: "bg-amber-500/10", icon: "text-amber-500", ring: "ring-amber-500/20" },
    red: { bg: "bg-rose-500/10", icon: "text-rose-500", ring: "ring-rose-500/20" },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-2xl p-6 ring-1 transition-colors duration-300",
        isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
            {title}
          </p>
          <p className={cn("text-3xl font-bold mt-2 tracking-tight", isDark ? "text-white" : "text-slate-900")}>
            {value}
          </p>
          {subtitle && (
            <p className={cn("text-xs mt-1.5", isDark ? "text-slate-500" : "text-slate-400")}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", c.bg)}>
          <Icon className={cn("w-6 h-6", c.icon)} />
        </div>
      </div>
    </motion.div>
  );
}