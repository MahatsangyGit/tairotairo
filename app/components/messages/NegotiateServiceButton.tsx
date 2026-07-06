"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import OpenUserChatButton from "./OpenUserChatButton";

interface NegotiateServiceButtonProps {
  serviceId: string;
  className?: string;
}

export default function NegotiateServiceButton({
  serviceId,
  className,
}: NegotiateServiceButtonProps) {
  const { user, authChecked } = useAuth();

  if (!authChecked || user?.role !== "CLIENT") return null;

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
