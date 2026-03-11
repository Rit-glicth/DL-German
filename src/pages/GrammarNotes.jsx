import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { BookOpen, Search, Loader2, Plus, Sparkles } from "lucide-react";
import TeacherAddContentDrawer from "../components/admin/TeacherAddContentDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NoteViewer from "../components/notes/NoteViewer";
import { motion, AnimatePresence } from "framer-motion";

const LEVELS = ["A1", "A2", "B1", "B2"];

export default function GrammarNotes({ isDark, isTeacher }) {
  const [selectedLevel, setSelectedLevel] = useState("A1");
  const [selectedNote, setSelectedNote] = useState(null);
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState("");

  const { data: notes, refetch } = useQuery({
    queryKey: ["grammarNotes"],
    queryFn: () => base44.entities.GrammarNote.list("order_index", 200),
    initialData: [],
  });

  const filtered = notes.filter((n) => {
    if (selectedLevel !== "all" && n.cefr_level !== selectedLevel) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const generateNote = async (topic, level) => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a comprehensive German grammar lesson note for IB students.

Topic: "${topic}"
CEFR Level: ${level}

Write a COMPLETE, THOROUGH lesson that includes:
1. Clear explanation with IB exam context
2. All relevant grammar tables (articles, case endings, conjugations as applicable)
3. Many example sentences in German with English translations
4. Rules for IB exam usage
5. Common exam mistakes
6. A "Quick Reference" section with the essential pattern

Format in Markdown. Use proper markdown tables with header rows and dividers. Use **bold** for German examples. Use > blockquotes for rules.
CRITICAL: NEVER output raw pipe-separated text lines like "|---|---|---|" or "|Masculine|der|ein|" outside of proper markdown tables. All grammar tables must use correct markdown table syntax with a header row and alignment row. Do not output any plain pipe characters as separators in prose.

Make it IB-exam focused - reference Paper 1, Paper 2, and Oral where relevant.
Include specific IB themes where this grammar appears (Identities, Experiences, Human Ingenuity, Social Organisation, Sharing the Planet).

IMPORTANT for youtube_videos: Only include videos you are CERTAIN exist on YouTube with correct video IDs. Prefer well-known German learning channels: 
- "Easy German" channel (e.g. IDs: xqQ3b-PBjyQ, dMQnfUAnuvQ)
- "Learn German with Anja" channel (e.g. IDs: hfzPIX_SNMQ, g7CrUVt4s0w)
- "Deutsch für Euch" channel (e.g. IDs: KjQuXlNvGnA, yEH1JKJIlLU)
- "DW Learn German" channel
If you are not 100% sure of a specific video ID, do NOT include it. It is better to return an empty youtube_videos array than to include broken links.

For external_links: include the nthuleen.com grammar worksheet page https://www.nthuleen.com/teach/grammar.html and goethe.de exercises as reliable sources.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          content_markdown: { type: "string" },
          key_rules: { type: "array", items: { type: "string" } },
          common_mistakes: { type: "array", items: { type: "string" } },
          ib_relevance: { type: "string" },
          ib_papers: { type: "array", items: { type: "string" } },
          youtube_videos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                youtube_id: { type: "string" },
                channel: { type: "string" }
              }
            }
          },
          external_links: {
            type: "array",
            items: {
              type: "object",
              properties: { label: { type: "string" }, url: { type: "string" }, source: { type: "string" } }
            }
          }
        }
      }
    });

    await base44.entities.GrammarNote.create({
      ...result,
      cefr_level: level,
      slug: topic.toLowerCase().replace(/\s+/g, "-"),
      order_index: notes.length + 1
    });
    await refetch();
    setGenerating(false);
    setGenTopic("");
  };

  const ibTopicsByLevel = {
    A1: ["Nominative Case & Articles", "Regular Verb Conjugation", "Modal Verbs (können, müssen, wollen)", "Verb-Second Word Order", "Questions (W-Fragen)", "Negation (nicht & kein)", "Personal Pronouns", "Sein & Haben"],
    A2: ["Accusative Case", "Dative Case", "Perfekt Tense (haben/sein)", "Separable Verbs", "Reflexive Verbs", "Subordinate Clauses (weil, dass, wenn)", "Prepositions (Accusative & Dative)", "Possessive Pronouns"],
    B1: ["Genitive Case", "Passive Voice (Vorgangspassiv)", "Relative Clauses", "Konjunktiv II (würden, hätten, wären)", "Wechselpräpositionen", "Adjective Endings", "Infinitive Constructions (um...zu)", "Temporal Clauses (als, wenn, nachdem)"],
    B2: ["Konjunktiv I (Indirect Speech)", "Extended Passive Constructions", "Complex Subordinate Clauses", "Nominalization", "Advanced Connectors (obwohl, dennoch, trotzdem)", "Participle Constructions", "Double Infinitive", "Reported Speech in Writing"],
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Sidebar list */}
      <div className={cn(
        "w-80 flex-shrink-0 rounded-2xl ring-1 overflow-hidden flex flex-col",
        isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      )}>
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-slate-900")}>Grammar Notes</h2>
            {isTeacher && <TeacherAddContentDrawer isDark={isDark} defaultTab="grammar" />}
          </div>
          <div className="flex gap-1 mb-3">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLevel(l)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  selectedLevel === l
                    ? "bg-blue-500 text-white"
                    : isDark ? "bg-slate-800 text-slate-400 hover:text-slate-200" : "bg-slate-100 text-slate-500 hover:text-slate-700"
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5", isDark ? "text-slate-500" : "text-slate-400")} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics..."
              className={cn("pl-9 text-xs rounded-xl h-8", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
            />
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="p-4">
              <p className={cn("text-xs text-center mb-4", isDark ? "text-slate-500" : "text-slate-400")}>
                No notes for {selectedLevel} yet. Generate one below:
              </p>
              <div className="space-y-1.5">
                {(ibTopicsByLevel[selectedLevel] || []).map((t) => (
                  <button
                    key={t}
                    onClick={() => generateNote(t, selectedLevel)}
                    disabled={generating}
                    className={cn(
                      "w-full text-left text-xs px-3 py-2.5 rounded-xl ring-1 transition-all",
                      isDark
                        ? "bg-slate-800/50 ring-slate-700 text-slate-300 hover:ring-blue-500/50"
                        : "bg-slate-50 ring-slate-200 text-slate-600 hover:ring-blue-300"
                    )}
                  >
                    {generating ? <Loader2 className="w-3 h-3 animate-spin inline mr-2" /> : <Plus className="w-3 h-3 inline mr-2" />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          {filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl mb-1 transition-all",
                selectedNote?.id === note.id
                  ? isDark ? "bg-blue-500/15 ring-1 ring-blue-500/30" : "bg-blue-50 ring-1 ring-blue-200"
                  : isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"
              )}
            >
              <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-900")}>{note.title}</p>
              {note.summary && (
                <p className={cn("text-xs mt-0.5 line-clamp-1", isDark ? "text-slate-500" : "text-slate-400")}>
                  {note.summary}
                </p>
              )}
            </button>
          ))}
          {/* Generate more */}
          {filtered.length > 0 && (
            <div className="p-2 pt-4 border-t mt-2" style={{ borderColor: isDark ? "#1e293b" : "#e2e8f0" }}>
              <p className={cn("text-xs font-medium mb-2 px-2", isDark ? "text-slate-500" : "text-slate-400")}>Generate more:</p>
              {(ibTopicsByLevel[selectedLevel] || [])
                .filter((t) => !filtered.find((n) => n.title === t || n.slug === t.toLowerCase().replace(/\s+/g, "-")))
                .map((t) => (
                  <button
                    key={t}
                    onClick={() => generateNote(t, selectedLevel)}
                    disabled={generating}
                    className={cn(
                      "w-full text-left text-xs px-3 py-2 rounded-lg transition-all mb-1",
                      isDark ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Plus className="w-3 h-3 inline mr-1.5" />{t}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {generating && (
          <div className={cn("rounded-2xl p-8 ring-1 text-center", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
            <p className={cn("font-medium", isDark ? "text-white" : "text-slate-900")}>Generating lesson note...</p>
            <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
              Creating a comprehensive IB-focused grammar lesson
            </p>
          </div>
        )}
        {!generating && selectedNote && <NoteViewer note={selectedNote} isDark={isDark} />}
        {!generating && !selectedNote && (
          <div className={cn("rounded-2xl p-12 ring-1 text-center", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-slate-900")}>Select a topic</h3>
            <p className={cn("text-sm mt-2", isDark ? "text-slate-400" : "text-slate-500")}>
              Choose a grammar note from the left, or click a topic to generate a new lesson.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}