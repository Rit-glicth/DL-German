import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const TOUR_STEPS = [
  {
    title: "Welcome to DeutschLernen",
    description: "You've been placed at your starting level. Let's take a quick tour of everything available to you.",
    position: "center",
    highlight: null,
  },
  {
    title: "Dashboard",
    description: "This is your home base. See your study streak, progress stats, and proficiency scores at a glance. Check here regularly to track your growth.",
    position: "right",
    highlight: "Dashboard",
  },
  {
    title: "Vocabulary",
    description: "Learn new German words using spaced repetition flashcards. The system automatically shows you words at the right time so they stick in your long-term memory.",
    position: "right",
    highlight: "Vocabulary",
  },
  {
    title: "Grammar Exercises",
    description: "Practice German grammar with targeted exercises. Each exercise focuses on a specific grammar rule and gives you instant feedback on your answers.",
    position: "right",
    highlight: "Grammar",
  },
  {
    title: "Grammar Notes",
    description: "Read detailed IB-focused grammar lessons. You can also generate new lessons on any grammar topic using AI — complete with tables, examples, and IB exam tips.",
    position: "right",
    highlight: "GrammarNotes",
  },
  {
    title: "Exam Style Practice Questions",
    description: "Practice with IB-style exam questions — multiple choice, gap fills, text analysis, essay prompts — covering all five IB themes. Perfect for exam preparation.",
    position: "right",
    highlight: "IBPractice",
  },
  {
    title: "Conversation",
    description: "Chat in German with an AI tutor. Choose a topic and difficulty level, and the AI will have a natural conversation with you, correcting your grammar as you go.",
    position: "right",
    highlight: "Conversation",
  },
  {
    title: "Pronunciation",
    description: "Work on your German pronunciation. Listen to native speakers and practice speaking — essential for the IB Oral examination.",
    position: "right",
    highlight: "Pronunciation",
  },
  {
    title: "Reading",
    description: "Read German texts at your level with comprehension questions. Great for building vocabulary in context and preparing for IB Paper 1.",
    position: "right",
    highlight: "Reading",
  },
  {
    title: "AI Helper",
    description: "Your personal IB German tutor available 24/7. Ask anything — grammar questions, past paper help, IB criteria explanations, model answers, or just general German questions.",
    position: "right",
    highlight: "AIHelper",
  },
  {
    title: "German Media",
    description: "Watch German cartoons, news, comedy, documentaries, nursery rhymes, and movie trailers. The best way to absorb the language naturally through real content.",
    position: "right",
    highlight: "GermanMedia",
  },
  {
    title: "You're all set",
    description: "That's the full tour. Start by reviewing your Dashboard, then head to Vocabulary or Grammar Exercises to begin your first session. Viel Erfolg — good luck!",
    position: "center",
    highlight: null,
  },
];

export default function OnboardingTour({ isDark, onComplete }) {
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;
  const isCentered = current.position === "center";

  const finish = async () => {
    localStorage.setItem("onboarding_tour_done", "1");
    // Mark onboarding as fully complete in DB
    try {
      const { base44 } = await import("@/api/base44Client");
      const user = await base44.auth.me();
      const settings = await base44.entities.UserSettings.filter({ created_by: user.email });
      if (settings.length > 0) {
        await base44.entities.UserSettings.update(settings[0].id, { onboarding_complete: true });
      }
    } catch (e) {}
    onComplete?.();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 pointer-events-auto"
          onClick={finish}
        />

        {/* Tooltip card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute pointer-events-auto w-80 rounded-2xl shadow-2xl ring-1 p-6",
            isDark ? "bg-slate-900 ring-slate-700" : "bg-white ring-slate-200",
            isCentered
              ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              : "top-1/2 left-80 ml-8 -translate-y-1/2"
          )}
          style={!isCentered ? { top: `${Math.min(10 + step * 7, 60)}%` } : {}}
        >
          {/* Progress dots */}
          <div className="flex items-center gap-1 mb-4">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step
                    ? "w-4 bg-blue-500"
                    : i < step
                    ? "w-1.5 bg-blue-300"
                    : isDark ? "w-1.5 bg-slate-700" : "w-1.5 bg-slate-200"
                )}
              />
            ))}
          </div>

          <button
            onClick={finish}
            className={cn("absolute top-4 right-4 rounded-lg p-1 transition-colors", isDark ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100")}
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className={cn("font-bold text-base mb-2 pr-6", isDark ? "text-white" : "text-slate-900")}>
            {current.title}
          </h3>
          <p className={cn("text-sm leading-relaxed mb-5", isDark ? "text-slate-300" : "text-slate-600")}>
            {current.description}
          </p>

          <div className="flex items-center justify-between gap-3">
            <span className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              {step + 1} / {TOUR_STEPS.length}
            </span>
            <div className="flex gap-2">
              {!isFirst && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStep(s => s - 1)}
                  className={cn("rounded-xl h-8 px-3", isDark ? "border-slate-700 text-slate-300" : "")}
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
              )}
              {isLast ? (
                <Button
                  size="sm"
                  onClick={finish}
                  className="rounded-xl h-8 px-4 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Start Learning!
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setStep(s => s + 1)}
                  className="rounded-xl h-8 px-4 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Next <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}