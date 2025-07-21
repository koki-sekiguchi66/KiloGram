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
        }

        fetchMeals();
        fetchWeights(); 
    }, []);



    const handleMealCreated = (newMeal) => {
        setMeals(prevMeals => 
            [newMeal, ...prevMeals].sort((a, b) => new Date(b.record_date) - new Date(a.record_date))
        );
    };

    const handleMealDelete = async (mealId) => {
        if (window.confirm('この記録を本当に削除しますか？')) {
            try {
              await apiClient.delete(`/meals/${mealId}/`);
              setMeals(meals.filter(meal => meal.id !== mealId));
            } catch (error) {
                console.error('Failed to delete meal', error);
              setMessage('記録の削除に失敗しました。');
            }
        }
    };

    const handleMealUpdated = (updatedMeal) => {
        setMeals(meals.map(meal => (meal.id === updatedMeal.id ? updatedMeal : meal)));
        setEditingMeal(null);
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
    <div>
      <h2>ダッシュボード</h2>
      <button onClick={handleLogout}>ログアウト</button>
      <hr />
      <div style={{ display: 'flex', gap: '50px' }}>
        <div style={{ flex: 1 }}>
          <MealForm onMealCreated={handleMealCreated} />
        </div>
        <div style={{ flex: 1 }}>
          <WeightForm onWeightCreated={handleWeightCreated} />
        </div>
      </div>
      <hr />
      <div style={{ display: 'flex', gap: '50px' }}>
        <div style={{ flex: 1 }}>
        <h3>あなたの食事記録</h3>
        {message && <p style={{ color: 'red' }}>{message}</p>}
        {meals.length > 0 ? (
            <ul>
            {meals.map((meal) => (
                <li key={meal.id}>
                    {meal.record_date}: {meal.meal.meal_timing} - {meal.meal_name} ({meal.calories} kcal)
                    <button onClick={() => setEditingMeal(meal)} style={{ marginLeft: '10px' }}>
                    編集
                    </button>
                    <button onClick={() => handleMealDelete(meal.id)} style={{ marginLeft: '10px' }}>
                    削除
                    </button>
                </li>
            ))}
            </ul>
        ) : (
            <p>まだ食事記録はありません。</p>
        )}
        </div>
        <div style={{ flex: 1 }}>
          <h3>あなたの体重記録</h3>
          {weights.length > 0 ? (
            <ul>
                {weights.map((weight) => (
                    <li key={weight.id}>
                        {weight.record_date}: {weight.weight} kg
                    </li>
                ))}
            </ul>
          ) : (
              <p>まだ体重記録はありません。</p>
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