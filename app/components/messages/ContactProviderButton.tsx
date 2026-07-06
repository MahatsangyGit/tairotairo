"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import OpenUserChatButton from "./OpenUserChatButton";

interface ContactProviderButtonProps {
  providerId: string;
  className?: string;
}

export default function ContactProviderButton({
  providerId,
  className,
}: ContactProviderButtonProps) {
  const { user, authChecked } = useAuth();

  if (!authChecked || user?.role !== "CLIENT") return null;

  return (
    <OpenUserChatButton
      providerId={providerId}
      label="Contacter"
      className={
        className ||
        "inline-flex items-center justify-center bg-brand-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50"
      }
    />
  );
}
