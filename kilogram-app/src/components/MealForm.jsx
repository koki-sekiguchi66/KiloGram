import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

const MealForm = ({ onMealCreated }) => {
  const [mealData, setMealData] = useState({
    meal_timing: 'breakfast',
    meal_name: '',
    calories: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0,
  });
  const [mealTimings, setMealTimings] = useState([]);
  const [message, setMessage] = useState('');

  
  useEffect(() => {
    const fetchMealTimings = async () => {
      try {
        const response = await apiClient.get('/meal-timings/');
        setMealTimings(response.data);
      } catch (error) {
        console.error('Failed to fetch meal timings', error);
      }
    };
    fetchMealTimings();
  }, []);

  const handleChange = (e) => {
    setMealData({ ...mealData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await apiClient.post('/meals/', mealData);
      setMessage('食事を記録しました！');
      onMealCreated(response.data); 
      setMealData({
        meal_timing: 'breakfast',
        meal_name: '',
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
      });
    } catch (error) {
      console.error('Failed to create meal', error);
      setMessage('記録に失敗しました。');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>新しい食事を記録</h3>
      <div>
        <label>タイミング:</label>
        <select name="meal_timing" value={mealData.meal_timing} onChange={handleChange}>
          {mealTimings.map((timing) => (
            <option key={timing.value} value={timing.value}>
              {timing.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>食事名:</label>
        <input type="text" name="meal_name" value={mealData.meal_name} onChange={handleChange} required />
      </div>
      <div>
        <label>カロリー(kcal):</label>
        <input type="number" name="calories" value={mealData.calories} onChange={handleChange} />
      </div>
      <button type="submit">記録する</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default MealForm;