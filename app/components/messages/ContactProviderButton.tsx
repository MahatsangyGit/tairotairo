"use client";

import { useEffect, useState } from "react";
import OpenUserChatButton from "./OpenUserChatButton";

interface ContactProviderButtonProps {
  providerId: string;
  className?: string;
}

export default function ContactProviderButton({
  providerId,
  className,
}: ContactProviderButtonProps) {
  const [canContact, setCanContact] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setCanContact(d.user?.role === "CLIENT");
      })
      .finally(() => setChecked(true));
  }, []);

  if (!checked || !canContact) return null;

  return (
    <OpenUserChatButton
      providerId={providerId}
      label="Contacter"
      className={
        className ||
        "inline-flex items-center justify-center bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
      }
    />
  );
}
