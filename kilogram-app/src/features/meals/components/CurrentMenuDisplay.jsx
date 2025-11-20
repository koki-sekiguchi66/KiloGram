import React from 'react';
import { ListGroup } from 'react-bootstrap';
import CurrentMenuItem from './CurrentMenuItem';

/**
 * 現在のメニュー表示
 * 
 * 役割:
 * - menuItems配列を受け取ってリスト表示
 * - 各アイテムにCurrentMenuItemコンポーネントを使用
 * 
 * 設計原則:
 * - シンプルなプレゼンテーションコンポーネント
 * - スクロール可能なリスト
 */
const CurrentMenuDisplay = ({ menuBuilder }) => {
  const { menuItems, updateItemAmount, removeItem, reorderItems } = menuBuilder;
  
  return (
    <ListGroup variant="flush">
      {menuItems.map((item, index) => (
        <CurrentMenuItem
          key={item.tempId}
          item={item}
          index={index}
          onAmountChange={(newAmount) => updateItemAmount(index, newAmount)}
          onRemove={() => removeItem(index)}
          onReorder={reorderItems}
        />
      ))}
    </ListGroup>
  );
};

export default CurrentMenuDisplay;