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
    <div className="rounded-2xl bg-board px-6 py-5">
      <span className="block h-px w-10 bg-primary" aria-hidden="true" />
      <h2 className="font-display mt-4 text-xl leading-snug text-board-foreground lg:text-2xl">
        {timingLabel}
        <span className="mx-3 font-normal text-board-muted">—</span>
        {status}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-board-muted">{message}</p>
    </div>
  );
}
