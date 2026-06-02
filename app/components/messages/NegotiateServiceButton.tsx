"use client";

import { useEffect, useState } from "react";
import OpenUserChatButton from "./OpenUserChatButton";

interface NegotiateServiceButtonProps {
  serviceId: string;
  className?: string;
}

export default function NegotiateServiceButton({
  serviceId,
  className,
}: NegotiateServiceButtonProps) {
  const [canNegotiate, setCanNegotiate] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setCanNegotiate(d.user?.role === "CLIENT");
      })
      .finally(() => setChecked(true));
  }, []);

  if (!checked || !canNegotiate) return null;

  return (
    <OpenUserChatButton
      serviceId={serviceId}
      label="Marchander le prix"
      className={
        className ||
        "w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
      }
    />
  );
}
