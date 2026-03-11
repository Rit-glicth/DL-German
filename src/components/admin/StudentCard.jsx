import React from "react";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle } from "lucide-react";

export default function StudentCard({ user, settings, lessons, errors, isSelected, onClick, isDark }) {
  const totalMin = Math.round(lessons.reduce((s, l) => s + (l.time_spent_seconds || 0) / 60, 0));
  const level = settings?.cefr_level || "—";
  const errorCount = errors.length;

  const levelColor = {
    A1: "bg-sky-500/10 text-sky-500",
    A2: "bg-blue-500/10 text-blue-500",
    B1: "bg-violet-500/10 text-violet-500",
    B2: "bg-rose-500/10 text-rose-500",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 rounded-xl transition-all",
        isSelected
          ? isDark ? "bg-blue-500/15 ring-1 ring-blue-500/30" : "bg-blue-50 ring-1 ring-blue-200"
          : isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <p className={cn("text-sm font-medium truncate", isDark ? "text-white" : "text-slate-900")}>
          {user.full_name || user.email}
        </p>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0 ml-2", levelColor[level] || "bg-slate-500/10 text-slate-500")}>
          {level}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <p className={cn("text-xs truncate", isDark ? "text-slate-500" : "text-slate-400")}>{user.email}</p>
        {settings?.ib_year_group && (
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0", isDark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600")}>
            {settings.ib_year_group}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className={cn("flex items-center gap-1 text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
          <Clock className="w-3 h-3" /> {totalMin}m
        </span>
        {errorCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-rose-500">
            <AlertTriangle className="w-3 h-3" /> {errorCount} errors
          </span>
        )}
        {!settings?.onboarding_complete && (
          <span className="text-xs text-amber-500">Not onboarded</span>
        )}
      </div>
    </button>
  );
}