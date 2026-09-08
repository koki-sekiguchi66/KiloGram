/**
 * PFCSummary — PFC 栄養サマリーダッシュボード
 *
 * 設計判断:
 *   - goals は optional。未指定ならリングを描かず、現在値のみを表示する
 *   - カロリーだけリングで大きく見せ、PFC は等幅3カラムに従える（ADR #33）
 *   - 目標がある間は「摂った量」ではなく「あと何 kcal か」を主役にする
 */
import { cn } from "@/lib/utils";
import type { NutritionGoals } from "@/types";

/** リングの寸法。viewBox と半径を揃えるため定数で持つ */
const RING_SIZE = 132;
const RING_STROKE = 9;
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
  const remaining = calories != null && goal ? Math.max(0, goal - calories) : null;

  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="h-full w-full -rotate-90"
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

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {remaining != null && (
          <span className="text-[11px] text-muted-foreground">あと</span>
        )}
        <span className="font-display text-3xl leading-none tabular-nums text-foreground">
          {(remaining ?? calories) != null
            ? Math.round(remaining ?? calories ?? 0).toLocaleString()
            : "--"}
        </span>
        <span className="text-[11px] text-muted-foreground">kcal</span>
        {goal != null && (
          <span className="mt-0.5 text-[10px] tabular-nums text-muted-foreground/70">
            / {goal.toLocaleString()}
          </span>
        )}
      </div>
    </div>
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
    <div className="px-3 first:pl-0 last:pr-0">
      <div className={cn("text-[11px]", colorClass)}>{label}</div>
      <div className="mt-1 flex items-baseline gap-0.5">
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {value != null ? Math.round(value) : "--"}
        </span>
        {goal != null && (
          <span className="text-[10px] tabular-nums text-muted-foreground">
            /{goal}g
          </span>
        )}
      </div>
      {pct != null && (
        <div
          className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
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
  return (
    <div
      className="flex items-center gap-5 rounded-2xl border border-border/70 bg-card p-5"
      role="region"
      aria-label="栄養サマリー"
    >
      <CalorieRing calories={calories} goal={goals?.calories} />

      <div className="grid min-w-0 flex-1 grid-cols-3 divide-x divide-border/60">
        <NutrientColumn
          label="たんぱく質"
          value={protein}
          goal={goals?.protein}
          colorClass="text-protein"
          barColorClass="bg-protein"
        />
        <NutrientColumn
          label="脂質"
          value={fat}
          goal={goals?.fat}
          colorClass="text-fat"
          barColorClass="bg-fat"
        />
        <NutrientColumn
          label="炭水化物"
          value={carbs}
          goal={goals?.carbs}
          colorClass="text-carbs"
          barColorClass="bg-carbs"
        />
      </div>
    </div>
  );
}
