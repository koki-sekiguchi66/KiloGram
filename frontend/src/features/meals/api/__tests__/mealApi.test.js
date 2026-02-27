import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockMeal, createMockDailySummary, createMockFood } from '@/test/helpers';

vi.mock('@/lib/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { mealApi } from '@/features/meals/api/mealApi';
import { apiClient } from '@/lib/axios';

describe('mealApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMeals', () => {
    it('パラメータなしで食事記録一覧を取得', async () => {
      const mockMeals = [createMockMeal(), createMockMeal({ id: 2 })];
      apiClient.get.mockResolvedValue({ data: mockMeals });

      const result = await mealApi.getMeals();

      expect(apiClient.get).toHaveBeenCalledWith('/meal-records/', { params: {} });
      expect(result).toEqual(mockMeals);
    });

    it('パラメータ付きでフィルタリング', async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await mealApi.getMeals({ date: '2025-01-15' });

      expect(apiClient.get).toHaveBeenCalledWith('/meal-records/', {
        params: { date: '2025-01-15' },
      });
    });
  });

  describe('getMealDetail', () => {
    it('指定IDの食事記録詳細を取得', async () => {
      const mockMeal = createMockMeal({ id: 42 });
      apiClient.get.mockResolvedValue({ data: mockMeal });

      const result = await mealApi.getMealDetail(42);

      expect(apiClient.get).toHaveBeenCalledWith('/meal-records/42/');
      expect(result).toEqual(mockMeal);
    });
  });

  describe('createMeal', () => {
    it('食事記録を作成', async () => {
      const newMeal = {
        record_date: '2025-01-15',
        meal_timing: 'lunch',
        meal_name: '昼食テスト',
        calories: 700,
        items: [],
      };
      const created = createMockMeal({ ...newMeal, id: 10 });
      apiClient.post.mockResolvedValue({ data: created });

      const result = await mealApi.createMeal(newMeal);

      expect(apiClient.post).toHaveBeenCalledWith('/meal-records/', newMeal);
      expect(result.id).toBe(10);
    });
  });

  describe('updateMeal', () => {
    it('指定IDの食事記録を更新', async () => {
      const updated = createMockMeal({ id: 5, meal_name: '更新済み' });
      apiClient.put.mockResolvedValue({ data: updated });

      const result = await mealApi.updateMeal(5, { meal_name: '更新済み' });

      expect(apiClient.put).toHaveBeenCalledWith('/meal-records/5/', { meal_name: '更新済み' });
      expect(result.meal_name).toBe('更新済み');
    });
  });

  describe('deleteMeal', () => {
    it('指定IDの食事記録を削除', async () => {
      apiClient.delete.mockResolvedValue({});

      await mealApi.deleteMeal(5);

      expect(apiClient.delete).toHaveBeenCalledWith('/meal-records/5/');
    });
  });

  describe('searchFoods', () => {
    it('検索クエリを渡して食品検索', async () => {
      const mockFoods = [createMockFood(), createMockFood({ id: 2, name: '鶏肉' })];
      apiClient.get.mockResolvedValue({ data: mockFoods });

      const result = await mealApi.searchFoods('鶏');

      expect(apiClient.get).toHaveBeenCalledWith('/foods/search/', { params: { q: '鶏' } });
      expect(result).toHaveLength(2);
    });
  });

  describe('calculateNutrition', () => {
    it('食品IDと分量から栄養素を計算', async () => {
      const mockResult = { calories: 500, protein: 20 };
      apiClient.post.mockResolvedValue({ data: mockResult });

      const result = await mealApi.calculateNutrition(1, 200);

      expect(apiClient.post).toHaveBeenCalledWith('/foods/calculate/', {
        food_id: 1,
        amount: 200,
      });
      expect(result.calories).toBe(500);
    });
  });

  describe('getDailySummary', () => {
    it('指定日の栄養サマリーを取得', async () => {
      const mockSummary = createMockDailySummary();
      apiClient.get.mockResolvedValue({ data: mockSummary });

      const result = await mealApi.getDailySummary('2025-01-15');

      expect(apiClient.get).toHaveBeenCalledWith('/nutrition/daily-summary/', {
        params: { date: '2025-01-15' },
      });
      // 修正: total_calories → calories（実際のAPIレスポンス構造に合わせる）
      expect(result.nutrition_summary.calories).toBe(1500);
    });
  });

  describe('getCafeteriaMenus', () => {
    it('カテゴリなしで食堂メニュー一覧を取得', async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await mealApi.getCafeteriaMenus();

      expect(apiClient.get).toHaveBeenCalledWith('/cafeteria/list/', { params: {} });
    });

    it('カテゴリ指定でフィルタリング', async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await mealApi.getCafeteriaMenus('定食');

      expect(apiClient.get).toHaveBeenCalledWith('/cafeteria/list/', {
        params: { category: '定食' },
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('APIエラー時にPromiseがreject', async () => {
      const error = new Error('Network Error');
      apiClient.get.mockRejectedValue(error);

      await expect(mealApi.getMeals()).rejects.toThrow('Network Error');
    });
  });
});