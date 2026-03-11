import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Plus, BookOpen, RotateCcw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import FlashCard from "../components/vocab/FlashCard";
import { calculateNextReview } from "../components/vocab/SpacedRepetition";
import TeacherAddContentDrawer from "../components/admin/TeacherAddContentDrawer";

export default function Vocabulary({ isDark, isTeacher }) {
  const [tab, setTab] = useState("review");
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: vocab } = useQuery({
    queryKey: ["vocabulary"],
    queryFn: () => base44.entities.Vocabulary.list("-created_date", 500),
    initialData: [],
  });

  const { data: progress } = useQuery({
    queryKey: ["vocabProgress"],
    queryFn: () => base44.entities.UserVocabProgress.list("-updated_date", 500),
    initialData: [],
  });

  const progressMap = useMemo(() => {
    const m = {};
    progress.forEach((p) => (m[p.vocabulary_id] = p));
    return m;
  }, [progress]);

  // Get cards due for review
  const dueCards = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return progress
      .filter((p) => !p.next_review_date || p.next_review_date <= today)
      .filter((p) => p.status !== "mastered");
  }, [progress]);

  // New words not yet in progress
  const newWords = useMemo(() => {
    const progIds = new Set(progress.map((p) => p.vocabulary_id));
    return vocab.filter((v) => !progIds.has(v.id));
  }, [vocab, progress]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const currentDeck = tab === "review" ? dueCards : newWords;
  const currentCard = currentDeck[currentIndex];
  const currentVocab = tab === "review"
    ? vocab.find((v) => v.id === currentCard?.vocabulary_id)
    : currentCard;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserVocabProgress.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vocabProgress"] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserVocabProgress.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vocabProgress"] }),
  });

  const handleRate = async (quality) => {
    if (isTeacher) { setCurrentIndex((prev) => Math.min(prev + 1, currentDeck.length - 1)); return; }
    if (tab === "review" && currentCard) {
      const updates = calculateNextReview(currentCard, quality);
      await updateMutation.mutateAsync({ id: currentCard.id, data: updates });
    } else if (tab === "new" && currentVocab) {
      const initial = {
        vocabulary_id: currentVocab.id,
        german_word: currentVocab.german_word,
        english_translation: currentVocab.english_translation,
        easiness_factor: 2.5,
        repetition_count: 0,
        interval_days: 1,
        total_reviews: 0,
        correct_count: 0,
        status: "new",
      };
      const updates = calculateNextReview(initial, quality);
      await createMutation.mutateAsync({ ...initial, ...updates });
    }
    setCurrentIndex((prev) => Math.min(prev + 1, currentDeck.length - 1));
  };

  // Browse tab
  const filteredVocab = vocab.filter((v) => {
    if (levelFilter !== "all" && v.cefr_level !== levelFilter) return false;
    if (search && !v.german_word.toLowerCase().includes(search.toLowerCase()) &&
        !v.english_translation.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusColor = {
    new: "bg-slate-500",
    learning: "bg-amber-500",
    review: "bg-blue-500",
    mastered: "bg-emerald-500",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
            Vocabulary
          </h1>
          <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
            Learn and review words with spaced repetition
          </p>
        </div>
        {isTeacher && <TeacherAddContentDrawer isDark={isDark} defaultTab="vocab" />}
      </div>
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setCurrentIndex(0); }}>
        <TabsList className={cn("rounded-xl", isDark ? "bg-slate-800" : "")}>
          {<>
            <TabsTrigger value="review" className="rounded-lg">
              <RotateCcw className="w-4 h-4 mr-2" />
              Review ({dueCards.length})
            </TabsTrigger>
            <TabsTrigger value="new" className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" />
              New Words ({newWords.length})
            </TabsTrigger>
          </> }
          <TabsTrigger value="browse" className="rounded-lg">
            <BookOpen className="w-4 h-4 mr-2" />
            Browse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="mt-8">
          {dueCards.length > 0 ? (
            <div className="space-y-4">
              <p className={cn("text-sm text-center", isDark ? "text-slate-400" : "text-slate-500")}>
                Card {currentIndex + 1} of {dueCards.length}
              </p>
              <FlashCard
                word={currentVocab ? { ...currentVocab, ...(currentCard || {}) } : null}
                isDark={isDark}
                onRate={handleRate}
              />
            </div>
          ) : (
            <div className={cn(
              "rounded-2xl p-12 text-center ring-1",
              isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
            )}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-slate-900")}>
                All caught up!
              </h3>
              <p className={cn("text-sm mt-2", isDark ? "text-slate-400" : "text-slate-500")}>
                No cards due for review. Try learning new words.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="new" className="mt-8">
          {newWords.length > 0 ? (
            <div className="space-y-4">
              <p className={cn("text-sm text-center", isDark ? "text-slate-400" : "text-slate-500")}>
                Word {currentIndex + 1} of {newWords.length}
              </p>
              <FlashCard word={currentVocab} isDark={isDark} onRate={handleRate} />
            </div>
          ) : (
            <div className={cn(
              "rounded-2xl p-12 text-center ring-1",
              isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
            )}>
              <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-slate-900")}>
                No new words available
              </h3>
              <p className={cn("text-sm mt-2", isDark ? "text-slate-400" : "text-slate-500")}>
                All words have been added to your review deck.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="browse" className="mt-6">
          <div className="flex items-center gap-3 mb-6">
            <Input
              placeholder="Search words..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn("max-w-xs rounded-xl", isDark ? "bg-slate-900 border-slate-800 text-white" : "")}
            />
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className={cn("w-32 rounded-xl", isDark ? "bg-slate-900 border-slate-800 text-white" : "")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredVocab.map((w) => {
              const prog = progressMap[w.id];
              return (
                <div
                  key={w.id}
                  className={cn(
                    "rounded-xl p-4 ring-1 flex items-center justify-between transition-colors",
                    isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {w.gender && w.gender !== "n/a" && (
                        <span className={cn(
                          "text-xs font-semibold",
                          w.gender === "der" ? "text-blue-500" : w.gender === "die" ? "text-rose-500" : "text-emerald-500"
                        )}>
                          {w.gender}
                        </span>
                      )}
                      <span className={cn("font-semibold", isDark ? "text-white" : "text-slate-900")}>
                        {w.german_word}
                      </span>
                    </div>
                    <p className={cn("text-sm mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
                      {w.english_translation}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{w.cefr_level}</Badge>
                    {prog && (
                      <div className={cn("w-2 h-2 rounded-full", statusColor[prog.status] || "bg-slate-400")} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}