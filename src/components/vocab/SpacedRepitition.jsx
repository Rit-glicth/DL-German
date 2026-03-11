// SM-2 Spaced Repetition Algorithm
import { format, addDays } from "date-fns";

export function calculateNextReview(progress, quality) {
  // quality: 0 (Again), 2 (Hard), 3 (Good), 5 (Easy)
  let ef = progress.easiness_factor || 2.5;
  let rep = progress.repetition_count || 0;
  let interval = progress.interval_days || 1;

  if (quality >= 3) {
    // Correct response
    if (rep === 0) {
      interval = 1;
    } else if (rep === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ef);
    }
    rep += 1;
  } else {
    // Incorrect — reset
    rep = 0;
    interval = 1;
  }

  // Update easiness factor
  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ef < 1.3) ef = 1.3;

  const nextDate = format(addDays(new Date(), interval), "yyyy-MM-dd");

  let status = "learning";
  if (rep >= 5 && ef >= 2.5) status = "mastered";
  else if (rep >= 2) status = "review";

  return {
    easiness_factor: Math.round(ef * 100) / 100,
    repetition_count: rep,
    interval_days: interval,
    next_review_date: nextDate,
    last_review_date: format(new Date(), "yyyy-MM-dd"),
    total_reviews: (progress.total_reviews || 0) + 1,
    correct_count: (progress.correct_count || 0) + (quality >= 3 ? 1 : 0),
    status,
  };
}