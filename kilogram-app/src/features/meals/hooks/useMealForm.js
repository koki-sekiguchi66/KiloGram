import { useState } from 'react';
import { mealApi } from '../api/mealApi';

export const useMealForm = (initialData = null) => {
  const [mealData, setMealData] = useState(initialData || {
    record_date: new Date().toISOString().split('T')[0],
    meal_timing: 'breakfast',
    meal_name: '',
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
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setMealData({ ...mealData, [e.target.name]: e.target.value });
  };

  const handleFoodSelected = (foodData) => {
    setMealData({
      ...mealData,
      meal_name: foodData.name,
      calories: foodData.calories,
      protein: foodData.protein,
      fat: foodData.fat,
      carbohydrates: foodData.carbohydrates,
      dietary_fiber: foodData.dietary_fiber,
      sodium: foodData.sodium,
      calcium: foodData.calcium,
      iron: foodData.iron,
      vitamin_a: foodData.vitamin_a,
      vitamin_b1: foodData.vitamin_b1,
      vitamin_b2: foodData.vitamin_b2,
      vitamin_c: foodData.vitamin_c,
    });
  };

  const submitMeal = async (saveToCustom = false) => {
    setError('');
    setIsLoading(true);

    if (!mealData.meal_name.trim()) {
      setError('食事名を入力してください。');
      setIsLoading(false);
      return null;
    }

    try {
      const response = await mealApi.createMeal(mealData);

      // Myアイテムとして保存
      if (saveToCustom) {
        try {
          const customFoodData = {
            name: mealData.meal_name,
            calories_per_100g: mealData.calories,
            protein_per_100g: mealData.protein,
            fat_per_100g: mealData.fat,
            carbs_per_100g: mealData.carbohydrates,
            fiber_per_100g: mealData.dietary_fiber,
            sodium_per_100g: mealData.sodium,
            calcium_per_100g: mealData.calcium,
            iron_per_100g: mealData.iron,
            vitamin_a_per_100g: mealData.vitamin_a,
            vitamin_b1_per_100g: mealData.vitamin_b1,
            vitamin_b2_per_100g: mealData.vitamin_b2,
            vitamin_c_per_100g: mealData.vitamin_c,
          };
          await apiClient.post('/foods/custom/', customFoodData);
        } catch (error) {
          if (error.response?.data?.name?.includes('already exists')) {
            setError('食事を記録しましたが、この名前の食品は既にMyアイテムに登録されています。');
          }
        }
      }

      
      const currentDate = mealData.record_date;
      const currentTiming = mealData.meal_timing;
      
      setMealData({
        record_date: currentDate,
        meal_timing: currentTiming,
        meal_name: '',
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
      });

      return response;
    } catch (error) {
      console.error('食事記録エラー:', error);
      setError('記録に失敗しました。');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMeal = async (mealId) => {
    setError('');
    setIsLoading(true);

    if (!mealData.meal_name.trim()) {
      setError('食事名を入力してください。');
      setIsLoading(false);
      return null;
    }

    try {
      const response = await mealApi.updateMeal(mealId, mealData);
      return response;
    } catch (error) {
      console.error('食事更新エラー:', error);
      setError('更新に失敗しました。');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mealData,
    setMealData,
    isLoading,
    error,
    setError,
    handleChange,
    handleFoodSelected,
    submitMeal,
    updateMeal,
  };
};