import { useState } from 'react';
import apiClient from '../api/axiosConfig'; 

const WeightForm = ({ onWeightCreated }) => {
  const [formData, setFormData] = useState({
    record_date: new Date().toISOString().split('T')[0], // 今日の日付を初期値に
    weight: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (!formData.weight || formData.weight <= 0) {
      setMessage('有効な体重を入力してください。');
      setIsLoading(false);
      return;
    }

    if (formData.weight > 1000) {
      setMessage('体重は1000kg以下で入力してください。');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/weights/', formData);
      setMessage('体重を記録しました！');
      onWeightCreated(response.data); 
      
      // フォームリセット（日付は保持）
      const currentDate = formData.record_date;
      setFormData({
        record_date: currentDate,
        weight: ''
      });
      
      // 成功メッセージを3秒後に消す
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to create weight record', error);
      if (error.response?.status === 400) {
        setMessage('入力内容を確認してください。');
      } else {
        setMessage('記録に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ color: '#333', marginBottom: '20px' }}>体重を記録</h3>
      
      <form onSubmit={handleSubmit}>
        {/* 日付選択 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            記録日:
          </label>
          <input
            type="date"
            name="record_date"
            value={formData.record_date}
            onChange={handleChange}
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

        {/* 体重入力 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
            体重 (kg):
          </label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="1000"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            required
            placeholder="例: 65.5"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
            ※ 小数点第1位まで入力可能です
          </small>
        </div>

        {/* 体重変化の簡単な目安表示 */}
        {formData.weight && (
          <div style={{ 
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#e7f3ff',
            borderRadius: '5px',
            border: '1px solid #b8daff'
          }}>
          </div>
        )}

        <button 
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? '記録中...' : '記録する'}
        </button>

        {message && (
          <div style={{ 
            marginTop: '15px',
            padding: '10px',
            borderRadius: '5px',
            backgroundColor: message.includes('失敗') || message.includes('確認') ? '#f8d7da' : '#d4edda',
            color: message.includes('失敗') || message.includes('確認') ? '#721c24' : '#155724',
            border: message.includes('失敗') || message.includes('確認') ? '1px solid #f5c6cb' : '1px solid #c3e6cb'
          }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default WeightForm;