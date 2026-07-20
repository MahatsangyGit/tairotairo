"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function HomeGuestOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  return user ? null : children;
}
