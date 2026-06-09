"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

const ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

interface ListingCoverFieldProps {
  currentImageUrl?: string | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
  removeExisting: boolean;
  onRemoveExistingChange: (remove: boolean) => void;
}

export default function ListingCoverField({
  currentImageUrl,
  file,
  onFileChange,
  removeExisting,
  onRemoveExistingChange,
}: ListingCoverFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = file ? URL.createObjectURL(file) : null;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayUrl =
    previewUrl ?? (removeExisting ? null : currentImageUrl ?? null);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    e.target.value = "";
    onFileChange(picked);
    if (picked) onRemoveExistingChange(false);
  };

  const handleRemove = () => {
    onFileChange(null);
    if (currentImageUrl) {
      onRemoveExistingChange(true);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">
        Photo (optionnelle, 1 max)
      </label>
      <p className="text-xs text-muted-foreground">
        JPEG, PNG ou WebP — max 3 Mo
      </p>

      {displayUrl ? (
        <div className="flex items-start gap-3">
          <img
            src={displayUrl}
            alt="Aperçu de l'annonce"
            className="w-28 h-28 rounded-xl object-cover border border-border bg-muted"
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Remplacer
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              Supprimer
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={() => inputRef.current?.click()}
        >
          Ajouter une photo
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handlePick}
      />
    </div>
  );
}
