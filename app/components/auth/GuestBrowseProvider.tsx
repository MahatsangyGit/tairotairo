"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import JoinUsModal from "@/components/auth/JoinUsModal";
import {
  GUEST_BROWSE_DESTINATIONS,
  isGuestBrowseIntent,
  type GuestBrowseIntent,
} from "@/lib/guest-browse";

type GuestBrowseContextValue = {
  openJoinModal: (intent: GuestBrowseIntent) => void;
  navigateBrowse: (intent: GuestBrowseIntent, href?: string) => void;
};

const GuestBrowseContext = createContext<GuestBrowseContextValue | null>(null);

export function useGuestBrowse(): GuestBrowseContextValue {
  const context = useContext(GuestBrowseContext);
  if (!context) {
    throw new Error("useGuestBrowse must be used within GuestBrowseProvider");
  }
  return context;
}

export function GuestBrowseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<GuestBrowseIntent>("services");

  const openJoinModal = useCallback((nextIntent: GuestBrowseIntent) => {
    setIntent(nextIntent);
    setOpen(true);
  }, []);

  const navigateBrowse = useCallback(
    (nextIntent: GuestBrowseIntent, href?: string) => {
      const destination = href ?? GUEST_BROWSE_DESTINATIONS[nextIntent];
      router.push(destination);
    },
    [router]
  );

  useEffect(() => {
    const join = searchParams.get("join");
    if (!isGuestBrowseIntent(join)) return;

    openJoinModal(join);
    router.replace("/", { scroll: false });
  }, [openJoinModal, router, searchParams]);

  const value = useMemo(
    () => ({ openJoinModal, navigateBrowse }),
    [navigateBrowse, openJoinModal]
  );

  return (
    <GuestBrowseContext.Provider value={value}>
      {children}
      <JoinUsModal open={open} onOpenChange={setOpen} intent={intent} />
    </GuestBrowseContext.Provider>
  );
}
