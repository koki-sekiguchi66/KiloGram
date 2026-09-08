/**
 * MenuPreviewPanel — メニュービルダーの下段
 *
 * 現在のメニューリスト + 合計栄養素 + 登録・保存アクション。
 * MenuBuilderPanel と同じカードの中に並ぶ前提で、自前のカードは持たない（ADR #33）。
 */
import { Trash2, Check, Loader2, ArrowRight, Bookmark } from "lucide-react";
import { BowlIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import CurrentMenuDisplay from "./CurrentMenuDisplay";
import type { MenuBuilderReturn } from "../hooks/useMenuBuilder";
import { MEAL_TIMING_LABELS } from "@/types";

interface MenuPreviewPanelProps {
  menuBuilder: MenuBuilderReturn;
}

/** 合計行に出す栄養素。カロリーだけ見出し扱いで大きく出す */
const TOTAL_MACROS = [
  { key: "protein", label: "P", colorClass: "text-protein" },
  { key: "fat", label: "F", colorClass: "text-fat" },
  { key: "carbohydrates", label: "C", colorClass: "text-carbs" },
] as const;

export default function MenuPreviewPanel({ menuBuilder }: MenuPreviewPanelProps) {
  const {
    menuItems,
    totalNutrition,
    saveAsMenu,
    setSaveAsMenu,
    menuName,
    setMenuName,
    menuDescription,
    setMenuDescription,
    handleSubmit,
    handleClearMenu,
    isSubmitting,
    mealTiming,
  } = menuBuilder;

  const isEmpty = menuItems.length === 0;
  const timingLabel = MEAL_TIMING_LABELS[mealTiming];

  return (
    <div className="space-y-4">
      {/* 現在のメニューリスト */}
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg">この食事</h3>
        {isEmpty ? (
          <p className="text-xs text-muted-foreground">{timingLabel}に追加します</p>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearMenu}
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            すべて消す
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/50 px-4 py-12 text-center">
          <BowlIcon className="h-9 w-9 text-muted-foreground/60" />
          <p className="mt-1 text-sm text-foreground">まだ何も追加されていません</p>
          <p className="text-xs text-muted-foreground">
            検索・撮影・メニューから追加できます
          </p>
        </div>
      ) : (
        <div className="max-h-[350px] overflow-y-auto">
          <CurrentMenuDisplay menuBuilder={menuBuilder} />
        </div>
      )}

      {/* 合計 + 登録 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-border/40 py-2 pr-2 pl-5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">合計</span>
            <span className="font-display text-xl tabular-nums">
              {Math.round(totalNutrition.calories ?? 0).toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">kcal</span>
          </p>
          {TOTAL_MACROS.map(({ key, label, colorClass }) => (
            <p key={key} className="flex items-baseline gap-1">
              <span className={cn("text-[11px]", colorClass)}>{label}</span>
              <span className="text-sm tabular-nums">
                {(totalNutrition[key] ?? 0).toFixed(1)}
              </span>
              <span className="text-[11px] text-muted-foreground">g</span>
            </p>
          ))}
        </div>

        <Button
          variant="brand"
          size="xl"
          className="ml-auto font-semibold"
          onClick={handleSubmit}
          disabled={isEmpty || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              保存中...
            </>
          ) : (
            <>
              {timingLabel}に記録
              <ArrowRight />
            </>
          )}
        </Button>
      </div>

      {/* Myメニューとしても保存する */}
      <div className="flex justify-end">
        <button
          type="button"
          aria-pressed={saveAsMenu}
          onClick={() => setSaveAsMenu(!saveAsMenu)}
          className={cn(
            "flex items-center gap-2 text-sm transition-colors",
            saveAsMenu ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {saveAsMenu ? (
            <Check className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          メニューとして保存
        </button>
      </div>

      {saveAsMenu && (
        <div className="space-y-2 rounded-2xl border border-border/40 p-4">
          <div className="space-y-1">
            <Label htmlFor="menu-name" className="text-xs">
              メニュー名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="menu-name"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="例: 定番朝食セット"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="menu-description" className="text-xs">
              説明
            </Label>
            <Textarea
              id="menu-description"
              value={menuDescription}
              onChange={(e) => setMenuDescription(e.target.value)}
              placeholder="メモ..."
              rows={2}
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
