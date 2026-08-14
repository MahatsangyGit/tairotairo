"use client";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { formatMgPhoneInput } from "@/lib/phone";
import { cn } from "@/lib/utils";

export default function PhoneField({
  id = "phone",
  value,
  onChange,
  className,
  native = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  native?: boolean;
}) {
  const input = (
    <Input
      id={id}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder="032 74 617 90"
      value={value}
      onChange={(e) => onChange(formatMgPhoneInput(e.target.value))}
      className={cn(native && className)}
      required
    />
  );

  if (native) {
    return (
      <label className="block text-sm">
        Numéro de téléphone
        <span className="mt-1 block">{input}</span>
      </label>
    );
  }

  return (
    <FormField
      label="Numéro de téléphone"
      htmlFor={id}
      hint="Format : 032 74 617 90 — unique, obligatoire"
    >
      {input}
    </FormField>
  );
}
