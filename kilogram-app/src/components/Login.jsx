import { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const API_URL = 'http://127.0.0.1:8000/api/login/';
      const response = await axios.post(API_URL, formData);

      if (response.data.token) {
        // 受け取ったトークンをlocalStorageに保存する
        localStorage.setItem('token', response.data.token);
        setMessage('ログインに成功しました！');
        onLoginSuccess(response.data.token)
      }
    } catch (error) {
      console.error('Login error:', error.response.data);
      setMessage('ログインに失敗しました。ユーザー名かパスワードを確認してください。');
    }
  };

  return (
    <div>
      <h2>ログイン</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>ユーザー名:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>パスワード:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">ログイン</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;