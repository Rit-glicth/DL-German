import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Volume2 } from "lucide-react";

export default function FlashCard({ word, isDark, onRate }) {
  const [flipped, setFlipped] = useState(false);

  if (!word) return null;

  const genderColor = {
    der: "text-blue-500",
    die: "text-rose-500",
    das: "text-emerald-500",
    "n/a": isDark ? "text-slate-400" : "text-slate-500",
  };

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        className="w-full max-w-md aspect-[3/2] cursor-pointer perspective-1000"
        onClick={() => setFlipped(!flipped)}
        whileTap={{ scale: 0.97 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={flipped ? "back" : "front"}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "w-full h-full rounded-3xl p-8 flex flex-col items-center justify-center ring-1",
              isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
            )}
          >
            {!flipped ? (
              <>
                {word.gender && word.gender !== "n/a" && (
                  <span className={cn("text-sm font-semibold mb-2", genderColor[word.gender])}>
                    {word.gender}
                  </span>
                )}
                <h2 className={cn("text-4xl font-bold mb-3", isDark ? "text-white" : "text-slate-900")}>
                  {word.german_word}
                </h2>
                <button
                  onClick={(e) => { e.stopPropagation(); speak(word.german_word); }}
                  className={cn("p-2 rounded-xl hover:bg-slate-100 transition", isDark && "hover:bg-slate-800")}
                >
                  <Volume2 className={cn("w-5 h-5", isDark ? "text-slate-400" : "text-slate-500")} />
                </button>
                <p className={cn("text-xs mt-4 uppercase tracking-wider", isDark ? "text-slate-600" : "text-slate-400")}>
                  Tap to reveal
                </p>
              </>
            ) : (
              <>
                <h2 className={cn("text-3xl font-bold mb-3", isDark ? "text-white" : "text-slate-900")}>
                  {word.english_translation}
                </h2>
                {word.example_sentence && (
                  <div className="mt-4 text-center">
                    <p className={cn("text-sm italic", isDark ? "text-slate-400" : "text-slate-500")}>
                      "{word.example_sentence}"
                    </p>
                    {word.example_translation && (
                      <p className={cn("text-xs mt-1", isDark ? "text-slate-600" : "text-slate-400")}>
                        {word.example_translation}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <span className={cn("text-xs font-medium mr-2", isDark ? "text-slate-500" : "text-slate-400")}>
            How well did you know this?
          </span>
          {[
            { label: "Again", value: 0, color: "bg-rose-500 hover:bg-rose-600" },
            { label: "Hard", value: 2, color: "bg-amber-500 hover:bg-amber-600" },
            { label: "Good", value: 3, color: "bg-blue-500 hover:bg-blue-600" },
            { label: "Easy", value: 5, color: "bg-emerald-500 hover:bg-emerald-600" },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => { onRate(btn.value); setFlipped(false); }}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium text-white transition-all",
                btn.color
              )}
            >
              {btn.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}