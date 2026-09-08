/**
 * RecordTab — 記録ページのプレゼンテーションコンポーネント
 *
 * 「食事記録」「体重記録」をモード切替で分離する（ADR #35）。
 * 両モードのコンテンツは常にマウントしたまま CSS の hidden で出し分ける。
 * 条件レンダリングでどちらかをアンマウントすると、useMenuBuilder や
 * WeightForm の入力途中の状態がモード切替のたびに消えてしまうため。
 */
import { useState, type ReactNode } from "react";
import { DateSelector } from "./DateSelector";
import { RecordModeSwitch, type RecordMode } from "./RecordModeSwitch";
import { PFCSummary } from "./PFCSummary";
import { MealTimingTabs } from "./MealTimingTabs";
import { useFrequentMeals } from "@/features/meals";
import { cn } from "@/lib/utils";
import type { Meal, DailySummary } from "../types";
import type { MealRecord, NutritionGoals } from "@/types";

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
  const [mode, setMode] = useState<RecordMode>("meal");

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-5">
        <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />
        <RecordModeSwitch mode={mode} onChange={setMode} />
      </div>

      {/* 食事記録: 広い画面では左右2列に畳んで1画面に収める（ADR #34, #35） */}
      <div className={cn(mode !== "meal" && "hidden")}>
        <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-0">
          <div className="flex min-w-0 flex-col gap-6 md:pr-8">
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
            />
          </div>

          <div className="min-w-0 border-t border-border/40 pt-7 md:border-t-0 md:border-l md:pt-0 md:pl-8">
            {mealFormSlot}
          </div>
        </div>
      </div>

      {/* 体重記録: 食事記録とは分離した独立モード（ADR #35） */}
      <div className={cn(mode !== "weight" && "hidden")}>
        <div className="max-w-md">{weightFormSlot}</div>
      </div>
    </div>
  );
}
