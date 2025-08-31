// src/components/MealForm.jsx
import { useState, useEffect } from 'react';
import FoodSearchInput from './FoodSearchInput';
import apiClient from '../api/axiosConfig';

const MealForm = ({ onMealCreated }) => {
  const [mealData, setMealData] = useState({
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

  const [mealTimings, setMealTimings] = useState([]);
  const [message, setMessage] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);

  useEffect(() => {
    const fetchMealTimings = async () => {
      try {
        const response = await apiClient.get('/meal-timings/');
        setMealTimings(response.data);
      } catch (error) {
        console.error('食事タイミング取得エラー:', error);
      }
    };
    fetchMealTimings();
  }, []);

  // 食品検索から栄養情報を自動設定
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
    setIsManualInput(false);
  };

  // 手動入力時の変更処理
  const handleChange = (e) => {
    setMealData({ ...mealData, [e.target.name]: e.target.value });
  };

  // フォーム送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!mealData.meal_name.trim()) {
      setMessage('食事名を入力してください。');
      return;
    }

    try {
      const response = await apiClient.post('/meals/', mealData);
      setMessage('食事を記録しました！');
      onMealCreated(response.data);
      
      // フォームリセット
      setMealData({
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
      setIsManualInput(false);
    } catch (error) {
      console.error('食事記録エラー:', error);
      setMessage('記録に失敗しました。');
    }
  };

  return (
    <div>
      <h3>新しい食事を記録</h3>
      
      <form onSubmit={handleSubmit}>
        {/* 食事タイミング選択 */}
        <div style={{ marginBottom: '15px' }}>
          <label>食事タイミング:</label>
          <select 
            name="meal_timing"
            value={mealData.meal_timing} 
            onChange={handleChange}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            {mealTimings.map((timing) => (
              <option key={timing.value} value={timing.value}>
                {timing.label}
              </option>
            ))}
          </select>
        </div>

        {/* 入力方法選択 */}
        <div style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="radio"
              checked={!isManualInput}
              onChange={() => setIsManualInput(false)}
            />
            食品検索から選択
          </label>
          <label style={{ marginLeft: '20px' }}>
            <input
              type="radio"
              checked={isManualInput}
              onChange={() => setIsManualInput(true)}
            />
            手動入力
          </label>
        </div>

        {/* 食品検索または手動入力 */}
        {!isManualInput ? (
          <div style={{ marginBottom: '20px' }}>
            <FoodSearchInput onFoodSelected={handleFoodSelected} />
          </div>
        ) : (
          <div style={{ marginBottom: '15px' }}>
            <label>食事名:</label>
            <input
              type="text"
              name="meal_name"
              value={mealData.meal_name}
              onChange={handleChange}
              required
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </div>
        )}

        {/* 栄養情報表示・編集エリア */}
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <h4>栄養情報 {!isManualInput && mealData.meal_name ? '(自動計算)' : '(手動入力)'}</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* 基本栄養素 */}
            <div>
              <label>カロリー (kcal):</label>
              <input
                type="number"
                name="calories"
                value={mealData.calories}
                onChange={handleChange}
                step="0.1"
                style={{ width: '80px', marginLeft: '5px' }}
              />
            </div>

            <div>
              <label>タンパク質 (g):</label>
              <input
                type="number"
                name="protein"
                value={mealData.protein}
                onChange={handleChange}
                step="0.1"
                style={{ width: '80px', marginLeft: '5px' }}
              />
            </div>

            <div>
              <label>脂質 (g):</label>
              <input
                type="number"
                name="fat"
                value={mealData.fat}
                onChange={handleChange}
                step="0.1"
                style={{ width: '80px', marginLeft: '5px' }}
              />
            </div>

            <div>
              <label>炭水化物 (g):</label>
              <input
                type="number"
                name="carbohydrates"
                value={mealData.carbohydrates}
                onChange={handleChange}
                step="0.1"
                style={{ width: '80px', marginLeft: '5px' }}
              />
            </div>

            <div>
              <label>食物繊維 (g):</label>
              <input
                type="number"
                name="dietary_fiber"
                value={mealData.dietary_fiber}
                onChange={handleChange}
                step="0.1"
                style={{ width: '80px', marginLeft: '5px' }}
              />
            </div>

            <div>
              <label>ナトリウム (mg):</label>
              <input
                type="number"
                name="sodium"
                value={mealData.sodium}
                onChange={handleChange}
                step="0.1"
                style={{ width: '80px', marginLeft: '5px' }}
              />
            </div>

            <div>
              <label>カルシウム (mg):</label>
              <input
                type="number"
                name="calcium"
                value={mealData.calcium}
                onChange={handleChange}
                step="0.1"
                style={{ width: '80px', marginLeft: '5px' }}
              />
            </div>

            <div>
              <label>鉄分 (mg):</label>
              <input
                type="number"
                name="iron"
                value={mealData.iron}
                onChange={handleChange}
                step="0.01"
                style={{ width: '80px', marginLeft: '5px' }}
              />
            </div>

            <div>
              <label>ビタミンA (μg):</label>
              <input
                type="number"
                name="vitamin_a"
                value={mealData.vitamin_a}
                onChange={handleChange}
                step="0.1"
                style={{ width: '80px', marginLeft: '5px' }}
              />
            </div>

            <div>
              <label>ビタミンB1 (mg):</label>
              <input
                type="number"
                name="vitamin_b1"
                value={mealData.vitamin_b1}
                onChange={handleChange}
                step="0.01"
                style={{ width: '80px', marginLeft: '5px' }}
              />
            </div>

            <div>
              <label>ビタミンB2 (mg):</label>
              <input
                type="number"
                name="vitamin_b2"
                value={mealData.vitamin_b2}
                onChange={handleChange}
                step="0.01"
                style={{ width: '80px', marginLeft: '5px' }}
              />
            </div>

            <div>
              <label>ビタミンC (mg):</label>
              <input
                type="number"
                name="vitamin_c"
                value={mealData.vitamin_c}
                onChange={handleChange}
                step="0.1"
                style={{ width: '80px', marginLeft: '5px' }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button type="submit" style={{ padding: '10px 20px' }}>
            記録する
          </button>
          {isManualInput && (
            <button
              type="button"
              onClick={() => setIsManualInput(false)}
              style={{ marginLeft: '10px', padding: '10px 20px' }}
            >
              食品検索に戻る
            </button>
          )}
        </div>

        {message && (
          <p style={{ 
            marginTop: '10px',
            color: message.includes('失敗') ? 'red' : 'green' 
          }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default MealForm;