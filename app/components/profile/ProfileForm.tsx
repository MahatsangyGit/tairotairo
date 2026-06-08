"use client";

import { useState } from "react";
import EmailVerification from "@/components/auth/EmailVerification";
import ProfileAvatarUpload from "@/components/profile/ProfileAvatarUpload";

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  emailVerified: boolean;
}

interface ProfileFormProps {
  initialUser: ProfileUser;
  showBio?: boolean;
}

export default function ProfileForm({ initialUser, showBio = false }: ProfileFormProps) {
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name);
  const [phone, setPhone] = useState(initialUser.phone ?? "");
  const [bio, setBio] = useState(initialUser.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          bio: showBio ? bio : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement");
        return;
      }

      setUser(data.user);
      setName(data.user.name);
      setSuccess("Profil mis à jour");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ProfileAvatarUpload
        name={user.name}
        initialAvatar={user.avatar}
        onAvatarChange={(avatar) => setUser((u) => ({ ...u, avatar }))}
      />

      <EmailVerification
        email={user.email}
        emailVerified={user.emailVerified}
        onVerified={() => setUser((u) => ({ ...u, emailVerified: true }))}
      />

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-foreground">Informations personnelles</h2>

        <input
          type="text"
          placeholder="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand-500"
        />
        <input
          type="email"
          value={user.email}
          disabled
          className="w-full px-4 py-3 border border-border rounded-lg bg-muted/40 text-muted-foreground"
        />
        <input
          type="tel"
          placeholder="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand-500"
        />
        {showBio && (
          <textarea
            placeholder="Présentation (visible sur votre profil public)"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg resize-none focus:outline-none focus:border-brand-500"
          />
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-brand-600 text-sm">{success}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 w-fit"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
