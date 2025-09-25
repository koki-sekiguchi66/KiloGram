import { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
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
      const response = await axios.post(API_URL, formData);
      console.log(response.data);
      setMessage('ユーザー登録が成功しました！ログインページに移動します...');
      
      setTimeout(() => {
        onRegisterSuccess();
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error.response?.data);
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
    <>
      <h3 className="text-center mb-4">
        <i className="bi bi-person-plus text-success me-2"></i>
        新規登録
      </h3>
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>
            <i className="bi bi-person me-1"></i>
            ユーザー名
          </Form.Label>
          <Form.Control
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="ユーザー名を入力"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            <i className="bi bi-envelope me-1"></i>
            メールアドレス
          </Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="メールアドレスを入力"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>
            <i className="bi bi-lock me-1"></i>
            パスワード
          </Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="パスワードを入力"
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>
            <i className="bi bi-lock-fill me-1"></i>
            パスワード (確認用)
          </Form.Label>
          <Form.Control
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
            placeholder="パスワードを再入力"
          />
        </Form.Group>

        <div className="d-grid">
          <Button 
            type="submit"
            variant="success"
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
                登録中...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                登録
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