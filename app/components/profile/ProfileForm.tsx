"use client";

import { useState } from "react";
import EmailVerification from "@/components/auth/EmailVerification";
import ProfileAvatarUpload from "@/components/profile/ProfileAvatarUpload";
import { formatStat } from "@/lib/provider-legal";

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  emailVerified: boolean;
  nif?: string | null;
  stat?: string | null;
  rcs?: string | null;
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
  const [nif, setNif] = useState(initialUser.nif ?? "");
  const [stat, setStat] = useState(
    initialUser.stat ? formatStat(initialUser.stat) : ""
  );
  const [rcs, setRcs] = useState(initialUser.rcs ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const showLegalIds =
    showBio || user.role === "PROVIDER" || user.role === "ADMIN";

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
          ...(showLegalIds
            ? { nif: nif.trim() || null, stat: stat.trim() || null, rcs: rcs.trim() || null }
            : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement");
        return;
      }

      setUser(data.user);
      setName(data.user.name);
      setNif(data.user.nif ?? "");
      setStat(data.user.stat ? formatStat(data.user.stat) : "");
      setRcs(data.user.rcs ?? "");
      setSuccess("Profil mis à jour");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand-500 bg-background";

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
          className={inputClass}
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
          className={inputClass}
        />
        {showBio && (
          <textarea
            placeholder="Présentation (visible sur votre profil public)"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg resize-none focus:outline-none focus:border-brand-500 bg-background"
          />
        )}
      </div>

      {showLegalIds ? (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Optionnel
            </p>
            <h2 className="font-semibold text-foreground mt-1">
              Entreprise individuelle
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Renseignez votre NIF, STAT et RCS pour afficher le badge{" "}
              <span className="font-semibold text-foreground">EI</span> sur
              votre profil public et vos annonces. NIF et STAT apparaissent
              aussi sur vos factures.
            </p>
          </div>

          <label className="block text-sm">
            NIF
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="10 chiffres — ex. 3002064702"
              value={nif}
              onChange={(e) => setNif(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="block text-sm">
            STAT
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="17 chiffres — ex. 41002 52 2015 0 00152"
              value={stat}
              onChange={(e) => setStat(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="block text-sm">
            RCS
            <input
              type="text"
              autoComplete="off"
              placeholder="ex. RCS Antananarivo A 2024 00031"
              value={rcs}
              onChange={(e) => setRcs(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
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
