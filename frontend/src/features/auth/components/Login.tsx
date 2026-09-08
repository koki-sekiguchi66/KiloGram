/**
 * Login — ログインフォーム
 *
 * トークン永続化の責務は App.tsx に一元化している。
 *   Login は「認証API呼び出し → 成功時にトークンを親に通知」のみ担当。
 *   localStorage への保存は App.tsx が一括管理する。
 *
 * テストが placeholder / role / 文言で要素を特定している。変更するとテストが落ちる:
 *   - "ユーザー名を入力" / "パスワードを入力"
 *   - heading の "ログイン"、button の "ログイン" / "ログイン中"
 */
import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";
import { LogIn, User, Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { GoogleSignInButton } from "./GoogleSignInButton";

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

interface LoginFormData {
  username: string;
  password: string;
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/login/", formData);

      if (response.data.token) {
        // localStorage への保存は App.tsx に委譲
        setMessage("ログインに成功しました！");
        onLoginSuccess(response.data.token);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      console.error("Login error:", err.response?.data);
      setMessage("ログインに失敗しました。ユーザー名またはパスワードを確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  const isSuccess = message.includes("成功");

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setMessage("");
    setIsLoading(true);
    try {
      const { data } = await apiClient.post<{ token: string }>("/auth/google/", { credential });
      onLoginSuccess(data.token);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { link_required?: boolean } } };
      setMessage(err.response?.data?.link_required
        ? "既存アカウントでログインし、設定画面からGoogleアカウントを連携してください。"
        : "Googleログインに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, [onLoginSuccess]);

  return (
    <div>
      <h3 className="font-display mb-6 text-center text-2xl text-foreground">
        ログイン
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-username" className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            ユーザー名
          </Label>
          <Input
            id="login-username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="ユーザー名を入力"
            autoComplete="username"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-password" className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            パスワード
          </Label>
          <Input
            id="login-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="パスワードを入力"
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          variant="brand"
          size="xl"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ログイン中...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              ログイン
            </>
          )}
        </Button>
      </form>

      {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <>
          <div className="my-4 flex items-center gap-3">
            <Separator className="flex-1" /><span className="text-xs text-muted-foreground">または</span><Separator className="flex-1" />
          </div>
          <GoogleSignInButton onCredential={handleGoogleCredential} />
        </>
      )}

      {message && (
        <Alert
          variant={isSuccess ? "success" : "destructive"}
          className="mt-4"
        >
          {isSuccess ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Login;
