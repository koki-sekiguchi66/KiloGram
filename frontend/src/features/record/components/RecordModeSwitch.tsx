import { RiceBallIcon, ScaleGaugeIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export type RecordMode = "meal" | "weight";

interface RecordModeSwitchProps {
  mode: RecordMode;
  onChange: (mode: RecordMode) => void;
}

const OPTIONS: { value: RecordMode; label: string; icon: typeof RiceBallIcon }[] = [
  { value: "meal", label: "食事記録", icon: RiceBallIcon },
  { value: "weight", label: "体重記録", icon: ScaleGaugeIcon },
];

/** 1項目ぶんの幅。TRACK_TRANSLATE の計算根拠でもある */
const ITEM_WIDTH = 168;
/** 見える窓の幅。ITEM_WIDTH より広い分だけ隣の項目が覗く */
const VIEWPORT_WIDTH = 228;
const PEEK = (VIEWPORT_WIDTH - ITEM_WIDTH) / 2;

const TRACK_TRANSLATE: Record<RecordMode, number> = {
  meal: PEEK,
  weight: PEEK - ITEM_WIDTH,
};

/**
 * 記録モードの切替（食事 / 体重）。
 *
 * MeasureField の目盛り（キッチンスケールの指針、ADR #18）と同じ「固定した指針の下を
 * 帯が流れる」意匠を、2択のダイヤルとして転用した。選ばれていない項目を窓の端に
 * 少し覗かせることで、単なる2ボタンのタブではなく回して選ぶダイヤルだと分かるようにする。
 */
export function RecordModeSwitch({ mode, onChange }: RecordModeSwitchProps) {
  return (
    <div
      role="tablist"
      aria-label="記録モード"
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-secondary/20"
      style={{ width: VIEWPORT_WIDTH, height: 72 }}
    >
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${TRACK_TRANSLATE[mode]}px)` }}
      >
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const selected = mode === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(value)}
              style={{ width: ITEM_WIDTH }}
              className={cn(
                "flex h-full shrink-0 flex-col items-center justify-center gap-1.5 pb-3 text-sm font-medium",
                "transition-[opacity,transform] duration-300 ease-out",
                selected
                  ? "scale-100 text-foreground opacity-100"
                  : "scale-90 text-muted-foreground opacity-40"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* 目盛り（装飾）。ダイヤルの質感だけを担い、値そのものは持たない */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 bottom-2.5 h-1.5 text-border/60"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 0 1px, transparent 1px)",
          backgroundSize: "10px 100%",
          backgroundRepeat: "repeat-x",
        }}
      />

      {/* 固定の指針。選択位置は常にここが指す */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1.5 left-1/2 h-0 w-0 -translate-x-1/2 border-x-4 border-b-4 border-x-transparent border-b-primary"
      />
    </div>
  );
}
