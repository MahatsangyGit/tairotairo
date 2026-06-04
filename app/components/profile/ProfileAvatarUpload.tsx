"use client";

import { useRef, useState } from "react";
import UserAvatar from "@/components/profile/UserAvatar";

const ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

interface ProfileAvatarUploadProps {
  name: string;
  initialAvatar: string | null;
  onAvatarChange: (avatar: string | null) => void;
}

export default function ProfileAvatarUpload({
  name,
  initialAvatar,
  onAvatarChange,
}: ProfileAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.set("file", file);

    try {
      const res = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Envoi impossible");
        return;
      }

      const next = data.avatar ?? data.user?.avatar ?? null;
      setAvatar(next);
      onAvatarChange(next);
      window.dispatchEvent(
        new CustomEvent("profile-avatar-updated", { detail: { avatar: next } })
      );
      setSuccess("Photo mise à jour");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void uploadFile(file);
  };

  const handleRemove = async () => {
    if (!avatar) return;
    if (!confirm("Supprimer votre photo de profil ?")) return;

    setRemoving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/users/me/avatar", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Suppression impossible");
        return;
      }

      setAvatar(null);
      onAvatarChange(null);
      window.dispatchEvent(
        new CustomEvent("profile-avatar-updated", { detail: { avatar: null } })
      );
      setSuccess("Photo supprimée");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
      <div>
        <h2 className="font-semibold text-gray-800">Photo de profil</h2>
        <p className="text-sm text-gray-500 mt-1">
          Visible sur votre profil public et dans la barre de navigation. JPEG,
          PNG ou WebP — max 2 Mo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <UserAvatar name={name} avatar={avatar} size="xl" />

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleChange}
          />
          <button
            type="button"
            disabled={uploading || removing}
            onClick={() => inputRef.current?.click()}
            className="text-sm border border-brand-200 text-brand-700 px-4 py-2 rounded-lg hover:bg-brand-50 disabled:opacity-50 w-fit"
          >
            {uploading
              ? "Envoi…"
              : avatar
                ? "Changer la photo"
                : "Ajouter une photo"}
          </button>
          {avatar && (
            <button
              type="button"
              disabled={uploading || removing}
              onClick={handleRemove}
              className="text-sm text-red-600 hover:underline disabled:opacity-50 w-fit text-left"
            >
              {removing ? "Suppression…" : "Supprimer la photo"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-brand-600 text-sm">{success}</p>}
    </div>
  );
}
