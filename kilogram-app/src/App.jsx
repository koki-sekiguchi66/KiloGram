import { useState, useEffect } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // アプリケーションの読み込み時にlocalStorageからトークンをチェック
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  // ログイン前の認証フォーム
  const AuthForms = () => (
    <div style={{ display: 'flex', gap: '50px' }}>
      <Register />
      <Login onLoginSuccess={handleLoginSuccess} />
    </div>
  );

  return (
    <div>
      <h1>KiloGram</h1>
      <hr />
      {token ? (
        <Dashboard handleLogout={handleLogout} />
      ) : (
        <AuthForms />
      )}
    </div>
  );
}

export default App;