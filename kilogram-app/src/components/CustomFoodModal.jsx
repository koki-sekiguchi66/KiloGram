import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import apiClient from '../api/axiosConfig';

const CustomFoodModal = ({ show, onClose, onFoodSelected }) => {
  const [customFoods, setCustomFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [amount, setAmount] = useState(100);

  useEffect(() => {
    if (show) {
      fetchCustomFoods();
    }
  }, [show]);

  const fetchCustomFoods = async () => {
    try {
      const response = await apiClient.get('/foods/custom/list/'); // エンドポイントを修正
      setCustomFoods(response.data);
      setError('');
    } catch (error) {
      setError('Myアイテムの読み込みに失敗しました');
      console.error('カスタム食品取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
  };

  const handleAddToMeal = () => {
    if (selectedFood) {
      onFoodSelected(selectedFood, amount);
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-bookmark-heart me-2"></i>
          Myアイテムから追加
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : customFoods.length === 0 ? (
          <div className="text-center p-4">
            <i className="bi bi-bookmark text-muted" style={{ fontSize: '2rem' }}></i>
            <p className="mt-2 text-muted">Myアイテムがまだありません</p>
          </div>
        ) : (
          <div className="list-group">
            {customFoods.map((food) => (
              <button
                key={food.id}
                className={`list-group-item list-group-item-action ${
                  selectedFood?.id === food.id ? 'active' : ''
                }`}
                onClick={() => handleFoodSelect(food)}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-1">{food.name}</h6>
                  <small>
                    <Badge bg="light" text="dark" className="me-1">
                      {food.calories_per_100g}kcal/100
                    </Badge>
                  </small>
                </div>
                <small className="d-block text-muted">
                  P:{food.protein_per_100g}g F:{food.fat_per_100g}g C:{food.carbs_per_100g}g
                </small>
              </button>
            ))}
          </div>
        )}

        {selectedFood && (
          <div className="mt-3">
            <label className="form-label">分量</label>
            <input
              type="number"
              className="form-control"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="1"
              max="1000"
            />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          キャンセル
        </Button>
        <Button
          variant="primary"
          onClick={handleAddToMeal}
          disabled={!selectedFood}
        >
          追加
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CustomFoodModal;