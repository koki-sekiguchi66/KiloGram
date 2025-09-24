import { useState } from 'react';
import axios from 'axios';

const Register = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
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

    if (formData.password !== formData.confirm_password) {
      setMessage('パスワードが一致しません。');
      setIsLoading(false);
      return;
    }

    try {
      const API_URL = 'http://127.0.0.1:8000/api/register/';
      const dataToSend = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
      };

      const response = await axios.post(API_URL, dataToSend);
      console.log(response.data);
      setMessage('ユーザー登録が成功しました！ログインページに移動します...');
      
      // 成功メッセージを少し表示してからログインページに移動
      setTimeout(() => {
        onRegisterSuccess();
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      // バックエンドからのエラーメッセージを表示
      if (error.response?.data) {
        const errorMessages = Object.values(error.response.data).join(' ');
        setMessage(`登録に失敗しました: ${errorMessages}`);
      } else {
        setMessage('登録に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>新規登録</h2>
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
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', textAlign: 'left', color: '#555' }}>
            メールアドレス:
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
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
        <div style={{ marginBottom: '15px' }}>
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
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', textAlign: 'left', color: '#555' }}>
            パスワード (確認用):
          </label>
          <input
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
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
            backgroundColor: isLoading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '登録中...' : '登録'}
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

export default Register;