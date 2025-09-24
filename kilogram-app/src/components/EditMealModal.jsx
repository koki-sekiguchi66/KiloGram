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
  zIndex: 1000,
};

const modalContentStyles = {
  background: 'white',
  padding: '30px',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
};

const EditMealModal = ({ meal, onClose, onMealUpdated }) => {
  const [mealData, setMealData] = useState({ ...meal });
  const [mealTimings, setMealTimings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvancedNutrition, setShowAdvancedNutrition] = useState(false);

  useEffect(() => {
    const fetchMealTimings = async () => {
      try {
        const response = await apiClient.get('/meal-timings/');
        setMealTimings(response.data);
      } catch (error) {
        console.error('Failed to fetch meal timings', error);
        setError('食事タイミングの取得に失敗しました。');
      }
    };
    fetchMealTimings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMealData({ 
      ...mealData, 
      [name]: name === 'meal_name' ? value : (parseFloat(value) || 0)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!mealData.meal_name.trim()) {
      setError('食事名を入力してください。');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.put(`/meals/${meal.id}/`, mealData);
      onMealUpdated(response.data);
    } catch (error) {
      console.error('Failed to update meal', error);
      setError('更新に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  return (
    <div style={modalStyles} onClick={onClose}>
      <div style={modalContentStyles} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>食事記録の編集</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 日付選択 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
              記録日:
            </label>
            <input
              type="date"
              name="record_date"
              value={mealData.record_date}
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

          {/* 食事タイミング選択 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
              食事タイミング:
            </label>
            <select 
              name="meal_timing" 
              value={mealData.meal_timing} 
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            >
              {mealTimings.map((timing) => (
                <option key={timing.value} value={timing.value}>
                  {timing.label}
                </option>
              ))}
            </select>
          </div>

          {/* 食事名 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
              食事名:
            </label>
            <input 
              type="text" 
              name="meal_name" 
              value={mealData.meal_name} 
              onChange={handleChange} 
              required 
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

          {/* 栄養情報 */}
          <div style={{ 
            marginBottom: '25px',
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: '#495057' }}>栄養情報</h4>
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

            {/* 基本栄養素 */}
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

            {/* 詳細栄養素 */}
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

          {/* エラーメッセージ */}
          {error && (
            <div style={{ 
              marginBottom: '20px',
              padding: '10px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              border: '1px solid #f5c6cb',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          {/* ボタン */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              キャンセル
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: isLoading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {isLoading ? '更新中...' : '更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMealModal;