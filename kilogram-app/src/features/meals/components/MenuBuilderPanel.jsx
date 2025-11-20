import React from 'react';
import { Card, Form, ButtonGroup, Button } from 'react-bootstrap';
import FoodSearchInput from './FoodSearchInput';
import ManualInputForm from './ManualInputForm';
import MyItemsSelector from './MyItemsSelector';
import MyMenusSelector from './MyMenusSelector';
import CafeteriaSelector from './CafeteriaSelector';

/**
 * メニュービルダーパネル（左側60%）
 * 
 * 役割:
 * - 日付・食事タイミングの選択
 * - 入力方法の切り替え
 * - 各入力方法に応じたコンポーネント表示
 * 
 * 設計原則:
 * - 条件付きレンダリングで1つずつ表示
 * - シンプルなUI/UX
 */
const MenuBuilderPanel = ({ menuBuilder }) => {
  const {
    recordDate,
    setRecordDate,
    mealTiming,
    setMealTiming,
    activeInputMethod,
    setActiveInputMethod,
  } = menuBuilder;
  
  return (
    <Card>
      <Card.Header className="bg-primary text-white">
        <i className="bi bi-plus-circle me-2"></i>
        <strong>メニューを作成</strong>
      </Card.Header>
      
      <Card.Body>
        {/* 日付選択 */}
        <Form.Group className="mb-3">
          <Form.Label>記録日</Form.Label>
          <Form.Control
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
          />
        </Form.Group>
        
        {/* 食事タイミング選択 */}
        <Form.Group className="mb-4">
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
        
        {/* 追加方法選択 */}
        <Form.Group className="mb-3">
          <Form.Label>追加方法</Form.Label>
          <ButtonGroup className="d-flex flex-wrap gap-2">
            <Button
              variant={activeInputMethod === 'search' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveInputMethod('search')}
              className="flex-fill"
            >
              <i className="bi bi-search me-1"></i>
              食品検索
            </Button>
            <Button
              variant={activeInputMethod === 'manual' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveInputMethod('manual')}
              className="flex-fill"
            >
              <i className="bi bi-pencil me-1"></i>
              手動入力
            </Button>
            <Button
              variant={activeInputMethod === 'myItems' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveInputMethod('myItems')}
              className="flex-fill"
            >
              <i className="bi bi-star me-1"></i>
              Myアイテム
            </Button>
            <Button
              variant={activeInputMethod === 'myMenus' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveInputMethod('myMenus')}
              className="flex-fill"
            >
              <i className="bi bi-menu-button-wide me-1"></i>
              Myメニュー
            </Button>
            <Button
              variant={activeInputMethod === 'cafeteria' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveInputMethod('cafeteria')}
              className="flex-fill"
            >
              <i className="bi bi-shop me-1"></i>
              食堂
            </Button>
          </ButtonGroup>
        </Form.Group>
        
        <hr />
        
        {/* 条件付きレンダリング：選択された入力方法を表示 */}
        {activeInputMethod === 'search' && (
          <FoodSearchInput menuBuilder={menuBuilder} />
        )}
        
        {activeInputMethod === 'manual' && (
          <ManualInputForm menuBuilder={menuBuilder} />
        )}
        
        {activeInputMethod === 'myItems' && (
          <MyItemsSelector menuBuilder={menuBuilder} />
        )}
        
        {activeInputMethod === 'myMenus' && (
          <MyMenusSelector menuBuilder={menuBuilder} />
        )}
        
        {activeInputMethod === 'cafeteria' && (
          <CafeteriaSelector menuBuilder={menuBuilder} />
        )}
      </Card.Body>
    </Card>
  );
};

export default MenuBuilderPanel;