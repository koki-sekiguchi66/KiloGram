import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLocalDateString } from "@/lib/date";

interface DateSelectorProps {
  selectedDate: string; // "YYYY-MM-DD"
  onDateChange: (date: string) => void;
}

function formatDateJa(dateStr: string): { date: string; dayOfWeek: string } {
  const date = new Date(dateStr + "T00:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return { date: `${month}月${day}日`, dayOfWeek: `${dayOfWeek}曜日` };
}

/** 日付を n 日ずらした "YYYY-MM-DD" を返す */
function shiftDate(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 今日の記録を眺めるための日付ナビゲーション。
 * 「日付を選択」の操作そのものは食事追加パネルの CalendarDatePicker が担うため、
 * ここは閲覧用に小さく留める（ADR #36）。
 */
export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const today = getLocalDateString();
  const isToday = selectedDate === today;
  const { date, dayOfWeek } = formatDateJa(selectedDate);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDateChange(shiftDate(selectedDate, -1))}
        aria-label="前日"
        className="-ml-2 h-7 w-7 text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <p className="font-display flex items-baseline gap-2 leading-none text-foreground">
        <span className="text-xl">{date}</span>
        <span className="text-xs text-muted-foreground">{dayOfWeek}</span>
      </p>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDateChange(shiftDate(selectedDate, 1))}
        disabled={isToday}
        aria-label="翌日"
        className="h-7 w-7 text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* 今日を見ているときは何も出さない。戻る手段が要るときだけ出す */}
      {!isToday && (
        <button
          onClick={() => onDateChange(today)}
          className={cn(
            "ml-auto text-[11px] tracking-widest text-primary",
            "transition-opacity hover:opacity-70"
          )}
        >
          今日へ
        </button>
      )}
    </div>
  );
}
