import { useState } from 'react';
import axios from 'axios';

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const API_URL = 'http://127.0.0.1:8000/api/login/';
      const response = await axios.post(API_URL, formData);

      if (response.data.token) {
        // 受け取ったトークンをlocalStorageに保存する
        localStorage.setItem('token', response.data.token);
        setMessage('ログインに成功しました！');
        // 親コンポーネントに成功を通知
        onLoginSuccess(response.data.token);
      }
    } catch (error) {
      console.error('Login error:', error.response?.data);
      setMessage('ログインに失敗しました。ユーザー名またはパスワードを確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>ログイン</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', textAlign: 'left', color: '#555' }}>
            ユーザー名:
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', textAlign: 'left', color: '#555' }}>
            パスワード:
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      {message && (
        <p style={{ 
          marginTop: '15px',
          color: message.includes('成功') ? '#28a745' : '#dc3545',
          fontSize: '14px'
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Login;