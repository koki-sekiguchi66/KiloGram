import { Section } from "@/components/layout";
import { WeeklyTrend } from "./WeeklyTrend";
import { PFCProgressBar } from "./PFCProgressBar";
import { HeatmapCalendar } from "./HeatmapCalendar";
import { CalorieChart } from "./CalorieChart";
import { WeightChart } from "./WeightChart";

interface Meal {
  id: number;
  record_date: string;
  calories: number | string;
  protein: number | string;
  fat: number | string;
  carbohydrates: number | string;
  meal_name?: string;
  meal_timing?: string;
}

interface Weight {
  id: number;
  record_date: string;
  weight: number | string;
}

interface DailySummary {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

interface AnalysisPageProps {
  allMeals: Meal[];
  weights: Weight[];
  dailySummary: DailySummary | null;
}

export function AnalysisPage({ allMeals, weights, dailySummary }: AnalysisPageProps) {
  const currentNutrition = {
    calories: dailySummary?.calories ?? 0,
    protein: dailySummary?.protein ?? 0,
    fat: dailySummary?.fat ?? 0,
    carbs: dailySummary?.carbohydrates ?? 0,
  };

  return (
    <div className="flex flex-col gap-8" data-testid="analysis-page">
      <header>
        <span className="block h-px w-10 bg-primary" aria-hidden="true" />
        <h2 className="font-display mt-5 text-4xl">ふりかえる</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          積み重ねてきた記録から、いまの傾向を眺めます。
        </p>
      </header>

      <WeeklyTrend meals={allMeals} />

      <Section title="今日の目標達成状況">
        <div className="bg-ledger rounded-2xl px-4 py-3">
          <PFCProgressBar current={currentNutrition} />
        </div>
      </Section>

      <HeatmapCalendar meals={allMeals} />
      <CalorieChart meals={allMeals} />
      <WeightChart weights={weights} />
    </div>
  );
}
