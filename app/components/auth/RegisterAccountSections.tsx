"use client";

import {
  IconBriefcase,
  IconBuilding,
  IconUser,
} from "@tabler/icons-react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import MadagascarCitySelect from "@/components/ui/madagascar-city-select";
import { Textarea } from "@/components/ui/textarea";
import { PROVIDER_ADDRESS_MAX_LENGTH } from "@/lib/provider-address";
import { cn } from "@/lib/utils";

export type AccountType = "CLIENT" | "CLIENT_PRO" | "PROVIDER";

const ACCOUNT_TYPES: {
  id: AccountType;
  title: string;
  description: string;
  icon: typeof IconUser;
}[] = [
  {
    id: "CLIENT",
    title: "Particulier",
    description: "Je cherche un prestataire",
    icon: IconUser,
  },
  {
    id: "CLIENT_PRO",
    title: "Entreprise",
    description: "Client professionnel",
    icon: IconBuilding,
  },
  {
    id: "PROVIDER",
    title: "Prestataire",
    description: "Je propose mes services",
    icon: IconBriefcase,
  },
];

export function accountTypeFromSearch(
  type: string | null,
  role: string | null
): AccountType {
  if (type === "pro" || type === "entreprise" || role === "CLIENT_PRO") {
    return "CLIENT_PRO";
  }
  if (role === "PROVIDER") return "PROVIDER";
  return "CLIENT";
}

export function RegisterAccountTypePicker({
  value,
  onChange,
}: {
  value: AccountType;
  onChange: (value: AccountType) => void;
}) {
  return (
    <div className="mb-5 grid grid-cols-3 gap-2">
      {ACCOUNT_TYPES.map((option) => {
        const selected = value === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-colors",
              selected
                ? "border-brand-600 bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
                : "border-border bg-card text-muted-foreground hover:border-brand-200 hover:text-foreground"
            )}
          >
            <Icon size={20} stroke={1.7} aria-hidden />
            <span className="text-xs font-semibold leading-tight">
              {option.title}
            </span>
            <span className="hidden text-[10px] leading-tight sm:block">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function RegisterProIdentityFields({
  companyName,
  nif,
  stat,
  rcs,
  companyAddress,
  onCompanyNameChange,
  onNifChange,
  onStatChange,
  onRcsChange,
  onCompanyAddressChange,
}: {
  companyName: string;
  nif: string;
  stat: string;
  rcs: string;
  companyAddress: string;
  onCompanyNameChange: (value: string) => void;
  onNifChange: (value: string) => void;
  onStatChange: (value: string) => void;
  onRcsChange: (value: string) => void;
  onCompanyAddressChange: (value: string) => void;
}) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Identité de la société
      </p>
      <FormField label="Nom de la société" htmlFor="companyName">
        <Input
          id="companyName"
          type="text"
          placeholder="ex. Société Andry SARL"
          value={companyName}
          onChange={(e) => onCompanyNameChange(e.target.value)}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="NIF" htmlFor="nif" hint="10 chiffres">
          <Input
            id="nif"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="3002064702"
            value={nif}
            onChange={(e) => onNifChange(e.target.value)}
          />
        </FormField>
        <FormField label="STAT" htmlFor="stat" hint="17 chiffres">
          <Input
            id="stat"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="41002 52 2015 0 00152"
            value={stat}
            onChange={(e) => onStatChange(e.target.value)}
          />
        </FormField>
      </div>
      <FormField label="RCS" htmlFor="rcs" hint="Immatriculation au greffe">
        <Input
          id="rcs"
          type="text"
          autoComplete="off"
          placeholder="RCS Antananarivo A 2024 00031"
          value={rcs}
          onChange={(e) => onRcsChange(e.target.value)}
        />
      </FormField>
      <FormField label="Adresse sociale" htmlFor="companyAddress">
        <Textarea
          id="companyAddress"
          rows={3}
          placeholder="Lot, rue, commune — Antananarivo"
          value={companyAddress}
          onChange={(e) => onCompanyAddressChange(e.target.value)}
        />
      </FormField>
    </>
  );
}

export function RegisterIndividualFields({
  name,
  isProvider,
  providerAddress,
  providerCity,
  onNameChange,
  onProviderAddressChange,
  onProviderCityChange,
}: {
  name: string;
  isProvider: boolean;
  providerAddress: string;
  providerCity: string;
  onNameChange: (value: string) => void;
  onProviderAddressChange: (value: string) => void;
  onProviderCityChange: (value: string) => void;
}) {
  return (
    <>
      <FormField label="Nom complet" htmlFor="name">
        <Input
          id="name"
          type="text"
          placeholder="Jean Dupont"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </FormField>
      {isProvider ? (
        <>
          <FormField
            label="Adresse"
            htmlFor="providerAddress"
            hint={`${providerAddress.length}/${PROVIDER_ADDRESS_MAX_LENGTH} caractères — lettres et chiffres`}
          >
            <Input
              id="providerAddress"
              type="text"
              autoComplete="street-address"
              maxLength={PROVIDER_ADDRESS_MAX_LENGTH}
              placeholder="Lot IVG 45 Antanimena"
              value={providerAddress}
              onChange={(e) =>
                onProviderAddressChange(
                  e.target.value
                    .replace(/[^\p{L}\p{N} ]/gu, "")
                    .slice(0, PROVIDER_ADDRESS_MAX_LENGTH)
                )
              }
            />
          </FormField>
          <FormField
            label="Ville"
            htmlFor="providerCity"
            hint="Commune urbaine officielle, identique pour toute la recherche"
          >
            <MadagascarCitySelect
              id="providerCity"
              required
              value={providerCity}
              onChange={onProviderCityChange}
              placeholder="Choisir une ville"
              className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </FormField>
        </>
      ) : null}
    </>
  );
}
