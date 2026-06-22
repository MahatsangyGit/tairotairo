"use client";

import { PostHogProvider as PHProvider, usePostHog } from "@posthog/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { POSTHOG_KEY, posthogOptions } from "@/lib/posthog";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (!pathname || !posthog) return;

    let url = window.location.origin + pathname;
    const query = searchParams.toString();
    if (query) {
      url += `?${query}`;
    }

    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, posthog]);

  return null;
}

function PostHogIdentify() {
  const { user, authChecked } = useAuth();
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog || !authChecked) return;

    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
      return;
    }

    posthog.reset();
  }, [user, authChecked, posthog]);

  return null;
}

export default function PostHogProvider({ children }: { children: ReactNode }) {
  if (!POSTHOG_KEY) {
    return children;
  }

  return (
    <PHProvider apiKey={POSTHOG_KEY} options={posthogOptions}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogIdentify />
      {children}
    </PHProvider>
  );
}
