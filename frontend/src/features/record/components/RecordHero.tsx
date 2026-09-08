import { useGreeting } from "../hooks/useGreeting";

/**
 * 記録ページのヒーロー（黒板パネル）。
 *
 * ページ全体を脱カードした中で、ここだけは面を持たせている。
 * 「食堂の掲示板」の黒板（ADR #21）を、1画面に1枚だけ残す扱いにした（ADR #34）。
 */
interface RecordHeroProps {
  /** いま選ばれている食事タイミングの表示名（朝食・昼食など） */
  timingLabel: string;
  /** そのタイミングに記録済みの品数 */
  mealCount: number;
}

export function RecordHero({ timingLabel, mealCount }: RecordHeroProps) {
  const { message } = useGreeting();
  const status = mealCount === 0 ? "まだ記録がありません" : `${mealCount}品を記録`;

  return (
    <div className="overflow-hidden rounded-2xl bg-board px-6 py-8">
      <div className="flex items-stretch justify-between gap-6">
        {/* 見出しを上端、挨拶を下端に振り分けて、縦書きの高さと釣り合わせる */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-6">
          <div>
            <span className="block h-px w-10 bg-primary" aria-hidden="true" />
            <h2 className="font-display mt-5 text-2xl leading-snug text-board-foreground">
              {timingLabel}
              <span className="mx-3 font-normal text-board-muted">—</span>
              {status}
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-board-muted">{message}</p>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-5 border-l border-board-muted/20 pl-6">
          <p className="text-vertical font-display text-sm text-board-foreground/80">
            おいしいが、整える。
          </p>
          <p className="text-center text-[9px] leading-relaxed tracking-[0.3em] text-board-muted">
            GOOD FOOD
            <br />
            BETTER YOU
          </p>
        </div>
      </div>
    </div>
  );
}
