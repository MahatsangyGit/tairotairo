"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { messageFromApiAction } from "@/lib/api-action-error";

export function useListingEditor() {
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  const focusListingForm = useCallback(() => {
    formSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    const titleInput = document.getElementById(
      "listing-title"
    ) as HTMLInputElement | null;
    titleInput?.focus({ preventScroll: true });
  }, []);

  const resetCover = useCallback(() => {
    setCoverFile(null);
    setRemoveCover(false);
    setCurrentCoverUrl(null);
  }, []);

  const reportActionError = useCallback((err: unknown) => {
    const message = messageFromApiAction(err);
    if (message) setActionError(message);
  }, []);

  return {
    actionError,
    setActionError,
    saving,
    setSaving,
    deleteTarget,
    setDeleteTarget,
    coverFile,
    setCoverFile,
    removeCover,
    setRemoveCover,
    currentCoverUrl,
    setCurrentCoverUrl,
    formSectionRef,
    focusListingForm,
    resetCover,
    reportActionError,
  };
}

export function useListingFormFocus(
  showForm: boolean,
  editingId: string | null,
  focusListingForm: () => void
) {
  useEffect(() => {
    if (!showForm) return;
    const id = window.setTimeout(focusListingForm, 50);
    return () => window.clearTimeout(id);
  }, [showForm, editingId, focusListingForm]);
}

export function ListingActionError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
      {message}
    </p>
  );
}

export function ListingListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="bg-card rounded-2xl border border-border p-6 animate-pulse h-32"
        />
      ))}
    </div>
  );
}

export function ListingErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-16">
      <p className="text-red-500 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="text-brand-600 font-medium hover:underline"
      >
        Réessayer
      </button>
    </div>
  );
}

export function ListingEmptyState({
  title,
  hint,
  ctaLabel,
  onCta,
  ctaClassName,
  showCta,
}: {
  title: string;
  hint: string;
  ctaLabel: string;
  onCta: () => void;
  ctaClassName: string;
  showCta: boolean;
}) {
  return (
    <div className="text-center py-16 bg-card rounded-2xl border border-border">
      <p className="text-muted-foreground mb-2">{title}</p>
      <p className="text-muted-foreground text-sm mb-4">{hint}</p>
      {showCta && (
        <button onClick={onCta} className={ctaClassName}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

export function ListingDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmLabel="Supprimer"
      destructive
      onConfirm={onConfirm}
    />
  );
}
