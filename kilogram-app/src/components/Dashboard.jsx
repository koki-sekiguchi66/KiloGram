import { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Navbar, 
  Nav, 
  Button, 
  Alert,
  Badge,
  Dropdown,
  Form
} from 'react-bootstrap';
import apiClient from '../api/axiosConfig'; 
import MealForm from './MealForm';
import WeightForm from './WeightForm';
import EditMealModal from './EditMealModal';

const Dashboard = ({ handleLogout }) => {
  const [meals, setMeals] = useState([]);
  const [weights, setWeights] = useState([]);
  const [message, setMessage] = useState('');
  const [editingMeal, setEditingMeal] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const response = await apiClient.get('/meals/');
        setMeals(response.data);
      } catch (error) {
        console.error('Failed to fetch meals', error);
        setMessage('食事記録の取得に失敗しました。');
      }
    };

    const fetchWeights = async () => {
      try {
        const response = await apiClient.get('/weights/');
        setWeights(response.data);
      } catch (error) {
        console.error('Failed to fetch weights', error);
        setMessage('体重記録の取得に失敗しました。');
      }
    };

    const fetchDailySummary = async () => {
      try {
        const response = await apiClient.get(`/nutrition/daily-summary/?date=${selectedDate}`);
        setDailySummary(response.data.nutrition_summary);
      } catch (error) {
        console.error('Failed to fetch daily summary', error);
      }
    };

    fetchMeals();
    fetchWeights(); 
    fetchDailySummary();
  }, [selectedDate]);

  const handleMealCreated = (newMeal) => {
    setMeals(prevMeals => 
      [newMeal, ...prevMeals].sort((a, b) => new Date(b.record_date) - new Date(a.record_date))
    );
    
    if (newMeal.record_date === selectedDate) {
      fetchDailySummary();
    }
  };

  const fetchDailySummary = async () => {
    try {
      const response = await apiClient.get(`/nutrition/daily-summary/?date=${selectedDate}`);
      setDailySummary(response.data.nutrition_summary);
    } catch (error) {
      console.error('Failed to fetch daily summary', error);
    }
  };

  const handleMealDelete = async (mealId) => {
    if (window.confirm('この記録を本当に削除しますか？')) {
      try {
        await apiClient.delete(`/meals/${mealId}/`);
        setMeals(meals.filter(meal => meal.id !== mealId));
        fetchDailySummary();
      } catch (error) {
        console.error('Failed to delete meal', error);
        setMessage('記録の削除に失敗しました。');
      }
    }
  };

  const handleMealUpdated = (updatedMeal) => {
    setMeals(meals.map(meal => (meal.id === updatedMeal.id ? updatedMeal : meal)));
    setEditingMeal(null);
    fetchDailySummary();
  };

  const handleWeightCreated = (newWeight) => {
    setWeights(prevWeights => {
      const existingIndex = prevWeights.findIndex(w => w.id === newWeight.id);
      if (existingIndex !== -1) {
        const updatedWeights = [...prevWeights];
        updatedWeights[existingIndex] = newWeight;
        return updatedWeights.sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
      } else {
        return [newWeight, ...prevWeights].sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
      }
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMealTimingIcon = (timing) => {
    const icons = {
      breakfast: 'bi-sun',
      lunch: 'bi-brightness-high',
      dinner: 'bi-moon',
      snack: 'bi-cup'
    };
    return icons[timing] || 'bi-circle';
  };

  const getMealTimingLabel = (timing) => {
    const labels = {
      breakfast: '朝食',
      lunch: '昼食', 
      dinner: '夕食',
      snack: '間食'
    };
    return labels[timing] || timing;
  };

  const getMealTimingVariant = (timing) => {
    const variants = {
      breakfast: 'warning',
      lunch: 'primary',
      dinner: 'info',
      snack: 'secondary'
    };
    return variants[timing] || 'primary';
  };

  return (
    <>
      {/* ナビゲーションバー */}
      <Navbar bg="primary" variant="dark" className="shadow-sm">
        <Container>
          <Navbar.Brand>
            <i className="bi bi-heart-pulse-fill me-2"></i>
            KiloGram
          </Navbar.Brand>
          <Nav>
            <Button 
              variant="outline-light"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              ログアウト
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container className="my-4">
        {/* 記録フォーム */}
        <Row className="mb-4">
          <Col md={6} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-success text-white">
                <Card.Title className="mb-0">
                  <i className="bi bi-journal-plus me-2"></i>
                  食事記録
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <MealForm onMealCreated={handleMealCreated} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-info text-white">
                <Card.Title className="mb-0">
                  <i className="bi bi-speedometer me-2"></i>
                  体重記録
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <WeightForm onWeightCreated={handleWeightCreated} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 日別栄養サマリー */}
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-warning text-dark">
            <Card.Title className="mb-0">
              <i className="bi bi-graph-up me-2"></i>
              日別栄養サマリー
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label className="fw-bold">日付選択:</Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ width: 'auto', display: 'inline-block' }}
                  className="ms-2"
                />
              </Col>
            </Row>
            
            {dailySummary && (
              <div className="bg-light p-3 rounded">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-calendar3 me-2"></i>
                  {formatDate(selectedDate)} の栄養摂取量
                </h6>
                <div className="nutrition-grid">
                  <div className="d-flex justify-content-between">
                    <span>カロリー:</span>
                    <Badge bg="light" text="dark">{dailySummary.calories} kcal</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>タンパク質:</span>
                    <Badge bg="light" text="dark">{dailySummary.protein} g</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>脂質:</span>
                    <Badge bg="light" text="dark">{dailySummary.fat} g</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>炭水化物:</span>
                    <Badge bg="light" text="dark">{dailySummary.carbohydrates} g</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>食物繊維:</span>
                    <Badge bg="light" text="dark">{dailySummary.dietary_fiber} g</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>ナトリウム:</span>
                    <Badge bg="light" text="dark">{dailySummary.sodium} mg</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>カルシウム:</span>
                    <Badge bg="light" text="dark">{dailySummary.calcium} mg</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>鉄分:</span>
                    <Badge bg="light" text="dark">{dailySummary.iron} mg</Badge>
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
        
        {/* 記録一覧 */}
        <Row>
          <Col lg={8} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">
                  <i className="bi bi-list-ul me-2"></i>
                  食事記録一覧
                </Card.Title>
                <Badge bg="light" text="primary">{meals.length}件</Badge>
              </Card.Header>
              <Card.Body>
                {message && (
                  <Alert variant="danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {message}
                  </Alert>
                )}
                
                {meals.length > 0 ? (
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {meals.map((meal) => (
                      <Card key={meal.id} className="mb-3 meal-card border-start border-4 border-primary">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <Card.Title className="h6 mb-1">
                                <i className={`${getMealTimingIcon(meal.meal_timing)} text-primary me-2`}></i>
                                {meal.meal_name}
                              </Card.Title>
                              <Card.Subtitle className="text-muted small">
                                <i className="bi bi-calendar3 me-1"></i>
                                {formatDate(meal.record_date)} - 
                                <Badge 
                                  bg={getMealTimingVariant(meal.meal_timing)} 
                                  className="ms-2"
                                >
                                  {getMealTimingLabel(meal.meal_timing)}
                                </Badge>
                              </Card.Subtitle>
                            </div>
                            <Dropdown>
                              <Dropdown.Toggle 
                                variant="outline-secondary" 
                                size="sm"
                                id={`dropdown-${meal.id}`}
                              >
                                <i className="bi bi-three-dots"></i>
                              </Dropdown.Toggle>

                              <Dropdown.Menu>
                                <Dropdown.Item onClick={() => setEditingMeal(meal)}>
                                  <i className="bi bi-pencil me-2"></i>編集
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item 
                                  onClick={() => handleMealDelete(meal.id)}
                                  className="text-danger"
                                >
                                  <i className="bi bi-trash me-2"></i>削除
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                          
                          <Row className="text-sm">
                            <Col xs={3}>
                              <small className="text-muted">カロリー</small><br/>
                              <Badge bg="light" text="dark">{meal.calories}kcal</Badge>
                            </Col>
                            <Col xs={3}>
                              <small className="text-muted">タンパク質</small><br/>
                              <Badge bg="light" text="dark">{meal.protein}g</Badge>
                            </Col>
                            <Col xs={3}>
                              <small className="text-muted">脂質</small><br/>
                              <Badge bg="light" text="dark">{meal.fat}g</Badge>
                            </Col>
                            <Col xs={3}>
                              <small className="text-muted">炭水化物</small><br/>
                              <Badge bg="light" text="dark">{meal.carbohydrates}g</Badge>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-journal-x text-muted display-4"></i>
                    <p className="text-muted mt-2">まだ食事記録はありません。</p>
                    <p className="text-muted">上のフォームから記録を追加しましょう！</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          
          <Col lg={4} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">
                  <i className="bi bi-speedometer2 me-2"></i>
                  体重記録一覧
                </Card.Title>
                <Badge bg="light" text="info">{weights.length}件</Badge>
              </Card.Header>
              <Card.Body>
                {weights.length > 0 ? (
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {weights.map((weight) => (
                      <Card key={weight.id} className="mb-2 weight-item">
                        <Card.Body className="py-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <small className="text-muted">
                                <i className="bi bi-calendar3 me-1"></i>
                                {formatDate(weight.record_date)}
                              </small>
                            </div>
                            <div className="text-end">
                              <h6 className="mb-0 text-primary">
                                <i className="bi bi-speedometer me-1"></i>
                                {weight.weight} kg
                              </h6>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-speedometer text-muted display-6"></i>
                    <p className="text-muted mt-2">まだ体重記録はありません。</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {editingMeal && (
        <EditMealModal
          meal={editingMeal}
          onClose={() => setEditingMeal(null)}
          onMealUpdated={handleMealUpdated}
        />
      )}
    </>
  );
};

export default Dashboard;