import {
  Search,
  EggFried,
  BookmarkCheck,
  Store,
  Pencil,
  Calendar,
  ScanLine,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import FoodSearchInput from "./FoodSearchInput";
import ManualInputForm from "./ManualInputForm";
import MyMenusSelector from "./MyMenuSelector";
import MyItemsSelector from "./MyItemsSelector";
import CafeteriaSelector from "./CafeteriaSelector";
import { OCRButton } from "@/features/ocr";
import type { MenuBuilderReturn } from "../hooks/useMenuBuilder";
import type { FoodSelectionItem, FullNutrition, MealTiming } from "@/types";
import {
  FULL_NUTRITION_KEYS,
  MEAL_TIMING_LABELS,
  PER_100G_FIELD,
} from "@/types";

interface MenuBuilderPanelProps {
  menuBuilder: MenuBuilderReturn;
}

type InputMethod = "search" | "myItems" | "myMenus" | "cafeteria" | "ocr" | "manual";

const INPUT_METHODS: { id: InputMethod; label: string; icon: typeof Search }[] = [
  { id: "search", label: "検索", icon: Search },
  { id: "myItems", label: "Myアイテム", icon: EggFried },
  { id: "myMenus", label: "Myメニュー", icon: BookmarkCheck },
  { id: "cafeteria", label: "食堂", icon: Store },
  { id: "ocr", label: "撮影", icon: ScanLine },
  { id: "manual", label: "手動", icon: Pencil },
];

const TIMING_OPTIONS: { value: MealTiming; label: string }[] = [
  { value: "breakfast", label: MEAL_TIMING_LABELS.breakfast },
  { value: "lunch", label: MEAL_TIMING_LABELS.lunch },
  { value: "dinner", label: MEAL_TIMING_LABELS.dinner },
  { value: "snack", label: MEAL_TIMING_LABELS.snack },
];

/**
 * 選択された食品をメニュー明細（摂取量ぶんの実数値）へ正規化する。
 *
 * 100g あたりの値しか持たない Myアイテムは、PER_100G_FIELD で対応する
 * フィールドを引いてから按分する。キー名を組み立てて引くと
 * carbs_per_100g / fiber_per_100g を取り逃がして 0 になるため。
 */
export const toMenuItemPayload = (
  item: FoodSelectionItem
): Record<string, unknown> => {
  const amount = parseFloat(String(item.amount_grams || item.amount || 100));

  const resolveNutrient = (key: keyof FullNutrition): number => {
    const direct = item[key];
    if (direct !== undefined && direct !== null) {
      return parseFloat(String(direct));
    }
    const per100Val = item[PER_100G_FIELD[key]];
    if (per100Val !== undefined && per100Val !== null) {
      return (parseFloat(String(per100Val)) * amount) / 100;
    }
    return 0;
  };

  const nutrition = Object.fromEntries(
    FULL_NUTRITION_KEYS.map((key) => [key, resolveNutrient(key)])
  );

  return {
    item_type:
      item.item_type ||
      (item.menu_id
        ? "cafeteria"
        : item.calories_per_100g
          ? "custom"
          : "standard"),
    item_id: item.item_id || item.menu_id || 0,
    item_name: item.item_name,
    amount_grams: amount,
    ...nutrition,
  };
};

export default function MenuBuilderPanel({ menuBuilder }: MenuBuilderPanelProps) {
  const {
    recordDate,
    setRecordDate,
    mealTiming,
    setMealTiming,
    activeInputMethod,
    setActiveInputMethod,
    addMenuItem,
  } = menuBuilder;

  const handleFoodSelected = (item: FoodSelectionItem) => {
    addMenuItem(toMenuItemPayload(item));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl">
          {MEAL_TIMING_LABELS[mealTiming]}を記録
        </h2>

        {/* 日付 & タイミング */}
        <div className="flex items-center gap-1 rounded-full border border-border/70 bg-secondary/40 py-1 pr-1 pl-3">
          <Label htmlFor="record-date" className="sr-only">
            記録日
          </Label>
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            id="record-date"
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            className="h-7 w-auto border-0 bg-transparent px-1.5 text-xs shadow-none focus-visible:ring-0"
          />
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <Label htmlFor="meal-timing" className="sr-only">
            タイミング
          </Label>
          <select
            id="meal-timing"
            value={mealTiming}
            onChange={(e) => setMealTiming(e.target.value as MealTiming)}
            className="h-7 rounded-full bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {TIMING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 入力方式タブ */}
      <div className="grid grid-cols-6 gap-2">
        {INPUT_METHODS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveInputMethod(id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-[10px] font-medium transition-colors",
              activeInputMethod === id
                ? "border-primary/60 bg-primary/12 text-primary"
                : "border-border/70 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* 入力エリア */}
      <div>
        {activeInputMethod === "search" && (
          <FoodSearchInput onFoodSelected={handleFoodSelected} />
        )}
        {activeInputMethod === "myItems" && (
          <MyItemsSelector onItemSelected={handleFoodSelected} />
        )}
        {activeInputMethod === "myMenus" && (
          <MyMenusSelector menuBuilder={menuBuilder} />
        )}
        {activeInputMethod === "cafeteria" && (
          <CafeteriaSelector onMenuSelected={handleFoodSelected} />
        )}
        {activeInputMethod === "ocr" && (
          <OCRButton onNutritionDetected={handleFoodSelected} />
        )}
        {activeInputMethod === "manual" && (
          <ManualInputForm onAdd={handleFoodSelected} />
        )}
      </div>
    </div>
  );
}
