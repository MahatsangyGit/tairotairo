"use client";

import { useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { isEmbeddedIdeBrowser } from "@/lib/embedded-browser";
import { isTurnstileClientEnabled } from "@/lib/turnstile-config";

type TurnstileWidgetProps = {
  action: "login" | "register" | "forgot_password";
  onTokenChange: (token: string | null) => void;
  resetKey?: number;
};

export default function TurnstileWidget({
  action,
  onTokenChange,
  resetKey = 0,
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [embeddedBrowser, setEmbeddedBrowser] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setEmbeddedBrowser(isEmbeddedIdeBrowser());
  }, []);

  if (!isTurnstileClientEnabled() || !siteKey) {
    return null;
  }

  const showEmbeddedHint =
    process.env.NODE_ENV === "development" && (embeddedBrowser || loadFailed);

  return (
    <div className="flex flex-col items-center gap-2">
      {showEmbeddedHint && (
        <p
          className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          Le captcha Cloudflare ne fonctionne pas dans le navigateur intégré de
          Cursor (moteur Electron). Ouvrez cette page dans Chrome, Safari ou
          Firefox pour tester la connexion.
        </p>
      )}
      <div className="flex justify-center">
        <Turnstile
          key={`${action}-${resetKey}`}
          siteKey={siteKey}
          options={{
            action,
            theme: "auto",
            size: "flexible",
          }}
          onSuccess={(token) => {
            setLoadFailed(false);
            onTokenChange(token);
          }}
          onExpire={() => onTokenChange(null)}
          onError={() => {
            setLoadFailed(true);
            onTokenChange(null);
          }}
        />
      </div>
    </div>
  );
}
