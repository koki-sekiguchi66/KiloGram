import { useState, useEffect } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(null);
  const [currentView, setCurrentView] = useState('login'); 

  useEffect(() => {
    // localStorageからトークンをチェック
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleRegisterSuccess = () => {
    // 登録成功後はログイン画面に戻る
    setCurrentView('login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentView('login'); // ログアウト後はログイン画面に戻る
  };

  const switchToRegister = () => {
    setCurrentView('register');
  };

  const switchToLogin = () => {
    setCurrentView('login');
  };

  // 認証済みの場合はダッシュボードを表示
  if (token) {
    return <Dashboard handleLogout={handleLogout} />;
  }

  // 未認証の場合は認証フォームを表示
  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '50px auto', 
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>KiloGram</h1>
      
      {currentView === 'login' ? (
        <div>
          <Login onLoginSuccess={handleLoginSuccess} />
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <p style={{ margin: '0 0 10px 0', color: '#666' }}>
              まだアカウントをお持ちでないですか？
            </p>
            <button 
              onClick={switchToRegister}
              style={{ 
                backgroundColor: '#28a745', 
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              新規登録
            </button>
          </div>
        </div>
      ) : (
        <div>
          <Register onRegisterSuccess={handleRegisterSuccess} />
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <p style={{ margin: '0 0 10px 0', color: '#666' }}>
              すでにアカウントをお持ちですか？
            </p>
            <button 
              onClick={switchToLogin}
              style={{ 
                backgroundColor: '#007bff', 
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ログイン
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;