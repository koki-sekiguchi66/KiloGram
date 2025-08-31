// src/components/FoodSearchInput.jsx
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

const FoodSearchInput = ({ onFoodSelected }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [amount, setAmount] = useState(100);
  const [showResults, setShowResults] = useState(false);

  // 食品検索（デバウンス付き）
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/foods/search/?q=${query}`);
        setResults(response.data.foods);
        setShowResults(true);
      } catch (error) {
        console.error('食品検索エラー:', error);
        setResults([]);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 栄養素計算
  const calculateNutrition = async (foodId, grams) => {
    try {
      const response = await apiClient.post('/foods/calculate/', {
        food_id: foodId,
        amount: grams
      });
      return response.data.nutrition;
    } catch (error) {
      console.error('栄養素計算エラー:', error);
      return null;
    }
  };

  // 食品選択時の処理
  const handleFoodSelect = async (food) => {
    setSelectedFood(food);
    setQuery(food.name);
    setShowResults(false);
    
    const nutrition = await calculateNutrition(food.id, amount);
    if (nutrition) {
      onFoodSelected({
        name: food.name,
        amount: amount,
        ...nutrition
      });
    }
  };

  // 量変更時の処理
  const handleAmountChange = async (newAmount) => {
    setAmount(newAmount);
    if (selectedFood) {
      const nutrition = await calculateNutrition(selectedFood.id, newAmount);
      if (nutrition) {
        onFoodSelected({
          name: selectedFood.name,
          amount: newAmount,
          ...nutrition
        });
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div>
        <label>食品名:</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder="食品名を入力してください..."
          style={{ width: '300px', padding: '8px' }}
        />
        {loading && <span style={{ marginLeft: '10px' }}>検索中...</span>}
      </div>

      {/* 検索結果ドロップダウン */}
      {showResults && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '0',
          right: '0',
          maxHeight: '200px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          backgroundColor: 'white',
          zIndex: 1000,
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {results.map((food) => (
            <div
              key={food.id}
              onClick={() => handleFoodSelect(food)}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                ':hover': { backgroundColor: '#f5f5f5' }
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              <div style={{ fontWeight: 'bold' }}>{food.name}</div>
              {food.category && (
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                  カテゴリ: {food.category}
                </div>
              )}
              <div style={{ fontSize: '0.8em', color: '#888' }}>
                {food.nutrition.calories}kcal/100g | 
                たんぱく質 {food.nutrition.protein}g | 
                脂質 {food.nutrition.fat}g
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 量入力 */}
      {selectedFood && (
        <div style={{ marginTop: '15px' }}>
          <label>摂取量 (g): </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
            min="1"
            step="0.1"
            style={{ width: '100px', padding: '4px' }}
          />
          <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#666' }}>
            選択中: {selectedFood.name}
          </span>
        </div>
      )}

      {/* 検索結果が0件の場合 */}
      {query.length >= 2 && !loading && results.length === 0 && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <p>「{query}」の検索結果が見つかりませんでした。</p>
          <button 
            onClick={() => {
              // カスタム食品作成画面への遷移などを実装
              alert('カスタム食品作成機能は今後実装予定です');
            }}
            style={{ padding: '5px 10px' }}
          >
            新しい食品として登録
          </button>
        </div>
      )}
    </div>
  );
};

export default FoodSearchInput;