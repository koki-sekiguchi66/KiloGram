/**
 * MenuPreviewPanel — メニュービルダーの下段
 *
 * 現在のメニューリスト + 合計栄養素 + 登録・保存アクション。
 * MenuBuilderPanel と同じカードの中に並ぶ前提で、自前のカードは持たない（ADR #33）。
 */
import { Trash2, Check, Loader2, Plus, ArrowRight, Bookmark } from "lucide-react";
import { BowlIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import CurrentMenuDisplay from "./CurrentMenuDisplay";
import type { MenuBuilderReturn } from "../hooks/useMenuBuilder";

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
  } = menuBuilder;

  const isEmpty = menuItems.length === 0;

  return (
    <div className="space-y-4">
      {/* 現在のメニューリスト */}
      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center">
          <BowlIcon className="h-8 w-8 text-muted-foreground/70" />
          <p className="text-sm text-foreground">まだメニューが追加されていません</p>
          <p className="text-xs text-muted-foreground">
            上の検索やメニューから、食べたものを追加しましょう。
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/70">
          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-xs text-muted-foreground">
              このお膳に {menuItems.length} 品
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearMenu}
              className="h-7 px-2 text-destructive hover:text-destructive"
              aria-label="メニューをすべて削除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="max-h-[350px] overflow-y-auto border-t border-border/70">
            <CurrentMenuDisplay menuBuilder={menuBuilder} />
          </div>
        </div>
      )}

      {/* 合計栄養素 */}
      <div className="flex items-center justify-between rounded-2xl border border-border/70 px-5 py-3">
        <p className="flex items-baseline gap-1.5">
          <span className="text-xs text-muted-foreground">合計</span>
          <span className="font-display text-xl tabular-nums">
            {Math.round(totalNutrition.calories ?? 0).toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">kcal</span>
        </p>
        <div className="flex items-center divide-x divide-border/60">
          {TOTAL_MACROS.map(({ key, label, colorClass }) => (
            <p key={key} className="flex items-baseline gap-1 px-3 last:pr-0">
              <span className={cn("text-xs", colorClass)}>{label}</span>
              <span className="text-base tabular-nums">
                {(totalNutrition[key] ?? 0).toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">g</span>
            </p>
          ))}
        </div>
      </div>

      {/* 登録 */}
      <Button
        variant="brand"
        size="xl"
        className="w-full font-semibold"
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
            <Plus />
            この食事を記録する
            <ArrowRight />
          </>
        )}
      </Button>

      {/* Myメニューとしても保存する */}
      <Button
        variant="outline"
        size="xl"
        className={cn("w-full", saveAsMenu && "border-primary/60 text-primary")}
        aria-pressed={saveAsMenu}
        onClick={() => setSaveAsMenu(!saveAsMenu)}
      >
        {saveAsMenu ? <Check /> : <Bookmark />}
        Myメニューとして保存
      </Button>

      {saveAsMenu && (
        <div className="space-y-2 rounded-2xl border border-border/70 bg-secondary/30 p-4">
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
