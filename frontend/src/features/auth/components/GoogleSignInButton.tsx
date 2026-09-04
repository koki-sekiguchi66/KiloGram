import { useEffect, useRef, useState } from "react";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
  renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number; text: string }) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  text?: "signin_with" | "continue_with";
}

const GOOGLE_SCRIPT_ID = "google-identity-services";

/** Google公式ボタンを描画する。client ID未設定時は何も表示しない。 */
export function GoogleSignInButton({ onCredential, text = "signin_with" }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(Boolean(window.google));
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || window.google) {
      setScriptReady(Boolean(window.google));
      return;
    }
    let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const ready = () => setScriptReady(true);
    script.addEventListener("load", ready);
    return () => script?.removeEventListener("load", ready);
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !scriptReady || !window.google || !containerRef.current) return;
    const container = containerRef.current;
    container.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => onCredential(credential),
    });
    window.google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      width: Math.min(container.clientWidth || 320, 360),
      text,
    });
  }, [clientId, onCredential, scriptReady, text]);

  if (!clientId) return null;
  return <div ref={containerRef} className="flex min-h-10 w-full justify-center" />;
}
