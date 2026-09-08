import { type ReactNode } from "react";
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
  /** 見出しの右に置く操作。ページ遷移リンクなど、meals feature の外の関心事を受け取る */
  headerAction?: ReactNode;
}

type InputMethod = "search" | "myItems" | "myMenus" | "cafeteria" | "ocr" | "manual";

const INPUT_METHODS: {
  id: InputMethod;
  label: string;
  note: string;
  icon: typeof Search;
}[] = [
  { id: "search", label: "検索", note: "食品を探す", icon: Search },
  { id: "myItems", label: "Myアイテム", note: "自分の食品", icon: EggFried },
  { id: "myMenus", label: "Myメニュー", note: "保存した組合せ", icon: BookmarkCheck },
  { id: "cafeteria", label: "食堂", note: "学食メニュー", icon: Store },
  { id: "ocr", label: "撮影", note: "成分表を読む", icon: ScanLine },
  { id: "manual", label: "手動", note: "直接入力", icon: Pencil },
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

export default function MenuBuilderPanel({
  menuBuilder,
  headerAction,
}: MenuBuilderPanelProps) {
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
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        {/* タイミングは右の選択ピルが示すため、見出しには入れない（タブと食い違って見えるため） */}
        <h2 className="font-display text-3xl">食事を追加</h2>
        {headerAction}
      </div>

      <div className="flex justify-end">
        {/* 日付 & タイミング */}
        <div className="flex items-center gap-1 rounded-full border border-border/40 py-1 pr-1 pl-3">
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

      {/* 入力方式。箱で囲わず、罫線で仕切るだけにする（ADR #34） */}
      <div className="grid grid-cols-6 divide-x divide-border/40 border-y border-border/40">
        {INPUT_METHODS.map(({ id, label, note, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveInputMethod(id)}
            className={cn(
              "flex flex-col items-center gap-1 px-1 py-3 transition-colors",
              activeInputMethod === id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-[10px] font-medium whitespace-nowrap lg:text-[11px]">
              {label}
            </span>
            {/* 列が狭いと2行に折り返して行の高さが揃わないため、広い画面だけ出す */}
            <span className="hidden text-[9px] leading-tight opacity-70 xl:block">
              {note}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
