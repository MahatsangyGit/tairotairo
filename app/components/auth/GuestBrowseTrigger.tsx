"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useGuestBrowse } from "@/components/auth/GuestBrowseProvider";
import {
  GUEST_BROWSE_DESTINATIONS,
  type GuestBrowseIntent,
} from "@/lib/guest-browse";
import { cn } from "@/lib/utils";

type GuestBrowseTriggerProps = {
  browse: GuestBrowseIntent;
  href?: string;
  className?: string;
  children: React.ReactNode;
  onActivate?: () => void;
};

export default function GuestBrowseTrigger({
  browse,
  href,
  className,
  children,
  onActivate,
}: GuestBrowseTriggerProps) {
  const { user, authChecked } = useAuth();
  const { openJoinModal, navigateBrowse } = useGuestBrowse();
  const [hydrated, setHydrated] = useState(false);
  const destination = href ?? GUEST_BROWSE_DESTINATIONS[browse];

  useEffect(() => {
    setHydrated(true);
  }, []);

  const showAsLink = hydrated && authChecked && Boolean(user);

  if (showAsLink) {
    return (
      <Link href={destination} className={className} onClick={onActivate}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(className)}
      onClick={() => {
        onActivate?.();
        if (user) {
          navigateBrowse(browse, destination);
          return;
        }
        openJoinModal(browse);
      }}
    >
      {children}
    </button>
  );
}
