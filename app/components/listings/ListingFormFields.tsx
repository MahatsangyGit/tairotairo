"use client";

import ListingCoverField from "@/components/listings/ListingCoverField";

export interface ListingFormValues {
  title: string;
  description: string;
  amount: string;
  category: string;
  location: string;
}

interface ListingFormFieldsProps {
  kind: "service" | "request";
  form: ListingFormValues;
  onChange: (form: ListingFormValues) => void;
  categories: readonly string[];
  currentCoverUrl: string | null;
  coverFile: File | null;
  onCoverFileChange: (file: File | null) => void;
  removeCover: boolean;
  onRemoveCoverChange: (remove: boolean) => void;
}

const inputClass =
  "w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand-500";

export default function ListingFormFields({
  kind,
  form,
  onChange,
  categories,
  currentCoverUrl,
  coverFile,
  onCoverFileChange,
  removeCover,
  onRemoveCoverChange,
}: ListingFormFieldsProps) {
  const amountLabel = kind === "service" ? "Prix (Ar)" : "Budget proposé (Ar)";
  const titlePlaceholder =
    kind === "service"
      ? "Titre (ex: Réparation fuite d'eau)"
      : "Titre (ex: Réparation robinet qui fuit)";
  const descriptionPlaceholder =
    kind === "service" ? "Description détaillée" : "Décrivez votre besoin en détail";

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor="listing-title" className="sr-only">
          Titre
        </label>
        <input
          id="listing-title"
          type="text"
          placeholder={titlePlaceholder}
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="listing-description" className="sr-only">
          Description
        </label>
        <textarea
          id="listing-description"
          placeholder={descriptionPlaceholder}
          rows={4}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          className={`${inputClass} resize-none`}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="listing-amount" className="sr-only">
            {amountLabel}
          </label>
          <input
            id="listing-amount"
            type="number"
            min="0"
            placeholder={amountLabel}
            value={form.amount}
            onChange={(e) => onChange({ ...form, amount: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="listing-category" className="sr-only">
            Catégorie
          </label>
          <select
            id="listing-category"
            value={form.category}
            onChange={(e) => onChange({ ...form, category: e.target.value })}
            className={`${inputClass} bg-card`}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="listing-location" className="sr-only">
          Ville
        </label>
        <input
          id="listing-location"
          type="text"
          placeholder="Ville (ex: Antananarivo)"
          value={form.location}
          onChange={(e) => onChange({ ...form, location: e.target.value })}
          className={inputClass}
        />
      </div>
      <ListingCoverField
        currentImageUrl={currentCoverUrl}
        file={coverFile}
        onFileChange={onCoverFileChange}
        removeExisting={removeCover}
        onRemoveExistingChange={onRemoveCoverChange}
      />
    </div>
  );
}
