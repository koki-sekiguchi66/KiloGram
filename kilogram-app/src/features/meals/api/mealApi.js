import { apiClient } from '@/lib/axios';

export const mealApi = {
  // 食事記録の取得
  getMeals: async () => {
    const response = await apiClient.get('/meals/');
    return response.data;
  },

  // 食事記録の作成
  createMeal: async (mealData) => {
    const response = await apiClient.post('/meals/', mealData);
    return response.data;
  },

  // 食事記録の更新
  updateMeal: async (mealId, mealData) => {
    const response = await apiClient.put(`/meals/${mealId}/`, mealData);
    return response.data;
  },

  // 食事記録の削除
  deleteMeal: async (mealId) => {
    await apiClient.delete(`/meals/${mealId}/`);
  },

  // 食事タイミングの選択肢取得
  getMealTimings: async () => {
    const response = await apiClient.get('/meal-timings/');
    return response.data;
  },

  // 食品検索
  searchFoods: async (query) => {
    const response = await apiClient.get(`/foods/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // 栄養素計算
  calculateNutrition: async (foodId, amount) => {
    const response = await apiClient.post('/foods/calculate/', {
      food_id: foodId,
      amount: amount
    });
    return response.data;
  },

  // 日別栄養サマリー
  getDailySummary: async (date) => {
    const response = await apiClient.get(`/nutrition/daily-summary/?date=${date}`);
    return response.data;
  },

  // 食堂メニュー取得
  getCafeteriaMenus: async (category = null) => {
    const url = category 
      ? `/cafeteria/list/?category=${category}`
      : '/cafeteria/list/';
    const response = await apiClient.get(url);
    return response.data;
  }
};