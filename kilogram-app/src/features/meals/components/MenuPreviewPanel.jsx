import React from 'react';
import { Card, Form, Button, Collapse } from 'react-bootstrap';
import CurrentMenuDisplay from './CurrentMenuDisplay';
import NutritionSummary from './NutritionSummary';

/**
 * メニュープレビューパネル（右側40%）
 * 
 * 役割:
 * - 現在作成中のメニューを表示
 * - 栄養素の合計を表示
 * - 保存オプション（Myメニューとして保存）
 * - 送信ボタン
 * 
 * 設計原則:
 * - リアルタイムプレビュー（ローカル状態を表示）
 * - sticky-topで画面上部に固定
 * - スクロール可能
 */
const MenuPreviewPanel = ({ menuBuilder }) => {
  const {
    menuItems,
    totalNutrition,
    saveAsMenu,
    setSaveAsMenu,
    menuName,
    setMenuName,
    menuDescription,
    setMenuDescription,
    handleSubmit,
    handleClearMenu,
    isSubmitting,
  } = menuBuilder;
  
  return (
    <>
      {/* 現在のメニュー */}
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-list-ul me-2"></i>
            <strong>現在のメニュー</strong>
          </span>
          {menuItems.length > 0 && (
            <Button
              size="sm"
              variant="outline-danger"
              onClick={handleClearMenu}
            >
              <i className="bi bi-trash me-1"></i>
              クリア
            </Button>
          )}
        </Card.Header>
        
        <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {menuItems.length === 0 ? (
            <p className="text-muted text-center mb-0">
              アイテムを追加してください
            </p>
          ) : (
            <CurrentMenuDisplay menuBuilder={menuBuilder} />
          )}
        </Card.Body>
      </Card>
      
      {/* 栄養サマリー */}
      <Card className="mb-3">
        <Card.Header>
          <i className="bi bi-bar-chart me-2"></i>
          <strong>合計栄養素</strong>
        </Card.Header>
        <Card.Body>
          <NutritionSummary nutrition={totalNutrition} />
        </Card.Body>
      </Card>
      
      {/* 保存オプション */}
      <Card>
        <Card.Header>
          <i className="bi bi-save me-2"></i>
          <strong>保存オプション</strong>
        </Card.Header>
        <Card.Body>
          {/* Myメニューとして保存チェックボックス */}
          <Form.Check
            type="checkbox"
            label="Myメニューとして保存"
            checked={saveAsMenu}
            onChange={(e) => setSaveAsMenu(e.target.checked)}
            className="mb-3"
          />
          
          {/* メニュー名・説明入力（条件付き表示） */}
          <Collapse in={saveAsMenu}>
            <div>
              <Form.Group className="mb-2">
                <Form.Label>
                  メニュー名 <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  placeholder="例: 私の朝食セット"
                  disabled={!saveAsMenu}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>説明（任意）</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={menuDescription}
                  onChange={(e) => setMenuDescription(e.target.value)}
                  placeholder="メモや説明を入力..."
                  disabled={!saveAsMenu}
                />
              </Form.Group>
            </div>
          </Collapse>
          
          {/* 送信ボタン */}
          <Button
            variant="success"
            className="w-100"
            onClick={handleSubmit}
            disabled={menuItems.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                保存中...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                食事記録として登録
              </>
            )}
          </Button>
          
          {/* 注意書き */}
          {menuItems.length === 0 && (
            <small className="text-muted d-block mt-2 text-center">
              少なくとも1つのアイテムを追加してください
            </small>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default MenuPreviewPanel;