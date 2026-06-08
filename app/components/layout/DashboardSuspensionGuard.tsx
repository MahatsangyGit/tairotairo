"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardSuspensionGuard() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 403 && data.suspended) {
          router.replace("/auth/login?suspended=1");
          router.refresh();
        }
      })
      .catch(() => {});
  }, [router]);

  return null;
}
