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

/**
 * 記録モードの切替（食事 / 体重）。
 * 2択固定なので、選択位置は幅50%のスライド1本で表現できる（JSでの計測は不要）。
 * ボタン幅を固定して両者を厳密に等幅にし、スライドの計算とずれないようにする。
 */
export function RecordModeSwitch({ mode, onChange }: RecordModeSwitchProps) {
  return (
    <div
      role="tablist"
      aria-label="記録モード"
      className="relative inline-grid grid-cols-2 rounded-full border border-border/40 p-1.5"
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-full bg-foreground transition-transform duration-300 ease-out",
          mode === "weight" && "translate-x-full"
        )}
      />
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(value)}
            className={cn(
              "relative z-10 flex w-32 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              selected ? "text-background" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
