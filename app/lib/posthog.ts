import type { PostHogConfig } from "posthog-js";

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export const POSTHOG_API_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export const POSTHOG_UI_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://eu.posthog.com";

export function getPostHogAssetsHost(apiHost: string): string {
  return apiHost
    .replace("://eu.i.", "://eu-assets.i.")
    .replace("://us.i.", "://us-assets.i.");
}

export const posthogOptions: Partial<PostHogConfig> = {
  api_host: "/ingest",
  ui_host: POSTHOG_UI_HOST,
  person_profiles: "identified_only",
  capture_pageview: false,
  capture_pageleave: true,
};

export const PostHogEvents = {
  USER_SIGNED_UP: "user_signed_up",
  USER_LOGGED_IN: "user_logged_in",
} as const;
