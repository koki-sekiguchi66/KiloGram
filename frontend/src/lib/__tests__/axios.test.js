import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => {
  const interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  return {
    default: {
      create: vi.fn(() => ({
        interceptors,
        get: vi.fn(),
        post: vi.fn(),
      })),
    },
  };
});

describe('apiClient', () => {
  let axios;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    axios = (await import('axios')).default;
  });

  it('axios.createが呼び出される', async () => {
    await import('@/lib/axios');
    expect(axios.create).toHaveBeenCalled();
  });

  it('リクエストインターセプターが登録される', async () => {
    await import('@/lib/axios');
    const instance = axios.create.mock.results[0]?.value;
    expect(instance.interceptors.request.use).toHaveBeenCalled();
  });

  it('レスポンスインターセプターが登録される', async () => {
    await import('@/lib/axios');
    const instance = axios.create.mock.results[0]?.value;
    expect(instance.interceptors.response.use).toHaveBeenCalled();
  });

  describe('リクエストインターセプター', () => {
    it('トークンが存在する場合、Authorizationヘッダーが付与される', async () => {
      localStorage.setItem('token', 'test-token-123');
      await import('@/lib/axios');

      const instance = axios.create.mock.results[0]?.value;
      const requestHandler = instance.interceptors.request.use.mock.calls[0][0];
      const config = { headers: {} };
      const result = requestHandler(config);

      expect(result.headers.Authorization).toBe('Token test-token-123');
    });

    it('トークンが存在しない場合、Authorizationヘッダーが付与されない', async () => {
      await import('@/lib/axios');

      const instance = axios.create.mock.results[0]?.value;
      const requestHandler = instance.interceptors.request.use.mock.calls[0][0];
      const config = { headers: {} };
      const result = requestHandler(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('レスポンスインターセプター', () => {
    it('401エラー時にlocalStorageのトークンを削除', async () => {
      localStorage.setItem('token', 'test-token-123');

      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' };

      await import('@/lib/axios');

      const instance = axios.create.mock.results[0]?.value;
      const errorHandler = instance.interceptors.response.use.mock.calls[0][1];

      const error = { response: { status: 401 } };

      try {
        await errorHandler(error);
      } catch (e) {
        // 401エラーはキャッチされるため、ここで例外が発生することを期待
      }

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');

      window.location = originalLocation;
    });
  });
});