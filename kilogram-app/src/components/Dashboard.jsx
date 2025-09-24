// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig'; 
import MealForm from './MealForm';
import WeightForm from './WeightForm';
import EditMealModal from './EditMealModal';

const Dashboard = ({ handleLogout }) => {
  const [meals, setMeals] = useState([]);
  const [weights, setWeights] = useState([]);
  const [message, setMessage] = useState('');
  const [editingMeal, setEditingMeal] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const response = await apiClient.get('/meals/');
        setMeals(response.data);
      } catch (error) {
        console.error('Failed to fetch meals', error);
        setMessage('食事記録の取得に失敗しました。');
      }
    };

    const fetchWeights = async () => {
      try {
        const response = await apiClient.get('/weights/');
        setWeights(response.data);
      } catch (error) {
        console.error('Failed to fetch weights', error);
        setMessage('体重記録の取得に失敗しました。');
      }
    };

    const fetchDailySummary = async () => {
      try {
        const response = await apiClient.get(`/nutrition/daily-summary/?date=${selectedDate}`);
        setDailySummary(response.data.nutrition_summary);
      } catch (error) {
        console.error('Failed to fetch daily summary', error);
      }
    };

    fetchMeals();
    fetchWeights(); 
    fetchDailySummary();
  }, [selectedDate]);

  const handleMealCreated = (newMeal) => {
    setMeals(prevMeals => 
      [newMeal, ...prevMeals].sort((a, b) => new Date(b.record_date) - new Date(a.record_date))
    );
    
    // 当日の記録が追加された場合、サマリーを更新
    if (newMeal.record_date === selectedDate) {
      fetchDailySummary();
    }
  };

  const fetchDailySummary = async () => {
    try {
      const response = await apiClient.get(`/nutrition/daily-summary/?date=${selectedDate}`);
      setDailySummary(response.data.nutrition_summary);
    } catch (error) {
      console.error('Failed to fetch daily summary', error);
    }
  };

  const handleMealDelete = async (mealId) => {
    if (window.confirm('この記録を本当に削除しますか？')) {
      try {
        await apiClient.delete(`/meals/${mealId}/`);
        setMeals(meals.filter(meal => meal.id !== mealId));
        fetchDailySummary(); // サマリー更新
      } catch (error) {
        console.error('Failed to delete meal', error);
        setMessage('記録の削除に失敗しました。');
      }
    }
  };

  const handleMealUpdated = (updatedMeal) => {
    setMeals(meals.map(meal => (meal.id === updatedMeal.id ? updatedMeal : meal)));
    setEditingMeal(null);
    fetchDailySummary(); // サマリー更新
  };

  const handleWeightCreated = (newWeight) => {
    setWeights(prevWeights => {
      const existingIndex = prevWeights.findIndex(w => w.id === newWeight.id);
      if (existingIndex !== -1) {
        const updatedWeights = [...prevWeights];
        updatedWeights[existingIndex] = newWeight;
        return updatedWeights.sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
      } else {
        return [newWeight, ...prevWeights].sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
      }
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* ヘッダー */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>KiloGram - ホーム</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ログアウト
        </button>
      </div>
      
      {/* 記録フォーム */}
      <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
        <div style={{ 
          flex: 1, 
          padding: '20px', 
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <MealForm onMealCreated={handleMealCreated} />
        </div>
        <div style={{ 
          flex: 1, 
          padding: '20px', 
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <WeightForm onWeightCreated={handleWeightCreated} />
        </div>
      </div>

      {/* 日別栄養サマリー */}
      <div style={{ 
        marginBottom: '40px',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: '#333', marginBottom: '20px' }}>日別栄養サマリー</h3>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>日付選択: </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>
        
        {dailySummary && (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>
              {selectedDate} の栄養摂取量
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div><strong>カロリー:</strong> {dailySummary.calories} kcal</div>
              <div><strong>タンパク質:</strong> {dailySummary.protein} g</div>
              <div><strong>脂質:</strong> {dailySummary.fat} g</div>
              <div><strong>炭水化物:</strong> {dailySummary.carbohydrates} g</div>
              <div><strong>食物繊維:</strong> {dailySummary.dietary_fiber} g</div>
              <div><strong>ナトリウム:</strong> {dailySummary.sodium} mg</div>
              <div><strong>カルシウム:</strong> {dailySummary.calcium} mg</div>
              <div><strong>鉄分:</strong> {dailySummary.iron} mg</div>
              <div><strong>ビタミンA:</strong> {dailySummary.vitamin_a} μg</div>
              <div><strong>ビタミンB1:</strong> {dailySummary.vitamin_b1} mg</div>
              <div><strong>ビタミンB2:</strong> {dailySummary.vitamin_b2} mg</div>
              <div><strong>ビタミンC:</strong> {dailySummary.vitamin_c} mg</div>
            </div>
          </div>
        )}
      </div>
      
      {/* 記録一覧 */}
      <div style={{ display: 'flex', gap: '30px' }}>
        <div style={{ 
          flex: 1,
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#333', marginBottom: '20px' }}>食事記録</h3>
          {message && <p style={{ color: 'red' }}>{message}</p>}
          {meals.length > 0 ? (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {meals.map((meal) => (
                <div key={meal.id} style={{ 
                  marginBottom: '15px', 
                  padding: '15px', 
                  border: '1px solid #eee',
                  borderRadius: '5px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#333' }}>
                      {meal.record_date}: {meal.meal_timing} - {meal.meal_name}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                    {meal.calories}kcal | タンパク質{meal.protein}g | 脂質{meal.fat}g | 炭水化物{meal.carbohydrates}g
                    {meal.iron > 0 && ` | 鉄分${meal.iron}mg`}
                    {meal.vitamin_c > 0 && ` | ビタミンC${meal.vitamin_c}mg`}
                  </div>
                  <div>
                    <button 
                      onClick={() => setEditingMeal(meal)} 
                      style={{ 
                        marginRight: '10px',
                        padding: '5px 10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      編集
                    </button>
                    <button 
                      onClick={() => handleMealDelete(meal.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              まだ食事記録はありません。
            </p>
          )}
        </div>
        
        <div style={{ 
          flex: 1,
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#333', marginBottom: '20px' }}>体重記録</h3>
          {weights.length > 0 ? (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {weights.map((weight) => (
                <div key={weight.id} style={{ 
                  marginBottom: '10px', 
                  padding: '10px', 
                  border: '1px solid #eee',
                  borderRadius: '5px',
                  backgroundColor: '#fafafa'
                }}>
                  <strong>{weight.record_date}:</strong> {weight.weight} kg
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              まだ体重記録はありません。
            </p>
          )}
        </div>
      </div>
      
      {editingMeal && (
        <EditMealModal
          meal={editingMeal}
          onClose={() => setEditingMeal(null)}
          onMealUpdated={handleMealUpdated}
        />
      )}
    </div>
  );
};

export default Dashboard;