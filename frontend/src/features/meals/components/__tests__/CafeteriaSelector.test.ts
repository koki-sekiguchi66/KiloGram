/**
 * buildCategoryFilters テスト
 *
 * 区分は食堂ごとに違い、サイト側でも入れ替わる（ADR #31）。
 * 固定の一覧を持たず、取得したメニューから組み立てられることを確認する。
 */
import { describe, it, expect } from "vitest";
import { buildCategoryFilters } from "@/features/meals/components/CafeteriaSelector";
import { createMockCafeteriaMenu } from "@/test/helpers";

const menu = (category: string, category_label: string) =>
  createMockCafeteriaMenu({ category, category_label });

describe("buildCategoryFilters", () => {
  it("共通区分をサイトの並び順で返す", () => {
    const filters = buildCategoryFilters([
      menu("dessert", "デザート"),
      menu("main", "主菜"),
      menu("noodle", "麺類"),
      menu("side", "副菜"),
      menu("rice", "丼・カレー"),
    ]);

    expect(filters.map((f) => f.label)).toEqual([
      "主菜",
      "副菜",
      "麺類",
      "丼・カレー",
      "デザート",
    ]);
  });

  it("食堂ごとの区分は共通区分より後ろに置く", () => {
    const filters = buildCategoryFilters([
      menu("other", "パフェ"),
      menu("main", "主菜"),
      menu("other", "ケバブ＆ベジタリアン"),
    ]);

    expect(filters[0].label).toBe("主菜");
    expect(filters.slice(1).map((f) => f.label).sort()).toEqual(
      ["ケバブ＆ベジタリアン", "パフェ"].sort()
    );
  });

  it("同じ区分のメニューが複数あってもチップは1つ", () => {
    const filters = buildCategoryFilters([
      menu("main", "主菜"),
      menu("main", "主菜"),
      menu("main", "主菜"),
    ]);

    expect(filters).toHaveLength(1);
  });

  it("メニューが無ければ空を返す", () => {
    expect(buildCategoryFilters([])).toEqual([]);
  });
});
