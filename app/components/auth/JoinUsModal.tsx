"use client";

import Link from "next/link";
import { User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  GUEST_BROWSE_DESTINATIONS,
  type GuestBrowseIntent,
} from "@/lib/guest-browse";

type JoinUsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent: GuestBrowseIntent;
};

export default function JoinUsModal({
  open,
  onOpenChange,
  intent,
}: JoinUsModalProps) {
  const callbackUrl = encodeURIComponent(GUEST_BROWSE_DESTINATIONS[intent]);
  const registerHref = `/auth/register?callbackUrl=${callbackUrl}`;
  const loginHref = `/auth/login?callbackUrl=${callbackUrl}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md px-8 py-10 text-center sm:max-w-md">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Fermer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path
              d="M4 4l10 10M14 4L4 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <AlertDialogHeader className="place-items-center text-center sm:place-items-center sm:text-center">
          <AlertDialogTitle className="text-2xl font-bold text-foreground">
            Rejoignez-nous !
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Les habitants et professionnels de votre quartier répondent à tous
            vos besoins.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-4">
          <Link
            href={registerHref}
            onClick={() => onOpenChange(false)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-foreground/20 bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
          >
            <User className="size-4 shrink-0" aria-hidden />
            M&apos;inscrire avec un e-mail
          </Link>

          <p className="text-sm text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link
              href={loginHref}
              onClick={() => onOpenChange(false)}
              className="font-medium text-foreground underline underline-offset-2 hover:text-brand-600"
            >
              Me connecter
            </Link>
          </p>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
