import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

const modalStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalContentStyles = {
  background: 'white',
  padding: '20px',
  borderRadius: '5px',
};

const EditMealModal = ({ meal, onClose, onMealUpdated }) => {
  const [mealData, setMealData] = useState({ ...meal });
  const [mealTimings, setMealTimings] = useState([]);

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
    try {
      const response = await apiClient.put(`/meals/${meal.id}/`, mealData);
      onMealUpdated(response.data); 
    } catch (error) {
      console.error('Failed to update meal', error);
      alert('更新に失敗しました。');
    }
  };

  return (
    <div style={modalStyles} onClick={onClose}>
      <div style={modalContentStyles} onClick={(e) => e.stopPropagation()}>
        <h2>食事記録の編集</h2>
        <form onSubmit={handleSubmit}>
          <select name="meal_timing" value={mealData.meal_timing} onChange={handleChange}>
            {mealTimings.map((timing) => (
              <option key={timing.value} value={timing.value}>{timing.label}</option>
            ))}
          </select>
          <input type="text" name="meal_name" value={mealData.meal_name} onChange={handleChange} required />
          <input type="number" name="calories" value={mealData.calories} onChange={handleChange} />
          <button type="submit">更新する</button>
          <button type="button" onClick={onClose}>キャンセル</button>
        </form>
      </div>
    </div>
  );
};

export default EditMealModal;