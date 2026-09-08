/**
 * Section — 罫線で区切るページ内セクション
 *
 * 設計判断:
 *   カード（枠 + 背景 + 影）をやめ、上端のヘアラインと余白だけで区切る（ADR #34）。
 *   同じ重さの箱が積み上がると主役が生まれないため、階層は見出しの大きさで示す。
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  /** 明朝の見出し。省略すると見出し行ごと出さない */
  title?: string;
  /** 見出しの右に小さく添える補足（件数・期間など） */
  note?: ReactNode;
  /** 見出しの右端に置く操作（リンクなど）。note より優先して右端に来る */
  action?: ReactNode;
  /** 上端の罫線を引かない（ページ先頭のセクション） */
  bare?: boolean;
  className?: string;
  children: ReactNode;
}

export function Section({
  title,
  note,
  action,
  bare = false,
  className,
  children,
}: SectionProps) {
  return (
    <section className={cn(!bare && "border-t border-border/40 pt-6", className)}>
      {title && (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="font-display text-xl">{title}</h2>
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
