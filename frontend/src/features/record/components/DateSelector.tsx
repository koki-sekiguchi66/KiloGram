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
  return { date: `${month}月${day}日`, dayOfWeek: `（${dayOfWeek}）` };
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
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <p className="font-display text-3xl leading-none text-foreground">
        {date}
        <span className="text-base text-muted-foreground">{dayOfWeek}</span>
      </p>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDateChange(shiftDate(selectedDate, 1))}
        disabled={isToday}
        aria-label="翌日"
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {isToday ? (
        <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold tracking-widest text-primary-foreground">
          TODAY
        </span>
      ) : (
        <button
          onClick={() => onDateChange(today)}
          className={cn(
            "rounded-full border border-primary/40 px-3 py-1 text-[11px] font-semibold tracking-widest text-primary",
            "transition-colors hover:bg-primary/15"
          )}
        >
          今日へ
        </button>
      )}
    </div>
  );
}
