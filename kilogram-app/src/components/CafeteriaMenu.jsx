import { useState } from 'react';
import { Modal, Button, Card, Badge, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import apiClient from '../api/axiosConfig';

const CafeteriaMenu = ({ show, onClose, onMenuSelected }) => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { key: 'all', label: '全て' },
    { key: 'main', label: '主菜' },
    { key: 'side', label: '副菜' },
    { key: 'noodle', label: '麺類' },
    { key: 'rice', label: '丼・カレー' },
    { key: 'dessert', label: 'デザート' },
  ];

  const handleUpdateMenus = async () => {
    setUpdating(true);
    setError('');
    try {
      await apiClient.post('/cafeteria/update/');
      await fetchMenus();
      setError('');
    } catch (err) {
      setError('メニュー更新に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/cafeteria/list/');
      setMenus(response.data);
    } catch (err) {
      setError('メニュー取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuSelect = (menu) => {
    setSelectedMenu(menu);
  };

  const handleAddToMeal = () => {
    if (selectedMenu) {
      onMenuSelected({
        name: selectedMenu.name,
        amount: 100,
        calories: selectedMenu.calories,
        protein: selectedMenu.protein,
        fat: selectedMenu.fat,
        carbohydrates: selectedMenu.carbohydrates,
        dietary_fiber: selectedMenu.dietary_fiber,
        sodium: selectedMenu.sodium,
        calcium: selectedMenu.calcium,
        iron: selectedMenu.iron,
        vitamin_a: selectedMenu.vitamin_a,
        vitamin_b1: selectedMenu.vitamin_b1,
        vitamin_b2: selectedMenu.vitamin_b2,
        vitamin_c: selectedMenu.vitamin_c,
      });
      onClose();
    }
  };

  const filteredMenus = activeCategory === 'all' 
    ? menus 
    : menus.filter(m => m.category === activeCategory);

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-shop me-2"></i>
          食堂メニュー
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex gap-2 mb-3">
          <Button
            variant="primary"
            onClick={handleUpdateMenus}
            disabled={updating}
          >
            {updating ? (
              <>
                <Spinner size="sm" className="me-2" />
                更新中...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2"></i>
                メニューを更新
              </>
            )}
          </Button>
          <Button variant="outline-secondary" onClick={fetchMenus}>
            <i className="bi bi-list me-2"></i>
            一覧表示
          </Button>
        </div>

        <Tabs activeKey={activeCategory} onSelect={setActiveCategory} className="mb-3">
          {categories.map(cat => (
            <Tab key={cat.key} eventKey={cat.key} title={cat.label} />
          ))}
        </Tabs>

        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" />
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="text-center p-4 text-muted">
            メニューがありません
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredMenus.map(menu => (
              <Card
                key={menu.id}
                className={`mb-2 ${selectedMenu?.id === menu.id ? 'border-primary' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleMenuSelect(menu)}
              >
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{menu.name}</h6>
                      <Badge bg="secondary">
                        {menu.category_display}
                      </Badge>
                    </div>
                  </div>
                  <small className="text-muted d-block mt-2">
                    {menu.calories}kcal | P:{menu.protein}g | F:{menu.fat}g | C:{menu.carbohydrates}g
                  </small>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          閉じる
        </Button>
        <Button
          variant="primary"
          onClick={handleAddToMeal}
          disabled={!selectedMenu}
        >
          追加
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CafeteriaMenu;