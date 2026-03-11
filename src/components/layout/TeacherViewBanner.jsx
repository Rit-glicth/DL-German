import React from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export default function TeacherViewBanner({ isDark }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl ring-1 text-sm font-medium mb-6",
      isDark
        ? "bg-violet-500/10 ring-violet-500/30 text-violet-300"
        : "bg-violet-50 ring-violet-200 text-violet-700"
    )}>
      <ShieldCheck className="w-4 h-4 flex-shrink-0" />
      <span>You are viewing this page as a <strong>Teacher</strong>. Student interactions are disabled — use the Teacher Panel to manage content.</span>
    </div>
  );
}