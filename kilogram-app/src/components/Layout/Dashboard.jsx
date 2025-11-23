import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Navbar, Nav, Button, Alert, Badge, Form } from 'react-bootstrap';

import { MealForm, EditMealModal, CalorieChart } from '@/features/meals';
import { WeightForm, WeightChart } from '@/features/weights';
import { InstallPWA } from '@/components/PWA';
import { mealApi } from '@/features/meals/api/mealApi';
import { weightApi } from '@/features/weights/api/weightApi';

const Dashboard = ({ handleLogout }) => {
  const [meals, setMeals] = useState([]);
  const [allMeals, setAllMeals] = useState([]); 
  const [weights, setWeights] = useState([]);
  const [message, setMessage] = useState('');
  const [editingMeal, setEditingMeal] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const data = await mealApi.getMeals();
        setAllMeals(data);
        filterMealsByDate(data, selectedDate);
      } catch (error) {
        console.error('Failed to fetch meals', error);
        setMessage('食事記録の取得に失敗しました。');
        setTimeout(() => setMessage(''), 5000);
      }
    };

    const fetchWeights = async () => {
      try {
        const data = await weightApi.getWeights();
        setWeights(data);
      } catch (error) {
        console.error('Failed to fetch weights', error);
        setMessage('体重記録の取得に失敗しました。');
        setTimeout(() => setMessage(''), 5000);
      }
    };

    const fetchDailySummary = async () => {
      try {
        const data = await mealApi.getDailySummary(selectedDate);
        setDailySummary(data.nutrition_summary);
      } catch (error) {
        console.error('Failed to fetch daily summary', error);
        setMessage('日次サマリーの取得に失敗しました。');
        setTimeout(() => setMessage(''), 5000);
      }
    };

    fetchMeals();
    fetchWeights(); 
    fetchDailySummary();
  }, [selectedDate]);

  const filterMealsByDate = (mealList, date) => {
    const filteredMeals = mealList.filter(meal => meal.record_date === date);
    setMeals(filteredMeals.sort((a, b) => new Date(b.record_date) - new Date(a.record_date)));
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    filterMealsByDate(allMeals, newDate);
  };

  const handleMealCreated = (newMeal) => {
    const updatedAllMeals = [newMeal, ...allMeals].sort((a, b) => new Date(b.record_date) - new Date(a.record_date));
    setAllMeals(updatedAllMeals);
    
    if (newMeal.record_date === selectedDate) {
      filterMealsByDate(updatedAllMeals, selectedDate);
      fetchDailySummary();
    }
  };

  const handleMealDelete = async (mealId) => {
    if (window.confirm('この記録を本当に削除しますか？')) {
      try {
        await mealApi.deleteMeal(mealId);
        const updatedAllMeals = allMeals.filter(meal => meal.id !== mealId);
        setAllMeals(updatedAllMeals);
        filterMealsByDate(updatedAllMeals, selectedDate);
        fetchDailySummary();
        setMessage('記録を削除しました。');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Failed to delete meal', error);
        setMessage('記録の削除に失敗しました。');
        setTimeout(() => setMessage(''), 5000);
      }
    }
  };

  const handleMealUpdated = (updatedMeal) => {
    const updatedAllMeals = allMeals.map(meal => (meal.id === updatedMeal.id ? updatedMeal : meal));
    setAllMeals(updatedAllMeals);
    filterMealsByDate(updatedAllMeals, selectedDate);
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

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <>
      <InstallPWA />
      <Navbar bg="primary" variant="dark" className="shadow-sm">
        <Container>
          <Navbar.Brand>KiloGram</Navbar.Brand>
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
        {/* 食事記録セクション（全幅に変更） */}
        <Row className="mb-4">
          <Col xs={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white">
                <Card.Title className="mb-0">
                  <i className="bi bi-journal-plus me-2"></i>
                  食事記録
                </Card.Title>
              </Card.Header>
              <Card.Body>
                {/* メニュービルダーが広々と表示されます */}
                <MealForm onMealCreated={handleMealCreated} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 体重記録セクション（全幅に変更） */}
        <Row className="mb-4">
          <Col xs={12}>
            <Card className="shadow-sm">
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
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    style={{ width: 'auto' }}
                  />
                  {!isToday && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                    >
                      <i className="bi bi-calendar-today me-1"></i>
                      今日の記録を見る
                    </Button>
                  )}
                </div>
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
        
        <Row className="mb-4">
          <Col xs={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">
                  <i className="bi bi-list-ul me-2"></i>
                  {formatDate(selectedDate)} の食事記録
                </Card.Title>
              </Card.Header>
              <Card.Body>
                {message && (
                  <Alert
                    variant={message.includes('失敗') ? 'danger' : 'success'}
                    dismissible
                    onClose={() => setMessage('')}
                  >
                    <i className={`bi ${message.includes('失敗') ? 'bi-exclamation-triangle' : 'bi-check-circle'} me-2`}></i>
                    {message}
                  </Alert>
                )}
                
                {meals.length > 0 ? (
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {meals.map((meal) => (
                      <Card key={meal.id} className="mb-3 meal-card border-start border-4">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <Card.Title className="h6 mb-1">
                                <i className={`${getMealTimingIcon(meal.meal_timing)} text-primary me-2`}></i>
                                {meal.meal_name}
                              </Card.Title>
                              <Card.Subtitle className="text-muted small">
                                <Badge 
                                  bg={getMealTimingVariant(meal.meal_timing)} 
                                  className="me-2"
                                >
                                  {getMealTimingLabel(meal.meal_timing)}
                                </Badge>
                                <i className="bi bi-calendar3 me-1"></i>
                                {formatDate(meal.record_date)}
                              </Card.Subtitle>
                            </div>
                            
                            <div className="d-flex gap-1 position-absolute top-0 end-0 p-2">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => setEditingMeal(meal)}
                                title="編集"
                              >
                                <i className="bi bi-pencil"></i>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => {
                                  if (window.confirm('この食事記録を削除してもよろしいですか？')) {
                                    handleMealDelete(meal.id);
                                  }
                                }}
                                title="削除"
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </div>
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
                    <p className="text-muted mt-2">
                      {isToday ? '今日の食事記録はまだありません。' : `${formatDate(selectedDate)}の食事記録はありません。`}
                    </p>
                    {!isToday && (
                      <Button
                        variant="outline-primary"
                        onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                      >
                        <i className="bi bi-calendar-today me-2"></i>
                        今日の記録を見る
                      </Button>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col xs={12}>
            <CalorieChart meals={allMeals} />
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <WeightChart weights={weights} />
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