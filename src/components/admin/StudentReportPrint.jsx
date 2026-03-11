import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

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

export default function StudentReportPrint({ user, settings, lessons, errors, vocab, isDark, onClose }) {
  const printRef = useRef();

  const totalMinutes = Math.round(lessons.reduce((s, l) => s + (l.time_spent_seconds || 0) / 60, 0));
  const masteredVocab = vocab.filter(v => v.status === "mastered").length;
  const avgScore = lessons.length > 0 ? Math.round(lessons.reduce((s, l) => s + (l.score || 0), 0) / lessons.length) : 0;
  const completedLessons = lessons.filter(l => l.completed).length;

  // Error breakdown
  const errorCounts = {};
  errors.forEach(e => { errorCounts[e.error_type] = (errorCounts[e.error_type] || 0) + 1; });
  const errorData = Object.entries(errorCounts)
    .map(([k, v]) => ({ subject: ERROR_LABELS[k] || k, count: v }))
    .sort((a, b) => b.count - a.count).slice(0, 8);

  // Lesson type breakdown
  const lessonTypes = {};
  lessons.forEach(l => { lessonTypes[l.lesson_type] = (lessonTypes[l.lesson_type] || 0) + (l.time_spent_seconds || 0) / 60; });
  const lessonData = Object.entries(lessonTypes).map(([k, v]) => ({ name: k, minutes: Math.round(v) }));

  // Vocab status
  const vocabStatus = { new: 0, learning: 0, review: 0, mastered: 0 };
  vocab.forEach(v => { vocabStatus[v.status] = (vocabStatus[v.status] || 0) + 1; });

  // Radar data for skills
  const radarData = [
    { skill: "Grammar", value: settings?.grammar_accuracy_score || 0 },
    { skill: "Vocab", value: settings?.vocab_retention_score || 0 },
    { skill: "Pronunciation", value: settings?.pronunciation_score || 0 },
    { skill: "Avg Score", value: avgScore },
  ];

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Student Report - ${user.full_name || user.email}</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 24px; color: #0f172a; background: white; }
            h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
            h2 { font-size: 16px; font-weight: 600; margin: 20px 0 10px; color: #334155; }
            h3 { font-size: 13px; font-weight: 600; margin: 0 0 8px; color: #475569; }
            .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
            .stat-val { font-size: 22px; font-weight: 700; color: #0f172a; }
            .stat-lbl { font-size: 11px; color: #94a3b8; margin-top: 2px; }
            .badge { display: inline-block; background: #dbeafe; color: #2563eb; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
            .section { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 12px 0; }
            .error-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
            .bar { height: 8px; background: #f43f5e; border-radius: 4px; }
            .lesson-row { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 8px; background: #f8fafc; border-radius: 6px; margin-bottom: 4px; }
            .vocab-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
            .vocab-item { background: #f8fafc; border-radius: 8px; padding: 8px; text-align: center; border: 1px solid #e2e8f0; }
            .vocab-num { font-size: 18px; font-weight: 700; }
            .vocab-lbl { font-size: 11px; color: #94a3b8; }
            .weaknesses { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
            .weakness-tag { background: #fef2f2; color: #ef4444; font-size: 11px; padding: 2px 8px; border-radius: 6px; }
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

  const maxErrorCount = Math.max(...errorData.map(e => e.count), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4">
      <div className={cn("w-full max-w-3xl rounded-2xl ring-1 overflow-hidden", isDark ? "bg-slate-900 ring-slate-700" : "bg-white ring-slate-200")}>
        {/* Toolbar */}
        <div className={cn("flex items-center justify-between px-6 py-4 border-b", isDark ? "border-slate-800" : "border-slate-200")}>
          <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-slate-900")}>
            Student Report: {user.full_name || user.email}
          </h2>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="rounded-xl bg-blue-500 hover:bg-blue-600 gap-2">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className={cn("rounded-xl", isDark ? "text-slate-400" : "")}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable content */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div ref={printRef}>
            {/* Header */}
            <h1 style={{fontSize:'22px',fontWeight:'700',margin:'0 0 4px'}}>{user.full_name || "Student"}</h1>
            <div className="meta" style={{color:'#64748b',fontSize:'13px',marginBottom:'20px'}}>
              {user.email} &nbsp;·&nbsp; CEFR Level: <strong>{settings?.cefr_level || "—"}</strong> &nbsp;·&nbsp; Report generated: {new Date().toLocaleDateString()}
            </div>

            {/* Stats */}
            <h2>Performance Summary</h2>
            <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',margin:'16px 0'}}>
              {[
                { label: "Study Time", value: `${totalMinutes} min` },
                { label: "Lessons Completed", value: completedLessons },
                { label: "Average Score", value: `${avgScore}%` },
                { label: "Vocab Mastered", value: masteredVocab },
                { label: "Grammar Errors Logged", value: errors.length },
                { label: "Current Level", value: settings?.cefr_level || "—" },
              ].map(s => (
                <div key={s.label} style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'12px 16px'}}>
                  <div style={{fontSize:'22px',fontWeight:'700',color:'#0f172a'}}>{s.value}</div>
                  <div style={{fontSize:'11px',color:'#94a3b8',marginTop:'2px'}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Grammar Skill Scores */}
            {(settings?.grammar_accuracy_score || settings?.vocab_retention_score) && (
              <>
                <h2>Skill Scores</h2>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
                  {[
                    { label: "Grammar Accuracy", val: settings?.grammar_accuracy_score },
                    { label: "Vocab Retention", val: settings?.vocab_retention_score },
                    { label: "Pronunciation", val: settings?.pronunciation_score },
                  ].filter(s => s.val).map(s => (
                    <div key={s.label} style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'12px 16px'}}>
                      <div style={{fontSize:'22px',fontWeight:'700',color:'#3b82f6'}}>{s.val}%</div>
                      <div style={{fontSize:'11px',color:'#94a3b8',marginTop:'2px'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Radar chart */}
            {radarData.some(r => r.value > 0) && (
              <div className={cn("rounded-xl ring-1 p-4 mb-4", isDark ? "ring-slate-800" : "ring-slate-200")}>
                <h3 className={cn("text-sm font-semibold mb-3", isDark ? "text-white" : "text-slate-900")}>Skills Radar</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Error Pattern Analysis */}
            {errorData.length > 0 && (
              <>
                <h2 style={{fontSize:'16px',fontWeight:'600',margin:'20px 0 10px',color:'#334155'}}>Grammar Error Pattern Analysis</h2>
                <div style={{border:'1px solid #e2e8f0',borderRadius:'10px',padding:'16px',marginBottom:'16px'}}>
                  {errorData.map((e, i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',fontSize:'12px',borderBottom:'1px solid #f1f5f9'}}>
                      <span style={{color:'#475569',width:'130px'}}>{e.subject}</span>
                      <div style={{flex:1,margin:'0 12px',background:'#f1f5f9',borderRadius:'4px',height:'8px',overflow:'hidden'}}>
                        <div style={{height:'100%',background:'#f43f5e',borderRadius:'4px',width:`${(e.count/maxErrorCount)*100}%`}} />
                      </div>
                      <span style={{fontWeight:'600',color:'#f43f5e',width:'24px',textAlign:'right'}}>{e.count}</span>
                    </div>
                  ))}
                </div>

                <div className={cn("rounded-xl ring-1 p-4 mb-4", isDark ? "ring-slate-800" : "ring-slate-200")}>
                  <h3 className={cn("text-sm font-semibold mb-3", isDark ? "text-white" : "text-slate-900")}>Error Distribution Chart</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={errorData} layout="vertical" margin={{ left: 0, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#94a3b8" }} />
                      <YAxis dataKey="subject" type="category" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} width={80} />
                      <Tooltip contentStyle={{ background: isDark ? "#0f172a" : "#fff", border: "none", borderRadius: 8 }} />
                      <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Study time by type */}
            {lessonData.length > 0 && (
              <>
                <h2 style={{fontSize:'16px',fontWeight:'600',margin:'20px 0 10px',color:'#334155'}}>Study Activity</h2>
                <div className={cn("rounded-xl ring-1 p-4 mb-4", isDark ? "ring-slate-800" : "ring-slate-200")}>
                  <h3 className={cn("text-sm font-semibold mb-3", isDark ? "text-white" : "text-slate-900")}>Time by Lesson Type (minutes)</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={lessonData} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? "#94a3b8" : "#64748b" }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: isDark ? "#0f172a" : "#fff", border: "none", borderRadius: 8 }} />
                      <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Vocabulary */}
            <h2 style={{fontSize:'16px',fontWeight:'600',margin:'20px 0 10px',color:'#334155'}}>Vocabulary Progress</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'16px'}}>
              {[
                { label: "New", key: "new", color: "#94a3b8" },
                { label: "Learning", key: "learning", color: "#60a5fa" },
                { label: "Review", key: "review", color: "#fbbf24" },
                { label: "Mastered", key: "mastered", color: "#34d399" },
              ].map(s => (
                <div key={s.key} style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'8px',textAlign:'center'}}>
                  <div style={{width:'10px',height:'10px',borderRadius:'50%',background:s.color,margin:'0 auto 6px'}} />
                  <div style={{fontSize:'20px',fontWeight:'700',color:'#0f172a'}}>{vocabStatus[s.key]}</div>
                  <div style={{fontSize:'11px',color:'#94a3b8'}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Weak areas */}
            {settings?.weakest_areas?.length > 0 && (
              <>
                <h2 style={{fontSize:'16px',fontWeight:'600',margin:'20px 0 8px',color:'#334155'}}>Identified Weak Areas</h2>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'16px'}}>
                  {settings.weakest_areas.map(a => (
                    <span key={a} style={{background:'#fef2f2',color:'#ef4444',fontSize:'12px',padding:'3px 10px',borderRadius:'6px'}}>{a}</span>
                  ))}
                </div>
              </>
            )}

            {/* Recent lessons */}
            {lessons.length > 0 && (
              <>
                <h2 style={{fontSize:'16px',fontWeight:'600',margin:'20px 0 10px',color:'#334155'}}>Recent Lessons</h2>
                <div style={{border:'1px solid #e2e8f0',borderRadius:'10px',overflow:'hidden'}}>
                  {lessons.slice(0, 10).map((l, i) => (
                    <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:'12px',padding:'7px 12px',background: i%2===0?'#f8fafc':'#fff',borderBottom:'1px solid #f1f5f9'}}>
                      <span style={{color:'#475569'}}>{l.lesson_type} — {l.topic || l.cefr_level}</span>
                      <span style={{color: l.score>=80?'#10b981':l.score>=60?'#f59e0b':'#ef4444', fontWeight:'600'}}>{l.score ?? "—"}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <p style={{fontSize:'11px',color:'#94a3b8',marginTop:'24px',textAlign:'center'}}>
              Generated by DeutschLernen · {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}