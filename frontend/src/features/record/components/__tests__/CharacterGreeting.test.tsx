import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharacterGreeting } from '../CharacterGreeting';

describe('CharacterGreeting', () => {
  beforeEach(() => {
    // テスト時刻を固定（14:00 = 午後の挨拶）
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T14:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('時間帯に応じたメッセージが表示される', () => {
    render(<CharacterGreeting selectedDate="2026-03-04" />);

    // 14時 → "午後もあと少し！間食の記録も忘れずに"
    expect(screen.getByText(/間食/)).toBeInTheDocument();
  });

  it('ストリーク表示エリアが存在する', () => {
    render(<CharacterGreeting selectedDate="2026-03-04" />);

    expect(screen.getByText(/ストリーク/)).toBeInTheDocument();
  });

  it('レベル表示エリアが存在する', () => {
    render(<CharacterGreeting selectedDate="2026-03-04" />);

    expect(screen.getByText(/Lv/)).toBeInTheDocument();
  });

  it('過去日の画面を今日の献立と表示しない', () => {
    render(<CharacterGreeting selectedDate="2026-03-03" />);
    expect(screen.getByText('3月3日の献立')).toBeInTheDocument();
    expect(screen.queryByText('今日の献立')).not.toBeInTheDocument();
  });
});
