import { useGreeting } from "../hooks/useGreeting";
import { getLocalDateString } from "@/lib/date";

/**
 * 記録ページのヒーロー部（黒板パネル）。
 * 「食堂の掲示板」提案（docs-public/ui-design-proposal.md, ADR #21）の黒板を残したまま、
 * 主役を明朝体の見出しに移した（ADR #33）。
 */
interface CharacterGreetingProps { selectedDate: string; }

export function CharacterGreeting({ selectedDate }: CharacterGreetingProps) {
  const { message } = useGreeting();
  const date = new Date(`${selectedDate}T00:00:00`);
  const heading =
    selectedDate === getLocalDateString()
      ? "今日の献立"
      : `${date.getMonth() + 1}月${date.getDate()}日の献立`;

  return (
    <div className="rounded-2xl bg-board px-6 py-8">
      <div className="flex items-start gap-5">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-3xl leading-snug text-board-foreground">
            {heading}
          </h2>
          <svg
            className="mt-1 h-2 w-44 text-board-muted"
            viewBox="0 0 168 8"
            aria-hidden="true"
          >
            <path
              d="M2,5 Q40,1 84,4 T166,3"
              stroke="currentColor"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
          <p className="mt-4 text-sm leading-relaxed text-board-muted">{message}</p>
        </div>

        {/* ストリーク・レベル 現在はUI枠のみ */}
        <dl className="shrink-0 space-y-3 border-l border-board-muted/25 pl-5 text-[11px] leading-tight text-board-muted">
          <div>
            <dt>ストリーク</dt>
            <dd className="mt-0.5 font-display text-base text-board-foreground/70">--日</dd>
          </div>
          <div>
            <dt>レベル</dt>
            <dd className="mt-0.5 font-display text-base text-board-foreground/70">Lv.--</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
