import React, { useState } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { ExternalLink, Youtube, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Curated, verified worksheet links from nthuleen.com keyed by grammar topic keywords
const WORKSHEET_MAP = {
  akkusativ: [
    { label: "Nominativ & Akkusativ – Worksheet", url: "https://www.nthuleen.com/teach/grammar/nominakkus.html", answer_url: "https://www.nthuleen.com/teach/grammar/nominakkusantw.html" },
    { label: "Akkusativ Pronouns – Worksheet", url: "https://www.nthuleen.com/teach/grammar/akkuspronom.html", answer_url: "https://www.nthuleen.com/teach/grammar/akkuspronomantw.html" },
    { label: "Akkusativ Prepositions – Worksheet", url: "https://www.nthuleen.com/teach/grammar/akkuspraeps.html", answer_url: "https://www.nthuleen.com/teach/grammar/akkuspraepsantw.html" },
  ],
  dativ: [
    { label: "Der Dativ – Worksheet", url: "https://www.nthuleen.com/teach/grammar/dativ.html", answer_url: "https://www.nthuleen.com/teach/grammar/dativantw.html" },
    { label: "Dativ Verbs – Worksheet", url: "https://www.nthuleen.com/teach/grammar/dativverben.html", answer_url: "https://www.nthuleen.com/teach/grammar/dativverbenantw.html" },
    { label: "Dativ Exercises", url: "https://www.nthuleen.com/teach/grammar/dativuebungen.html", answer_url: null },
  ],
  genitiv: [
    { label: "Der Genitiv – Worksheet", url: "https://www.nthuleen.com/teach/grammar/genitiv.html", answer_url: "https://www.nthuleen.com/teach/grammar/genitivantw.html" },
    { label: "Genitiv Prepositions – Worksheet", url: "https://www.nthuleen.com/teach/grammar/genitivpraeps.html", answer_url: "https://www.nthuleen.com/teach/grammar/genitivpraepsantw.html" },
  ],
  adjektiv: [
    { label: "Adjective Endings 1 – Worksheet", url: "https://www.nthuleen.com/teach/grammar/adjektivendungen1.html", answer_url: "https://www.nthuleen.com/teach/grammar/adjektivendungen1antw.html" },
    { label: "Adjective Endings 2 – Worksheet", url: "https://www.nthuleen.com/teach/grammar/adjektivendungen2.html", answer_url: "https://www.nthuleen.com/teach/grammar/adjektivendungen2antw.html" },
    { label: "Adjective Endings 3 – Worksheet", url: "https://www.nthuleen.com/teach/grammar/adjektivendungen3.html", answer_url: "https://www.nthuleen.com/teach/grammar/adjektivendungen3antw.html" },
  ],
  perfekt: [
    { label: "Perfekt – Worksheet", url: "https://www.nthuleen.com/teach/grammar/perfekt.html", answer_url: "https://www.nthuleen.com/teach/grammar/perfektantw.html" },
  ],
  präteritum: [
    { label: "Präteritum – Worksheet", url: "https://www.nthuleen.com/teach/grammar/praeteritum.html", answer_url: "https://www.nthuleen.com/teach/grammar/praeteritumantw.html" },
  ],
  konjunktiv: [
    { label: "Konjunktiv II – Worksheet", url: "https://www.nthuleen.com/teach/grammar/konjunktiv2.html", answer_url: "https://www.nthuleen.com/teach/grammar/konjunktiv2antw.html" },
  ],
  passiv: [
    { label: "Passiv – Worksheet", url: "https://www.nthuleen.com/teach/grammar/passiv.html", answer_url: "https://www.nthuleen.com/teach/grammar/passivantw.html" },
  ],
  relativsatz: [
    { label: "Relativsätze – Worksheet", url: "https://www.nthuleen.com/teach/grammar/relativsaetze.html", answer_url: "https://www.nthuleen.com/teach/grammar/relativsaetzeantw.html" },
  ],
  wortstellung: [
    { label: "Word Order – Worksheet", url: "https://www.nthuleen.com/teach/grammar/wordorder.html", answer_url: "https://www.nthuleen.com/teach/grammar/wordorderantw.html" },
  ],
  modalverb: [
    { label: "Modal Verbs – Worksheet", url: "https://www.nthuleen.com/teach/grammar/modalverben.html", answer_url: "https://www.nthuleen.com/teach/grammar/modalverbenantw.html" },
  ],
};

function getWorksheetsForNote(note) {
  if (!note) return [];
  const text = (note.title + " " + (note.content_markdown || "") + " " + (note.summary || "")).toLowerCase();
  const results = [];
  for (const [key, sheets] of Object.entries(WORKSHEET_MAP)) {
    if (text.includes(key)) {
      results.push(...sheets);
    }
  }
  // Fallback: always show case review
  if (results.length === 0) {
    results.push({ label: "Grammar Worksheets – nthuleen.com", url: "https://www.nthuleen.com/teach/grammar.html", answer_url: null });
  }
  return results.slice(0, 4);
}

// Strip lines that are pure pipe-separator rows like |---|---|---|
function cleanMarkdown(md) {
  if (!md) return md;
  return md
    .split("\n")
    .filter(line => {
      const stripped = line.trim();
      // Remove lines that are only pipes, dashes, spaces, colons (table separator rows that slipped out)
      if (/^\|[\s|:\-]+\|$/.test(stripped)) return false;
      // Remove lines like: |------------|-------------|
      if (/^\|[-|: ]+$/.test(stripped)) return false;
      return true;
    })
    .join("\n");
}

export default function NoteViewer({ note, isDark }) {
  const [showVideos, setShowVideos] = useState(false);

  if (!note) return null;

  const ibColor = {
    core: "bg-rose-500/10 text-rose-500 ring-rose-500/20",
    important: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
    advanced: "bg-violet-500/10 text-violet-500 ring-violet-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-lg ring-1",
            isDark ? "bg-blue-500/10 text-blue-400 ring-blue-500/20" : "bg-blue-50 text-blue-600 ring-blue-200"
          )}>
            {note.cefr_level}
          </span>
          {note.ib_relevance && (
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-lg ring-1", ibColor[note.ib_relevance])}>
              IB {note.ib_relevance}
            </span>
          )}
          {note.ib_papers?.map((p) => (
            <span key={p} className={cn(
              "text-xs px-2 py-1 rounded-lg ring-1",
              isDark ? "ring-slate-700 text-slate-400" : "ring-slate-200 text-slate-500"
            )}>
              {p}
            </span>
          ))}
        </div>
        <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>{note.title}</h1>
        {note.summary && (
          <p className={cn("text-sm mt-1.5", isDark ? "text-slate-400" : "text-slate-500")}>{note.summary}</p>
        )}
      </div>

      {/* Main content */}
      <div className={cn(
        "rounded-2xl p-8 ring-1 prose prose-sm max-w-none",
        isDark
          ? "bg-slate-900 ring-slate-800 prose-invert prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-code:text-blue-300 prose-code:bg-slate-800 prose-table:text-slate-300 prose-th:text-slate-200 prose-td:text-slate-300"
          : "bg-white ring-slate-200 prose-headings:text-slate-900 prose-p:text-slate-700 prose-code:bg-slate-100 prose-code:text-blue-700"
      )}>
        <ReactMarkdown
          components={{

            table: ({ children }) => (
              <div className="overflow-x-auto my-5 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
                <table className="w-full text-sm border-collapse">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className={isDark ? "bg-slate-800" : "bg-slate-50"}>
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className={isDark ? "divide-y divide-slate-800" : "divide-y divide-slate-100"}>
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className={isDark ? "hover:bg-slate-800/60" : "hover:bg-blue-50/40 transition-colors"}>
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className={cn("px-5 py-3 text-left text-xs font-bold uppercase tracking-wider", isDark ? "text-blue-400" : "text-blue-700")}>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className={cn("px-5 py-3 text-sm", isDark ? "text-slate-300" : "text-slate-700")}>
                {children}
              </td>
            ),
            blockquote: ({ children }) => (
              <blockquote className={cn("border-l-4 border-blue-400 pl-4 py-1 my-3 rounded-r-lg", isDark ? "bg-blue-500/10 text-slate-300" : "bg-blue-50 text-slate-700")}>
                {children}
              </blockquote>
            ),
            code: ({ inline, children }) => inline ? (
              <code className={cn("px-1.5 py-0.5 rounded-md text-sm font-mono font-semibold", isDark ? "bg-slate-800 text-blue-300" : "bg-blue-50 text-blue-700")}>
                {children}
              </code>
            ) : (
              <pre className={cn("p-4 rounded-xl overflow-x-auto font-mono text-sm", isDark ? "bg-slate-800 text-blue-300" : "bg-slate-50 text-blue-700")}>
                <code>{children}</code>
              </pre>
            ),
            h1: ({ children }) => <h1 className={cn("text-xl font-bold mt-6 mb-3", isDark ? "text-white" : "text-slate-900")}>{children}</h1>,
            h2: ({ children }) => <h2 className={cn("text-lg font-bold mt-5 mb-2 pb-1 border-b", isDark ? "text-white border-slate-700" : "text-slate-900 border-slate-200")}>{children}</h2>,
            h3: ({ children }) => <h3 className={cn("text-base font-semibold mt-4 mb-2", isDark ? "text-blue-400" : "text-blue-700")}>{children}</h3>,
            p: ({ children }) => <p className={cn("leading-relaxed my-2", isDark ? "text-slate-300" : "text-slate-700")}>{children}</p>,
            ul: ({ children }) => <ul className={cn("my-3 space-y-1.5 pl-1", isDark ? "text-slate-300" : "text-slate-700")}>{children}</ul>,
            ol: ({ children }) => <ol className={cn("my-3 space-y-1.5 pl-1 list-decimal list-inside", isDark ? "text-slate-300" : "text-slate-700")}>{children}</ol>,
            li: ({ children }) => (
              <li className="flex items-start gap-2">
                <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0", isDark ? "bg-blue-400" : "bg-blue-500")} />
                <span>{children}</span>
              </li>
            ),
          }}
        >
          {cleanMarkdown(note.content_markdown)}
        </ReactMarkdown>
      </div>

      {/* Key rules */}
      {note.key_rules?.length > 0 && (
        <div className={cn("rounded-2xl p-6 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className={cn("font-semibold", isDark ? "text-white" : "text-slate-900")}>Key Rules to Remember</h3>
          </div>
          <ul className="space-y-2">
            {note.key_rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md mt-0.5", isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700")}>
                  {i + 1}
                </span>
                <span className={cn("text-sm", isDark ? "text-slate-300" : "text-slate-600")}>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common mistakes */}
      {note.common_mistakes?.length > 0 && (
        <div className={cn("rounded-2xl p-6 ring-1", isDark ? "bg-slate-900 ring-rose-500/20" : "bg-rose-50 ring-rose-200")}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className={cn("font-semibold", isDark ? "text-white" : "text-slate-900")}>Common IB Exam Mistakes</h3>
          </div>
          <ul className="space-y-2">
            {note.common_mistakes.map((m, i) => (
              <li key={i} className={cn("text-sm flex items-start gap-2", isDark ? "text-slate-300" : "text-slate-700")}>
                <span className="text-rose-400 mt-0.5">✗</span> {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* YouTube videos */}
      {note.youtube_videos?.length > 0 && (
        <div className={cn("rounded-2xl ring-1 overflow-hidden", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
          <button
            onClick={() => setShowVideos(!showVideos)}
            className={cn("w-full flex items-center justify-between px-6 py-4 transition-colors", isDark ? "hover:bg-slate-800" : "hover:bg-slate-50")}
          >
            <div className="flex items-center gap-3">
              <Youtube className="w-5 h-5 text-red-500" />
              <span className={cn("font-medium", isDark ? "text-white" : "text-slate-900")}>
                Video Explanations ({note.youtube_videos.length})
              </span>
            </div>
            {showVideos ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          <AnimatePresence>
            {showVideos && (
              <motion.div
                initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {note.youtube_videos.map((v, i) => (
                    <a
                      key={i}
                      href={`https://www.youtube.com/watch?v=${v.youtube_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl ring-1 transition-colors group",
                        isDark ? "ring-slate-700 hover:ring-red-500/30 hover:bg-slate-800" : "ring-slate-200 hover:ring-red-300 hover:bg-red-50"
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <Youtube className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className={cn("text-sm font-medium line-clamp-1", isDark ? "text-white" : "text-slate-900")}>{v.title}</p>
                        <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>{v.channel}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* External links */}
      {note.external_links?.length > 0 && (
        <div className={cn("rounded-2xl p-6 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
          <h3 className={cn("font-medium mb-3 flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
            <ExternalLink className="w-4 h-4 text-blue-500" />
            Further Study
          </h3>
          <div className="space-y-2">
            {note.external_links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("flex items-center justify-between text-sm py-2 px-3 rounded-lg transition-colors", isDark ? "hover:bg-slate-800 text-blue-400" : "hover:bg-slate-50 text-blue-600")}
              >
                <span>{l.label}</span>
                <span className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>{l.source}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Practice Worksheets */}
      {(() => {
        const sheets = getWorksheetsForNote(note);
        return sheets.length > 0 ? (
          <div className={cn("rounded-2xl p-6 ring-1", isDark ? "bg-emerald-900/20 ring-emerald-500/20" : "bg-emerald-50 ring-emerald-200")}>
            <h3 className={cn("font-semibold mb-1 flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
              <FileText className="w-4 h-4 text-emerald-500" />
              Practice Worksheets
            </h3>
            <p className={cn("text-xs mb-4", isDark ? "text-slate-400" : "text-slate-500")}>
              Work through these exercises, then check your answers with the answer key.
            </p>
            <div className="space-y-2">
              {sheets.map((s, i) => (
                <div key={i} className={cn("flex items-center justify-between py-2 px-3 rounded-xl ring-1", isDark ? "ring-slate-700 bg-slate-800/50" : "ring-emerald-200 bg-white")}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    className={cn("text-sm font-medium hover:underline", isDark ? "text-emerald-400" : "text-emerald-700")}>
                    {s.label}
                  </a>
                  {s.answer_url && (
                    <a href={s.answer_url} target="_blank" rel="noopener noreferrer"
                      className={cn("text-xs px-2.5 py-1 rounded-lg ring-1 transition-colors", isDark ? "ring-slate-600 text-slate-400 hover:text-white" : "ring-emerald-300 text-emerald-600 hover:bg-emerald-100")}>
                      Answer Key
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}