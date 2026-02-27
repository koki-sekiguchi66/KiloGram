import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMockWeight } from '@/test/helpers';

vi.mock('@/features/weights/api/weightApi', () => ({
  weightApi: {
    createWeight: vi.fn(),
  },
}));

import WeightForm from '@/features/weights/components/WeightForm';
import { weightApi } from '@/features/weights/api/weightApi';

describe('WeightForm コンポーネント', () => {
  const mockOnWeightCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('フォームが正しくレンダリングされる', () => {
    render(<WeightForm onWeightCreated={mockOnWeightCreated} />);

    expect(screen.getByText(/記録日/)).toBeInTheDocument();
    expect(screen.getByText(/体重/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('例: 65.5')).toBeInTheDocument();
    expect(screen.getByText('kg')).toBeInTheDocument();
  });

  it('体重記録を正常に作成', async () => {
    const user = userEvent.setup();
    const created = createMockWeight();
    weightApi.createWeight.mockResolvedValue(created);

    render(<WeightForm onWeightCreated={mockOnWeightCreated} />);

    const weightInput = screen.getByPlaceholderText('例: 65.5');
    await user.clear(weightInput);
    await user.type(weightInput, '65.5');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(weightApi.createWeight).toHaveBeenCalled();
      expect(mockOnWeightCreated).toHaveBeenCalledWith(created);
    });
  });

  it('API失敗時にエラーメッセージが表示', async () => {
    const user = userEvent.setup();
    weightApi.createWeight.mockRejectedValue(new Error('Server Error'));

    render(<WeightForm onWeightCreated={mockOnWeightCreated} />);

    const weightInput = screen.getByPlaceholderText('例: 65.5');
    await user.clear(weightInput);
    await user.type(weightInput, '65.5');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/失敗しました/)).toBeInTheDocument();
    });

    expect(mockOnWeightCreated).not.toHaveBeenCalled();
  });
});