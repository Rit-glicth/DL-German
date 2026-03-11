import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Sidebar from "./components/layout/Sidebar";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const BYPASS_PAGES = ["PlacementTest"];

export default function Layout({ children, currentPageName }) {
  const [theme, setTheme] = useState("light");
  const [isTeacher, setIsTeacher] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const teacher = user?.role === "admin";
        setIsTeacher(teacher);

        if (!teacher && !BYPASS_PAGES.includes(currentPageName)) {
          const settings = await base44.entities.UserSettings.list();
          if (!settings.length || !settings[0].onboarding_complete) {
            navigate(createPageUrl("PlacementTest"));
            return;
          }
          if (settings[0].theme) {
            setTheme(settings[0].theme === "system" ? "light" : settings[0].theme);
          }
        } else if (teacher) {
          const settings = await base44.entities.UserSettings.list();
          if (settings.length > 0 && settings[0].theme) {
            setTheme(settings[0].theme === "system" ? "light" : settings[0].theme);
          }
        }
      } catch (e) {}
    };
    init();
  }, [currentPageName]);

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    try {
      const settings = await base44.entities.UserSettings.list();
      if (settings.length > 0) {
        await base44.entities.UserSettings.update(settings[0].id, { theme: newTheme });
      }
    } catch (e) { /* silent */ }
  };

  const isDark = theme === "dark";

  return (
    <div className={cn("min-h-screen transition-colors duration-300", isDark ? "bg-slate-950" : "bg-slate-50")}>
      <style>{`
        :root {
          --bg-primary: ${isDark ? "#0f172a" : "#f8fafc"};
          --bg-card: ${isDark ? "#1e293b" : "#ffffff"};
          --text-primary: ${isDark ? "#f1f5f9" : "#0f172a"};
          --text-secondary: ${isDark ? "#94a3b8" : "#64748b"};
          --accent: #3b82f6;
          --border: ${isDark ? "#1e293b" : "#e2e8f0"};
        }
      `}</style>
      <Sidebar
        currentPage={currentPageName}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className={cn("ml-72 min-h-screen p-8 transition-colors duration-300", isDark ? "bg-slate-950" : "bg-slate-50")}>
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { theme, isDark, isTeacher })
            : child
        )}
      </main>
    </div>
  );
}