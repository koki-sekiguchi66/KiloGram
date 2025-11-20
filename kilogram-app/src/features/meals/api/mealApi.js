import { apiClient } from '@/lib/axios';

/**
 * 食事記録API クライアント
 * 
 * 設計原則:
 * - 個別アイテム(items)を含む完全なCRUD
 * - RESTful APIとの通信を抽象化
 */
export const mealApi = {
  /**
   * 食事記録一覧取得
   * @param {Object} params - クエリパラメータ
   * @param {string} params.start_date - 開始日（任意）
   * @param {string} params.end_date - 終了日（任意）
   * @returns {Promise<Array>} 食事記録一覧
   */
  getMeals: async (params = {}) => {
    const response = await apiClient.get('/meal-records/', { params });
    return response.data;
  },

  /**
   * 食事記録詳細取得（items含む）
   * @param {number} mealId - 食事記録ID
   * @returns {Promise<Object>} 食事記録詳細
   */
  getMealDetail: async (mealId) => {
    const response = await apiClient.get(`/meal-records/${mealId}/`);
    return response.data;
  },

  /**
   * 食事記録作成（items含む）
   * @param {Object} mealData - 食事記録データ
   * @param {string} mealData.record_date - 記録日
   * @param {string} mealData.meal_timing - 食事タイミング
   * @param {string} mealData.meal_name - 食事名
   * @param {number} mealData.calories - カロリー
   * @param {Array} mealData.items - アイテム配列
   * @returns {Promise<Object>} 作成された食事記録
   */
  createMeal: async (mealData) => {
    const response = await apiClient.post('/meal-records/', mealData);
    return response.data;
  },

  /**
   * 食事記録更新（items含む）
   * @param {number} mealId - 食事記録ID
   * @param {Object} mealData - 更新する食事記録データ
   * @returns {Promise<Object>} 更新された食事記録
   */
  updateMeal: async (mealId, mealData) => {
    const response = await apiClient.put(`/meal-records/${mealId}/`, mealData);
    return response.data;
  },

  /**
   * 食事記録部分更新
   * @param {number} mealId - 食事記録ID
   * @param {Object} mealData - 更新する食事記録データ
   * @returns {Promise<Object>} 更新された食事記録
   */
  patchMeal: async (mealId, mealData) => {
    const response = await apiClient.patch(`/meal-records/${mealId}/`, mealData);
    return response.data;
  },

  /**
   * 食事記録削除
   * @param {number} mealId - 食事記録ID
   * @returns {Promise<void>}
   */
  deleteMeal: async (mealId) => {
    await apiClient.delete(`/meal-records/${mealId}/`);
  },
};