import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { BookMarked, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import TeacherAddContentDrawer from "../components/admin/TeacherAddContentDrawer";

const readingTopics = ["Daily Life", "Travel", "Culture", "Science", "History", "Nature", "Food", "Technology"];

export default function Reading({ isDark, isTeacher }) {
  // Teachers can use this page fully; their data is not persisted in analytics
  const [level, setLevel] = useState("A1");
  const [topic, setTopic] = useState("Daily Life");
  const [passage, setPassage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordInfo, setWordInfo] = useState(null);
  const [loadingWord, setLoadingWord] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [answers, setAnswers] = useState({});

  const generatePassage = async () => {
    setLoading(true);
    setPassage(null);
    setShowTranslation(false);
    setAnswers({});
    setSelectedWord(null);
    setWordInfo(null);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a German reading passage for CEFR level ${level} about "${topic}".

Include:
1. A title in German
2. A passage of 100-200 words (appropriate for ${level})
3. English translation
4. 3 comprehension questions (in German with answer choices)
5. Highlight 5 important vocabulary words from the text
6. Mark any notable grammar features (e.g. relative clauses, passive voice) present in the text

Use proper German (ä, ö, ü, ß).`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          german_text: { type: "string" },
          english_translation: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correct_index: { type: "number" },
              },
            },
          },
          vocabulary: {
            type: "array",
            items: {
              type: "object",
              properties: {
                german: { type: "string" },
                english: { type: "string" },
                gender: { type: "string" },
              },
            },
          },
          grammar_features: { type: "array", items: { type: "string" } },
        },
      },
    });

    setPassage(result);
    setLoading(false);
  };

  const lookupWord = async (word) => {
    setSelectedWord(word);
    setLoadingWord(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Give me a quick dictionary entry for the German word "${word}":
- English translation
- Part of speech
- Gender (if noun)
- Example sentence
Be concise.`,
      response_json_schema: {
        type: "object",
        properties: {
          word: { type: "string" },
          translation: { type: "string" },
          part_of_speech: { type: "string" },
          gender: { type: "string" },
          example: { type: "string" },
        },
      },
    });
    setWordInfo(result);
    setLoadingWord(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
            Reading
          </h1>
          <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
            Read German texts with integrated dictionary and grammar notes
          </p>
        </div>
        {isTeacher && <TeacherAddContentDrawer isDark={isDark} defaultTab="vocab" />}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className={cn("w-32 rounded-xl", isDark ? "bg-slate-900 border-slate-800 text-white" : "")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A1">A1</SelectItem>
            <SelectItem value="A2">A2</SelectItem>
            <SelectItem value="B1">B1</SelectItem>
            <SelectItem value="B2">B2</SelectItem>
          </SelectContent>
        </Select>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className={cn("w-40 rounded-xl", isDark ? "bg-slate-900 border-slate-800 text-white" : "")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {readingTopics.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={generatePassage} disabled={loading} className="rounded-xl bg-blue-500 hover:bg-blue-600">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookMarked className="w-4 h-4 mr-2" />}
          {passage ? "New Passage" : "Generate"}
        </Button>
      </div>

      {passage && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {/* Main text */}
          <div className="lg:col-span-2 space-y-4">
            <div className={cn(
              "rounded-2xl p-8 ring-1",
              isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
            )}>
              <h2 className={cn("text-xl font-bold mb-4", isDark ? "text-white" : "text-slate-900")}>
                {passage.title}
              </h2>
              <div className={cn("text-base leading-relaxed", isDark ? "text-slate-300" : "text-slate-700")}>
                {passage.german_text?.split(/\s+/).map((word, i) => (
                  <span
                    key={i}
                    onClick={() => lookupWord(word.replace(/[.,!?;:]/g, ""))}
                    className={cn(
                      "cursor-pointer hover:underline hover:decoration-blue-500 transition",
                      selectedWord === word.replace(/[.,!?;:]/g, "") && "bg-blue-500/20 rounded px-0.5"
                    )}
                  >
                    {word}{" "}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={cn("mt-4 text-sm font-medium", isDark ? "text-blue-400" : "text-blue-600")}
              >
                {showTranslation ? "Hide" : "Show"} Translation
              </button>
              {showTranslation && (
                <p className={cn("mt-2 text-sm italic", isDark ? "text-slate-400" : "text-slate-500")}>
                  {passage.english_translation}
                </p>
              )}
            </div>

            {/* Questions */}
            <div className={cn(
              "rounded-2xl p-6 ring-1",
              isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
            )}>
              <h3 className={cn("text-sm font-semibold mb-4", isDark ? "text-slate-300" : "text-slate-700")}>
                Comprehension Questions
              </h3>
              <div className="space-y-4">
                {passage.questions?.map((q, qi) => (
                  <div key={qi}>
                    <p className={cn("text-sm font-medium mb-2", isDark ? "text-white" : "text-slate-900")}>
                      {qi + 1}. {q.question}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {q.options?.map((opt, oi) => {
                        const selected = answers[qi] === oi;
                        const isCorrect = q.correct_index === oi;
                        const answered = answers[qi] !== undefined;
                        return (
                          <button
                            key={oi}
                            onClick={() => !answered && setAnswers({ ...answers, [qi]: oi })}
                            disabled={answered}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-sm ring-1 transition-all",
                              answered && isCorrect
                                ? "bg-emerald-500/10 text-emerald-600 ring-emerald-300"
                                : answered && selected && !isCorrect
                                ? "bg-rose-500/10 text-rose-600 ring-rose-300"
                                : selected
                                ? "bg-blue-500 text-white ring-blue-500"
                                : isDark
                                ? "bg-slate-800 text-slate-300 ring-slate-700"
                                : "bg-white text-slate-600 ring-slate-200"
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Word lookup */}
            {(selectedWord || wordInfo) && (
              <div className={cn(
                "rounded-2xl p-5 ring-1",
                isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
              )}>
                <h3 className={cn("text-xs uppercase tracking-wider mb-3", isDark ? "text-slate-500" : "text-slate-400")}>
                  Dictionary
                </h3>
                {loadingWord ? (
                  <Loader2 className={cn("w-4 h-4 animate-spin", isDark ? "text-slate-400" : "text-slate-500")} />
                ) : wordInfo ? (
                  <div className="space-y-2">
                    <p className={cn("text-lg font-bold", isDark ? "text-white" : "text-slate-900")}>
                      {wordInfo.gender && <span className="text-sm text-blue-500 mr-1">{wordInfo.gender}</span>}
                      {wordInfo.word}
                    </p>
                    <p className={cn("text-sm", isDark ? "text-slate-300" : "text-slate-600")}>
                      {wordInfo.translation}
                    </p>
                    <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
                      {wordInfo.part_of_speech}
                    </p>
                    {wordInfo.example && (
                      <p className={cn("text-xs italic mt-2", isDark ? "text-slate-400" : "text-slate-500")}>
                        "{wordInfo.example}"
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Key vocabulary */}
            <div className={cn(
              "rounded-2xl p-5 ring-1",
              isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
            )}>
              <h3 className={cn("text-xs uppercase tracking-wider mb-3", isDark ? "text-slate-500" : "text-slate-400")}>
                Key Vocabulary
              </h3>
              <div className="space-y-2">
                {passage.vocabulary?.map((v, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-slate-900")}>
                      {v.gender && <span className="text-xs text-blue-500 mr-1">{v.gender}</span>}
                      {v.german}
                    </span>
                    <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                      {v.english}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grammar notes */}
            {passage.grammar_features?.length > 0 && (
              <div className={cn(
                "rounded-2xl p-5 ring-1",
                isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
              )}>
                <h3 className={cn("text-xs uppercase tracking-wider mb-3", isDark ? "text-slate-500" : "text-slate-400")}>
                  Grammar Features
                </h3>
                <div className="space-y-1">
                  {passage.grammar_features.map((g, i) => (
                    <p key={i} className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                      • {g}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {!passage && !loading && (
        <div className={cn(
          "rounded-2xl p-12 text-center ring-1",
          isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
        )}>
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <BookMarked className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-slate-900")}>
            Select a level and topic to begin reading
          </h3>
          <p className={cn("text-sm mt-2", isDark ? "text-slate-400" : "text-slate-500")}>
            Click on any word in the text for an instant dictionary lookup
          </p>
        </div>
      )}
    </div>
  );
}