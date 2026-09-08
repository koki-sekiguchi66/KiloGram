import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FoodChipList } from "./FoodChipList";
import { QuickRepeatChips } from "./QuickRepeatChips";
import { useCurrentMealTiming } from "../hooks/useCurrentMealTiming";
import { cn } from "@/lib/utils";
import type { Meal } from "../types";
import type { MealRecord, MealTiming } from "@/types";

interface MealTimingTabsProps {
  meals: Meal[];
  onEdit?: (meal: Meal) => void;
  onDelete?: (mealId: number) => void;
  onSaveAsMenu?: (meal: Meal) => void;
  /** タイミングごとの「よく記録するメニュー」候補。省略するとチップ列を出さない */
  frequentMeals?: Record<MealTiming, MealRecord[]>;
  onRepeatMeal?: (meal: MealRecord) => void;
  isRepeatingMeal?: boolean;
}

const TIMINGS = [
  { value: "breakfast", label: "朝食", emoji: "☀️" },
  { value: "lunch", label: "昼食", emoji: "⛅" },
  { value: "dinner", label: "夕食", emoji: "🌙" },
  { value: "snack", label: "間食", emoji: "🍩" },
] as const;

export function MealTimingTabs({
  meals,
  onEdit,
  onDelete,
  onSaveAsMenu,
  frequentMeals,
  onRepeatMeal,
  isRepeatingMeal,
}: MealTimingTabsProps) {
  const currentTiming = useCurrentMealTiming();

  const groupedMeals = TIMINGS.reduce(
    (acc, timing) => {
      acc[timing.value] = meals.filter((m) => m.meal_timing === timing.value);
      return acc;
    },
    {} as Record<string, Meal[]>
  );

  return (
    <Tabs defaultValue={currentTiming} className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-4 gap-1 rounded-2xl border border-border/70 bg-card p-2">
        {TIMINGS.map((timing) => {
          const count = groupedMeals[timing.value]?.length ?? 0;
          return (
            <TabsTrigger
              key={timing.value}
              value={timing.value}
              className={cn(
                "flex items-center gap-1.5 rounded-xl py-2.5 text-xs",
                "data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-sm"
              )}
            >
              <span>{timing.emoji}</span>
              <span>{timing.label}</span>
              {count > 0 && (
                <span className="ml-0.5 rounded-full bg-primary/20 px-1.5 text-[10px] font-semibold text-primary">
                  {count}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {TIMINGS.map((timing) => (
        <TabsContent key={timing.value} value={timing.value} className="mt-4">
          {onRepeatMeal && (
            <QuickRepeatChips
              suggestions={frequentMeals?.[timing.value] ?? []}
              onRepeat={onRepeatMeal}
              isRepeating={isRepeatingMeal}
            />
          )}
          <FoodChipList
            meals={groupedMeals[timing.value] ?? []}
            onEdit={onEdit}
            onDelete={onDelete}
            onSaveAsMenu={onSaveAsMenu}
            emptyMessage={`${timing.label}の記録がありません`}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}