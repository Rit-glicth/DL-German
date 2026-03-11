import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GrammarExercise({ exercise, isDark, onAnswer, onNext }) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);

  if (!exercise) return null;

  const handleSubmit = () => {
    const isCorrect = answer.trim().toLowerCase() === exercise.correct_answer.toLowerCase();
    setResult({ correct: isCorrect });
    onAnswer(isCorrect, answer.trim());
  };

  const handleNext = () => {
    setAnswer("");
    setResult(null);
    setShowHint(false);
    onNext();
  };

  return (
    <motion.div
      key={exercise.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "rounded-2xl p-8 ring-1 max-w-2xl mx-auto",
        isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      )}
    >
      {/* Category & Type */}
      <div className="flex items-center gap-2 mb-6">
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
          isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
        )}>
          {exercise.level}
        </span>
        <span className={cn("text-[10px] uppercase tracking-wider", isDark ? "text-slate-500" : "text-slate-400")}>
          {exercise.topic}
        </span>
      </div>

      {/* Question */}
      <h3 className={cn("text-xl font-semibold mb-2", isDark ? "text-white" : "text-slate-900")}>
        {exercise.instruction}
      </h3>
      <p className={cn("text-lg mb-8 leading-relaxed", isDark ? "text-slate-300" : "text-slate-700")}>
        {exercise.question}
      </p>

      {/* Answer input */}
      <div className="flex items-center gap-3 mb-4">
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !result && handleSubmit()}
          placeholder="Type your answer..."
          disabled={!!result}
          className={cn(
            "text-lg rounded-xl",
            isDark ? "bg-slate-800 border-slate-700 text-white" : "",
            result?.correct === true && "border-emerald-500 ring-2 ring-emerald-500/20",
            result?.correct === false && "border-rose-500 ring-2 ring-rose-500/20"
          )}
        />
        {!result ? (
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="rounded-xl bg-blue-500 hover:bg-blue-600 px-6"
          >
            Check
          </Button>
        ) : (
          <Button onClick={handleNext} className="rounded-xl px-6">
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Hint */}
      {!result && exercise.hint && (
        <button
          onClick={() => setShowHint(!showHint)}
          className={cn("flex items-center gap-2 text-sm", isDark ? "text-amber-400" : "text-amber-600")}
        >
          <Lightbulb className="w-4 h-4" />
          {showHint ? exercise.hint : "Show hint"}
        </button>
      )}

      {/* Result feedback */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-6 p-4 rounded-xl",
              result.correct
                ? isDark ? "bg-emerald-500/10" : "bg-emerald-50"
                : isDark ? "bg-rose-500/10" : "bg-rose-50"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.correct ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500" />
              )}
              <span className={cn(
                "font-semibold",
                result.correct ? "text-emerald-600" : "text-rose-600"
              )}>
                {result.correct ? "Correct!" : "Not quite"}
              </span>
            </div>
            {!result.correct && (
              <p className={cn("text-sm", isDark ? "text-slate-300" : "text-slate-600")}>
                Correct answer: <strong>{exercise.correct_answer}</strong>
              </p>
            )}
            {exercise.explanation && (
              <p className={cn("text-sm mt-2", isDark ? "text-slate-400" : "text-slate-500")}>
                {exercise.explanation}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}