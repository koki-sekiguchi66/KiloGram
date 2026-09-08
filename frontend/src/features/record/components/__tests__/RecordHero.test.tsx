import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecordHero } from '../RecordHero';

describe('RecordHero', () => {
  beforeEach(() => {
    // テスト時刻を固定（14:00 = 午後の挨拶）
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T14:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('時間帯に応じたメッセージが表示される', () => {
    render(<RecordHero timingLabel="昼食" mealCount={0} />);

    // 14時 → "午後もあと少し！間食の記録も忘れずに"
    expect(screen.getByText(/間食/)).toBeInTheDocument();
  });

  it('記録が無いときは「まだ記録がありません」と出す', () => {
    render(<RecordHero timingLabel="昼食" mealCount={0} />);

    expect(screen.getByText(/まだ記録がありません/)).toBeInTheDocument();
  });

  it('記録があるときは品数を出す', () => {
    render(<RecordHero timingLabel="昼食" mealCount={3} />);

    expect(screen.getByText(/3品を記録/)).toBeInTheDocument();
    expect(screen.queryByText(/まだ記録がありません/)).not.toBeInTheDocument();
  });
});
