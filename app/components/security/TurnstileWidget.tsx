"use client";

import { Turnstile } from "@marsidev/react-turnstile";

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

  if (!siteKey) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <Turnstile
        key={`${action}-${resetKey}`}
        siteKey={siteKey}
        options={{
          action,
          theme: "auto",
          size: "flexible",
        }}
        onSuccess={onTokenChange}
        onExpire={() => onTokenChange(null)}
        onError={() => onTokenChange(null)}
      />
    </div>
  );
}
