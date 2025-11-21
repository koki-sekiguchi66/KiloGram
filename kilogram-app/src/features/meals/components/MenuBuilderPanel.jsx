import React from 'react';
import { Card, Form, ButtonGroup, Button } from 'react-bootstrap';
import FoodSearchInput from './FoodSearchInput';
import ManualInputForm from './ManualInputForm';
import MyMenusSelector from './MyMenuSelector';
import MyItemsSelector from './MyItemsSelector';
import CafeteriaSelector from './CafeteriaSelector'; // 新しいコンポーネント

const MenuBuilderPanel = ({ menuBuilder }) => {
  const {
    recordDate,
    setRecordDate,
    mealTiming,
    setMealTiming,
    activeInputMethod,
    setActiveInputMethod,
    addMenuItem
  } = menuBuilder;

  const handleFoodSelected = (item) => {
    addMenuItem({
      item_type: item.item_type || 'standard',
      item_id: item.id || item.menu_id || 0,
      item_name: item.name || item.item_name,
      amount_grams: item.amount || 100,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbohydrates: item.carbohydrates,
      dietary_fiber: item.dietary_fiber || 0,
      sodium: item.sodium || 0,
      calcium: item.calcium || 0,
      iron: item.iron || 0,
      vitamin_a: item.vitamin_a || 0,
      vitamin_b1: item.vitamin_b1 || 0,
      vitamin_b2: item.vitamin_b2 || 0,
      vitamin_c: item.vitamin_c || 0,
    });
  };
  
  return (
    <Card className="shadow-sm h-100">
      <Card.Header className="bg-primary text-white">
        <i className="bi bi-plus-circle me-2"></i>
        <strong>メニューを作成</strong>
      </Card.Header>
      
      <Card.Body>
        <div className="d-flex gap-3 mb-4">
          <Form.Group className="flex-fill">
            <Form.Label>記録日</Form.Label>
            <Form.Control
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="flex-fill">
            <Form.Label>食事タイミング</Form.Label>
            <Form.Select
              value={mealTiming}
              onChange={(e) => setMealTiming(e.target.value)}
            >
              <option value="breakfast">朝食</option>
              <option value="lunch">昼食</option>
              <option value="dinner">夕食</option>
              <option value="snack">間食</option>
            </Form.Select>
          </Form.Group>
        </div>
        
        <Form.Group className="mb-3">
          <Form.Label>追加方法</Form.Label>
          <ButtonGroup className="d-flex flex-wrap w-100">
            <Button
              variant={activeInputMethod === 'search' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveInputMethod('search')}
            >
              <i className="bi bi-search me-1"></i> 検索
            </Button>
            <Button
              variant={activeInputMethod === 'myItems' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveInputMethod('myItems')}
            >
              <i className="bi bi-egg-fried me-1"></i> Myアイテム
            </Button>
            <Button
              variant={activeInputMethod === 'myMenus' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveInputMethod('myMenus')}
            >
              <i className="bi bi-bookmark-star me-1"></i> Myメニュー
            </Button>
            <Button
              variant={activeInputMethod === 'cafeteria' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveInputMethod('cafeteria')}
            >
              <i className="bi bi-shop me-1"></i> 食堂
            </Button>
            <Button
              variant={activeInputMethod === 'manual' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveInputMethod('manual')}
            >
              <i className="bi bi-pencil me-1"></i> 手動
            </Button>
          </ButtonGroup>
        </Form.Group>
        
        <hr />
        
        <div className="p-1">
          {activeInputMethod === 'search' && (
            <FoodSearchInput onFoodSelected={handleFoodSelected} />
          )}
          
          {activeInputMethod === 'myItems' && (
            <MyItemsSelector onItemSelected={handleFoodSelected} />
          )}
          
          {activeInputMethod === 'myMenus' && (
            <MyMenusSelector menuBuilder={menuBuilder} />
          )}

          {activeInputMethod === 'cafeteria' && (
            <CafeteriaSelector onMenuSelected={handleFoodSelected} />
          )}

          {activeInputMethod === 'manual' && (
            <ManualInputForm onAdd={handleFoodSelected} />
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default MenuBuilderPanel;