import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Send, Loader2, Plus, Bot, Sparkles, ExternalLink, Youtube, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_PROMPTS = [
  "Explain the dative case for IB Paper 1",
  "What grammar do I need for IB German B SL?",
  "Give me a model answer for a Paper 1 essay",
  "Explain Konjunktiv II with examples",
  "What are the IB German B assessment criteria?",
  "How do I use relative clauses?",
  "Explain the Perfekt vs Präteritum",
  "Give me vocabulary for the 'Identities' theme",
];

export default function AIHelper({ isDark }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput("");
    setSending(true);

    const userMsg = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const { base44 } = await import("@/api/base44Client");

    const conversationContext = newMessages
      .map(m => `${m.role === "user" ? "Student" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const prompt = `You are an expert IB German study assistant and examiner. You help students with grammar, IB exam technique, past paper questions, and German language concepts.

ALWAYS:
- Structure responses clearly with headers (## and ###)
- Use **bold** for German words and examples
- Provide English translations in italics
- Use markdown tables for grammar charts (they render beautifully)
- Be specific about IB criteria (Paper 1, Paper 2, Oral) when relevant
- Reference the 5 IB themes: Identities, Experiences, Human Ingenuity, Social Organisation, Sharing the Planet
- For vocabulary lists, use clean markdown tables instead of raw pipes
- Correct any German mistakes the student makes

Conversation so far:
${conversationContext}

Respond only as the Assistant. Give a helpful, detailed, well-structured response to the latest student message.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt, model: "meta-llama/llama-4-scout-17b-16e" });
    setMessages([...newMessages, { role: "assistant", content: result }]);
    setSending(false);
  };

  const newConversation = () => {
    setMessages([]);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={cn("text-xl font-bold", isDark ? "text-white" : "text-slate-900")}>
              IB German Assistant
            </h1>
            <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Grammar · IB Exam Technique · Past Paper Help · Resources
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={newConversation}
          className={cn("rounded-xl", isDark ? "text-slate-400" : "text-slate-500")}>
          <Plus className="w-4 h-4 mr-1" /> New Chat
        </Button>
      </div>

      {/* Resource bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {[
          { label: "DW Learn German", url: "https://learngerman.dw.com", icon: ExternalLink },
          { label: "Goethe Institut", url: "https://www.goethe.de/en/spr/ueb.html", icon: ExternalLink },
          { label: "Easy German", url: "https://www.youtube.com/@EasyGerman", icon: Youtube },
          { label: "Learn German with Anja", url: "https://www.youtube.com/@LearnGermanwithAnja", icon: Youtube },
          { label: "Deutsch für Euch", url: "https://www.youtube.com/@DeutschFuerEuch", icon: Youtube },
          { label: "Herr Antrim", url: "https://www.youtube.com/@MrLAntrim", icon: Youtube },
          { label: "YourGermanTeacher", url: "https://www.youtube.com/@yourgermanteacher", icon: Youtube },
          { label: "Lingoni GERMAN", url: "https://www.youtube.com/@lingoniGERMAN", icon: Youtube },
          { label: "Deutsch mit Marija", url: "https://www.youtube.com/@DeutschmitMarija", icon: Youtube },
          { label: "smarterGerman", url: "https://www.youtube.com/@smarterGerman", icon: Youtube },
          { label: "Get Germanized", url: "https://www.youtube.com/@GetGermanized", icon: Youtube },
        ].map((r) => (
          <a
            key={r.label}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ring-1 transition-colors",
              isDark
                ? "ring-slate-700 text-slate-400 hover:text-slate-200 hover:ring-slate-600"
                : "ring-slate-200 text-slate-500 hover:text-slate-700 hover:ring-slate-300"
            )}
          >
            <r.icon className="w-3 h-3" />
            {r.label}
          </a>
        ))}
      </div>

      {/* Messages */}
      <div className={cn(
        "flex-1 overflow-y-auto rounded-2xl p-6 ring-1 mb-4 space-y-4",
        isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      )}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-violet-500" />
            </div>
            <h3 className={cn("font-semibold text-lg mb-2", isDark ? "text-white" : "text-slate-900")}>
              Ask me anything about German
            </h3>
            <p className={cn("text-sm mb-8 max-w-md", isDark ? "text-slate-400" : "text-slate-500")}>
              IB exam questions, grammar explanations, past paper help, or general German language questions
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className={cn(
                    "text-left text-xs px-4 py-3 rounded-xl ring-1 transition-all",
                    isDark
                      ? "ring-slate-700 text-slate-300 hover:ring-violet-500/40 hover:bg-slate-800"
                      : "ring-slate-200 text-slate-600 hover:ring-violet-300 hover:bg-violet-50"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role !== "user" && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded-2xl px-5 py-3",
              msg.role === "user"
                ? "bg-blue-500 text-white"
                : isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-800"
            )}>
              {msg.role === "user" ? (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              ) : (
                <ReactMarkdown
                  className="text-sm max-w-none"
                  components={{
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4 rounded-xl ring-1 ring-slate-200">
                        <table className="w-full text-sm border-collapse">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className={isDark ? "bg-slate-700" : "bg-slate-50"}>{children}</thead>,
                    tbody: ({ children }) => <tbody className={isDark ? "divide-y divide-slate-700" : "divide-y divide-slate-100"}>{children}</tbody>,
                    tr: ({ children }) => <tr className={isDark ? "hover:bg-slate-700/60" : "hover:bg-blue-50/40 transition-colors"}>{children}</tr>,
                    th: ({ children }) => <th className={cn("px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider", isDark ? "text-blue-400" : "text-blue-700")}>{children}</th>,
                    td: ({ children }) => <td className={cn("px-4 py-2.5 text-sm", isDark ? "text-slate-300" : "text-slate-700")}>{children}</td>,
                    blockquote: ({ children }) => (
                      <blockquote className={cn("border-l-4 border-blue-400 pl-3 py-1 my-2 rounded-r-lg text-sm", isDark ? "bg-blue-500/10 text-slate-300" : "bg-blue-50 text-slate-700")}>{children}</blockquote>
                    ),
                    h2: ({ children }) => <h2 className={cn("text-base font-bold mt-4 mb-2", isDark ? "text-white" : "text-slate-900")}>{children}</h2>,
                    h3: ({ children }) => <h3 className={cn("text-sm font-semibold mt-3 mb-1.5", isDark ? "text-blue-400" : "text-blue-700")}>{children}</h3>,
                    p: ({ children }) => <p className={cn("leading-relaxed my-1.5 text-sm", isDark ? "text-slate-300" : "text-slate-700")}>{children}</p>,
                    strong: ({ children }) => <strong className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>{children}</strong>,
                    ul: ({ children }) => <ul className="my-2 space-y-1 pl-1">{children}</ul>,
                    li: ({ children }) => (
                      <li className={cn("flex items-start gap-2 text-sm", isDark ? "text-slate-300" : "text-slate-700")}>
                        <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0", isDark ? "bg-blue-400" : "bg-blue-500")} />
                        <span>{children}</span>
                      </li>
                    ),
                    code: ({ inline, children }) => inline
                      ? <code className={cn("px-1 py-0.5 rounded text-xs font-mono font-semibold", isDark ? "bg-slate-700 text-blue-300" : "bg-blue-50 text-blue-700")}>{children}</code>
                      : <pre className={cn("p-3 rounded-xl text-xs font-mono overflow-x-auto my-2", isDark ? "bg-slate-900 text-blue-300" : "bg-slate-100 text-blue-700")}><code>{children}</code></pre>,
                    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className={cn("rounded-2xl px-5 py-3", isDark ? "bg-slate-800" : "bg-slate-100")}>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
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
          placeholder="Ask about grammar, IB papers, exam technique..."
          className={cn("rounded-xl text-sm", isDark ? "bg-slate-900 border-slate-800 text-white" : "")}
        />
        <Button
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending}
          className="rounded-xl bg-violet-500 hover:bg-violet-600 px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}