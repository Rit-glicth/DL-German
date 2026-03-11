import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import {
  GraduationCap, Loader2, CheckCircle2, XCircle, ArrowRight,
  Upload, Plus, Headphones, Volume2
} from "lucide-react";
import TeacherAddContentDrawer from "../components/admin/TeacherAddContentDrawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

const IB_THEMES = ["Identities", "Experiences", "Human Ingenuity", "Social Organisation", "Sharing the Planet"];
const PAPERS = ["Paper 1", "Paper 2", "Oral", "Writing Task", "Ab Initio", "Listening"];

export default function IBPractice({ isDark, isTeacher }) {
  const [tab, setTab] = useState("practice");
  const [level, setLevel] = useState("B1");
  const [paper, setPaper] = useState("Paper 1");
  const [theme, setTheme] = useState("Identities");
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [essayInput, setEssayInput] = useState("");
  const [essayFeedback, setEssayFeedback] = useState(null);
  const [analyzingEssay, setAnalyzingEssay] = useState(false);
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef();
  // Listening
  const [listeningTheme, setListeningTheme] = useState("Identities");
  const [listeningLevel, setListeningLevel] = useState("B1");
  const [listeningData, setListeningData] = useState(null);
  const [generatingListening, setGeneratingListening] = useState(false);
  const [listeningAnswers, setListeningAnswers] = useState({});
  const [listeningSubmitted, setListeningSubmitted] = useState(false);
  const queryClient = useQueryClient();

  const { data: savedQuestions } = useQuery({
    queryKey: ["ibQuestions"],
    queryFn: () => base44.entities.IBQuestion.list("-created_date", 200),
    initialData: [],
  });

  const saveQuestion = useMutation({
    mutationFn: (q) => base44.entities.IBQuestion.create(q),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ibQuestions"] }),
  });

  const generateListening = async () => {
    setGeneratingListening(true);
    setListeningData(null);
    setListeningAnswers({});
    setListeningSubmitted(false);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create an IB German listening comprehension exercise.
Theme: "${listeningTheme}", Level: ${listeningLevel}

1. Write a realistic German audio TRANSCRIPT (a monologue, interview, or short dialogue, 150-200 words) that sounds like authentic spoken German related to the theme.
2. Write 10 multiple-choice comprehension questions in English (about the transcript content).
3. Each question must have 4 options (A-D) and one correct index (0-3).
4. Return a german_text field with the full German transcript that will be read aloud.
All content must be IB Language B appropriate.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          german_text: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correct_index: { type: "number" },
                explanation: { type: "string" }
              }
            }
          }
        }
      }
    });
    setListeningData(result);
    setGeneratingListening(false);
  };

  const speakGerman = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "de-DE";
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  };

  const generateQuestions = async () => {
    setGenerating(true);
    setScore({ correct: 0, total: 0 });
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowResult(false);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 6 IB German exam practice questions.

Settings:
- CEFR Level: ${level}
- Paper type: ${paper}
- IB Theme: ${theme}

Create a MIX of question types appropriate for ${paper}:
- Multiple choice (reading comprehension)
- Fill in the blank (grammar focus)
- Short answer (text analysis)
- Essay prompt (for Paper 1 writing tasks)

For multiple choice: provide 4 options with the correct index (0-3).
For essay prompts: provide a model answer/mark scheme.
All German text must use proper umlauts.
Base questions on authentic IB-style content relevant to the theme "${theme}".
Include a short German text/stimulus where appropriate.`,
      response_json_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question_text: { type: "string" },
                question_type: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correct_answer: { type: "string" },
                correct_index: { type: "number" },
                model_answer: { type: "string" },
                mark_scheme: { type: "string" },
                explanation: { type: "string" },
                grammar_focus: { type: "string" },
                difficulty: { type: "number" },
              },
            },
          },
        },
      },
    });

    const qs = (result.questions || []).map((q) => ({
      ...q,
      paper,
      cefr_level: level,
      ib_theme: theme,
      source: "AI-generated",
    }));

    setQuestions(qs);
    setGenerating(false);
  };

  const handleAnswer = (answer, index) => {
    setSelectedAnswer(index);
    setShowResult(true);
    const q = questions[currentQ];
    const isCorrect =
      q.question_type === "multiple_choice"
        ? index === q.correct_index
        : answer.trim().toLowerCase() === (q.correct_answer || "").trim().toLowerCase();
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentQ((prev) => prev + 1);
  };

  const analyzeEssay = async () => {
    setAnalyzingEssay(true);
    const q = questions[currentQ];
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an IB German examiner. Assess this student response.

Prompt: "${q.question_text}"
Student response: "${essayInput}"
Level: ${level}
IB Theme: ${theme}

Assess based on IB criteria:
- Criterion A: Language (grammar, vocabulary, register)
- Criterion B: Message (content, relevance, clarity)  
- Criterion C: Format/Conventions

Provide specific corrections and improvements. Be detailed.`,
      response_json_schema: {
        type: "object",
        properties: {
          criterion_a_score: { type: "number" },
          criterion_b_score: { type: "number" },
          criterion_c_score: { type: "number" },
          total_score: { type: "number" },
          language_feedback: { type: "string" },
          message_feedback: { type: "string" },
          format_feedback: { type: "string" },
          grammar_corrections: { type: "array", items: { type: "object", properties: { error: { type: "string" }, correction: { type: "string" } } } },
          improved_version: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
        },
      },
    });
    setEssayFeedback(result);
    setAnalyzingEssay(false);
  };

  const q = questions[currentQ];
  const sessionDone = questions.length > 0 && currentQ >= questions.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-500" />
            </div>
            <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
              Exam Style Practice
            </h1>
          </div>
          {isTeacher && <TeacherAddContentDrawer isDark={isDark} defaultTab="ibq" />}
        </div>
        <p className={cn("text-sm ml-12", isDark ? "text-slate-400" : "text-slate-500")}>
          IB-style exam questions · Paper 1 · Paper 2 · Writing Tasks
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn("rounded-xl", isDark ? "bg-slate-800" : "")}>
          <TabsTrigger value="practice" className="rounded-lg">Practice Questions</TabsTrigger>
          <TabsTrigger value="listening" className="rounded-lg">Listening Task</TabsTrigger>
          <TabsTrigger value="upload" className="rounded-lg">Upload Past Papers</TabsTrigger>
        </TabsList>

        <TabsContent value="practice" className="mt-6">
          {questions.length === 0 ? (
            <div className={cn("rounded-2xl p-8 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
              {sessionDone && (
                <div className={cn("mb-8 p-6 rounded-xl text-center", isDark ? "bg-blue-500/10" : "bg-blue-50")}>
                  <h3 className={cn("text-xl font-bold", isDark ? "text-white" : "text-slate-900")}>
                    Session Complete — {score.correct}/{score.total}
                  </h3>
                  <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
                    {Math.round((score.correct / score.total) * 100)}% accuracy
                  </p>
                </div>
              )}

              <h3 className={cn("font-semibold text-lg mb-6", isDark ? "text-white" : "text-slate-900")}>
                Configure your practice session
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className={cn("text-xs font-medium mb-2 block uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Level</label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2 / Ab Initio</SelectItem>
                      <SelectItem value="B1">B1 / SL</SelectItem>
                      <SelectItem value="B2">B2 / HL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={cn("text-xs font-medium mb-2 block uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Paper</label>
                  <Select value={paper} onValueChange={setPaper}>
                    <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAPERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={cn("text-xs font-medium mb-2 block uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>IB Theme</label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IB_THEMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={generateQuestions} disabled={generating} className="rounded-xl bg-blue-500 hover:bg-blue-600">
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GraduationCap className="w-4 h-4 mr-2" />}
                Generate IB Questions
              </Button>
            </div>
          ) : sessionDone ? (
            <div className={cn("rounded-2xl p-12 ring-1 text-center", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
              <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>Session Complete!</h2>
              <p className={cn("text-4xl font-bold text-blue-500 my-4")}>{score.correct}/{score.total}</p>
              <p className={cn("text-sm mb-6", isDark ? "text-slate-400" : "text-slate-500")}>
                {Math.round((score.correct / score.total) * 100)}% accuracy on {paper} · {theme}
              </p>
              <Button onClick={() => { setQuestions([]); setScore({ correct: 0, total: 0 }); }} className="rounded-xl bg-blue-500 hover:bg-blue-600">
                New Session
              </Button>
            </div>
          ) : q ? (
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center justify-between">
                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                  {currentQ + 1} / {questions.length} · Score: {score.correct}/{score.total}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{q.question_type?.replace(/_/g, " ")}</Badge>
                  {q.grammar_focus && <Badge variant="outline" className="text-xs">{q.grammar_focus}</Badge>}
                </div>
              </div>
              <div className={cn("h-1.5 rounded-full", isDark ? "bg-slate-800" : "bg-slate-200")}>
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(currentQ / questions.length) * 100}%` }} />
              </div>

              {/* Question card */}
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn("rounded-2xl p-8 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}
              >
                <div className="mb-6">
                  <p className={cn("text-xs uppercase tracking-wider mb-2 text-blue-500")}>
                    {q.paper} · {q.ib_theme}
                  </p>
                  <p className={cn("text-lg leading-relaxed", isDark ? "text-white" : "text-slate-900")}>
                    {q.question_text}
                  </p>
                </div>

                {/* Multiple choice */}
                {q.question_type === "multiple_choice" && q.options?.length > 0 && (
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt, i) => {
                      const isSelected = selectedAnswer === i;
                      const isCorrect = i === q.correct_index;
                      return (
                        <button
                          key={i}
                          onClick={() => !showResult && handleAnswer(opt, i)}
                          disabled={showResult}
                          className={cn(
                            "text-left px-5 py-4 rounded-xl ring-1 text-sm transition-all",
                            showResult && isCorrect
                              ? "ring-emerald-500 bg-emerald-500/10 text-emerald-600"
                              : showResult && isSelected && !isCorrect
                              ? "ring-rose-500 bg-rose-500/10 text-rose-600"
                              : isSelected
                              ? "ring-blue-500 bg-blue-500/10"
                              : isDark
                              ? "ring-slate-700 text-slate-300 hover:ring-slate-600"
                              : "ring-slate-200 text-slate-700 hover:ring-slate-300"
                          )}
                        >
                          <span className="font-semibold mr-3">{["A", "B", "C", "D"][i]}.</span>
                          {opt}
                          {showResult && isCorrect && <CheckCircle2 className="inline w-4 h-4 ml-2 text-emerald-500" />}
                          {showResult && isSelected && !isCorrect && <XCircle className="inline w-4 h-4 ml-2 text-rose-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Essay/short answer */}
                {(q.question_type === "essay_prompt" || q.question_type === "short_answer") && (
                  <div className="space-y-4">
                    <Textarea
                      value={essayInput}
                      onChange={(e) => setEssayInput(e.target.value)}
                      placeholder={q.question_type === "essay_prompt" ? "Write your response in German (150-250 words)..." : "Write your answer in German..."}
                      rows={q.question_type === "essay_prompt" ? 8 : 3}
                      className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
                    />
                    {!essayFeedback && (
                      <Button onClick={analyzeEssay} disabled={!essayInput.trim() || analyzingEssay} className="rounded-xl bg-blue-500 hover:bg-blue-600">
                        {analyzingEssay ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Get IB Examiner Feedback
                      </Button>
                    )}
                    {essayFeedback && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "Criterion A: Language", score: essayFeedback.criterion_a_score },
                            { label: "Criterion B: Message", score: essayFeedback.criterion_b_score },
                            { label: "Criterion C: Format", score: essayFeedback.criterion_c_score },
                          ].map((c) => (
                            <div key={c.label} className={cn("p-3 rounded-xl text-center ring-1", isDark ? "bg-slate-800 ring-slate-700" : "bg-slate-50 ring-slate-200")}>
                              <p className={cn("text-xs mb-1", isDark ? "text-slate-400" : "text-slate-500")}>{c.label}</p>
                              <p className={cn("text-2xl font-bold text-blue-500")}>{c.score}</p>
                            </div>
                          ))}
                        </div>
                        {essayFeedback.grammar_corrections?.length > 0 && (
                          <div className={cn("p-4 rounded-xl", isDark ? "bg-rose-500/10" : "bg-rose-50")}>
                            <p className="text-sm font-semibold text-rose-600 mb-2">Grammar Corrections:</p>
                            {essayFeedback.grammar_corrections.map((c, i) => (
                              <p key={i} className={cn("text-sm", isDark ? "text-slate-300" : "text-slate-700")}>
                                ❌ {c.error} → ✅ {c.correction}
                              </p>
                            ))}
                          </div>
                        )}
                        {essayFeedback.improved_version && (
                          <div className={cn("p-4 rounded-xl", isDark ? "bg-emerald-500/10" : "bg-emerald-50")}>
                            <p className="text-sm font-semibold text-emerald-600 mb-2">Improved version:</p>
                            <p className={cn("text-sm", isDark ? "text-slate-300" : "text-slate-700")}>{essayFeedback.improved_version}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Fill blank / other */}
                {(q.question_type === "fill_blank" || q.question_type === "gap_fill") && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Type your answer..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !showResult) handleAnswer(e.target.value, 0);
                      }}
                      disabled={showResult}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl ring-1 text-sm outline-none transition-all",
                        isDark ? "bg-slate-800 ring-slate-700 text-white" : "bg-white ring-slate-200"
                      )}
                    />
                    {!showResult && <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>Press Enter to check</p>}
                  </div>
                )}

                {/* Feedback & next */}
                <AnimatePresence>
                  {showResult && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
                      {q.explanation && (
                        <p className={cn("text-sm p-4 rounded-xl", isDark ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-600")}>
                          {q.explanation}
                        </p>
                      )}
                      {q.mark_scheme && (
                        <p className={cn("text-xs p-3 rounded-xl", isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700")}>
                          Mark scheme: {q.mark_scheme}
                        </p>
                      )}
                      <Button onClick={nextQuestion} className="rounded-xl">
                        Next <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="listening" className="mt-6">
          {!listeningData ? (
            <div className={cn("rounded-2xl p-8 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <h3 className={cn("font-semibold text-lg", isDark ? "text-white" : "text-slate-900")}>Listening Comprehension</h3>
                  <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>10 multiple-choice questions based on a German audio text</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className={cn("text-xs font-medium mb-2 block uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Level</label>
                  <Select value={listeningLevel} onValueChange={setListeningLevel}>
                    <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2 / Ab Initio</SelectItem>
                      <SelectItem value="B1">B1 / SL</SelectItem>
                      <SelectItem value="B2">B2 / HL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={cn("text-xs font-medium mb-2 block uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>IB Theme</label>
                  <Select value={listeningTheme} onValueChange={setListeningTheme}>
                    <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {IB_THEMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={generateListening} disabled={generatingListening} className="rounded-xl bg-violet-500 hover:bg-violet-600">
                {generatingListening ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Headphones className="w-4 h-4 mr-2" />}
                Generate Listening Task
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Audio text card */}
              <div className={cn("rounded-2xl p-6 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={cn("font-semibold", isDark ? "text-white" : "text-slate-900")}>{listeningData.title}</h3>
                  <Button size="sm" variant="outline" onClick={() => speakGerman(listeningData.german_text)}
                    className={cn("rounded-xl gap-2", isDark ? "border-slate-700 text-slate-300" : "")}>
                    <Volume2 className="w-4 h-4" /> Listen
                  </Button>
                </div>
                <div className={cn("p-4 rounded-xl text-sm leading-relaxed", isDark ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-700")}>
                  {listeningData.german_text}
                </div>
                <p className={cn("text-xs mt-2", isDark ? "text-slate-500" : "text-slate-400")}>Read the transcript or click Listen to hear it spoken in German, then answer the questions below.</p>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {(listeningData.questions || []).map((q, qi) => (
                  <div key={qi} className={cn("rounded-2xl p-6 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
                    <p className={cn("font-medium mb-4 text-sm", isDark ? "text-white" : "text-slate-900")}>
                      <span className="text-blue-500 font-bold mr-2">{qi + 1}.</span>{q.question}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, oi) => {
                        const chosen = listeningAnswers[qi] === oi;
                        const isCorrect = oi === q.correct_index;
                        return (
                          <button key={oi} disabled={listeningSubmitted}
                            onClick={() => !listeningSubmitted && setListeningAnswers(a => ({ ...a, [qi]: oi }))}
                            className={cn("text-left px-4 py-3 rounded-xl ring-1 text-sm transition-all",
                              listeningSubmitted && isCorrect ? "ring-emerald-500 bg-emerald-500/10 text-emerald-600"
                              : listeningSubmitted && chosen && !isCorrect ? "ring-rose-500 bg-rose-500/10 text-rose-600"
                              : chosen ? isDark ? "ring-blue-500 bg-blue-500/10 text-blue-300" : "ring-blue-500 bg-blue-50 text-blue-700"
                              : isDark ? "ring-slate-700 text-slate-300 hover:ring-slate-600" : "ring-slate-200 text-slate-700 hover:ring-slate-300"
                            )}>
                            <span className="font-semibold mr-2">{["A","B","C","D"][oi]}.</span>{opt}
                            {listeningSubmitted && isCorrect && <CheckCircle2 className="inline w-4 h-4 ml-2 text-emerald-500" />}
                            {listeningSubmitted && chosen && !isCorrect && <XCircle className="inline w-4 h-4 ml-2 text-rose-500" />}
                          </button>
                        );
                      })}
                    </div>
                    {listeningSubmitted && q.explanation && (
                      <p className={cn("text-xs mt-3 p-3 rounded-lg", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-600")}>{q.explanation}</p>
                    )}
                  </div>
                ))}
              </div>

              {!listeningSubmitted ? (
                <Button onClick={() => setListeningSubmitted(true)} disabled={Object.keys(listeningAnswers).length < (listeningData.questions?.length || 10)}
                  className="rounded-xl bg-violet-500 hover:bg-violet-600">
                  Submit Answers
                </Button>
              ) : (
                <div className={cn("rounded-2xl p-6 ring-1 text-center", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
                  <p className={cn("text-2xl font-bold text-violet-500 mb-1")}>
                    {Object.entries(listeningAnswers).filter(([qi, ai]) => ai === listeningData.questions[qi]?.correct_index).length} / {listeningData.questions?.length}
                  </p>
                  <p className={cn("text-sm mb-4", isDark ? "text-slate-400" : "text-slate-500")}>Listening score</p>
                  <Button onClick={() => { setListeningData(null); setListeningAnswers({}); setListeningSubmitted(false); }} className="rounded-xl bg-violet-500 hover:bg-violet-600">
                    New Listening Task
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <div className={cn("rounded-2xl p-8 ring-1", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
            <h3 className={cn("text-lg font-semibold mb-2", isDark ? "text-white" : "text-slate-900")}>
              Upload Past IB Papers
            </h3>
            <p className={cn("text-sm mb-6", isDark ? "text-slate-400" : "text-slate-500")}>
              Upload your IB German past paper PDFs and the AI will extract questions, mark schemes, and model answers into the practice system.
            </p>

            <div className="space-y-6">
              <div className={cn("border-2 border-dashed rounded-2xl p-10 text-center transition-colors",
                isDark ? "border-slate-700 hover:border-slate-600" : "border-slate-300 hover:border-slate-400"
              )}>
                <Upload className={cn("w-8 h-8 mx-auto mb-3", isDark ? "text-slate-500" : "text-slate-400")} />
                <p className={cn("font-medium mb-1", isDark ? "text-white" : "text-slate-900")}>Drop your PDF here</p>
                <p className={cn("text-sm mb-4", isDark ? "text-slate-500" : "text-slate-400")}>
                  Supports IB past papers, mark schemes, specimen papers
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setUploading(true);
                    setUploadStatus(null);
                    try {
                      const { file_url } = await base44.integrations.Core.UploadFile({ file });
                      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
                        file_url,
                        json_schema: {
                          type: "object",
                          properties: {
                            questions: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  question_text: { type: "string" },
                                  question_type: { type: "string" },
                                  options: { type: "array", items: { type: "string" } },
                                  correct_answer: { type: "string" },
                                  mark_scheme: { type: "string" },
                                  grammar_focus: { type: "string" },
                                  paper: { type: "string" },
                                  difficulty: { type: "number" }
                                }
                              }
                            }
                          }
                        }
                      });
                      if (result.status === "success" && result.output?.questions?.length) {
                        for (const q of result.output.questions) {
                          await saveQuestion.mutateAsync({ ...q, cefr_level: level, source: "Past Paper - " + file.name });
                        }
                        setUploadStatus({ ok: true, msg: `Extracted ${result.output.questions.length} questions from "${file.name}"` });
                      } else {
                        setUploadStatus({ ok: false, msg: "Could not extract questions. Make sure the file contains IB German exam content." });
                      }
                    } catch(err) {
                      setUploadStatus({ ok: false, msg: "Upload failed. Please try again." });
                    }
                    setUploading(false);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={cn("rounded-xl", isDark ? "border-slate-700 text-slate-300" : "")}
                >
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploading ? "Processing..." : "Select PDF / DOCX / TXT"}
                </Button>
                {uploadStatus && (
                  <p className={cn("text-sm mt-3", uploadStatus.ok ? "text-emerald-500" : "text-rose-500")}>{uploadStatus.msg}</p>
                )}
              </div>

              <div className={cn("rounded-xl p-5 ring-1", isDark ? "bg-slate-800/50 ring-slate-700" : "bg-slate-50 ring-slate-200")}>
                <h4 className={cn("font-medium mb-3", isDark ? "text-white" : "text-slate-900")}>How to add past papers:</h4>
                <ol className={cn("space-y-2 text-sm", isDark ? "text-slate-400" : "text-slate-600")}>
                  <li>1. Download past papers from your school's IB resources or teacher</li>
                  <li>2. Upload the PDF here — the AI extracts all questions automatically</li>
                  <li>3. Questions are saved and appear in the Practice tab</li>
                  <li>4. You can also paste text from mark schemes for model answers</li>
                </ol>
                <div className="mt-4 pt-4 border-t" style={{ borderColor: isDark ? "#334155" : "#e2e8f0" }}>
                  <p className={cn("text-xs font-medium mb-2", isDark ? "text-slate-400" : "text-slate-500")}>Useful resources:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "IB German Specimen Papers", url: "https://www.ibo.org/programmes/diploma-programme/curriculum/language-acquisition/german-b/" },
                      { label: "Foliotek / ManageBac", url: "#" },
                      { label: "IB Past Papers (school access)", url: "#" },
                    ].map((r) => (
                      <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer"
                        className={cn("text-xs px-3 py-1.5 rounded-lg ring-1", isDark ? "ring-slate-700 text-blue-400" : "ring-slate-200 text-blue-600")}>
                        {r.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {savedQuestions.length > 0 && (
                <div>
                  <p className={cn("text-sm font-medium mb-3", isDark ? "text-slate-300" : "text-slate-700")}>
                    Saved questions ({savedQuestions.length}):
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {savedQuestions.slice(0, 20).map((q) => (
                      <div key={q.id} className={cn("flex items-center justify-between p-3 rounded-xl ring-1", isDark ? "bg-slate-800 ring-slate-700" : "bg-white ring-slate-200")}>
                        <p className={cn("text-xs line-clamp-1 flex-1", isDark ? "text-slate-300" : "text-slate-700")}>
                          {q.question_text?.substring(0, 80)}...
                        </p>
                        <Badge variant="outline" className="ml-3 text-[10px] flex-shrink-0">{q.source || "AI"}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}