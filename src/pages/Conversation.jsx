import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Send, Loader2, Plus, Languages, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import TeacherAddContentDrawer from "../components/admin/TeacherAddContentDrawer";

const topics = ["Free Conversation", "At the Restaurant", "Shopping", "Travel", "At School", "Hobbies", "Weather", "Family"];
const grammarFoci = {
  A1: ["Present Tense", "Basic Questions", "Nominative Case"],
  A2: ["Perfekt Tense", "Dative Case", "Separable Verbs"],
  B1: ["Konjunktiv II", "Passive Voice", "Relative Clauses"],
  B2: ["Complex Sentences", "Reported Speech", "Advanced Connectors"],
};

export default function Conversation({ isDark, isTeacher }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [level, setLevel] = useState("A1");
  const [topic, setTopic] = useState("Free Conversation");
  const [focus, setFocus] = useState("");
  const [started, setStarted] = useState(false);
  const scrollRef = useRef(null);

  const { data: settings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || null;
    },
  });

  useEffect(() => {
    if (settings?.cefr_level) setLevel(settings.cefr_level);
  }, [settings]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversation = async () => {
    setStarted(true);
    setSending(true);
    const systemMessage = `You are a friendly German conversation partner at CEFR level ${level}. 
Topic: ${topic}. ${focus ? `Grammar focus: ${focus}.` : ""}
Start the conversation in German. Keep responses at appropriate ${level} complexity.
After each response, if the user made grammar errors, briefly correct them with this format:
💡 Correction: ❌ [error] → ✅ [correct form]
Then continue the conversation naturally. Be encouraging.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: systemMessage + "\n\nStart the conversation with a greeting and a question.",
      model: "meta-llama/llama-4-scout-17b-16e",
    });

    setMessages([{ role: "assistant", content: result }]);
    setSending(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setSending(true);

    const history = messages.map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`).join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      model: "meta-llama/llama-4-scout-17b-16e",
      prompt: `You are a German conversation tutor at level ${level}. Topic: ${topic}. ${focus ? `Grammar focus: ${focus}.` : ""}

Previous conversation:
${history}

Student: ${userMsg}

Respond naturally in German at ${level} level. If the student made grammar errors, correct them briefly using:
💡 ❌ [error] → ✅ [correct]
Then continue the conversation. Keep it engaging. Use short paragraphs.`,
    });

    setMessages((prev) => [...prev, { role: "assistant", content: result }]);
    setSending(false);
  };

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
              Conversation
            </h1>
            <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
              Practice speaking German with an AI tutor
            </p>
          </div>
          {isTeacher && <TeacherAddContentDrawer isDark={isDark} defaultTab="vocab" />}
        </div>
        <div className={cn(
          "rounded-2xl p-8 ring-1 space-y-6",
          isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
        )}>
          <div>
            <label className={cn("text-sm font-medium mb-2 block", isDark ? "text-slate-300" : "text-slate-700")}>
              Difficulty Level
            </label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1">A1 — Beginner</SelectItem>
                <SelectItem value="A2">A2 — Elementary</SelectItem>
                <SelectItem value="B1">B1 — Intermediate</SelectItem>
                <SelectItem value="B2">B2 — Upper Intermediate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={cn("text-sm font-medium mb-2 block", isDark ? "text-slate-300" : "text-slate-700")}>
              Conversation Topic
            </label>
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all ring-1",
                    topic === t
                      ? "bg-blue-500 text-white ring-blue-500"
                      : isDark
                      ? "bg-slate-800 text-slate-300 ring-slate-700"
                      : "bg-white text-slate-600 ring-slate-200"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={cn("text-sm font-medium mb-2 block", isDark ? "text-slate-300" : "text-slate-700")}>
              Grammar Focus (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {(grammarFoci[level] || []).map((f) => (
                <button
                  key={f}
                  onClick={() => setFocus(focus === f ? "" : f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all ring-1",
                    focus === f
                      ? "bg-violet-500 text-white ring-violet-500"
                      : isDark
                      ? "bg-slate-800 text-slate-300 ring-slate-700"
                      : "bg-white text-slate-600 ring-slate-200"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={startConversation} className="w-full rounded-xl bg-blue-500 hover:bg-blue-600">
            <MessageSquare className="w-4 h-4 mr-2" />
            Start Conversation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className={cn("text-xl font-bold", isDark ? "text-white" : "text-slate-900")}>
            German Conversation
          </h1>
          <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
            {level} · {topic} {focus && `· ${focus}`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setStarted(false); setMessages([]); }}
          className={cn("rounded-xl", isDark ? "text-slate-400" : "text-slate-500")}
        >
          <Plus className="w-4 h-4 mr-1" /> New Chat
        </Button>
      </div>

      {/* Messages */}
      <div className={cn(
        "flex-1 overflow-y-auto rounded-2xl p-6 ring-1 space-y-4 mb-4",
        isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      )}>
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] rounded-2xl px-5 py-3",
              msg.role === "user"
                ? "bg-blue-500 text-white"
                : isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-800"
            )}>
              {msg.role === "user" ? (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              ) : (
                <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className={cn("rounded-2xl px-5 py-3", isDark ? "bg-slate-800" : "bg-slate-100")}>
              <Loader2 className={cn("w-4 h-4 animate-spin", isDark ? "text-slate-400" : "text-slate-500")} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Schreib etwas auf Deutsch..."
          className={cn("rounded-xl text-sm flex-1", isDark ? "bg-slate-900 border-slate-800 text-white" : "")}
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="rounded-xl bg-blue-500 hover:bg-blue-600 px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}