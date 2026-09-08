import { useState } from "react";
import { Sunrise, Sun, Moon, Coffee } from "lucide-react";
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

/** time は目安の時刻。useCurrentMealTiming の時間帯の代表値を表示に使う */
const TIMINGS = [
  { value: "breakfast", label: "朝食", time: "07:00", icon: Sunrise },
  { value: "lunch", label: "昼食", time: "12:00", icon: Sun },
  { value: "dinner", label: "夕食", time: "19:00", icon: Moon },
  { value: "snack", label: "間食", time: "いつでも", icon: Coffee },
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
  const [activeTiming, setActiveTiming] = useState<MealTiming>(currentTiming);

  const groupedMeals = TIMINGS.reduce(
    (acc, timing) => {
      acc[timing.value] = meals.filter((m) => m.meal_timing === timing.value);
      return acc;
    },
    {} as Record<string, Meal[]>
  );

  return (
    <div>
      <p className="text-[11px] tracking-[0.25em] text-muted-foreground">
        食事タイミングを選択
      </p>

      <Tabs
        value={activeTiming}
        onValueChange={(value) => setActiveTiming(value as MealTiming)}
        className="mt-1.5 w-full"
      >
        <TabsList className="grid h-auto w-full grid-cols-4 gap-0 divide-x divide-border/40 rounded-2xl border border-border/40 bg-transparent p-1.5">
          {TIMINGS.map((timing) => {
            const count = groupedMeals[timing.value]?.length ?? 0;
            const Icon = timing.icon;
            return (
              <TabsTrigger
                key={timing.value}
                value={timing.value}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-1 py-2.5",
                  "data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-left leading-tight">
                  <span className="block text-xs">
                    {timing.label}
                    {count > 0 && (
                      <span className="ml-1 text-[10px] font-semibold text-primary">
                        {count}
                      </span>
                    )}
                  </span>
                  <span className="block text-[10px] opacity-60">{timing.time}</span>
                </span>
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
    </div>
  );
}
