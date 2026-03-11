import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import TeacherAddContent from "./TeacherAddContent";

export default function TeacherAddContentDrawer({ isDark, defaultTab }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="rounded-xl bg-violet-500 hover:bg-violet-600 gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Content
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />

          {/* Drawer */}
          <div className={cn(
            "w-full max-w-2xl h-full overflow-y-auto shadow-2xl p-8",
            isDark ? "bg-slate-950" : "bg-white"
          )}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-slate-900")}>
                Add Content
              </h2>
              <button
                onClick={() => setOpen(false)}
                className={cn("p-2 rounded-xl transition-colors", isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <TeacherAddContent isDark={isDark} defaultTab={defaultTab} />
          </div>
        </div>
      )}
    </>
  );
}