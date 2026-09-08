/**
 * CafeteriaSelector — 食堂メニュー選択コンポーネント
 *
 * 食堂メニュー一覧取得 → 食堂タブ → カテゴリフィルタ → クリックでメニュー選択。
 */
import { useState, useEffect, useMemo } from "react";
import { Store, Plus, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mealApi } from "../api/mealApi";
import type { CafeteriaMenu, CafeteriaCode, FoodSelectionItem } from "@/types";
import {
  CAFETERIA_LABELS,
  CAFETERIA_ORDER,
  CAFETERIA_CATEGORY_ORDER,
} from "@/types";

interface CafeteriaSelectorProps {
  onMenuSelected: (item: FoodSelectionItem) => void;
}

/** 「すべて」タブを表す番兵。空文字は実在しない category_label なので衝突しない */
const ALL_CATEGORIES = "";

/**
 * その食堂が実際に持つ区分だけをフィルタとして並べる。
 *
 * 区分は食堂ごとに違い、サイト側で入れ替わる（ADR #31）。固定の一覧を持たず、
 * 取得したメニューから category_label を拾って組み立てる。
 */
export const buildCategoryFilters = (
  menus: CafeteriaMenu[]
): { label: string; order: number }[] => {
  const byLabel = new Map<string, number>();

  for (const menu of menus) {
    if (!byLabel.has(menu.category_label)) {
      byLabel.set(
        menu.category_label,
        CAFETERIA_CATEGORY_ORDER[menu.category] ?? Number.MAX_SAFE_INTEGER
      );
    }
  }

  return [...byLabel.entries()]
    .map(([label, order]) => ({ label, order }))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "ja"));
};

export default function CafeteriaSelector({
  onMenuSelected,
}: CafeteriaSelectorProps) {
  const [menus, setMenus] = useState<CafeteriaMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCafeteria, setSelectedCafeteria] =
    useState<CafeteriaCode>("rune");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMenus = async () => {
      setLoading(true);
      try {
        const data = await mealApi.getCafeteriaMenus();
        setMenus(data as CafeteriaMenu[]);
      } catch {
        setError("食堂メニューの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, []);

  const cafeteriaMenus = useMemo(
    () => menus.filter((m) => m.cafeteria === selectedCafeteria),
    [menus, selectedCafeteria]
  );

  const categories = useMemo(
    () => buildCategoryFilters(cafeteriaMenus),
    [cafeteriaMenus]
  );

  const filteredMenus = useMemo(() => {
    let filtered = cafeteriaMenus;
    if (selectedCategory) {
      filtered = filtered.filter((m) => m.category_label === selectedCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [cafeteriaMenus, selectedCategory, searchQuery]);

  const handleSelectCafeteria = (cafeteria: CafeteriaCode) => {
    setSelectedCafeteria(cafeteria);
    // 区分は食堂ごとに違うので、食堂を変えたら絞り込みを外す
    setSelectedCategory(ALL_CATEGORIES);
  };

  const handleSelect = (menu: CafeteriaMenu) => {
    onMenuSelected({
      item_type: "cafeteria",
      item_id: menu.id,
      item_name: menu.name,
      menu_id: menu.id,
      amount_grams: 100,
      calories: menu.calories,
      protein: menu.protein,
      fat: menu.fat,
      carbohydrates: menu.carbohydrates,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        読み込み中...
      </div>
    );
  }

  if (error) {
    return <p className="py-4 text-center text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-3">
      <h6 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Store className="h-4 w-4" />
        食堂メニュー
      </h6>

      {/* 食堂タブ */}
      <div
        role="tablist"
        aria-label="食堂を選ぶ"
        className="flex gap-1 rounded-lg bg-secondary p-1"
      >
        {CAFETERIA_ORDER.map((code) => (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={selectedCafeteria === code}
            onClick={() => handleSelectCafeteria(code)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-bold transition-colors ${
              selectedCafeteria === code
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {CAFETERIA_LABELS[code]}
          </button>
        ))}
      </div>

      {/* 検索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="メニュー名で検索..."
          className="h-8 pl-9 text-sm"
        />
      </div>

      {/* カテゴリフィルタ */}
      <div className="flex flex-wrap gap-1.5">
        {[{ label: "すべて", value: ALL_CATEGORIES }]
          .concat(categories.map((c) => ({ label: c.label, value: c.label })))
          .map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
      </div>

      {/* メニューリスト */}
      {filteredMenus.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          該当するメニューはありません。
        </p>
      ) : (
        <div className="max-h-[400px] space-y-2 overflow-y-auto">
          {filteredMenus.map((menu) => (
            <div
              key={menu.id}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/30"
              onClick={() => handleSelect(menu)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleSelect(menu)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {menu.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {menu.category_label || menu.category_display}
                  </Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  <span className="mr-2 font-bold text-foreground">
                    {menu.calories}kcal
                  </span>
                  <span>
                    P:{menu.protein}g / F:{menu.fat}g / C:{menu.carbohydrates}g
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary text-primary hover:bg-primary/10"
                aria-label={`${menu.name}を追加`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
