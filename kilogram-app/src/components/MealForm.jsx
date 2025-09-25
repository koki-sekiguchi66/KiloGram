import { useState, useEffect } from 'react';
import { 
  Form, 
  Button, 
  Card, 
  Alert, 
  Spinner, 
  Row, 
  Col,
  ButtonGroup,
  Collapse
} from 'react-bootstrap';
import FoodSearchInput from './FoodSearchInput';
import apiClient from '../api/axiosConfig';

const MealForm = ({ onMealCreated }) => {
  const [mealData, setMealData] = useState({
    record_date: new Date().toISOString().split('T')[0],
    meal_timing: 'breakfast',
    meal_name: '',
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

  const [mealTimings, setMealTimings] = useState([]);
  const [message, setMessage] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const [showAdvancedNutrition, setShowAdvancedNutrition] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMealTimings = async () => {
      try {
        const response = await apiClient.get('/meal-timings/');
        setMealTimings(response.data);
      } catch (error) {
        console.error('食事タイミング取得エラー:', error);
      }
    };
    fetchMealTimings();
  }, []);

  const handleFoodSelected = (foodData) => {
    setMealData({
      ...mealData,
      meal_name: foodData.name,
      calories: foodData.calories,
      protein: foodData.protein,
      fat: foodData.fat,
      carbohydrates: foodData.carbohydrates,
      dietary_fiber: foodData.dietary_fiber,
      sodium: foodData.sodium,
      calcium: foodData.calcium,
      iron: foodData.iron,
      vitamin_a: foodData.vitamin_a,
      vitamin_b1: foodData.vitamin_b1,
      vitamin_b2: foodData.vitamin_b2,
      vitamin_c: foodData.vitamin_c,
    });
    setIsManualInput(false);
  };

  const handleChange = (e) => {
    setMealData({ ...mealData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (!mealData.meal_name.trim()) {
      setMessage('食事名を入力してください。');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/meals/', mealData);
      setMessage('食事を記録しました！');
      onMealCreated(response.data);
      
      const currentDate = mealData.record_date;
      const currentTiming = mealData.meal_timing;
      
      setMealData({
        record_date: currentDate,
        meal_timing: currentTiming,
        meal_name: '',
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
      setIsManualInput(false);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('食事記録エラー:', error);
      setMessage('記録に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* 日付選択 */}
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">
          <i className="bi bi-calendar3 me-2"></i>
          記録日
        </Form.Label>
        <Form.Control
          type="date"
          name="record_date"
          value={mealData.record_date}
          onChange={handleChange}
        />
      </Form.Group>

      {/* 食事タイミング選択 */}
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">
          <i className="bi bi-clock me-2"></i>
          食事タイミング
        </Form.Label>
        <Form.Select 
          name="meal_timing"
          value={mealData.meal_timing} 
          onChange={handleChange}
        >
          {mealTimings.map((timing) => (
            <option key={timing.value} value={timing.value}>
              {timing.label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* 入力方法選択 */}
      <Card className="bg-light mb-3">
        <Card.Body className="py-3">
          <Form.Label className="fw-bold mb-3">
            <i className="bi bi-gear me-2"></i>
            入力方法
          </Form.Label>
          <ButtonGroup className="w-100">
            <Button
              variant={!isManualInput ? "primary" : "outline-primary"}
              onClick={() => setIsManualInput(false)}
            >
              <i className="bi bi-search me-2"></i>
              食品検索
            </Button>
            <Button
              variant={isManualInput ? "primary" : "outline-primary"}
              onClick={() => setIsManualInput(true)}
            >
              <i className="bi bi-pencil me-2"></i>
              手動入力
            </Button>
          </ButtonGroup>
        </Card.Body>
      </Card>

      {/* 食品検索または手動入力 */}
      {!isManualInput ? (
        <div className="mb-3">
          <FoodSearchInput onFoodSelected={handleFoodSelected} />
        </div>
      ) : (
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">
            <i className="bi bi-journal-text me-2"></i>
            食事名
          </Form.Label>
          <Form.Control
            type="text"
            name="meal_name"
            value={mealData.meal_name}
            onChange={handleChange}
            required
            placeholder="例: 白米、鶏胸肉のサラダ"
          />
        </Form.Group>
      )}

      {/* 栄養情報 */}
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <Card.Title className="mb-0 h6">
            <i className="bi bi-graph-up me-2"></i>
            栄養情報 {!isManualInput && mealData.meal_name ? '(自動計算)' : '(手動入力)'}
          </Card.Title>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowAdvancedNutrition(!showAdvancedNutrition)}
          >
            <i className={`bi ${showAdvancedNutrition ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i>
            {showAdvancedNutrition ? '詳細を隠す' : '詳細を表示'}
          </Button>
        </Card.Header>
        <Card.Body>
          {/* 基本栄養素 */}
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>
                カロリー (kcal)
              </Form.Label>
              <Form.Control
                type="number"
                name="calories"
                value={mealData.calories}
                onChange={handleChange}
                step="0.1"
              />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>
                タンパク質 (g)
              </Form.Label>
              <Form.Control
                type="number"
                name="protein"
                value={mealData.protein}
                onChange={handleChange}
                step="0.1"
              />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>
                脂質 (g)
              </Form.Label>
              <Form.Control
                type="number"
                name="fat"
                value={mealData.fat}
                onChange={handleChange}
                step="0.1"
              />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>
                炭水化物 (g)
              </Form.Label>
              <Form.Control
                type="number"
                name="carbohydrates"
                value={mealData.carbohydrates}
                onChange={handleChange}
                step="0.1"
              />
            </Col>
          </Row>

          {/* 詳細栄養素（折りたたみ式） */}
          <Collapse in={showAdvancedNutrition}>
            <div>
              <hr />
              <Row>
                <Col md={4} className="mb-3">
                  <Form.Label>食物繊維 (g)</Form.Label>
                  <Form.Control
                    type="number"
                    name="dietary_fiber"
                    value={mealData.dietary_fiber}
                    onChange={handleChange}
                    step="0.1"
                    size="sm"
                  />
                </Col>
                <Col md={4} className="mb-3">
                  <Form.Label>ナトリウム (mg)</Form.Label>
                  <Form.Control
                    type="number"
                    name="sodium"
                    value={mealData.sodium}
                    onChange={handleChange}
                    step="0.1"
                    size="sm"
                  />
                </Col>
                <Col md={4} className="mb-3">
                  <Form.Label>カルシウム (mg)</Form.Label>
                  <Form.Control
                    type="number"
                    name="calcium"
                    value={mealData.calcium}
                    onChange={handleChange}
                    step="0.1"
                    size="sm"
                  />
                </Col>
                <Col md={4} className="mb-3">
                  <Form.Label>鉄分 (mg)</Form.Label>
                  <Form.Control
                    type="number"
                    name="iron"
                    value={mealData.iron}
                    onChange={handleChange}
                    step="0.01"
                    size="sm"
                  />
                </Col>
                <Col md={4} className="mb-3">
                  <Form.Label>ビタミンA (μg)</Form.Label>
                  <Form.Control
                    type="number"
                    name="vitamin_a"
                    value={mealData.vitamin_a}
                    onChange={handleChange}
                    step="0.1"
                    size="sm"
                  />
                </Col>
                <Col md={4} className="mb-3">
                  <Form.Label>ビタミンB1 (mg)</Form.Label>
                  <Form.Control
                    type="number"
                    name="vitamin_b1"
                    value={mealData.vitamin_b1}
                    onChange={handleChange}
                    step="0.01"
                    size="sm"
                  />
                </Col>
                <Col md={4} className="mb-3">
                  <Form.Label>ビタミンB2 (mg)</Form.Label>
                  <Form.Control
                    type="number"
                    name="vitamin_b2"
                    value={mealData.vitamin_b2}
                    onChange={handleChange}
                    step="0.01"
                    size="sm"
                  />
                </Col>
                <Col md={4} className="mb-3">
                  <Form.Label>ビタミンC (mg)</Form.Label>
                  <Form.Control
                    type="number"
                    name="vitamin_c"
                    value={mealData.vitamin_c}
                    onChange={handleChange}
                    step="0.1"
                    size="sm"
                  />
                </Col>
              </Row>
            </div>
          </Collapse>
        </Card.Body>
      </Card>

      {/* ボタンエリア */}
      <div className="d-flex gap-2 justify-content-between">
        <Button 
          type="submit" 
          variant="success"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                className="me-2"
              />
              記録中...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle me-2"></i>
              記録する
            </>
          )}
        </Button>
        {isManualInput && (
          <Button
            variant="outline-secondary"
            onClick={() => setIsManualInput(false)}
          >
            <i className="bi bi-search me-2"></i>
            食品検索に戻る
          </Button>
        )}
      </div>

      {/* メッセージ */}
      {message && (
        <Alert 
          variant={message.includes('失敗') ? 'danger' : 'success'} 
          className="mt-3"
        >
          <i className={`bi ${message.includes('失敗') ? 'bi-exclamation-triangle' : 'bi-check-circle'} me-2`}></i>
          {message}
        </Alert>
      )}
    </Form>
  );
};

export default MealForm;