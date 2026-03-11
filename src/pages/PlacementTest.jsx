import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const SURVEY_QUESTIONS = [
  {
    id: "experience",
    question: "Have you studied German before?",
    options: ["Never — this is completely new to me", "A little (some words / short phrases)", "Yes, for 1-2 years", "Yes, for 3+ years / studied formally"],
  },
  {
    id: "comfort",
    question: "Which best describes your current comfort level?",
    options: ["Complete beginner — I know almost nothing", "I know basics (greetings, numbers, colours)", "I can hold simple conversations", "I can read and write fairly well"],
  },
];

const PLACEMENT_QUESTIONS = [
  // A1
  { id: 1, level: "A1", question: "What is 'apple' in German?", options: ["Apfel", "Buch", "Hund", "Schule"], answer: "Apfel" },
  { id: 2, level: "A1", question: "Which is the correct article for 'Buch' (book)?", options: ["der", "die", "das", "den"], answer: "das" },
  { id: 3, level: "A1", question: "How do you say 'I am hungry' in German?", options: ["Ich habe Hunger", "Ich bin Hunger", "Mir ist Hunger", "Ich esse Hunger"], answer: "Ich habe Hunger" },
  { id: 4, level: "A1", question: "Choose the correct conjugation: 'Ich ___ (gehen) in die Schule.'", options: ["geht", "gehe", "gehen", "gehst"], answer: "gehe" },
  { id: 5, level: "A1", question: "'Wie heißt du?' means:", options: ["How old are you?", "What is your name?", "Where do you live?", "How are you?"], answer: "What is your name?" },
  // A2
  { id: 6, level: "A2", question: "Which case does 'mit' always take?", options: ["Nominativ", "Akkusativ", "Dativ", "Genitiv"], answer: "Dativ" },
  { id: 7, level: "A2", question: "Complete: 'Ich habe gestern viel ___.' (lernen – Perfekt)", options: ["lernt", "gelernt", "gelerntet", "lerne"], answer: "gelernt" },
  { id: 8, level: "A2", question: "Choose the correct sentence:", options: ["Ich kaufe ein neues Auto.", "Ich kaufe einen neues Auto.", "Ich kaufe eine neues Auto.", "Ich kaufe neu Auto."], answer: "Ich kaufe ein neues Auto." },
  { id: 9, level: "A2", question: "'Weil' sends the verb to:", options: ["Start of clause", "Second position", "End of clause", "Before the subject"], answer: "End of clause" },
  { id: 10, level: "A2", question: "Translate: 'I was at the cinema yesterday.'", options: ["Ich war gestern im Kino.", "Ich bin gestern im Kino.", "Ich werde gestern im Kino.", "Gestern Kino ich war."], answer: "Ich war gestern im Kino." },
  // B1
  { id: 11, level: "B1", question: "Which sentence uses the Konjunktiv II correctly?", options: ["Wenn ich Zeit hätte, käme ich.", "Wenn ich Zeit habe, käme ich.", "Wenn ich Zeit hätte, komme ich.", "Wenn ich Zeit habe, komme ich."], answer: "Wenn ich Zeit hätte, käme ich." },
  { id: 12, level: "B1", question: "Which preposition takes the Genitiv?", options: ["mit", "wegen", "nach", "seit"], answer: "wegen" },
  { id: 13, level: "B1", question: "Build the Passiv: 'Das Buch ___ von dem Kind gelesen.'", options: ["hat", "ist", "wird", "war"], answer: "wird" },
  { id: 14, level: "B1", question: "Which relative pronoun is correct? 'Das Buch, ___ ich gelesen habe, war toll.'", options: ["der", "die", "das", "dem"], answer: "das" },
  { id: 15, level: "B1", question: "What does 'obwohl' mean?", options: ["because", "although", "therefore", "if"], answer: "although" },
  // B2
  { id: 16, level: "B2", question: "Identify the Genitivattribut: 'Das Auto meines Vaters ist neu.'", options: ["Das Auto", "meines Vaters", "ist", "neu"], answer: "meines Vaters" },
  { id: 17, level: "B2", question: "Which word order is correct for a subordinate clause with modal verb?", options: ["..., weil er kann kommen.", "..., weil er kommen kann.", "..., weil kann er kommen.", "..., weil kommen kann er."], answer: "..., weil er kommen kann." },
  { id: 18, level: "B2", question: "Choose the correct Konjunktiv I form (reported speech): Er sagte, er ___ in Berlin.", options: ["ist", "sei", "wäre", "war"], answer: "sei" },
  { id: 19, level: "B2", question: "What does 'nichtsdestotrotz' mean?", options: ["furthermore", "nevertheless", "however much", "at least"], answer: "nevertheless" },
  { id: 20, level: "B2", question: "Which is a correct extended participial phrase?", options: ["Das von dem Künstler gemalte Bild ist wertvoll.", "Das gemalte von dem Künstler Bild ist wertvoll.", "Das Bild gemalte von dem Künstler ist wertvoll.", "Das Bild ist von dem Künstler gemalte wertvoll."], answer: "Das von dem Künstler gemalte Bild ist wertvoll." },
];

const levelOrder = ["A1", "A2", "B1", "B2"];

function determinePlacementLevel(answers) {
  const scores = { A1: { correct: 0, total: 0 }, A2: { correct: 0, total: 0 }, B1: { correct: 0, total: 0 }, B2: { correct: 0, total: 0 } };
  PLACEMENT_QUESTIONS.forEach(q => {
    scores[q.level].total++;
    if (answers[q.id] === q.answer) scores[q.level].correct++;
  });

  // Place at the FIRST level where score is not clearly strong (below 80%)
  for (const level of levelOrder) {
    const pct = scores[level].correct / scores[level].total;
    if (pct < 0.8) return level;
  }
  // If all levels scored >= 80%, place at B2
  return "B2";
}

export default function PlacementTest({ isDark }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState("survey"); // survey | test | result
  const [surveyIdx, setSurveyIdx] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [testAnswers, setTestAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [placedLevel, setPlacedLevel] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSurveyAnswer = (option) => {
    const updated = { ...surveyAnswers, [SURVEY_QUESTIONS[surveyIdx].id]: option };
    setSurveyAnswers(updated);
    if (surveyIdx < SURVEY_QUESTIONS.length - 1) {
      setSurveyIdx(surveyIdx + 1);
    } else {
      setPhase("test");
    }
  };

  const handleTestAnswer = (questionId, answer) => {
    const updated = { ...testAnswers, [questionId]: answer };
    setTestAnswers(updated);
    if (currentQ < PLACEMENT_QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const level = determinePlacementLevel(updated);
      setPlacedLevel(level);
      setPhase("result");
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    const existing = await base44.entities.UserSettings.list();
    if (existing.length > 0) {
      await base44.entities.UserSettings.update(existing[0].id, {
        cefr_level: placedLevel,
        onboarding_complete: true,
      });
    } else {
      await base44.entities.UserSettings.create({
        cefr_level: placedLevel,
        onboarding_complete: true,
        daily_goal_minutes: 20,
        study_streak: 0,
        total_study_minutes: 0,
        grammar_accuracy_score: 0,
        vocab_retention_score: 0,
        pronunciation_score: 0,
        theme: "light",
      });
    }
    queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    navigate(createPageUrl("Dashboard"));
  };

  // Auto-confirm: save and redirect immediately after test ends without waiting for button press
  React.useEffect(() => {
    if (phase === "result" && placedLevel && !saving) {
      handleConfirm();
    }
  }, [phase, placedLevel]);

  const progress = phase === "test" ? ((currentQ) / PLACEMENT_QUESTIONS.length) * 100 : 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className={cn("w-full max-w-xl rounded-3xl p-8 ring-1 shadow-xl", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>

        {/* SURVEY PHASE */}
        <AnimatePresence mode="wait">
          {phase === "survey" && (
            <motion.div key={`survey-${surveyIdx}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <div className="mb-6">
                <div className={cn("text-xs font-semibold uppercase tracking-widest mb-2", isDark ? "text-blue-400" : "text-blue-600")}>
                  Quick Survey · {surveyIdx + 1} / {SURVEY_QUESTIONS.length}
                </div>
                <h2 className={cn("text-xl font-bold mb-1", isDark ? "text-white" : "text-slate-900")}>
                  {SURVEY_QUESTIONS[surveyIdx].question}
                </h2>
              </div>
              <div className="space-y-3">
                {SURVEY_QUESTIONS[surveyIdx].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSurveyAnswer(opt)}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-2xl ring-1 text-sm font-medium transition-all",
                      isDark
                        ? "ring-slate-700 text-slate-300 hover:ring-blue-500 hover:bg-slate-800"
                        : "ring-slate-200 text-slate-700 hover:ring-blue-400 hover:bg-blue-50"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* TEST PHASE */}
          {phase === "test" && (
            <motion.div key={`test-${currentQ}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className={cn("text-xs font-semibold uppercase tracking-widest", isDark ? "text-blue-400" : "text-blue-600")}>
                    Placement Test · Question {currentQ + 1} / {PLACEMENT_QUESTIONS.length}
                  </span>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-lg", isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600")}>
                    {PLACEMENT_QUESTIONS[currentQ].level}
                  </span>
                </div>
                <div className={cn("h-1.5 rounded-full overflow-hidden", isDark ? "bg-slate-800" : "bg-slate-100")}>
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQ + 1) / PLACEMENT_QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              <h2 className={cn("text-lg font-bold mb-5", isDark ? "text-white" : "text-slate-900")}>
                {PLACEMENT_QUESTIONS[currentQ].question}
              </h2>
              <div className="space-y-3">
                {PLACEMENT_QUESTIONS[currentQ].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleTestAnswer(PLACEMENT_QUESTIONS[currentQ].id, opt)}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-2xl ring-1 text-sm font-medium transition-all",
                      isDark
                        ? "ring-slate-700 text-slate-300 hover:ring-blue-500 hover:bg-slate-800"
                        : "ring-slate-200 text-slate-700 hover:ring-blue-400 hover:bg-blue-50"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* RESULT PHASE */}
          {phase === "result" && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-slate-900")}>
                  Your Starting Level: <span className="text-blue-500">{placedLevel}</span>
                </h2>
                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                  {placedLevel === "A1" && "We'll start from the very beginning — no worries, everyone starts somewhere!"}
                  {placedLevel === "A2" && "You have a solid foundation. You'll start at elementary level."}
                  {placedLevel === "B1" && "Great work! You're at an intermediate level and ready for IB-relevant grammar."}
                  {placedLevel === "B2" && "Impressive! You're at upper-intermediate — let's sharpen your IB exam skills."}
                </p>
              </div>

              {/* Level breakdown */}
              <div className="grid grid-cols-4 gap-2 mb-8">
                {levelOrder.map((lvl) => {
                  const q = PLACEMENT_QUESTIONS.filter(q => q.level === lvl);
                  const correct = q.filter(q => testAnswers[q.id] === q.answer).length;
                  const pct = Math.round((correct / q.length) * 100);
                  const isPlaced = lvl === placedLevel;
                  return (
                    <div key={lvl} className={cn(
                      "rounded-2xl p-3 text-center ring-1",
                      isPlaced
                        ? "ring-blue-500 bg-blue-500/10"
                        : isDark ? "ring-slate-700 bg-slate-800" : "ring-slate-200 bg-slate-50"
                    )}>
                      <div className={cn("text-lg font-bold", isPlaced ? "text-blue-500" : isDark ? "text-white" : "text-slate-900")}>{lvl}</div>
                      <div className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>{correct}/{q.length} correct</div>
                      <div className={cn("text-xs font-semibold", pct >= 60 ? "text-emerald-500" : "text-slate-400")}>{pct}%</div>
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={handleConfirm}
                disabled={saving}
                className="w-full rounded-2xl bg-blue-500 hover:bg-blue-600 h-12 text-base font-semibold"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ChevronRight className="w-5 h-5 mr-2" />}
                Start Learning at {placedLevel}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}