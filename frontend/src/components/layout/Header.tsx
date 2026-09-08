/**
 * Header — DishBoard アプリヘッダー
 *
 * 設計判断:
 *   Claude スマホアプリと同様、ヘッダー左上のハンバーガーアイコンで
 *   サイドバーを開閉する。モバイルファーストのナビゲーションパターン。
 *   右側のタグラインはアプリの性格を伝えるためだけの静的な要素で、操作は持たせない。
 */
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  /** サイドバーを開くコールバック */
  onMenuOpen: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/30 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-5">
        {/* 左: ハンバーガーメニュー + アプリ名 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuOpen}
            aria-label="メニューを開く"
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-primary">Dish</span>
            <span className="text-foreground">Board</span>
          </h1>
        </div>

        {/* 右: タグライン */}
        <p className="text-[10px] leading-tight text-muted-foreground">
          食で、
          <br />
          いい一日をつくる。
        </p>
      </div>
    </header>
  );
}
