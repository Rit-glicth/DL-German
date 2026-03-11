import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

const ERROR_LABELS = {
  case_agreement: "Case", gender_mismatch: "Gender", verb_conjugation: "Conjugation",
  verb_position: "Word Order", article_error: "Articles", tense_error: "Tense",
  word_order: "Syntax", preposition_case: "Prepositions", reflexive_verb: "Reflexive",
  separable_verb: "Separable", relative_clause: "Rel. Clause", passive_voice: "Passive",
  konjunktiv: "Konjunktiv", other: "Other",
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4"];

export default function GroupReportPrint({ title, students, allSettings, allLessons, allErrors, allVocab, isDark, onClose }) {
  const printRef = useRef();

  // Aggregate data
  const totalStudents = students.length;
  const studentEmails = new Set(students.map(u => u.email));
  const settings = allSettings.filter(s => studentEmails.has(s.created_by));
  const lessons = allLessons.filter(l => studentEmails.has(l.created_by));
  const errors = allErrors.filter(e => studentEmails.has(e.created_by));
  const vocab = allVocab.filter(v => studentEmails.has(v.created_by));

  const totalMinutes = Math.round(lessons.reduce((s, l) => s + (l.time_spent_seconds || 0) / 60, 0));
  const completedLessons = lessons.filter(l => l.completed).length;
  const avgScore = lessons.length > 0 ? Math.round(lessons.reduce((s, l) => s + (l.score || 0), 0) / lessons.length) : 0;
  const masteredVocab = vocab.filter(v => v.status === "mastered").length;

  // Level distribution
  const levelDist = { A1: 0, A2: 0, B1: 0, B2: 0 };
  settings.forEach(s => { if (s.cefr_level) levelDist[s.cefr_level]++; });
  const levelData = Object.entries(levelDist).map(([k, v]) => ({ name: k, students: v }));

  // Error breakdown
  const errorCounts = {};
  errors.forEach(e => { errorCounts[e.error_type] = (errorCounts[e.error_type] || 0) + 1; });
  const errorData = Object.entries(errorCounts)
    .map(([k, v]) => ({ subject: ERROR_LABELS[k] || k, count: v }))
    .sort((a, b) => b.count - a.count).slice(0, 8);
  const maxErrorCount = Math.max(...errorData.map(e => e.count), 1);

  // Vocab status
  const vocabStatus = { new: 0, learning: 0, review: 0, mastered: 0 };
  vocab.forEach(v => { vocabStatus[v.status] = (vocabStatus[v.status] || 0) + 1; });
  const vocabPieData = Object.entries(vocabStatus).map(([k, v]) => ({ name: k, value: v }));

  // Per-student summary
  const studentSummary = students.map(u => {
    const s = allSettings.find(x => x.created_by === u.email);
    const ls = allLessons.filter(l => l.created_by === u.email);
    const score = ls.length > 0 ? Math.round(ls.reduce((a, l) => a + (l.score || 0), 0) / ls.length) : 0;
    const mins = Math.round(ls.reduce((a, l) => a + (l.time_spent_seconds || 0) / 60, 0));
    return { name: u.full_name || u.email, level: s?.cefr_level || "—", score, mins, group: s?.ib_year_group || "—" };
  });

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 24px; color: #0f172a; background: white; }
            h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
            h2 { font-size: 16px; font-weight: 600; margin: 20px 0 10px; color: #334155; }
            .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin: 16px 0; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
            .stat-val { font-size: 22px; font-weight: 700; color: #0f172a; }
            .stat-lbl { font-size: 11px; color: #94a3b8; margin-top: 2px; }
            .section { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 12px 0; }
            .error-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
            th { background: #f8fafc; text-align: left; padding: 6px 10px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
            td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4">
      <div className={cn("w-full max-w-4xl rounded-2xl ring-1 overflow-hidden", isDark ? "bg-slate-900 ring-slate-700" : "bg-white ring-slate-200")}>
        <div className={cn("flex items-center justify-between px-6 py-4 border-b", isDark ? "border-slate-800" : "border-slate-200")}>
          <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-slate-900")}>{title}</h2>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="rounded-xl bg-blue-500 hover:bg-blue-600 gap-2">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className={cn("rounded-xl", isDark ? "text-slate-400" : "")}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div ref={printRef}>
            <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 4px" }}>{title}</h1>
            <div className="meta" style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
              {totalStudents} students · Report generated: {new Date().toLocaleDateString()}
            </div>

            {/* Summary stats */}
            <h2>Overview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", margin: "16px 0" }}>
              {[
                { label: "Total Students", value: totalStudents },
                { label: "Total Study Time", value: `${totalMinutes} min` },
                { label: "Lessons Completed", value: completedLessons },
                { label: "Average Score", value: `${avgScore}%` },
                { label: "Vocab Mastered", value: masteredVocab },
                { label: "Grammar Errors Logged", value: errors.length },
                { label: "Avg Score per Student", value: `${avgScore}%` },
                { label: "Avg Study Time", value: `${totalStudents > 0 ? Math.round(totalMinutes / totalStudents) : 0} min` },
              ].map(s => (
                <div key={s.label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Level distribution */}
            <h2>Level Distribution</h2>
            <div className={cn("rounded-xl ring-1 p-4 mb-4", isDark ? "ring-slate-800" : "ring-slate-200")}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={levelData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: isDark ? "#94a3b8" : "#64748b" }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: isDark ? "#0f172a" : "#fff", border: "none", borderRadius: 8 }} />
                  <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Error pattern */}
            {errorData.length > 0 && (
              <>
                <h2>Common Grammar Error Patterns</h2>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
                  {errorData.map((e, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", fontSize: "12px", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ color: "#475569", width: "130px" }}>{e.subject}</span>
                      <div style={{ flex: 1, margin: "0 12px", background: "#f1f5f9", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                        <div style={{ height: "100%", background: "#f43f5e", borderRadius: "4px", width: `${(e.count / maxErrorCount) * 100}%` }} />
                      </div>
                      <span style={{ fontWeight: "600", color: "#f43f5e", width: "24px", textAlign: "right" }}>{e.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Per-student table */}
            <h2>Student Summary</h2>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Name</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Year Group</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Level</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Avg Score</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>Study Time</th>
                  </tr>
                </thead>
                <tbody>
                  {studentSummary.map((s, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #f1f5f9" }}>{s.name}</td>
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #f1f5f9" }}>{s.group}</td>
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #f1f5f9" }}>{s.level}</td>
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #f1f5f9", color: s.score >= 80 ? "#10b981" : s.score >= 60 ? "#f59e0b" : "#ef4444", fontWeight: "600" }}>{s.score}%</td>
                      <td style={{ padding: "7px 12px", borderBottom: "1px solid #f1f5f9" }}>{s.mins} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "24px", textAlign: "center" }}>
              Generated by DeutschLernen · {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}