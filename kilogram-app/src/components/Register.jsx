import { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import apiClient from '../api/axiosConfig';

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

    // パスワード一致チェック（フロントエンド側でも確認）
    if (formData.password !== formData.confirm_password) {
      setMessage('パスワードが一致しません。');
      return;
    }

    // パスワードの長さチェック
    if (formData.password.length < 8) {
      setMessage('パスワードは8文字以上で入力してください。');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/register/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
      });
      setMessage('アカウントの作成に成功しました！');
      onRegisterSuccess();
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      
      // エラーメッセージの詳細表示
      if (error.response?.data) {
        const errors = error.response.data;
        if (errors.username) {
          setMessage(`ユーザー名: ${errors.username[0]}`);
        } else if (errors.password) {
          setMessage(`パスワード: ${errors.password[0]}`);
        } else if (errors.confirm_password) {
          setMessage(`確認パスワード: ${errors.confirm_password[0]}`);
        } else if (errors.non_field_errors) {
          setMessage(errors.non_field_errors[0]);
        } else {
          setMessage('アカウントの作成に失敗しました。入力内容を確認してください。');
        }
      } else {
        setMessage('アカウントの作成に失敗しました。入力内容を確認してください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h3 className="text-center mb-4">
        <i className="bi bi-person-plus text-primary me-2"></i>
        アカウント作成
      </h3>
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>
            ユーザー名
          </Form.Label>
          <Form.Control
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="ユーザー名を入力"
            autoComplete="username"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            メールアドレス
          </Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="メールアドレスを入力"
            autoComplete="email"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            パスワード
          </Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="パスワードを入力"
            autoComplete="new-password"
            minLength={8}
          />
          <Form.Text className="text-muted">
            8文字以上で入力してください
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>
            パスワード（確認）
          </Form.Label>
          <Form.Control
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
            placeholder="パスワードを再入力"
            autoComplete="new-password"
            minLength={8}
          />
        </Form.Group>

        <div className="d-grid">
          <Button 
            type="submit" 
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  className="me-2"
                />
                作成中...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                アカウントを作成
              </>
            )}
          </Button>
        </div>
      </Form>

      {message && (
        <Alert 
          variant={message.includes('成功') ? 'success' : 'danger'} 
          className="mt-3"
        >
          <i className={`bi ${message.includes('成功') ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
          {message}
        </Alert>
      )}
    </>
  );
};

export default Register;