import { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
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

    if (formData.password !== formData.confirm_password) {
      setMessage('パスワードが一致しません。');
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
      setMessage('ユーザー登録が成功しました！');
      // ログインページへリダイレクトするなどの処理
    } catch (error) {
      console.error('Registration error:', error.response.data);
      // バックエンドからのエラーメッセージを表示
      const errorMessages = Object.values(error.response.data).join(' ');
      setMessage(`登録に失敗しました: ${errorMessages}`);
    }
  };

  return (
    <div>
      <h2>ユーザー登録</h2>
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
          <label>メールアドレス:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
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
        <div>
          <label>パスワード (確認用):</label>
          <input
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">登録</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Register;