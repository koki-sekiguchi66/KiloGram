// src/components/MealForm.jsx
import { useState, useEffect } from 'react';
import FoodSearchInput from './FoodSearchInput';
import apiClient from '../api/axiosConfig';

const MealForm = ({ onMealCreated }) => {
  const [mealData, setMealData] = useState({
    record_date: new Date().toISOString().split('T')[0], // 今日の日付を初期値に
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
  const [showAdvancedNutrition, setShowAdvancedNutrition] = useState(false);

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
      
      // フォームリセット（日付と食事タイミングは保持）
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
      setIsManualInput(false);
      
      // 成功メッセージを3秒後に消す
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('食事記録エラー:', error);
      setMessage('記録に失敗しました。');
    }
  };

  return (
    <div>
      <h3 style={{ color: '#333', marginBottom: '20px' }}>新しい食事を記録</h3>
      
      <form onSubmit={handleSubmit}>
        {/* 日付選択 */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            記録日:
          </label>
          <input
            type="date"
            name="record_date"
            value={mealData.record_date}
            onChange={handleChange}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* 食事タイミング選択 */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            食事タイミング:
          </label>
          <select 
            name="meal_timing"
            value={mealData.meal_timing} 
            onChange={handleChange}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              width: '200px'
            }}
          >
            {mealTimings.map((timing) => (
              <option key={timing.value} value={timing.value}>
                {timing.label}
              </option>
            ))}
          </select>
        </div>

        {/* 入力方法選択 */}
        <div style={{ 
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>
            入力方法:
          </label>
          <div style={{ display: 'flex', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={!isManualInput}
                onChange={() => setIsManualInput(false)}
                style={{ marginRight: '8px' }}
              />
              食品検索から選択
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                checked={isManualInput}
                onChange={() => setIsManualInput(true)}
                style={{ marginRight: '8px' }}
              />
              手動入力
            </label>
          </div>
        </div>

        {/* 食品検索または手動入力 */}
        {!isManualInput ? (
          <div style={{ marginBottom: '20px' }}>
            <FoodSearchInput onFoodSelected={handleFoodSelected} />
          </div>
        ) : (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
              食事名:
            </label>
            <input
              type="text"
              name="meal_name"
              value={mealData.meal_name}
              onChange={handleChange}
              required
              placeholder="例: 白米、鶏胸肉のサラダ"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* 栄養情報表示・編集エリア */}
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, color: '#495057' }}>
              栄養情報 {!isManualInput && mealData.meal_name ? '(自動計算)' : '(手動入力)'}
            </h4>
            <button
              type="button"
              onClick={() => setShowAdvancedNutrition(!showAdvancedNutrition)}
              style={{
                padding: '5px 10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showAdvancedNutrition ? '詳細を隠す' : '詳細を表示'}
            </button>
          </div>
          
          {/* 基本栄養素（常に表示） */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                カロリー (kcal):
              </label>
              <input
                type="number"
                name="calories"
                value={mealData.calories}
                onChange={handleChange}
                step="0.1"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                タンパク質 (g):
              </label>
              <input
                type="number"
                name="protein"
                value={mealData.protein}
                onChange={handleChange}
                step="0.1"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                脂質 (g):
              </label>
              <input
                type="number"
                name="fat"
                value={mealData.fat}
                onChange={handleChange}
                step="0.1"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                炭水化物 (g):
              </label>
              <input
                type="number"
                name="carbohydrates"
                value={mealData.carbohydrates}
                onChange={handleChange}
                step="0.1"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* 詳細栄養素（折りたたみ式） */}
          {showAdvancedNutrition && (
            <div>
              <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #dee2e6' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                    食物繊維 (g):
                  </label>
                  <input
                    type="number"
                    name="dietary_fiber"
                    value={mealData.dietary_fiber}
                    onChange={handleChange}
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                    ナトリウム (mg):
                  </label>
                  <input
                    type="number"
                    name="sodium"
                    value={mealData.sodium}
                    onChange={handleChange}
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                    カルシウム (mg):
                  </label>
                  <input
                    type="number"
                    name="calcium"
                    value={mealData.calcium}
                    onChange={handleChange}
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                    鉄分 (mg):
                  </label>
                  <input
                    type="number"
                    name="iron"
                    value={mealData.iron}
                    onChange={handleChange}
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                    ビタミンA (μg):
                  </label>
                  <input
                    type="number"
                    name="vitamin_a"
                    value={mealData.vitamin_a}
                    onChange={handleChange}
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                    ビタミンB1 (mg):
                  </label>
                  <input
                    type="number"
                    name="vitamin_b1"
                    value={mealData.vitamin_b1}
                    onChange={handleChange}
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                    ビタミンB2 (mg):
                  </label>
                  <input
                    type="number"
                    name="vitamin_b2"
                    value={mealData.vitamin_b2}
                    onChange={handleChange}
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                    ビタミンC (mg):
                  </label>
                  <input
                    type="number"
                    name="vitamin_c"
                    value={mealData.vitamin_c}
                    onChange={handleChange}
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            style={{ 
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            記録する
          </button>
          {isManualInput && (
            <button
              type="button"
              onClick={() => setIsManualInput(false)}
              style={{ 
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              食品検索に戻る
            </button>
          )}
        </div>

        {message && (
          <div style={{ 
            marginTop: '15px',
            padding: '10px',
            borderRadius: '5px',
            backgroundColor: message.includes('失敗') ? '#f8d7da' : '#d4edda',
            color: message.includes('失敗') ? '#721c24' : '#155724',
            border: message.includes('失敗') ? '1px solid #f5c6cb' : '1px solid #c3e6cb'
          }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default MealForm;