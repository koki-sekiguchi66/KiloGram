import { apiClient } from '@/lib/axios';

export const customFoodApi = {
  // Myアイテム一覧の取得
  getCustomFoods: async () => {
    const response = await apiClient.get('/foods/custom/');
    return response.data;
  },

  // Myアイテムの作成
  createCustomFood: async (foodData) => {
    const response = await apiClient.post('/foods/custom/', foodData);
    return response.data;
  },

  // Myアイテムの更新
  updateCustomFood: async (foodId, foodData) => {
    const response = await apiClient.put(`/foods/custom/${foodId}/`, foodData);
    return response.data;
  },

  // Myアイテムの削除
  deleteCustomFood: async (foodId) => {
    await apiClient.delete(`/foods/custom/${foodId}/`);
  }
};