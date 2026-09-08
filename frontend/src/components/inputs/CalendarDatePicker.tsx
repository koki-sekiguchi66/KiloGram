/**
 * CalendarDatePicker — 月グリッドのカレンダーから日付を選ぶ
 *
 * ネイティブの `<input type="date">` は OS 標準の見た目になり、
 * アプリのトーンから浮く。react-day-picker 等のライブラリは追加せず、
 * 月グリッドを自前で組む（ライブラリ追加は事前確認が要るため → CLAUDE.md）。
 */
import { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLocalDateString } from "@/lib/date";

interface CalendarDatePickerProps {
  /** "YYYY-MM-DD" */
  value: string;
  onChange: (date: string) => void;
  id?: string;
  className?: string;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const GRID_CELLS = 42; // 6週ぶん。前後月の日で埋める

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

/** UTC変換を挟まず、Date のローカル年月日から "YYYY-MM-DD" を組み立てる */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: GRID_CELLS }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function CalendarDatePicker({ value, onChange, id, className }: CalendarDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  // 開くたびに選択中の日を含む月を表示する
  useEffect(() => {
    if (!open) return;
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const handleSelect = (d: Date) => {
    onChange(toDateString(d));
    setOpen(false);
  };

  const grid = buildMonthGrid(viewYear, viewMonth);
  const today = getLocalDateString();

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-border/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-border"
      >
        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
        {selected.getMonth() + 1}/{selected.getDate()}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="日付を選ぶカレンダー"
          className="absolute left-0 top-full z-30 mt-2 w-64 rounded-2xl border border-border/50 bg-popover p-3 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="前の月"
              className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-display text-sm">
              {viewYear}年{viewMonth + 1}月
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="次の月"
              className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 text-center text-[10px] text-muted-foreground">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-y-1">
            {grid.map((d) => {
              const dateStr = toDateString(d);
              const inMonth = d.getMonth() === viewMonth;
              const isSelected = dateStr === value;
              const isToday = dateStr === today;
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleSelect(d)}
                  aria-current={isToday ? "date" : undefined}
                  aria-pressed={isSelected}
                  className={cn(
                    "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs tabular-nums transition-colors",
                    !inMonth && "text-muted-foreground/30",
                    inMonth && !isSelected && "text-foreground hover:bg-secondary",
                    isSelected && "bg-primary font-semibold text-primary-foreground",
                    isToday && !isSelected && "font-semibold text-primary"
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
