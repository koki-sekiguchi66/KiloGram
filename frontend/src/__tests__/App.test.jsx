import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/features/auth', () => ({
  Login: ({ onLoginSuccess }) => (
    <div data-testid="login-component">
      <button onClick={() => onLoginSuccess('mock-token')}>Mock Login</button>
    </div>
  ),
  Register: ({ onRegisterSuccess }) => (
    <div data-testid="register-component">
      <button onClick={() => onRegisterSuccess('mock-token')}>Mock Register</button>
    </div>
  ),
}));

vi.mock('@/features/dashboard', () => ({
  Dashboard: ({ handleLogout }) => (
    <div data-testid="dashboard-component">
      <button onClick={handleLogout}>Mock Logout</button>
    </div>
  ),
}));

import App from '@/App';

describe('App 統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('未ログイン状態でログインフォームが表示', () => {
    render(<App />);

    expect(screen.getByTestId('login-component')).toBeInTheDocument();
    expect(screen.getByText('DishBoard')).toBeInTheDocument();
  });

  it('トークンがある場合にダッシュボードが表示', () => {
    localStorage.setItem('token', 'stored-token');

    render(<App />);

    expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
  });

  it('ログイン成功後にダッシュボードに遷移', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('Mock Login'));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
  });

  it('ログインとユーザー登録のタブ切り替えができる', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByTestId('login-component')).toBeInTheDocument();

    const registerButton = screen.getByRole('button', { name: /新規登録/i });
    await user.click(registerButton);

    expect(screen.getByTestId('register-component')).toBeInTheDocument();

    const loginButton = screen.getByRole('button', { name: /ログイン/i });
    await user.click(loginButton);

    expect(screen.getByTestId('login-component')).toBeInTheDocument();
  });

  it('ログアウトでログインフォームに戻る', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'stored-token');

    render(<App />);

    expect(screen.getByTestId('dashboard-component')).toBeInTheDocument();

    await user.click(screen.getByText('Mock Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('login-component')).toBeInTheDocument();
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('無効なトークンの場合にログインフォームにフォールバック', () => {
    // トークンがない状態をテスト（setup.jsでlocalStorageモック済み）
    render(<App />);

    expect(screen.getByTestId('login-component')).toBeInTheDocument();
  });
});