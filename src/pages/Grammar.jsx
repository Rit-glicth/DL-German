import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Languages, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GrammarExercise from "../components/grammar/GrammarExercise";
import TeacherAddContentDrawer from "../components/admin/TeacherAddContentDrawer";

const grammarTopics = {
  A1: ["Nominative & Accusative", "Articles", "Verb Conjugation", "Modal Verbs", "Word Order"],
  A2: ["Dative Case", "Separable Verbs", "Perfekt Tense", "Reflexive Verbs", "Subordinate Clauses (weil, dass)"],
  B1: ["Genitive Case", "Passive Voice", "Relative Clauses", "Konjunktiv II", "Wechselpräpositionen"],
  B2: ["Complex Subordinate Clauses", "Nominalization", "Advanced Connectors", "Reported Speech"],
};

export default function Grammar({ isDark, isTeacher }) {
  const [level, setLevel] = useState("A1");
  const [topic, setTopic] = useState("");
  const [exercises, setExercises] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const queryClient = useQueryClient();

  const errorMutation = useMutation({
    mutationFn: (data) => base44.entities.GrammarError.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grammarErrors"] }),
  });

  const lessonMutation = useMutation({
    mutationFn: (data) => base44.entities.LessonProgress.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lessonProgress"] }),
  });

  const generateExercises = async () => {
    setLoading(true);
    setScore({ correct: 0, total: 0 });
    setCurrentIdx(0);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 5 German grammar exercises for level ${level}, topic: "${topic}".
Each exercise should test the student's understanding of this grammar point.
Mix fill-in-the-blank, translation, and correction exercises.
Make them progressively harder.
All German text should use proper umlauts (ä, ö, ü, ß).`,
      response_json_schema: {
        type: "object",
        properties: {
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                instruction: { type: "string" },
                question: { type: "string" },
                correct_answer: { type: "string" },
                hint: { type: "string" },
                explanation: { type: "string" },
                error_type: { type: "string" },
              },
            },
          },
        },
      },
    });
    setExercises(
      (result.exercises || []).map((e, i) => ({ ...e, id: i, level, topic }))
    );
    setLoading(false);
  };

  const handleAnswer = (correct, userAnswer) => {
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
    if (!correct && exercises[currentIdx] && !isTeacher) {
      errorMutation.mutate({
        error_type: exercises[currentIdx].error_type || "other",
        grammar_category: level,
        user_input: userAnswer,
        correct_form: exercises[currentIdx].correct_answer,
        explanation: exercises[currentIdx].explanation,
        context: "grammar_exercise",
      });
    }
  };

  const handleNext = () => {
    if (currentIdx >= exercises.length - 1) {
      // Lesson complete
      if (!isTeacher) {
        lessonMutation.mutate({
          lesson_type: "grammar",
          cefr_level: level,
          topic,
          score: Math.round((score.correct / score.total) * 100),
          errors_made: score.total - score.correct,
          total_questions: score.total,
          completed: true,
        });
      }
      setExercises([]);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const sessionComplete = exercises.length > 0 && currentIdx >= exercises.length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
            Grammar
          </h1>
          <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
            Targeted exercises from A1 to B2
          </p>
        </div>
        {isTeacher && <TeacherAddContentDrawer isDark={isDark} defaultTab="grammar" />}
      </div>
      {exercises.length === 0 ? (
        <div className={cn(
          "rounded-2xl p-8 ring-1 max-w-2xl mx-auto",
          isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
        )}>
          {sessionComplete && score.total > 0 && (
            <div className={cn("mb-8 p-6 rounded-xl text-center", isDark ? "bg-blue-500/10" : "bg-blue-50")}>
              <h3 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>
                Session Complete!
              </h3>
              <p className={cn("text-lg mt-2", isDark ? "text-slate-300" : "text-slate-600")}>
                Score: {score.correct}/{score.total} ({Math.round((score.correct / score.total) * 100)}%)
              </p>
            </div>
          )}

          <h3 className={cn("text-lg font-semibold mb-6", isDark ? "text-white" : "text-slate-900")}>
            Choose your practice
          </h3>
          <div className="space-y-4">
            <div>
              <label className={cn("text-sm font-medium mb-2 block", isDark ? "text-slate-300" : "text-slate-700")}>
                CEFR Level
              </label>
              <Select value={level} onValueChange={(v) => { setLevel(v); setTopic(""); }}>
                <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(grammarTopics).map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={cn("text-sm font-medium mb-2 block", isDark ? "text-slate-300" : "text-slate-700")}>
                Grammar Topic
              </label>
              <div className="flex flex-wrap gap-2">
                {grammarTopics[level].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all ring-1",
                      topic === t
                        ? "bg-blue-500 text-white ring-blue-500"
                        : isDark
                        ? "bg-slate-800 text-slate-300 ring-slate-700 hover:ring-slate-600"
                        : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={generateExercises}
              disabled={!topic || loading}
              className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating exercises...
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4 mr-2" />
                  Start Practice
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
              Exercise {currentIdx + 1} of {exercises.length} · Score: {score.correct}/{score.total}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExercises([])}
              className={cn("rounded-xl", isDark ? "text-slate-400" : "text-slate-500")}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> New Session
            </Button>
          </div>
          {/* Progress bar */}
          <div className={cn("h-1.5 rounded-full", isDark ? "bg-slate-800" : "bg-slate-200")}>
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${((currentIdx) / exercises.length) * 100}%` }}
            />
          </div>
          <GrammarExercise
            exercise={exercises[currentIdx]}
            isDark={isDark}
            onAnswer={handleAnswer}
            onNext={handleNext}
          />
        </div>
      )}
    </div>
  );
}