import { useState } from 'react';
import { Container, Row, Col, Card, Navbar, Nav, Button, Alert, Badge, Form } from 'react-bootstrap';

import { MealForm, EditMealModal, CalorieChart } from '@/features/meals';
import { WeightForm, WeightChart } from '@/features/weights';
import { InstallPWA } from '@/components/PWA';
import { useDashboardData } from '../hooks/useDashboardData';

// ヘルパー関数群（日付フォーマット、食事タイミングの表示設定など）
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getMealTimingConfig = (timing) => {
  const config = {
    breakfast: { icon: 'bi-sun', label: '朝食', variant: 'warning' },
    lunch: { icon: 'bi-brightness-high', label: '昼食', variant: 'primary' },
    dinner: { icon: 'bi-moon', label: '夕食', variant: 'info' },
    snack: { icon: 'bi-cup', label: '間食', variant: 'secondary' }
  };
  return config[timing] || { icon: 'bi-circle', label: timing, variant: 'primary' };
};

const Dashboard = ({ handleLogout }) => {
  const [editingMeal, setEditingMeal] = useState(null);
  const initialDate = new Date().toISOString().split('T')[0];
  
  // カスタムフックを使用
  const { data, actions } = useDashboardData(initialDate);
  const { meals, allMeals, weights, dailySummary, selectedDate, message } = data;
  
  const isToday = selectedDate === initialDate;

  // Meal更新時のラッパー（モーダルを閉じる処理を追加）
  const onMealUpdateWrapper = (updatedMeal) => {
    actions.handleMealUpdated(updatedMeal);
    setEditingMeal(null);
  };

  // 削除確認ラッパー
  const confirmDelete = (mealId) => {
    if (window.confirm('この記録を本当に削除しますか？')) {
      actions.handleMealDelete(mealId);
    }
  };

  return (
    <>
      <InstallPWA />
      <Navbar bg="primary" variant="dark" className="shadow-sm">
        <Container>
          <Navbar.Brand>DishBoard</Navbar.Brand>
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
        {/* 食事記録フォーム */}
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
                <MealForm onMealCreated={actions.handleMealCreated} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 体重記録フォーム */}
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
                <WeightForm onWeightCreated={actions.handleWeightCreated} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 日付選択と本日のサマリー */}
        <Row className="mb-4">
          <Col xs={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">
                  <i className="bi bi-calendar3 me-2"></i>
                  {isToday ? '今日' : formatDate(selectedDate)}の記録
                </Card.Title>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => actions.handleDateChange(e.target.value)}
                  style={{ width: 'auto' }}
                  className="bg-white"
                />
              </Card.Header>
              <Card.Body>
                {dailySummary && (
                  <Row className="text-center mb-3">
                    <Col xs={3}>
                      <div className="fw-bold text-primary">{dailySummary.total_calories}</div>
                      <small className="text-muted">kcal</small>
                    </Col>
                    <Col xs={3}>
                      <div className="fw-bold text-success">{dailySummary.total_protein}g</div>
                      <small className="text-muted">タンパク質</small>
                    </Col>
                    <Col xs={3}>
                      <div className="fw-bold text-warning">{dailySummary.total_fat}g</div>
                      <small className="text-muted">脂質</small>
                    </Col>
                    <Col xs={3}>
                      <div className="fw-bold text-info">{dailySummary.total_carbohydrates}g</div>
                      <small className="text-muted">炭水化物</small>
                    </Col>
                  </Row>
                )}

                {message && (
                  <Alert 
                    variant={message.includes('失敗') ? 'danger' : 'success'}
                    dismissible
                    onClose={() => actions.setMessage('')}
                  >
                    <i className={`bi ${message.includes('失敗') ? 'bi-exclamation-triangle' : 'bi-check-circle'} me-2`}></i>
                    {message}
                  </Alert>
                )}
                
                {meals.length > 0 ? (
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {meals.map((meal) => {
                      const timingConf = getMealTimingConfig(meal.meal_timing);
                      return (
                        <Card key={meal.id} className="mb-3 meal-card border-start border-4">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <Card.Title className="h6 mb-1">
                                  <i className={`${timingConf.icon} text-primary me-2`}></i>
                                  {meal.meal_name}
                                </Card.Title>
                                <Card.Subtitle className="text-muted small">
                                  <Badge bg={timingConf.variant} className="me-2">
                                    {timingConf.label}
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
                                  onClick={() => confirmDelete(meal.id)}
                                  title="削除"
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </div>
                            </div>
                            
                            <Row className="text-sm">
                              {[
                                {l: 'カロリー', v: meal.calories, u: 'kcal'},
                                {l: 'タンパク質', v: meal.protein, u: 'g'},
                                {l: '脂質', v: meal.fat, u: 'g'},
                                {l: '炭水化物', v: meal.carbohydrates, u: 'g'},
                              ].map((n, i) => (
                                <Col xs={3} key={i}>
                                  <small className="text-muted">{n.l}</small><br/>
                                  <Badge bg="light" text="dark">{n.v}{n.u}</Badge>
                                </Col>
                              ))}
                            </Row>
                          </Card.Body>
                        </Card>
                      );
                    })}
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
                        onClick={() => actions.handleDateChange(initialDate)}
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
          onMealUpdated={onMealUpdateWrapper}
        />
      )}
    </>
  );
};

export default Dashboard;