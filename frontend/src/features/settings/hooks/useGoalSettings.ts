/**
 * useGoalSettings — 栄養目標値の永続化フック
 *
 * 保存先はサーバー。localStorage は「オフライン用のキャッシュ」として併用する（ADR #28）。
 *   - 初回は localStorage を即座に表示し、サーバー取得後に上書きする（ちらつき防止）
 *   - 保存は楽観更新。サーバーが失敗してもローカルには残す（PWA はオフラインで動く）
 *
 * なぜ Context を使わないか:
 *   goals を必要とするのは Dashboard 系統のみで、props 伝搬で足りる（YAGNI）。
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  type NutritionGoals,
  DEFAULT_GOALS,
  STORAGE_KEY_GOALS,
} from "@/types/settings";
import { goalApi } from "../api/goalApi";

/** localStorage から読み、壊れていれば既定値へ落とす。キー単位で防御する。 */
function loadCachedGoals(): NutritionGoals {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GOALS);
    if (!raw) return DEFAULT_GOALS;

    const parsed = JSON.parse(raw) as Partial<Record<keyof NutritionGoals, unknown>>;

    return {
      calories:
        typeof parsed.calories === "number" ? parsed.calories : DEFAULT_GOALS.calories,
      protein:
        typeof parsed.protein === "number" ? parsed.protein : DEFAULT_GOALS.protein,
      fat: typeof parsed.fat === "number" ? parsed.fat : DEFAULT_GOALS.fat,
      carbs: typeof parsed.carbs === "number" ? parsed.carbs : DEFAULT_GOALS.carbs,
    };
  } catch {
    return DEFAULT_GOALS;
  }
}

/** 永続化は best-effort。容量超過などで失敗しても UI は動かす。 */
function cacheGoals(goals: NutritionGoals): void {
  try {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
  } catch {
    // QuotaExceededError 等。キャッシュなので失われても致命的ではない
  }
}

interface UseGoalSettingsReturn {
  goals: NutritionGoals;
  updateGoals: (next: NutritionGoals) => void;
}

export function useGoalSettings(): UseGoalSettingsReturn {
  const [goals, setGoals] = useState<NutritionGoals>(loadCachedGoals);
  // 初回取得が編集より後に届くと、利用者の入力を古い値で潰してしまうため
  const editedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    goalApi
      .getGoals()
      .then((serverGoals) => {
        if (cancelled || editedRef.current) return;
        setGoals(serverGoals);
        cacheGoals(serverGoals);
      })
      .catch(() => {
        // オフラインやサーバー障害。キャッシュ済みの値で動かし続ける
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateGoals = useCallback((next: NutritionGoals) => {
    editedRef.current = true;

    // 楽観更新。保存の成否を待たず UI を進める
    setGoals(next);
    cacheGoals(next);

    goalApi.updateGoals(next).catch(() => {
      // サーバー保存に失敗しても、次回オンライン時の保存で追いつく
    });
  }, []);

  return { goals, updateGoals };
}
