import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { BookOpen, Languages, Flame, Clock } from "lucide-react";
import StatsCard from "../components/dashboard/StatsCard";
import CEFRProgress from "../components/dashboard/CEFRProgress";
import WeaknessChart from "../components/dashboard/WeaknessChart";
import ProficiencyScore from "../components/dashboard/ProficiencyScore";
import StudyStreakChart from "../components/dashboard/StudyStreakChart";
import OnboardingTour from "../components/onboarding/OnboardingTour";

export default function Dashboard({ isDark }) {
  const [showTour, setShowTour] = useState(false);
  const queryClient = useQueryClient();

  // Force fresh settings fetch when landing here (e.g. right after placement test)
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["userSettings"] });
  }, []);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || null;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (settingsLoading || !settings?.onboarding_complete) return;
    const done = localStorage.getItem("onboarding_tour_done");
    if (!done) setShowTour(true);
  }, [settings, settingsLoading]);

  const { data: errors } = useQuery({
    queryKey: ["grammarErrors"],
    queryFn: () => base44.entities.GrammarError.list("-created_date", 100),
    initialData: [],
  });

  const { data: lessons } = useQuery({
    queryKey: ["lessonProgress"],
    queryFn: () => base44.entities.LessonProgress.list("-created_date", 50),
    initialData: [],
  });

  const { data: vocabProgress } = useQuery({
    queryKey: ["vocabProgress"],
    queryFn: () => base44.entities.UserVocabProgress.list("-updated_date", 200),
    initialData: [],
  });

  const mastered = vocabProgress.filter((v) => v.status === "mastered").length;
  const totalStudyMin = Math.round((settings?.total_study_minutes || 0));
  const streak = settings?.study_streak || 0;

  return (
    <>
    {showTour && <OnboardingTour isDark={isDark} onComplete={() => setShowTour(false)} />}
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
          Dashboard
        </h1>
        <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>
          Track your German learning journey
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Words Mastered"
          value={mastered}
          subtitle={`of ${vocabProgress.length} total`}
          icon={BookOpen}
          color="blue"
          isDark={isDark}
        />
        <StatsCard
          title="Study Streak"
          value={`${streak} days`}
          subtitle="Keep it going!"
          icon={Flame}
          color="orange"
          isDark={isDark}
        />
        <StatsCard
          title="Grammar Accuracy"
          value={`${settings?.grammar_accuracy_score || 0}%`}
          subtitle="Last 30 days"
          icon={Languages}
          color="purple"
          isDark={isDark}
        />
        <StatsCard
          title="Total Study Time"
          value={`${totalStudyMin}m`}
          subtitle="All time"
          icon={Clock}
          color="green"
          isDark={isDark}
        />
      </div>

      {/* CEFR + Proficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CEFRProgress currentLevel={settings?.cefr_level} isDark={isDark} />
        <ProficiencyScore settings={settings} isDark={isDark} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeaknessChart errors={errors} isDark={isDark} />
        <StudyStreakChart lessons={lessons} isDark={isDark} />
      </div>
    </div>
    </>
  );
}