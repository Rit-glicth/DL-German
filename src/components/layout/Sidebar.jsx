import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  BookOpen,
  Languages,
  MessageSquare,
  Mic,
  BookMarked,
  Settings,
  GraduationCap,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  ShieldCheck,
  Youtube
} from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Vocabulary", icon: BookOpen, page: "Vocabulary" },
  { name: "Grammar Exercises", icon: Languages, page: "Grammar" },
  { name: "Grammar Notes", icon: BookMarked, page: "GrammarNotes" },
  { name: "Exam Style Practice Questions", icon: GraduationCap, page: "IBPractice" },
  { name: "Conversation", icon: MessageSquare, page: "Conversation" },
  { name: "Pronunciation", icon: Mic, page: "Pronunciation" },
  { name: "Reading", icon: BookMarked, page: "Reading" },
  { name: "AI Helper", icon: Sparkles, page: "AIHelper" },
  { name: "German Media", icon: Youtube, page: "GermanMedia" },
];

export default function Sidebar({ currentPage, theme, onToggleTheme }) {
  const isDark = theme === "dark";
  const [isAdmin, setIsAdmin] = useState(null);
  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    base44.auth.me().then(u => {
      setIsAdmin(u?.role === "admin");
      setUserRole(u?.role);
    }).catch(() => {});
  }, []);

  return (
    <aside
      className={cn(
        "w-72 h-screen flex flex-col fixed left-0 top-0 z-40 border-r transition-colors duration-300",
        isDark
          ? "bg-slate-950 border-slate-800"
          : "bg-white border-slate-200"
      )}
    >
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1
            className={cn(
              "text-lg font-bold tracking-tight",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            DeutschLernen
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? isDark
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-blue-50 text-blue-600"
                  : isDark
                  ? "text-slate-200 hover:text-white hover:bg-slate-800/50"
                                   : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive
                    ? isDark
                      ? "text-blue-400"
                      : "text-blue-600"
                    : ""
                )}
              />
              {item.name}
              {isActive && (
                <div
                  className={cn(
                    "ml-auto w-1.5 h-1.5 rounded-full",
                    isDark ? "bg-blue-400" : "bg-blue-600"
                  )}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className={cn("px-3 py-4 border-t space-y-1", isDark ? "border-slate-800" : "border-slate-200")}>
        {isAdmin ? (
          <Link
            to={createPageUrl("AdminDashboard")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-all duration-200",
              currentPage === "AdminDashboard"
                ? isDark ? "bg-violet-500/15 text-violet-400" : "bg-violet-50 text-violet-600"
                : isDark ? "text-violet-300 hover:text-violet-200 hover:bg-violet-500/10" : "text-violet-700 hover:bg-violet-50"
            )}
          >
            <ShieldCheck className="w-5 h-5" />
            Teacher Panel
          </Link>
        ) : null}
        <button
          onClick={onToggleTheme}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-all duration-200",
            isDark
              ? "text-slate-200 hover:text-white hover:bg-slate-800/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
        <Link
          to={createPageUrl("Settings")}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-all duration-200",
            currentPage === "Settings"
              ? isDark
                ? "bg-blue-500/15 text-blue-400"
                : "bg-blue-50 text-blue-600"
              : isDark
              ? "text-slate-200 hover:text-white hover:bg-slate-800/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button
          onClick={() => base44.auth.logout()}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-all duration-200",
            isDark
              ? "text-red-400 hover:bg-red-500/10"
              : "text-red-500 hover:bg-red-50"
          )}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}