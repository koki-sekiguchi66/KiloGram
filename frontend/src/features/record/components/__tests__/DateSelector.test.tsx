import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateSelector } from '../DateSelector';

describe('DateSelector', () => {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  it('選択日付が日本語形式で表示される', () => {
    render(<DateSelector selectedDate="2026-03-04" onDateChange={vi.fn()} />);

    // 日付と曜日は別要素（曜日だけ小さく muted で出す）
    expect(screen.getByText('3月4日')).toBeInTheDocument();
    expect(screen.getByText('水曜日')).toBeInTheDocument();
  });

  it('前日ボタンで1日前の日付が渡される', async () => {
    const onDateChange = vi.fn();
    const user = userEvent.setup();

    render(<DateSelector selectedDate="2026-03-04" onDateChange={onDateChange} />);

    await user.click(screen.getByLabelText('前日'));
    expect(onDateChange).toHaveBeenCalledWith('2026-03-03');
  });

  it('翌日ボタンで1日後の日付が渡される', async () => {
    const onDateChange = vi.fn();
    const user = userEvent.setup();

    render(<DateSelector selectedDate="2026-03-03" onDateChange={onDateChange} />);

    await user.click(screen.getByLabelText('翌日'));
    expect(onDateChange).toHaveBeenCalledWith('2026-03-04');
  });

  it('今日の場合は「今日へ」ボタンを出さない', () => {
    render(<DateSelector selectedDate={today} onDateChange={vi.fn()} />);

    expect(screen.queryByRole('button', { name: '今日へ' })).not.toBeInTheDocument();
  });

  it('今日でない場合は「今日へ」ボタンが表示される', () => {
    render(<DateSelector selectedDate="2026-01-01" onDateChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '今日へ' })).toBeInTheDocument();
  });

  it('「今日へ」ボタンクリックで今日の日付が渡される', async () => {
    const onDateChange = vi.fn();
    const user = userEvent.setup();

    render(<DateSelector selectedDate="2026-01-01" onDateChange={onDateChange} />);

    await user.click(screen.getByRole('button', { name: '今日へ' }));
    expect(onDateChange).toHaveBeenCalledWith(today);
  });

  it('今日の場合は翌日ボタンが無効', () => {
    render(<DateSelector selectedDate={today} onDateChange={vi.fn()} />);

    expect(screen.getByLabelText('翌日')).toBeDisabled();
  });
});
