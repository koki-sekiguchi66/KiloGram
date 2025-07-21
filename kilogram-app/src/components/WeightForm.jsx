import { useState } from 'react';
import apiClient from '../api/axiosConfig'; 

const WeightForm = ({ onWeightCreated }) => {
  const [weight, setWeight] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!weight || weight <= 0) {
      setMessage('有効な体重を入力してください。');
      return;
    }
    try {
      const response = await apiClient.post('/weights/', { weight });
      setMessage('体重を記録しました！');
      onWeightCreated(response.data); 
      setWeight(''); 
    } catch (error) {
      console.error('Failed to create weight record', error);
      setMessage('記録に失敗しました。');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>今日の体重を記録</h3>
      <div>
        <label>体重(kg):</label>
        <input
          type="number"
          step="0.1"
          name="weight"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
        />
      </div>
      <button type="submit">記録する</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default WeightForm;