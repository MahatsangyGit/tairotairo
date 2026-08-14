"use client";

import { useState } from "react";
import EmailVerification from "@/components/auth/EmailVerification";
import ProfileAvatarUpload from "@/components/profile/ProfileAvatarUpload";
import { isProfessionalClient } from "@/lib/client-kind";
import { formatMgPhone, formatMgPhoneInput } from "@/lib/phone";
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
  clientKind?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
}

interface ProfileFormProps {
  initialUser: ProfileUser;
  showBio?: boolean;
}

export default function ProfileForm({ initialUser, showBio = false }: ProfileFormProps) {
  const [user, setUser] = useState(initialUser);
  const professional = isProfessionalClient(user);
  const [name, setName] = useState(
    professional ? (initialUser.companyName ?? initialUser.name) : initialUser.name
  );
  const [phone, setPhone] = useState(
    initialUser.phone ? formatMgPhone(initialUser.phone) : ""
  );
  const [bio, setBio] = useState(initialUser.bio ?? "");
  const [companyAddress, setCompanyAddress] = useState(
    initialUser.companyAddress ?? ""
  );
  const [nif, setNif] = useState(initialUser.nif ?? "");
  const [stat, setStat] = useState(
    initialUser.stat ? formatStat(initialUser.stat) : ""
  );
  const [rcs, setRcs] = useState(initialUser.rcs ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const showProviderLegal =
    !professional &&
    (showBio || user.role === "PROVIDER" || user.role === "ADMIN");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          bio: showBio ? bio : undefined,
          ...(professional
            ? {
                companyName: name.trim(),
                companyAddress: companyAddress.trim(),
                nif: nif.trim(),
                stat: stat.trim(),
                rcs: rcs.trim(),
              }
            : {
                name,
                ...(showProviderLegal
                  ? {
                      nif: nif.trim() || null,
                      stat: stat.trim() || null,
                      rcs: rcs.trim() || null,
                    }
                  : {}),
              }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement");
        return;
      }

      setUser(data.user);
      setName(
        isProfessionalClient(data.user)
          ? (data.user.companyName ?? data.user.name)
          : data.user.name
      );
      setCompanyAddress(data.user.companyAddress ?? "");
      setNif(data.user.nif ?? "");
      setStat(data.user.stat ? formatStat(data.user.stat) : "");
      setRcs(data.user.rcs ?? "");
      setPhone(data.user.phone ? formatMgPhone(data.user.phone) : "");
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

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {professional ? "Société" : "Compte"}
          </p>
          <h2 className="mt-1 font-semibold text-foreground">
            {professional ? "Fiche entreprise" : "Informations personnelles"}
          </h2>
          {professional ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Ces informations apparaissent sur vos factures et identifient
              votre société auprès des prestataires.
            </p>
          ) : null}
        </div>

        <label className="block text-sm">
          {professional ? "Nom de la société" : "Nom complet"}
          <input
            type="text"
            placeholder={professional ? "ex. Société Andry SARL" : "Nom complet"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <input
          type="email"
          value={user.email}
          disabled
          className="w-full rounded-lg border border-border bg-muted/40 px-4 py-3 text-muted-foreground"
        />
        <label className="block text-sm">
          Numéro de téléphone
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="032 74 617 90"
            value={phone}
            onChange={(e) => setPhone(formatMgPhoneInput(e.target.value))}
            required
            className={`mt-1 ${inputClass}`}
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Format : 032 74 617 90 — unique, obligatoire
          </span>
        </label>
        {professional ? (
          <label className="block text-sm">
            Adresse sociale
            <textarea
              rows={3}
              placeholder="Lot, rue, commune"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              className={`mt-1 ${inputClass} resize-none`}
            />
          </label>
        ) : null}
        {showBio && (
          <textarea
            placeholder="Présentation (visible sur votre profil public)"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 focus:border-brand-500 focus:outline-none"
          />
        )}
      </div>

      {professional ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Identifiants légaux
            </p>
            <h2 className="mt-1 font-semibold text-foreground">NIF, STAT, RCS</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Obligatoires pour un compte entreprise. Ils figurent sur vos
              factures.
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

      {showProviderLegal ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Optionnel
            </p>
            <h2 className="mt-1 font-semibold text-foreground">
              Entreprise individuelle
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
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
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-brand-600">{success}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-fit rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
