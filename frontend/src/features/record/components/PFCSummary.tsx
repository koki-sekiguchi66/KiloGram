/**
 * PFCSummary — PFC 栄養サマリー
 *
 * 設計判断:
 *   - goals は optional。未指定ならリングを描かず、現在値のみを表示する
 *   - リングの中に文字を収める構成は縮小すると破綻するため、リングは純粋な
 *     ミニ進捗インジケータにし、kcal の数値はリングの外へ横並びで出す（ADR #36）
 *   - 目標がある間は「摂った量」ではなく「あと何 kcal か」を主役にする
 */
import { cn } from "@/lib/utils";
import type { NutritionGoals } from "@/types";

/** リングの viewBox 座標系。実寸は CSS 側で決め、SVG は viewBox で追従させる */
const RING_SIZE = 40;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface PFCSummaryProps {
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  /** 目標値（任意）。指定時はリングとゲージバーを描く */
  goals?: Partial<NutritionGoals>;
}

function ratio(value: number | null, goal?: number): number | null {
  if (value == null || !goal) return null;
  return Math.min(1, Math.max(0, value / goal));
}

function CalorieRing({ calories, goal }: { calories: number | null; goal?: number }) {
  const pct = ratio(calories, goal);

  return (
    <svg
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="h-11 w-11 shrink-0 -rotate-90"
      aria-hidden="true"
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="var(--border)"
        strokeWidth={RING_STROKE}
      />
      {pct != null && (
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="var(--color-calories)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      )}
    </svg>
  );
}

interface NutrientColumnProps {
  label: string;
  value: number | null;
  goal?: number;
  colorClass: string;
  barColorClass: string;
}

function NutrientColumn({
  label,
  value,
  goal,
  colorClass,
  barColorClass,
}: NutrientColumnProps) {
  const pct = ratio(value, goal);

  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-1">
        <span className={cn("text-[10px]", colorClass)}>{label}</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {value != null ? Math.round(value) : "--"}
        </span>
        {goal != null && (
          <span className="text-[10px] tabular-nums text-muted-foreground">/{goal}g</span>
        )}
      </div>
      {pct != null && (
        <div
          className="mt-1 h-[3px] w-14 overflow-hidden rounded-full bg-border/70"
          aria-hidden="true"
        >
          <div
            className={cn("h-full rounded-full transition-[width] duration-500", barColorClass)}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function PFCSummary({
  calories,
  protein,
  fat,
  carbs,
  goals,
}: PFCSummaryProps) {
  const remaining =
    calories != null && goals?.calories ? Math.max(0, goals.calories - calories) : null;

  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-2"
      role="region"
      aria-label="栄養サマリー"
    >
      <div className="flex items-center gap-2.5">
        <CalorieRing calories={calories} goal={goals?.calories} />
        <p className="flex items-baseline gap-1 whitespace-nowrap">
          {remaining != null && (
            <span className="text-[10px] text-muted-foreground">あと</span>
          )}
          <span className="font-display text-lg leading-none tabular-nums text-foreground">
            {(remaining ?? calories) != null
              ? Math.round(remaining ?? calories ?? 0).toLocaleString()
              : "--"}
          </span>
          <span className="text-[10px] text-muted-foreground">kcal</span>
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2">
        <NutrientColumn
          label="P"
          value={protein}
          goal={goals?.protein}
          colorClass="text-protein"
          barColorClass="bg-protein"
        />
        <NutrientColumn
          label="F"
          value={fat}
          goal={goals?.fat}
          colorClass="text-fat"
          barColorClass="bg-fat"
        />
        <NutrientColumn
          label="C"
          value={carbs}
          goal={goals?.carbs}
          colorClass="text-carbs"
          barColorClass="bg-carbs"
        />
      </div>
    </div>
  );
}
