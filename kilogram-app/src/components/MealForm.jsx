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
import CustomFoodModal from './CustomFoodModal';
import apiClient from '../api/axiosConfig';

const MealForm = ({ onMealCreated }) => {
  // 既存のstate
  const [saveToCustom, setSaveToCustom] = useState(false); // 追加

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
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);

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

    // 食品検索からの手動入力切り替えを監視
    const handleSwitchToManual = (event) => {
      const { name } = event.detail;
      setIsManualInput(true);
      setMealData(prevData => ({
        ...prevData,
        meal_name: name || '',
      }));
    };

    window.addEventListener('switchToManual', handleSwitchToManual);
    return () => {
      window.removeEventListener('switchToManual', handleSwitchToManual);
    };
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

  const handleSaveAsCustomFood = async () => {
    if (!mealData.meal_name.trim()) {
      setMessage('食事名を入力してから保存してください。');
      return;
    }

    try {
      const customFoodData = {
        name: mealData.meal_name,
        calories_per_100g: mealData.calories,
        protein_per_100g: mealData.protein,
        fat_per_100g: mealData.fat,
        carbs_per_100g: mealData.carbohydrates,
        fiber_per_100g: mealData.dietary_fiber,
        sodium_per_100g: mealData.sodium,
        calcium_per_100g: mealData.calcium,
        iron_per_100g: mealData.iron,
        vitamin_a_per_100g: mealData.vitamin_a,
        vitamin_b1_per_100g: mealData.vitamin_b1,
        vitamin_b2_per_100g: mealData.vitamin_b2,
        vitamin_c_per_100g: mealData.vitamin_c,
      };

      await apiClient.post('/foods/custom/', customFoodData);
      setMessage('Myアイテムとして保存しました！');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('カスタム食品保存エラー:', error);
      if (error.response?.data?.name && error.response.data.name.includes('already exists')) {
        setMessage('この名前の食品は既に登録されています。');
      } else {
        setMessage('保存に失敗しました。');
      }
    }
  };

  const handleCustomFoodSelected = (customFood, amount = 100) => {
    const multiplier = amount / 100;
    setMealData({
      ...mealData,
      meal_name: `${customFood.name} (${amount}g)`,
      calories: Math.round(customFood.calories_per_100g * multiplier * 10) / 10,
      protein: Math.round(customFood.protein_per_100g * multiplier * 10) / 10,
      fat: Math.round(customFood.fat_per_100g * multiplier * 10) / 10,
      carbohydrates: Math.round(customFood.carbs_per_100g * multiplier * 10) / 10,
      dietary_fiber: Math.round(customFood.fiber_per_100g * multiplier * 10) / 10,
      sodium: Math.round(customFood.sodium_per_100g * multiplier * 10) / 10,
      calcium: Math.round(customFood.calcium_per_100g * multiplier * 10) / 10,
      iron: Math.round(customFood.iron_per_100g * multiplier * 100) / 100,
      vitamin_a: Math.round(customFood.vitamin_a_per_100g * multiplier * 10) / 10,
      vitamin_b1: Math.round(customFood.vitamin_b1_per_100g * multiplier * 100) / 100,
      vitamin_b2: Math.round(customFood.vitamin_b2_per_100g * multiplier * 100) / 100,
      vitamin_c: Math.round(customFood.vitamin_c_per_100g * multiplier * 10) / 10,
    });
    setShowCustomFoodModal(false);
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
      // 食事を記録
      const response = await apiClient.post('/meals/', mealData);
      
      // チェックボックスがオンの場合、Myアイテムとしても保存
      if (isManualInput && saveToCustom) {
        try {
          const customFoodData = {
            name: mealData.meal_name,
            calories_per_100g: mealData.calories,
            protein_per_100g: mealData.protein,
            fat_per_100g: mealData.fat,
            carbs_per_100g: mealData.carbohydrates,
            fiber_per_100g: mealData.dietary_fiber,
            sodium_per_100g: mealData.sodium,
            calcium_per_100g: mealData.calcium,
            iron_per_100g: mealData.iron,
            vitamin_a_per_100g: mealData.vitamin_a,
            vitamin_b1_per_100g: mealData.vitamin_b1,
            vitamin_b2_per_100g: mealData.vitamin_b2,
            vitamin_c_per_100g: mealData.vitamin_c,
          };
          await apiClient.post('/foods/custom/', customFoodData);
          setMessage('食事を記録し、Myアイテムとしても保存しました！');
        } catch (error) {
          if (error.response?.data?.name && error.response.data.name.includes('already exists')) {
            setMessage('食事を記録しましたが、この名前の食品は既にMyアイテムに登録されています。');
          } else {
            setMessage('食事を記録しましたが、Myアイテムへの保存に失敗しました。');
          }
        }
      } else {
        setMessage('食事を記録しました！');
      }

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
      setSaveToCustom(false); // チェックボックスをリセット
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
    <>
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
            <div className="d-grid gap-2">
              <ButtonGroup>
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
              <Button
                variant="outline-success"
                onClick={() => setShowCustomFoodModal(true)}
              >
                <i className="bi bi-bookmark-heart me-2"></i>
                Myアイテムから追加
              </Button>
            </div>
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
            <div className="d-flex gap-2">
              {isManualInput && mealData.meal_name && (
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={handleSaveAsCustomFood}
                >
                  <i className="bi bi-bookmark-plus me-1"></i>
                  Myアイテムに保存
                </Button>
              )}
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowAdvancedNutrition(!showAdvancedNutrition)}
              >
                <i className={`bi ${showAdvancedNutrition ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i>
                {showAdvancedNutrition ? '詳細を隠す' : '詳細を表示'}
              </Button>
            </div>
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
        <div className="d-flex gap-2 justify-content-between align-items-center">
          <div className="d-flex gap-3 align-items-center">
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
              <Form.Check
                type="checkbox"
                id="save-to-custom"
                label="Myアイテムとして保存"
                checked={saveToCustom}
                onChange={(e) => setSaveToCustom(e.target.checked)}
              />
            )}
          </div>
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

      {/* カスタム食品モーダル */}
      {showCustomFoodModal && (
        <CustomFoodModal 
          show={showCustomFoodModal}
          onClose={() => setShowCustomFoodModal(false)}
          onFoodSelected={handleCustomFoodSelected}
        />
      )}
    </>
  );
};

export default MealForm;