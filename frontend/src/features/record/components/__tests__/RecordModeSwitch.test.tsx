import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordModeSwitch } from '../RecordModeSwitch';

describe('RecordModeSwitch', () => {
  it('食事記録と体重記録の2つを表示する', () => {
    render(<RecordModeSwitch mode="meal" onChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: '食事記録' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '体重記録' })).toBeInTheDocument();
  });

  it('選択中のモードに aria-selected が付く', () => {
    render(<RecordModeSwitch mode="weight" onChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: '体重記録' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '食事記録' })).toHaveAttribute('aria-selected', 'false');
  });

  it('未選択の項目をクリックすると onChange が呼ばれる', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<RecordModeSwitch mode="meal" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: '体重記録' }));

    expect(onChange).toHaveBeenCalledWith('weight');
  });
});
