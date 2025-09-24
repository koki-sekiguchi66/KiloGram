// src/components/FoodSearchInput.jsx
import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axiosConfig';

const FoodSearchInput = ({ onFoodSelected }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [amount, setAmount] = useState(100);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  // 食品検索（デバウンス付き）
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      setError('');
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get(`/foods/search/?q=${encodeURIComponent(query)}`);
        setResults(response.data.foods || []);
        setShowResults(true);
        
        if (response.data.foods && response.data.foods.length === 0) {
          setError('該当する食品が見つかりませんでした。');
        }
      } catch (error) {
        console.error('食品検索エラー:', error);
        setResults([]);
        setError('検索中にエラーが発生しました。');
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      setError('栄養素の計算に失敗しました。');
      return null;
    }
  };

  // 食品選択時の処理
  const handleFoodSelect = async (food) => {
    setSelectedFood(food);
    setQuery(food.name);
    setShowResults(false);
    setError('');
    
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
    if (newAmount < 0) return;
    
    setAmount(newAmount);
    if (selectedFood && newAmount > 0) {
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

  // フォームリセット
  const handleClear = () => {
    setQuery('');
    setSelectedFood(null);
    setResults([]);
    setShowResults(false);
    setError('');
    setAmount(100);
    onFoodSelected({
      name: '',
      amount: 0,
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
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
          食品名:
        </label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
            placeholder="食品名を入力してください..."
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
          {(query || selectedFood) && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              クリア
            </button>
          )}
        </div>
        
        {loading && (
          <div style={{ marginTop: '8px', color: '#007bff', fontSize: '14px' }}>
            🔍 検索中...
          </div>
        )}

        {error && (
          <div style={{ 
            marginTop: '8px', 
            color: '#dc3545', 
            fontSize: '14px',
            padding: '8px',
            backgroundColor: '#f8d7da',
            borderRadius: '4px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* 検索結果ドロップダウン */}
      {showResults && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '75px',
          left: '0',
          right: '0',
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          backgroundColor: 'white',
          zIndex: 1000,
          borderRadius: '4px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          {results.map((food, index) => (
            <div
              key={food.id}
              onClick={() => handleFoodSelect(food)}
              style={{
                padding: '15px',
                cursor: 'pointer',
                borderBottom: index === results.length - 1 ? 'none' : '1px solid #eee',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
                {food.name}
              </div>
              {food.category && (
                <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>
                  カテゴリ: {food.category}
                </div>
              )}
              <div style={{ fontSize: '0.8em', color: '#888' }}>
                {food.nutrition.calories}kcal/100g | 
                たんぱく質 {food.nutrition.protein}g | 
                脂質 {food.nutrition.fat}g | 
                炭水化物 {food.nutrition.carbohydrates}g
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 量入力 */}
      {selectedFood && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '5px',
          border: '1px solid #b8daff'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold', color: '#004085' }}>
              選択中: {selectedFood.name}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <label style={{ fontWeight: 'bold', color: '#004085' }}>
              摂取量:
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              style={{
                width: '100px',
                padding: '8px',
                border: '1px solid #b8daff',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
            <span style={{ color: '#004085' }}>g</span>
          </div>
          
          {amount > 0 && (
            <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#004085' }}>
              📊 この量でのカロリー: 
              <strong style={{ marginLeft: '5px' }}>
                {Math.round((selectedFood.nutrition.calories * amount) / 100)} kcal
              </strong>
            </div>
          )}
        </div>
      )}

      {/* 検索結果が0件の場合 */}
      {query.length >= 2 && !loading && results.length === 0 && !error && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '5px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 10px 0', color: '#666' }}>
            「{query}」の検索結果が見つかりませんでした。
          </p>
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            💡 検索のコツ:
            <ul style={{ textAlign: 'left', marginTop: '8px', paddingLeft: '20px' }}>
              <li>ひらがなやカタカナで試してみてください</li>
              <li>「鶏肉」「りんご」など、シンプルな名前で検索してみてください</li>
              <li>複数の単語は避けて、単一の食材名で検索してください</li>
            </ul>
          </div>
          <button 
            onClick={() => {
              // カスタム食品作成機能は今後実装予定
              alert('カスタム食品作成機能は今後実装予定です。\n現在は手動入力をご利用ください。');
            }}
            style={{ 
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            新しい食品として登録
          </button>
        </div>
      )}
    </div>
  );
};

export default FoodSearchInput;