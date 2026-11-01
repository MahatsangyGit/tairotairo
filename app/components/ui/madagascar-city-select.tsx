"use client";

import {
  findMadagascarCity,
  madagascarCitiesByRegion,
} from "@/lib/madagascar-cities";

interface MadagascarCitySelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function MadagascarCitySelect({
  id,
  value,
  onChange,
  placeholder = "Choisir une ville",
  required,
  disabled,
  className,
}: MadagascarCitySelectProps) {
  const trimmed = value.trim();
  const isCustomLegacyValue = trimmed !== "" && !findMadagascarCity(trimmed);

  return (
    <select
      id={id}
      required={required}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">{placeholder}</option>
      {isCustomLegacyValue ? <option value={trimmed}>{trimmed}</option> : null}
      {madagascarCitiesByRegion().map((group) => (
        <optgroup key={group.region} label={group.region}>
          {group.cities.map((city) => (
            <option key={city.name} value={city.name}>
              {city.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
