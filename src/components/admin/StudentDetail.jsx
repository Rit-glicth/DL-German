import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, BookOpen, AlertTriangle, Target, TrendingUp, Award, Calendar, BarChart2, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const ERROR_LABELS = {
  case_agreement: "Case",
  gender_mismatch: "Gender",
  verb_conjugation: "Conjugation",
  verb_position: "Word Order",
  article_error: "Articles",
  tense_error: "Tense",
  word_order: "Syntax",
  preposition_case: "Prepositions",
  reflexive_verb: "Reflexive",
  separable_verb: "Separable",
  relative_clause: "Rel. Clause",
  passive_voice: "Passive",
  konjunktiv: "Konjunktiv",
  other: "Other",
};

export default function StudentDetail({ user, settings, lessons, errors, vocab, isDark, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteStudent = async () => {
    setDeleting(true);
    const email = user.email;

    // Fetch ALL records for this user fresh (not limited by what's in props)
    const [allLessons, allErrors, allVocab, allSettings, allChats] = await Promise.all([
      base44.entities.LessonProgress.filter({ created_by: email }),
      base44.entities.GrammarError.filter({ created_by: email }),
      base44.entities.UserVocabProgress.filter({ created_by: email }),
      base44.entities.UserSettings.filter({ created_by: email }),
      base44.entities.ChatHistory.filter({ created_by: email }),
    ]);

    await Promise.all([
      ...allLessons.map(l => base44.entities.LessonProgress.delete(l.id)),
      ...allErrors.map(e => base44.entities.GrammarError.delete(e.id)),
      ...allVocab.map(v => base44.entities.UserVocabProgress.delete(v.id)),
      ...allSettings.map(s => base44.entities.UserSettings.delete(s.id)),
      ...allChats.map(c => base44.entities.ChatHistory.delete(c.id)),
      base44.entities.User.delete(user.id),
    ]);

    setDeleting(false);
    setConfirmDelete(false);
    onDeleted?.();
  };
  const totalMinutes = Math.round(lessons.reduce((s, l) => s + (l.time_spent_seconds || 0) / 60, 0));
  const masteredVocab = vocab.filter(v => v.status === "mastered").length;
  const avgScore = lessons.length > 0
    ? Math.round(lessons.reduce((s, l) => s + (l.score || 0), 0) / lessons.length)
    : 0;
  const completedLessons = lessons.filter(l => l.completed).length;

  // Error breakdown
  const errorCounts = {};
  errors.forEach(e => { errorCounts[e.error_type] = (errorCounts[e.error_type] || 0) + 1; });
  const errorData = Object.entries(errorCounts)
    .map(([k, v]) => ({ subject: ERROR_LABELS[k] || k, count: v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Lesson type breakdown
  const lessonTypes = {};
  lessons.forEach(l => { lessonTypes[l.lesson_type] = (lessonTypes[l.lesson_type] || 0) + (l.time_spent_seconds || 0) / 60; });
  const lessonData = Object.entries(lessonTypes).map(([k, v]) => ({ name: k, minutes: Math.round(v) }));

  // Vocab status breakdown
  const vocabStatus = { new: 0, learning: 0, review: 0, mastered: 0 };
  vocab.forEach(v => { vocabStatus[v.status] = (vocabStatus[v.status] || 0) + 1; });

  const statCards = [
    { label: "CEFR Level", value: settings?.cefr_level || "—", icon: Target, color: "blue" },
    { label: "Study Time", value: `${totalMinutes}m`, icon: Clock, color: "violet" },
    { label: "Lessons Done", value: completedLessons, icon: BookOpen, color: "emerald" },
    { label: "Avg Score", value: `${avgScore}%`, icon: Award, color: "amber" },
    { label: "Vocab Mastered", value: masteredVocab, icon: TrendingUp, color: "sky" },
    { label: "Errors Logged", value: errors.length, icon: AlertTriangle, color: "rose" },
  ];

  const cardColor = {
    blue: isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600",
    violet: isDark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600",
    emerald: isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    amber: isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600",
    sky: isDark ? "bg-sky-500/10 text-sky-400" : "bg-sky-50 text-sky-600",
    rose: isDark ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-600",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={cn("rounded-2xl p-5 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className={cn("text-xl font-bold", isDark ? "text-white" : "text-slate-900")}>{user.full_name || "Student"}</h2>
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {settings?.onboarding_complete ? (
              <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-lg font-semibold">Active</span>
            ) : (
              <span className="text-xs bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-lg font-semibold">Not Onboarded</span>
            )}
            {!confirmDelete ? (
              <Button size="sm" variant="outline" onClick={() => setConfirmDelete(true)}
                className={cn("rounded-xl gap-1.5 border-rose-300 text-rose-500 hover:bg-rose-50", isDark ? "border-rose-800 hover:bg-rose-500/10" : "")}>
                <Trash2 className="w-3.5 h-3.5" /> Delete Student
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>Delete all data?</span>
                <Button size="sm" onClick={handleDeleteStudent} disabled={deleting}
                  className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white h-7 px-3 text-xs gap-1">
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}
                  className={cn("rounded-xl h-7 px-3 text-xs", isDark ? "border-slate-700 text-slate-300" : "")}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
        {settings?.weakest_areas?.length > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
            <p className={cn("text-xs font-medium mb-2", isDark ? "text-slate-400" : "text-slate-500")}>Weakest Areas:</p>
            <div className="flex flex-wrap gap-1.5">
              {settings.weakest_areas.map(a => (
                <span key={a} className="text-xs bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-md">{a}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn("rounded-2xl p-3 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}
          >
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-2", cardColor[s.color])}>
              <s.icon className="w-3.5 h-3.5" />
            </div>
            <p className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>{s.value}</p>
            <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Error Pattern */}
        {errorData.length > 0 && (
          <div className={cn("rounded-2xl p-5 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
            <h3 className={cn("font-semibold text-sm mb-4 flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Grammar Weak Points
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={errorData} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#94a3b8" }} />
                <YAxis dataKey="subject" type="category" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} width={72} />
                <Tooltip contentStyle={{ background: isDark ? "#0f172a" : "#fff", border: "none", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Study time by type */}
        {lessonData.length > 0 && (
          <div className={cn("rounded-2xl p-5 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
            <h3 className={cn("font-semibold text-sm mb-4 flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
              <BarChart2 className="w-4 h-4 text-blue-500" /> Time by Lesson Type
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={lessonData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#94a3b8" }} />
                <Tooltip contentStyle={{ background: isDark ? "#0f172a" : "#fff", border: "none", borderRadius: 8 }} />
                <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Vocab Progress */}
      <div className={cn("rounded-2xl p-5 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
        <h3 className={cn("font-semibold text-sm mb-4 flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
          <BookOpen className="w-4 h-4 text-emerald-500" /> Vocabulary Progress
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "New", key: "new", color: "bg-slate-400" },
            { label: "Learning", key: "learning", color: "bg-blue-400" },
            { label: "Review", key: "review", color: "bg-amber-400" },
            { label: "Mastered", key: "mastered", color: "bg-emerald-400" },
          ].map(s => (
            <div key={s.key} className={cn("rounded-xl p-3 text-center ring-1", isDark ? "ring-slate-700" : "ring-slate-200")}>
              <div className={cn("w-3 h-3 rounded-full mx-auto mb-2", s.color)} />
              <p className={cn("text-lg font-bold", isDark ? "text-white" : "text-slate-900")}>{vocabStatus[s.key]}</p>
              <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent lessons */}
      {lessons.length > 0 && (
        <div className={cn("rounded-2xl p-5 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
          <h3 className={cn("font-semibold text-sm mb-4 flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
            <Calendar className="w-4 h-4 text-violet-500" /> Recent Lessons
          </h3>
          <div className="space-y-2">
            {lessons.slice(0, 6).map((l, i) => (
              <div key={i} className={cn("flex items-center justify-between text-xs py-2 px-3 rounded-lg", isDark ? "bg-slate-800" : "bg-slate-50")}>
                <span className={cn("font-medium", isDark ? "text-slate-300" : "text-slate-700")}>
                  {l.lesson_type} — {l.topic || l.cefr_level}
                </span>
                <div className="flex items-center gap-3">
                  <span className={cn(isDark ? "text-slate-500" : "text-slate-400")}>
                    {Math.round((l.time_spent_seconds || 0) / 60)}m
                  </span>
                  <span className={cn("font-semibold", l.score >= 80 ? "text-emerald-500" : l.score >= 60 ? "text-amber-500" : "text-rose-500")}>
                    {l.score ?? "—"}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}