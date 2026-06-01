"use client";

import { useState } from "react";
import EmailVerification from "@/components/auth/EmailVerification";

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
  const [avatar, setAvatar] = useState(initialUser.avatar ?? "");
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
          avatar,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement");
        return;
      }

      setUser(data.user);
      setSuccess("Profil mis à jour");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <EmailVerification
        email={user.email}
        emailVerified={user.emailVerified}
        onVerified={() => setUser((u) => ({ ...u, emailVerified: true }))}
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-800">Informations personnelles</h2>

        <input
          type="text"
          placeholder="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
        />
        <input
          type="email"
          value={user.email}
          disabled
          className="w-full px-4 py-3 border border-gray-100 rounded-lg bg-gray-50 text-gray-500"
        />
        <input
          type="tel"
          placeholder="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
        />
        <input
          type="url"
          placeholder="URL de l'avatar (optionnel)"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
        />
        {showBio && (
          <textarea
            placeholder="Présentation (visible sur votre profil public)"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-emerald-500"
          />
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-emerald-600 text-sm">{success}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 w-fit"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
