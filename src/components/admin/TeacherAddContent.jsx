
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Plus, BookOpen, Languages, GraduationCap, CheckCircle2 } from "lucide-react";

export default function TeacherAddContent({ isDark, defaultTab }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState(defaultTab || "vocab");
  const [success, setSuccess] = useState(null);

  // Vocab form
  const [vocab, setVocab] = useState({
    german_word: "", english_translation: "", gender: "n/a",
    word_type: "noun", cefr_level: "B1", example_sentence: "", example_translation: "", tags: ""
  });

  // Grammar note form
  const [grammar, setGrammar] = useState({
    title: "", cefr_level: "B1", ib_relevance: "core", summary: "", content_markdown: "",
    key_rules: "", common_mistakes: ""
  });

  // IB Question form
  const [ibq, setIbq] = useState({
    question_text: "", question_type: "multiple_choice", paper: "Paper 1",
    cefr_level: "B1", ib_theme: "Identities", topic: "",
    options: ["", "", "", ""], correct_answer: "", mark_scheme: "", difficulty: 3
  });

  const [generating, setGenerating] = useState(false);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const addVocab = useMutation({
    mutationFn: (d) => base44.entities.Vocabulary.create(d),
    onSuccess: () => {
      qc.invalidateQueries(["vocab"]);
      setVocab({ german_word: "", english_translation: "", gender: "n/a", word_type: "noun", cefr_level: "B1", example_sentence: "", example_translation: "", tags: "" });
      showSuccess("Vocabulary word added!");
    }
  });

  const addGrammar = useMutation({
    mutationFn: (d) => base44.entities.GrammarNote.create(d),
    onSuccess: () => {
      qc.invalidateQueries(["grammarNotes"]);
      setGrammar({ title: "", cefr_level: "B1", ib_relevance: "core", summary: "", content_markdown: "", key_rules: "", common_mistakes: "" });
      showSuccess("Grammar note added!");
    }
  });

  const addIbq = useMutation({
    mutationFn: (d) => base44.entities.IBQuestion.create(d),
    onSuccess: () => {
      qc.invalidateQueries(["ibQuestions"]);
      setIbq({ question_text: "", question_type: "multiple_choice", paper: "Paper 1", cefr_level: "B1", ib_theme: "Identities", topic: "", options: ["","","",""], correct_answer: "", mark_scheme: "", difficulty: 3 });
      showSuccess("IB question added!");
    }
  });

  const generateGrammarAI = async () => {
    if (!grammar.title) return;
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a comprehensive IB German grammar lesson for the topic: "${grammar.title}" at CEFR level ${grammar.cefr_level}.
Include:
- Clear explanation with rules
- Conjugation tables or declension tables where relevant
- 3-5 example sentences with translations
- Common mistakes to avoid
- IB exam tips
Format in clean markdown with headers and tables. Do NOT use pipe separator lines outside of tables.`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          content_markdown: { type: "string" },
          key_rules: { type: "array", items: { type: "string" } },
          common_mistakes: { type: "array", items: { type: "string" } }
        }
      }
    });
    setGrammar(g => ({
      ...g,
      summary: result.summary || g.summary,
      content_markdown: result.content_markdown || g.content_markdown,
      key_rules: (result.key_rules || []).join("\n"),
      common_mistakes: (result.common_mistakes || []).join("\n")
    }));
    setGenerating(false);
  };

  const card = cn("rounded-2xl p-6 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200");
  const label = cn("text-xs font-medium mb-1.5 block uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500");
  const inputCls = cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" : "");

  return (
    <div className="space-y-6">
      <div>
        <h2 className={cn("text-xl font-bold", isDark ? "text-white" : "text-slate-900")}>Add Learning Content</h2>
        <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>Add vocabulary, grammar notes, and exam questions for students</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn("rounded-xl", isDark ? "bg-slate-800" : "")}>
          <TabsTrigger value="vocab" className="rounded-lg gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Vocabulary</TabsTrigger>
          <TabsTrigger value="grammar" className="rounded-lg gap-1.5"><Languages className="w-3.5 h-3.5" /> Grammar Note</TabsTrigger>
          <TabsTrigger value="ibq" className="rounded-lg gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> IB Question</TabsTrigger>
        </TabsList>

        {/* VOCABULARY */}
        <TabsContent value="vocab" className="mt-5">
          <div className={card}>
            <h3 className={cn("font-semibold mb-5", isDark ? "text-white" : "text-slate-900")}>Add Vocabulary Word</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>German Word *</label>
                <Input value={vocab.german_word} onChange={e => setVocab(v=>({...v, german_word: e.target.value}))} placeholder="e.g. das Haus" className={inputCls} />
              </div>
              <div>
                <label className={label}>English Translation *</label>
                <Input value={vocab.english_translation} onChange={e => setVocab(v=>({...v, english_translation: e.target.value}))} placeholder="e.g. the house" className={inputCls} />
              </div>
              <div>
                <label className={label}>Gender</label>
                <Select value={vocab.gender} onValueChange={v => setVocab(s=>({...s, gender: v}))}>
                  <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["der","die","das","n/a"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={label}>Word Type</label>
                <Select value={vocab.word_type} onValueChange={v => setVocab(s=>({...s, word_type: v}))}>
                  <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["noun","verb","adjective","adverb","preposition","conjunction","pronoun","other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={label}>CEFR Level</label>
                <Select value={vocab.cefr_level} onValueChange={v => setVocab(s=>({...s, cefr_level: v}))}>
                  <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["A1","A2","B1","B2"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={label}>Tags (comma separated)</label>
                <Input value={vocab.tags} onChange={e => setVocab(v=>({...v, tags: e.target.value}))} placeholder="e.g. travel, food, school" className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={label}>Example Sentence (German)</label>
                <Input value={vocab.example_sentence} onChange={e => setVocab(v=>({...v, example_sentence: e.target.value}))} placeholder="e.g. Das Haus ist groß." className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={label}>Example Translation (English)</label>
                <Input value={vocab.example_translation} onChange={e => setVocab(v=>({...v, example_translation: e.target.value}))} placeholder="e.g. The house is big." className={inputCls} />
              </div>
            </div>
            <Button
              className="mt-5 rounded-xl bg-blue-500 hover:bg-blue-600"
              disabled={!vocab.german_word || !vocab.english_translation || addVocab.isPending}
              onClick={() => addVocab.mutate({ ...vocab, tags: vocab.tags ? vocab.tags.split(",").map(t=>t.trim()) : [] })}
            >
              {addVocab.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Word
            </Button>
          </div>
        </TabsContent>

        {/* GRAMMAR NOTE */}
        <TabsContent value="grammar" className="mt-5">
          <div className={card}>
            <h3 className={cn("font-semibold mb-5", isDark ? "text-white" : "text-slate-900")}>Add Grammar Note</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Topic Title *</label>
                <Input value={grammar.title} onChange={e => setGrammar(g=>({...g, title: e.target.value}))} placeholder="e.g. Akkusativ Case" className={inputCls} />
              </div>
              <div>
                <label className={label}>CEFR Level</label>
                <Select value={grammar.cefr_level} onValueChange={v => setGrammar(g=>({...g, cefr_level: v}))}>
                  <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
                  <SelectContent>{["A1","A2","B1","B2"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className={label}>IB Relevance</label>
                <Select value={grammar.ib_relevance} onValueChange={v => setGrammar(g=>({...g, ib_relevance: v}))}>
                  <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
                  <SelectContent>{["core","important","advanced"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className={label}>Summary (one line)</label>
                <Input value={grammar.summary} onChange={e => setGrammar(g=>({...g, summary: e.target.value}))} placeholder="Brief summary" className={inputCls} />
              </div>
              <div className="md:col-span-2 flex items-center justify-between">
                <label className={label}>Full Content (Markdown)</label>
                <Button size="sm" variant="outline" onClick={generateGrammarAI}
                  disabled={!grammar.title || generating}
                  className={cn("rounded-xl text-xs h-7 gap-1.5", isDark ? "border-slate-700 text-slate-300" : "")}>
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Generate with AI
                </Button>
              </div>
              <div className="md:col-span-2">
                <Textarea value={grammar.content_markdown} onChange={e => setGrammar(g=>({...g, content_markdown: e.target.value}))}
                  placeholder="Write the lesson content in Markdown. Use ## for headers, | for tables, etc."
                  rows={10} className={cn("rounded-xl font-mono text-xs", isDark ? "bg-slate-800 border-slate-700 text-white" : "")} />
              </div>
              <div>
                <label className={label}>Key Rules (one per line)</label>
                <Textarea value={grammar.key_rules} onChange={e => setGrammar(g=>({...g, key_rules: e.target.value}))}
                  placeholder="Rule 1&#10;Rule 2&#10;Rule 3" rows={4} className={cn("rounded-xl text-xs", isDark ? "bg-slate-800 border-slate-700 text-white" : "")} />
              </div>
              <div>
                <label className={label}>Common Mistakes (one per line)</label>
                <Textarea value={grammar.common_mistakes} onChange={e => setGrammar(g=>({...g, common_mistakes: e.target.value}))}
                  placeholder="Mistake 1&#10;Mistake 2" rows={4} className={cn("rounded-xl text-xs", isDark ? "bg-slate-800 border-slate-700 text-white" : "")} />
              </div>
            </div>
            <Button
              className="mt-5 rounded-xl bg-emerald-500 hover:bg-emerald-600"
              disabled={!grammar.title || !grammar.content_markdown || addGrammar.isPending}
              onClick={() => addGrammar.mutate({
                ...grammar,
                slug: grammar.title.toLowerCase().replace(/\s+/g, "-"),
                key_rules: grammar.key_rules ? grammar.key_rules.split("\n").filter(Boolean) : [],
                common_mistakes: grammar.common_mistakes ? grammar.common_mistakes.split("\n").filter(Boolean) : [],
              })}
            >
              {addGrammar.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Save Grammar Note
            </Button>
          </div>
        </TabsContent>

        {/* IB QUESTION */}
        <TabsContent value="ibq" className="mt-5">
          <div className={card}>
            <h3 className={cn("font-semibold mb-5", isDark ? "text-white" : "text-slate-900")}>Add IB Practice Question</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={label}>Question Text *</label>
                <Textarea value={ibq.question_text} onChange={e => setIbq(q=>({...q, question_text: e.target.value}))}
                  placeholder="Write the question in German or English..." rows={3} className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")} />
              </div>
              <div>
                <label className={label}>Question Type</label>
                <Select value={ibq.question_type} onValueChange={v => setIbq(q=>({...q, question_type: v}))}>
                  <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["multiple_choice","fill_blank","short_answer","essay_prompt","text_analysis","listening_comp","gap_fill"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={label}>Paper</label>
                <Select value={ibq.paper} onValueChange={v => setIbq(q=>({...q, paper: v}))}>
                  <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
                  <SelectContent>{["Paper 1","Paper 2","Oral","Writing Task","Ab Initio"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className={label}>CEFR Level</label>
                <Select value={ibq.cefr_level} onValueChange={v => setIbq(q=>({...q, cefr_level: v}))}>
                  <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
                  <SelectContent>{["A1","A2","B1","B2"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className={label}>IB Theme</label>
                <Select value={ibq.ib_theme} onValueChange={v => setIbq(q=>({...q, ib_theme: v}))}>
                  <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
                  <SelectContent>{["Identities","Experiences","Human Ingenuity","Social Organisation","Sharing the Planet"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {ibq.question_type === "multiple_choice" && (
                <div className="md:col-span-2 space-y-2">
                  <label className={label}>Answer Options</label>
                  {ibq.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={cn("text-xs font-bold w-5", isDark ? "text-slate-400" : "text-slate-500")}>{["A","B","C","D"][i]}.</span>
                      <Input value={opt} onChange={e => setIbq(q=>({...q, options: q.options.map((o,j)=>j===i?e.target.value:o)}))}
                        placeholder={`Option ${["A","B","C","D"][i]}`} className={inputCls} />
                    </div>
                  ))}
                  <div>
                    <label className={label}>Correct Answer (A/B/C/D)</label>
                    <Select value={ibq.correct_answer} onValueChange={v => setIbq(q=>({...q, correct_answer: v}))}>
                      <SelectTrigger className={cn("rounded-xl w-28", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue placeholder="Correct" /></SelectTrigger>
                      <SelectContent>{["A","B","C","D"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {ibq.question_type !== "multiple_choice" && (
                <div className="md:col-span-2">
                  <label className={label}>Model Answer / Correct Answer</label>
                  <Textarea value={ibq.correct_answer} onChange={e => setIbq(q=>({...q, correct_answer: e.target.value}))}
                    placeholder="Model answer or correct response..." rows={3} className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")} />
                </div>
              )}

              <div className="md:col-span-2">
                <label className={label}>Mark Scheme / Notes</label>
                <Textarea value={ibq.mark_scheme} onChange={e => setIbq(q=>({...q, mark_scheme: e.target.value}))}
                  placeholder="What marks are awarded for..." rows={2} className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")} />
              </div>
            </div>
            <Button
              className="mt-5 rounded-xl bg-violet-500 hover:bg-violet-600"
              disabled={!ibq.question_text || addIbq.isPending}
              onClick={() => addIbq.mutate({ ...ibq, source: "Teacher-created" })}
            >
              {addIbq.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Save Question
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}