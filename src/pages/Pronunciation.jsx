import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Volume2, RefreshCw, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import TeacherAddContentDrawer from "../components/admin/TeacherAddContentDrawer";

const sampleSentences = {
  A1: [
    { german: "Guten Morgen, wie geht es Ihnen?", english: "Good morning, how are you?" },
    { german: "Ich heiße Anna und komme aus Berlin.", english: "My name is Anna and I come from Berlin." },
    { german: "Können Sie mir bitte helfen?", english: "Can you please help me?" },
    { german: "Ich möchte einen Kaffee, bitte.", english: "I would like a coffee, please." },
    { german: "Wo ist der Bahnhof?", english: "Where is the train station?" },
  ],
  A2: [
    { german: "Gestern bin ich ins Kino gegangen.", english: "Yesterday I went to the cinema." },
    { german: "Ich habe mich auf die Prüfung vorbereitet.", english: "I prepared for the exam." },
    { german: "Er hat sich die Hände gewaschen.", english: "He washed his hands." },
    { german: "Wir müssen uns beeilen, weil der Zug bald abfährt.", english: "We need to hurry because the train leaves soon." },
  ],
  B1: [
    { german: "Obwohl es regnete, gingen wir spazieren.", english: "Although it was raining, we went for a walk." },
    { german: "Das Buch, das ich lese, ist sehr spannend.", english: "The book that I'm reading is very exciting." },
    { german: "Wenn ich mehr Geld hätte, würde ich reisen.", english: "If I had more money, I would travel." },
  ],
  B2: [
    { german: "Es wird behauptet, dass die Wirtschaft sich erholen werde.", english: "It is claimed that the economy will recover." },
    { german: "Trotz der Schwierigkeiten gelang es ihm, das Projekt abzuschließen.", english: "Despite the difficulties, he managed to complete the project." },
  ],
};

export default function Pronunciation({ isDark, isTeacher }) {
  const [level, setLevel] = useState("A1");
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const recognitionRef = useRef(null);

  const sentences = sampleSentences[level] || [];
  const current = sentences[sentenceIdx];

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  };

  const startRecording = () => {
    setTranscript("");
    setFeedback(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedback({ error: "Speech recognition is not supported in this browser. Please use Chrome." });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setIsRecording(false);
      analyzePronunciation(result);
    };

    recognition.onerror = (event) => {
      setIsRecording(false);
      setFeedback({ error: `Recognition error: ${event.error}. Try again.` });
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const analyzePronunciation = async (spokenText) => {
    setAnalyzing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Compare the student's spoken German with the target sentence.

Target: "${current.german}"
Spoken: "${spokenText}"

Analyze:
1. Overall accuracy (0-100%)
2. Specific word differences
3. Pronunciation tips for German sounds (umlauts, ch, r, etc.)
4. Encouragement

Be specific about which words were different.`,
      response_json_schema: {
        type: "object",
        properties: {
          accuracy: { type: "number" },
          word_comparison: {
            type: "array",
            items: {
              type: "object",
              properties: {
                target: { type: "string" },
                spoken: { type: "string" },
                correct: { type: "boolean" },
              },
            },
          },
          tips: { type: "array", items: { type: "string" } },
          encouragement: { type: "string" },
        },
      },
    });
    setFeedback(result);
    setAnalyzing(false);
  };

  const nextSentence = () => {
    setSentenceIdx((prev) => (prev + 1) % sentences.length);
    setTranscript("");
    setFeedback(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
            Pronunciation
          </h1>
          <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
            Practice speaking and get feedback
          </p>
        </div>
        {isTeacher && <TeacherAddContentDrawer isDark={isDark} defaultTab="vocab" />}
      </div>
      <div className="flex items-center gap-3">
        <Select value={level} onValueChange={(v) => { setLevel(v); setSentenceIdx(0); setFeedback(null); setTranscript(""); }}>
          <SelectTrigger className={cn("w-40 rounded-xl", isDark ? "bg-slate-900 border-slate-800 text-white" : "")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A1">A1</SelectItem>
            <SelectItem value="A2">A2</SelectItem>
            <SelectItem value="B1">B1</SelectItem>
            <SelectItem value="B2">B2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {current && (
        <div className={cn(
          "rounded-2xl p-8 ring-1 text-center space-y-6",
          isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
        )}>
          <p className={cn("text-xs uppercase tracking-wider", isDark ? "text-slate-500" : "text-slate-400")}>
            Listen, then repeat
          </p>
          <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-slate-900")}>
            {current.german}
          </h2>
          <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
            {current.english}
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => speak(current.german)}
              variant="outline"
              className={cn("rounded-xl", isDark ? "border-slate-700" : "")}
            >
              <Volume2 className="w-4 h-4 mr-2" /> Listen
            </Button>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={analyzing}
              className={cn(
                "rounded-xl px-6",
                isRecording
                  ? "bg-rose-500 hover:bg-rose-600"
                  : "bg-blue-500 hover:bg-blue-600"
              )}
            >
              {isRecording ? (
                <><MicOff className="w-4 h-4 mr-2" /> Stop</>
              ) : (
                <><Mic className="w-4 h-4 mr-2" /> Record</>
              )}
            </Button>
            <Button
              onClick={nextSentence}
              variant="outline"
              className={cn("rounded-xl", isDark ? "border-slate-700" : "")}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Next
            </Button>
          </div>

          {/* Recording animation */}
          {isRecording && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex items-center justify-center"
            >
              <div className="w-4 h-4 rounded-full bg-rose-500" />
              <span className={cn("ml-3 text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                Listening...
              </span>
            </motion.div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className={cn("p-4 rounded-xl", isDark ? "bg-slate-800" : "bg-slate-50")}>
              <p className={cn("text-xs uppercase tracking-wider mb-1", isDark ? "text-slate-500" : "text-slate-400")}>
                You said:
              </p>
              <p className={cn("text-lg font-medium", isDark ? "text-white" : "text-slate-900")}>
                {transcript}
              </p>
            </div>
          )}

          {analyzing && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className={cn("w-4 h-4 animate-spin", isDark ? "text-slate-400" : "text-slate-500")} />
              <span className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                Analyzing pronunciation...
              </span>
            </div>
          )}

          {/* Feedback */}
          {feedback && !feedback.error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 text-left"
            >
              {/* Score */}
              <div className={cn(
                "p-4 rounded-xl flex items-center justify-between",
                feedback.accuracy >= 80
                  ? isDark ? "bg-emerald-500/10" : "bg-emerald-50"
                  : feedback.accuracy >= 50
                  ? isDark ? "bg-amber-500/10" : "bg-amber-50"
                  : isDark ? "bg-rose-500/10" : "bg-rose-50"
              )}>
                <span className={cn("font-semibold", isDark ? "text-white" : "text-slate-900")}>
                  Accuracy
                </span>
                <span className={cn(
                  "text-2xl font-bold",
                  feedback.accuracy >= 80 ? "text-emerald-500" : feedback.accuracy >= 50 ? "text-amber-500" : "text-rose-500"
                )}>
                  {feedback.accuracy}%
                </span>
              </div>

              {/* Word comparison */}
              {feedback.word_comparison?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {feedback.word_comparison.map((w, i) => (
                    <span
                      key={i}
                      className={cn(
                        "px-2 py-1 rounded-lg text-sm font-medium",
                        w.correct
                          ? isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                          : isDark ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-700"
                      )}
                    >
                      {w.correct ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
                      {w.target}
                    </span>
                  ))}
                </div>
              )}

              {/* Tips */}
              {feedback.tips?.length > 0 && (
                <div className={cn("p-4 rounded-xl space-y-2", isDark ? "bg-slate-800" : "bg-slate-50")}>
                  <p className={cn("text-xs uppercase tracking-wider", isDark ? "text-slate-500" : "text-slate-400")}>Tips</p>
                  {feedback.tips.map((tip, i) => (
                    <p key={i} className={cn("text-sm", isDark ? "text-slate-300" : "text-slate-600")}>
                      • {tip}
                    </p>
                  ))}
                </div>
              )}

              {feedback.encouragement && (
                <p className={cn("text-sm italic text-center", isDark ? "text-slate-400" : "text-slate-500")}>
                  {feedback.encouragement}
                </p>
              )}
            </motion.div>
          )}

          {feedback?.error && (
            <p className="text-sm text-rose-500">{feedback.error}</p>
          )}
        </div>
      )}
    </div>
  );
}