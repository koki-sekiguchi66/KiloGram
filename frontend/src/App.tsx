import { useState, useEffect } from "react";
import { HeartPulse, UserPlus, LogIn } from "lucide-react";
import { Login, Register } from "@/features/auth";
import { Dashboard } from "@/features/dashboard";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";

type AuthView = "login" | "register";

const TOKEN_STORAGE_KEY = "token";

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AuthView>("login");

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
  };

  const handleRegisterSuccess = (tokenOrNull: string | null) => {
    if (tokenOrNull) {
      localStorage.setItem(TOKEN_STORAGE_KEY, tokenOrNull);
      setToken(tokenOrNull);
    } else {
      setCurrentView("login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setCurrentView("login");
  };

  const switchToRegister = () => setCurrentView("register");
  const switchToLogin = () => setCurrentView("login");

  if (token) {
    return (
      <>
        <Dashboard handleLogout={handleLogout} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="bg-aura flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="flex items-center justify-center gap-2 text-4xl font-bold tracking-tight">
            <HeartPulse className="h-8 w-8 text-primary" />
            <span className="text-primary">Dish</span>
            <span className="text-foreground">Board</span>
          </h1>
          <p className="font-display mt-3 text-sm text-muted-foreground">
            食で、いい一日をつくる。
          </p>
        </div>

        {currentView === "login" ? (
          <>
            <Login onLoginSuccess={handleLoginSuccess} />

            <Separator className="my-8 bg-border/40" />

            <div className="text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                まだアカウントをお持ちでないですか？
              </p>
              <button
                onClick={switchToRegister}
                className="inline-flex items-center gap-2 text-sm text-foreground transition-opacity hover:opacity-70"
              >
                <UserPlus className="h-4 w-4" />
                新規登録
              </button>
            </div>
          </>
        ) : (
          <>
            <Register onRegisterSuccess={handleRegisterSuccess} />

            <Separator className="my-8 bg-border/40" />

            <div className="text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                すでにアカウントをお持ちですか？
              </p>
              <button
                onClick={switchToLogin}
                className="inline-flex items-center gap-2 text-sm text-foreground transition-opacity hover:opacity-70"
              >
                <LogIn className="h-4 w-4" />
                ログイン
              </button>
            </div>
          </>
        )}
      </div>

      <Toaster />
    </div>
  );
}

export default App;
