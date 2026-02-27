import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createMockCustomMenu } from '@/test/helpers';

vi.mock('@/features/meals/api/mealApi', () => ({
  mealApi: {
    createMeal: vi.fn(),
  },
}));

vi.mock('@/features/customMenus/api/customMenuApi', () => ({
  customMenuApi: {
    createMenu: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useMenuBuilder } from '@/features/meals/hooks/useMenuBuilder';
import { mealApi } from '@/features/meals/api/mealApi';
import { customMenuApi } from '@/features/customMenus/api/customMenuApi';
import { toast } from 'react-hot-toast';

describe('useMenuBuilder フック', () => {
  const mockOnMealCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('初期状態', () => {
    const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

    expect(result.current.menuItems).toEqual([]);
    expect(result.current.mealTiming).toBe('breakfast');
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.saveAsMenu).toBe(false);
  });

  describe('addMenuItem', () => {
    it('アイテムを追加', () => {
      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      act(() => {
        result.current.addMenuItem({
          item_name: '白米',
          calories: 340,
          protein: 5,
          fat: 0.6,
          carbohydrates: 74,
        });
      });

      expect(result.current.menuItems).toHaveLength(1);
      expect(result.current.menuItems[0].item_name).toBe('白米');
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('白米'));
    });

    it('複数アイテムを追加', () => {
      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      act(() => {
        result.current.addMenuItem({ item_name: '白米', calories: 340 });
      });
      act(() => {
        result.current.addMenuItem({ item_name: '味噌汁', calories: 50 });
      });

      expect(result.current.menuItems).toHaveLength(2);
    });
  });

  describe('removeMenuItem', () => {
    it('指定したtempIdのアイテムを削除', () => {
      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      act(() => {
        result.current.addMenuItem({ item_name: '白米', calories: 340 });
      });
      act(() => {
        result.current.addMenuItem({ item_name: '味噌汁', calories: 50 });
      });

      const tempIdToRemove = result.current.menuItems[0].tempId;

      act(() => {
        result.current.removeMenuItem(tempIdToRemove);
      });

      expect(result.current.menuItems).toHaveLength(1);
      expect(result.current.menuItems[0].item_name).toBe('味噌汁');
    });
  });

  describe('totalNutrition（useMemo）', () => {
    it('アイテム追加時に合計栄養素を自動計算', () => {
      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      act(() => {
        result.current.addMenuItem({ item_name: '白米', calories: 340, protein: 5, fat: 0.6, carbohydrates: 74 });
      });
      act(() => {
        result.current.addMenuItem({ item_name: '味噌汁', calories: 50, protein: 3, fat: 1, carbohydrates: 5 });
      });

      expect(result.current.totalNutrition.calories).toBe(390);
      expect(result.current.totalNutrition.protein).toBe(8);
      expect(result.current.totalNutrition.fat).toBeCloseTo(1.6);
      expect(result.current.totalNutrition.carbohydrates).toBe(79);
    });

    it('アイテムが空の場合に全栄養素を0とする', () => {
      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      expect(result.current.totalNutrition.calories).toBe(0);
      expect(result.current.totalNutrition.protein).toBe(0);
    });

    it('未定義の栄養素は0として扱われる', () => {
      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      act(() => {
        result.current.addMenuItem({ item_name: 'テスト', calories: 100 });
      });

      expect(result.current.totalNutrition.calories).toBe(100);
      expect(result.current.totalNutrition.protein).toBe(0);
      expect(result.current.totalNutrition.fat).toBe(0);
    });
  });

  describe('loadFromCustomMenu', () => {
    it('Myメニューのアイテムを既存アイテムに追加', () => {
      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      act(() => {
        result.current.addMenuItem({ item_name: '既存アイテム', calories: 100 });
      });

      const mockMenu = createMockCustomMenu();
      act(() => {
        result.current.loadFromCustomMenu(mockMenu);
      });

      expect(result.current.menuItems.length).toBeGreaterThanOrEqual(2);
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('お気に入りランチ')
      );
    });
  });

  describe('handleClearMenu', () => {
    it('confirmがtrueの場合にメニューがクリア', () => {
      window.confirm = vi.fn(() => true);
      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      act(() => {
        result.current.addMenuItem({ item_name: 'テスト', calories: 100 });
        result.current.setMenuName('テストメニュー');
      });

      act(() => {
        result.current.handleClearMenu();
      });

      expect(result.current.menuItems).toHaveLength(0);
      expect(result.current.menuName).toBe('');
    });

    it('confirmがfalseの場合にメニューを保持', () => {
      window.confirm = vi.fn(() => false);
      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      act(() => {
        result.current.addMenuItem({ item_name: 'テスト', calories: 100 });
      });

      act(() => {
        result.current.handleClearMenu();
      });

      expect(result.current.menuItems).toHaveLength(1);
    });
  });

  describe('handleSubmit バリデーション', () => {
    it('アイテムが空の場合にエラートーストを表示', async () => {
      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(toast.error).toHaveBeenCalledWith('アイテムを追加してください');
      expect(mealApi.createMeal).not.toHaveBeenCalled();
    });

    it('Myメニュー保存時に名前が空の場合にエラーを表示', async () => {
      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      act(() => {
        result.current.addMenuItem({ item_name: 'テスト', calories: 100 });
        result.current.setSaveAsMenu(true);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Myメニューとして保存する場合は名前が必要です'
      );
    });
  });

  describe('handleSubmit 成功', () => {
    it('食事記録が作成されコールバックする', async () => {
      const createdMeal = { id: 1, meal_name: '白米 他' };
      mealApi.createMeal.mockResolvedValue(createdMeal);

      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      act(() => {
        result.current.addMenuItem({ item_name: '白米', calories: 340, protein: 5, fat: 0.6, carbohydrates: 74 });
        result.current.addMenuItem({ item_name: '味噌汁', calories: 50, protein: 3, fat: 1, carbohydrates: 5 });
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mealApi.createMeal).toHaveBeenCalled();
      expect(mockOnMealCreated).toHaveBeenCalledWith(createdMeal);
      expect(toast.success).toHaveBeenCalledWith('食事を記録しました！');
      expect(result.current.menuItems).toHaveLength(0);
    });

    it('Myメニュー保存オプション付きで送信した場合にメニューも作成', async () => {
      mealApi.createMeal.mockResolvedValue({ id: 1 });
      customMenuApi.createMenu.mockResolvedValue({ id: 10 });

      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      act(() => {
        result.current.addMenuItem({ item_name: '白米', calories: 340, protein: 5 });
        result.current.setSaveAsMenu(true);
        result.current.setMenuName('マイランチ');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mealApi.createMeal).toHaveBeenCalled();
      expect(customMenuApi.createMenu).toHaveBeenCalled();
    });
  });

  describe('handleSubmit エラー', () => {
    it('API送信失敗時にエラートーストを表示', async () => {
      mealApi.createMeal.mockRejectedValue(new Error('Server Error'));

      const { result } = renderHook(() => useMenuBuilder(mockOnMealCreated));

      act(() => {
        result.current.addMenuItem({ item_name: 'テスト', calories: 100 });
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('失敗'));
    });
  });
});