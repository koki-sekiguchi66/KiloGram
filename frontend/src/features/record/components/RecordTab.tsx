/**
 * RecordTab — 記録ページのプレゼンテーションコンポーネント
 *
 * Dashboard → RecordTab → PFCSummary の3段 props drilling。
 * Context は導入せず、シンプルさを優先。
 */
import { useState, type ReactNode } from "react";
import { DateSelector } from "./DateSelector";
import { RecordHero } from "./RecordHero";
import { PFCSummary } from "./PFCSummary";
import { MealTimingTabs } from "./MealTimingTabs";
import { useCurrentMealTiming } from "../hooks/useCurrentMealTiming";
import { useFrequentMeals } from "@/features/meals";
import { Section } from "@/components/layout";
import type { Meal, DailySummary } from "../types";
import type { MealRecord, MealTiming, NutritionGoals } from "@/types";
import { MEAL_TIMING_LABELS } from "@/types";

interface RecordTabProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  meals: Meal[];
  /** よく記録するメニューの抽出に使う全期間の記録 */
  allMeals: MealRecord[];
  dailySummary: DailySummary | null;
  /** 栄養目標値（任意）。GoalSettings で設定された値が伝搬される */
  goals?: Partial<NutritionGoals>;
  onMealEdit?: (meal: Meal) => void;
  onMealDelete?: (mealId: number) => void;
  onMealSaveAsMenu?: (meal: Meal) => void;
  onMealRepeat?: (meal: MealRecord) => void;
  isRepeatingMeal?: boolean;
  mealFormSlot: ReactNode;
  weightFormSlot: ReactNode;
}

export function RecordTab({
  selectedDate,
  onDateChange,
  meals,
  allMeals,
  dailySummary,
  goals,
  onMealEdit,
  onMealDelete,
  onMealSaveAsMenu,
  onMealRepeat,
  isRepeatingMeal,
  mealFormSlot,
  weightFormSlot,
}: RecordTabProps) {
  const frequentMeals = useFrequentMeals(allMeals, selectedDate);

  // タブの選択状態は MealTimingTabs が持つ。ここではヒーローの表示のために写しを取る
  const currentTiming = useCurrentMealTiming();
  const [shownTiming, setShownTiming] = useState<MealTiming>(currentTiming);

  return (
    <div className="flex flex-col gap-7">
      {/* 食事記録に関わるUIは、広い画面では左右2列に畳んで1画面に収める（ADR #34） */}
      <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-0">
        <div className="flex min-w-0 flex-col gap-5 md:pr-8">
          <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />

          <RecordHero
            timingLabel={MEAL_TIMING_LABELS[shownTiming]}
            mealCount={meals.filter((m) => m.meal_timing === shownTiming).length}
          />

          <PFCSummary
            calories={dailySummary?.calories ?? null}
            protein={dailySummary?.protein ?? null}
            fat={dailySummary?.fat ?? null}
            carbs={dailySummary?.carbohydrates ?? null}
            goals={goals}
          />

          <MealTimingTabs
            meals={meals}
            onEdit={onMealEdit}
            onDelete={onMealDelete}
            onSaveAsMenu={onMealSaveAsMenu}
            frequentMeals={frequentMeals}
            onRepeatMeal={onMealRepeat}
            isRepeatingMeal={isRepeatingMeal}
            onTimingChange={setShownTiming}
          />

          <Section>{weightFormSlot}</Section>
        </div>

        <div className="min-w-0 border-t border-border/40 pt-7 md:border-t-0 md:border-l md:pt-0 md:pl-8">
          {mealFormSlot}
        </div>
      </div>
    </div>
  );
}
