/**
 * useGoalSettings フックのテスト
 *
 * 保存先がサーバーに変わったため（ADR #28）、検証項目も次に変えている。
 *   - localStorage はオフライン用キャッシュとして初期表示に使う
 *   - サーバー取得が成功したらそれで上書きし、キャッシュも更新する
 *   - サーバーが落ちていてもキャッシュで動き続ける
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGoalSettings } from "../useGoalSettings";
import { goalApi } from "../../api/goalApi";
import {
  DEFAULT_GOALS,
  STORAGE_KEY_GOALS,
  type NutritionGoals,
} from "@/types/settings";

vi.mock("../../api/goalApi", () => ({
  goalApi: { getGoals: vi.fn(), updateGoals: vi.fn() },
}));

const SERVER_GOALS: NutritionGoals = {
  calories: 1800,
  protein: 90,
  fat: 50,
  carbs: 247,
};

describe("useGoalSettings フック", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(goalApi.getGoals).mockResolvedValue(DEFAULT_GOALS);
    vi.mocked(goalApi.updateGoals).mockResolvedValue(DEFAULT_GOALS);
  });

  describe("初期表示（キャッシュ）", () => {
    it("localStorage が空なら DEFAULT_GOALS を返す", () => {
      const { result } = renderHook(() => useGoalSettings());

      expect(result.current.goals).toEqual(DEFAULT_GOALS);
    });

    it("localStorage の値をサーバー応答前に表示する", () => {
      const cached: NutritionGoals = { calories: 1500, protein: 80, fat: 40, carbs: 200 };
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(cached));

      const { result } = renderHook(() => useGoalSettings());

      // サーバー応答を待たずに描画できること
      expect(result.current.goals).toEqual(cached);
    });

    it("localStorage が壊れていれば DEFAULT_GOALS へ落とす", () => {
      localStorage.setItem(STORAGE_KEY_GOALS, "{invalid json");

      const { result } = renderHook(() => useGoalSettings());

      expect(result.current.goals).toEqual(DEFAULT_GOALS);
    });

    it("一部のキーが欠損していれば欠損分だけ DEFAULT を使う", () => {
      localStorage.setItem(
        STORAGE_KEY_GOALS,
        JSON.stringify({ calories: 1800, protein: 90 })
      );

      const { result } = renderHook(() => useGoalSettings());

      expect(result.current.goals.calories).toBe(1800);
      expect(result.current.goals.fat).toBe(DEFAULT_GOALS.fat);
    });
  });

  describe("サーバーとの同期", () => {
    it("取得できたらサーバーの値で上書きする", async () => {
      localStorage.setItem(
        STORAGE_KEY_GOALS,
        JSON.stringify({ calories: 1500, protein: 80, fat: 40, carbs: 200 })
      );
      vi.mocked(goalApi.getGoals).mockResolvedValue(SERVER_GOALS);

      const { result } = renderHook(() => useGoalSettings());

      await waitFor(() => {
        expect(result.current.goals).toEqual(SERVER_GOALS);
      });
    });

    it("取得した値をキャッシュへ書き戻す", async () => {
      vi.mocked(goalApi.getGoals).mockResolvedValue(SERVER_GOALS);

      renderHook(() => useGoalSettings());

      await waitFor(() => {
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY_GOALS)!)).toEqual(SERVER_GOALS);
      });
    });

    it("サーバーが落ちていてもキャッシュの値で動き続ける", async () => {
      const cached: NutritionGoals = { calories: 1500, protein: 80, fat: 40, carbs: 200 };
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(cached));
      vi.mocked(goalApi.getGoals).mockRejectedValue(new Error("offline"));

      const { result } = renderHook(() => useGoalSettings());

      await waitFor(() => {
        expect(goalApi.getGoals).toHaveBeenCalled();
      });
      expect(result.current.goals).toEqual(cached);
    });
  });

  describe("updateGoals", () => {
    it("state を即座に更新する（保存完了を待たない）", () => {
      const { result } = renderHook(() => useGoalSettings());

      act(() => {
        result.current.updateGoals(SERVER_GOALS);
      });

      expect(result.current.goals).toEqual(SERVER_GOALS);
    });

    it("サーバーへ保存する", async () => {
      const { result } = renderHook(() => useGoalSettings());

      act(() => {
        result.current.updateGoals(SERVER_GOALS);
      });

      await waitFor(() => {
        expect(goalApi.updateGoals).toHaveBeenCalledWith(SERVER_GOALS);
      });
    });

    it("キャッシュにも書く", () => {
      const { result } = renderHook(() => useGoalSettings());

      act(() => {
        result.current.updateGoals(SERVER_GOALS);
      });

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY_GOALS)!)).toEqual(SERVER_GOALS);
    });

    it("サーバー保存が失敗しても state は保たれる", async () => {
      vi.mocked(goalApi.updateGoals).mockRejectedValue(new Error("offline"));
      const { result } = renderHook(() => useGoalSettings());

      act(() => {
        result.current.updateGoals(SERVER_GOALS);
      });

      await waitFor(() => {
        expect(goalApi.updateGoals).toHaveBeenCalled();
      });
      expect(result.current.goals).toEqual(SERVER_GOALS);
    });

    it("localStorage が throw しても state は更新される", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      const { result } = renderHook(() => useGoalSettings());

      expect(() => {
        act(() => {
          result.current.updateGoals(SERVER_GOALS);
        });
      }).not.toThrow();
      expect(result.current.goals).toEqual(SERVER_GOALS);

      spy.mockRestore();
    });
  });
});
