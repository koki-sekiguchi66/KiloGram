/**
 * ProfileSection — プロフィール表示セクション
 *
 * /api/profile/ から取得した username / email を表示する。
 * 読み取り専用。編集機能は将来実装。
 *
 * 3状態: loading → success | error
 */
import { useCallback, useState } from "react";
import { Loader2, RefreshCw, Unlink } from "lucide-react";
import { Section } from "@/components/layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useProfile } from "../hooks/useProfile";
import { GoogleSignInButton } from "@/features/auth";
import { apiClient } from "@/lib/axios";

export function ProfileSection() {
  const { profile, loading, error, refetch } = useProfile();
  const [googleMessage, setGoogleMessage] = useState<string | null>(null);
  const linkGoogle = useCallback(async (credential: string) => {
    try {
      await apiClient.post("/auth/google/link/", { credential });
      setGoogleMessage("Googleアカウントを連携しました。");
      refetch();
    } catch {
      setGoogleMessage("Googleアカウントを連携できませんでした。");
    }
  }, [refetch]);
  const unlinkGoogle = async () => {
    try {
      await apiClient.delete("/auth/google/link/");
      setGoogleMessage("Googleアカウントの連携を解除しました。");
      refetch();
    } catch {
      setGoogleMessage("Googleアカウントの連携を解除できませんでした。");
    }
  };

  return (
    <Section bare title="プロフィール">
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className="mr-1 h-3 w-3" />
              再試行
            </Button>
          </div>
        ) : profile ? (
          <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{profile.username}</p>
              {profile.email && (
                <p className="text-xs text-muted-foreground truncate">
                  {profile.email}
                </p>
              )}
            </div>
          </div>
          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-sm font-medium">Googleアカウント</p>
              {profile.google_linked ? (
                profile.can_unlink_google ? (
                  <Button variant="outline" size="sm" onClick={unlinkGoogle}>
                    <Unlink className="mr-2 h-4 w-4" />連携を解除
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Googleログインが唯一のログイン方法のため連携中です。
                  </p>
                )
              ) : <GoogleSignInButton onCredential={linkGoogle} text="continue_with" />}
              {googleMessage && <p className="mt-2 text-xs text-muted-foreground">{googleMessage}</p>}
            </div>
          )}
          </div>
        ) : null}
      </div>
    </Section>
  );
}
