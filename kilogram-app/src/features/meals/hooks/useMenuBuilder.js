import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mealApi } from '../api/mealApi';
import { customMenuApi } from '@/features/customMenus/api/customMenuApi';
import { toast } from 'react-hot-toast';

/**
 * メニュービルダー カスタムフック
 * 
 * 設計原則:
 * - ローカル状態でプレビューを管理（DBアクセスなし）
 * - submitボタン押下時のみDBに保存
 * - 明確な責務分離（状態管理 / API通信 / UI更新）
 * 
 * 状態管理の流れ:
 * 1. アイテム追加 → menuItems配列に追加（メモリ上）
 * 2. リアルタイムプレビュー → menuItemsを表示
 * 3. submit → MealRecord + (オプション)CustomMenu を保存
 */
export const useMenuBuilder = () => {
  const navigate = useNavigate();
  
  // メニューアイテム（ローカル状態）
  const [menuItems, setMenuItems] = useState([]);
  
  // フォーム入力
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealTiming, setMealTiming] = useState('breakfast');
  const [activeInputMethod, setActiveInputMethod] = useState('search');
  
  // メニュー保存オプション
  const [saveAsMenu, setSaveAsMenu] = useState(false);
  const [menuName, setMenuName] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  
  // ローディング状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 栄養素の合計計算（メモ化）
  
  
  const totalNutrition = useMemo(() => {
    return menuItems.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        fat: acc.fat + (item.fat || 0),
        carbohydrates: acc.carbohydrates + (item.carbohydrates || 0),
        dietary_fiber: acc.dietary_fiber + (item.dietary_fiber || 0),
        sodium: acc.sodium + (item.sodium || 0),
        calcium: acc.calcium + (item.calcium || 0),
        iron: acc.iron + (item.iron || 0),
        vitamin_a: acc.vitamin_a + (item.vitamin_a || 0),
        vitamin_b1: acc.vitamin_b1 + (item.vitamin_b1 || 0),
        vitamin_b2: acc.vitamin_b2 + (item.vitamin_b2 || 0),
        vitamin_c: acc.vitamin_c + (item.vitamin_c || 0),
      }),
      {
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
        dietary_fiber: 0,
        sodium: 0,
        calcium: 0,
        iron: 0,
        vitamin_a: 0,
        vitamin_b1: 0,
        vitamin_b2: 0,
        vitamin_c: 0,
      }
    );
  }, [menuItems]);
  
  
  /**
   * アイテムを追加
   * @param {Object} item - 追加するアイテム
   */
  const addItem = useCallback((item) => {
    // 一時IDを付与（フロントエンド用）
    const itemWithTempId = {
      ...item,
      tempId: `temp_${Date.now()}_${Math.random()}`,
      display_order: menuItems.length,
    };
    
    setMenuItems(prev => [...prev, itemWithTempId]);
    toast.success(`${item.item_name}を追加しました`);
  }, [menuItems.length]);
  
  /**
   * アイテムの分量を更新
   * @param {number} index - アイテムのインデックス
   * @param {number} newAmount - 新しい分量
   */
  const updateItemAmount = useCallback((index, newAmount) => {
    setMenuItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const ratio = newAmount / item.amount_grams;
      
      // 分量と栄養素を比例計算
      updated[index] = {
        ...item,
        amount_grams: newAmount,
        calories: item.calories * ratio,
        protein: item.protein * ratio,
        fat: item.fat * ratio,
        carbohydrates: item.carbohydrates * ratio,
        dietary_fiber: item.dietary_fiber * ratio,
        sodium: item.sodium * ratio,
        calcium: item.calcium * ratio,
        iron: item.iron * ratio,
        vitamin_a: item.vitamin_a * ratio,
        vitamin_b1: item.vitamin_b1 * ratio,
        vitamin_b2: item.vitamin_b2 * ratio,
        vitamin_c: item.vitamin_c * ratio,
      };
      
      return updated;
    });
  }, []);
  
  /**
   * アイテムを削除
   * @param {number} index - 削除するアイテムのインデックス
   */
  const removeItem = useCallback((index) => {
    setMenuItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // display_orderを再設定
      return updated.map((item, idx) => ({
        ...item,
        display_order: idx,
      }));
    });
    toast.success('アイテムを削除しました');
  }, []);
  
  /**
   * アイテムの順序を変更（ドラッグ&ドロップ用）
   * @param {number} fromIndex - 移動元インデックス
   * @param {number} toIndex - 移動先インデックス
   */
  const reorderItems = useCallback((fromIndex, toIndex) => {
    setMenuItems(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      
      // display_orderを再設定
      return updated.map((item, idx) => ({
        ...item,
        display_order: idx,
      }));
    });
  }, []);
  
  /**
   * すべてのアイテムをクリア
   */
  const handleClearMenu = useCallback(() => {
    if (window.confirm('すべてのアイテムをクリアしますか?')) {
      setMenuItems([]);
      toast.success('メニューをクリアしました');
    }
  }, []);
  
  /**
   * カスタムメニューから全アイテムを読み込み
   * @param {Object} customMenu - カスタムメニューオブジェクト
   */
  const loadFromCustomMenu = useCallback((customMenu) => {
    const items = customMenu.items.map((item, index) => ({
      ...item,
      tempId: `temp_${Date.now()}_${index}`,
      display_order: index,
    }));
    
    setMenuItems(items);
    setMenuName(customMenu.name);
    setMenuDescription(customMenu.description || '');
    toast.success(`${customMenu.name}を読み込みました`);
  }, []);
  
  /**
   * フォームを送信（食事記録 + オプションでカスタムメニュー）
   */
  const handleSubmit = useCallback(async () => {
    // バリデーション
    if (menuItems.length === 0) {
      toast.error('少なくとも1つのアイテムを追加してください');
      return;
    }
    
    if (saveAsMenu && !menuName.trim()) {
      toast.error('メニュー名を入力してください');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // アイテムデータを準備（tempIdを除外）
      const itemsData = menuItems.map(({ tempId, ...item }) => item);
      
      // 食事記録を作成
      const mealData = {
        record_date: recordDate,
        meal_timing: mealTiming,
        meal_name: saveAsMenu ? menuName : `食事記録 ${recordDate}`,
        items: itemsData,
        ...totalNutrition,
      };
      
      await mealApi.createMeal(mealData);
      toast.success('食事記録を作成しました');
      
      // カスタムメニューとして保存（オプション）
      if (saveAsMenu) {
        const menuData = {
          name: menuName,
          description: menuDescription,
          items: itemsData,
        };
        
        await customMenuApi.createMenu(menuData);
        toast.success('カスタムメニューも保存しました');
      }
  
      setMenuItems([]);
      setMenuName('');
      setMenuDescription('');
      setSaveAsMenu(false);
      
      navigate('/meals');
      
    } catch (error) {
      console.error('保存エラー:', error);
      toast.error('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    menuItems,
    saveAsMenu,
    menuName,
    menuDescription,
    recordDate,
    mealTiming,
    totalNutrition,
    navigate,
  ]);
  
  
  return {
    // 状態
    menuItems,
    recordDate,
    mealTiming,
    activeInputMethod,
    saveAsMenu,
    menuName,
    menuDescription,
    totalNutrition,
    isSubmitting,
    
    // セッター
    setRecordDate,
    setMealTiming,
    setActiveInputMethod,
    setSaveAsMenu,
    setMenuName,
    setMenuDescription,
    
    // アイテム操作
    addItem,
    updateItemAmount,
    removeItem,
    reorderItems,
    handleClearMenu,
    loadFromCustomMenu,
    
    // 保存
    handleSubmit,
  };
};