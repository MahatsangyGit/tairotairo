import {
  findMadagascarCity,
  madagascarCitiesByRegion,
} from "@/lib/madagascar-cities";

export default function MadagascarCityOptions({
  currentValue,
}: {
  currentValue?: string;
}) {
  const trimmed = currentValue?.trim() ?? "";
  const isCustomLegacyValue = trimmed !== "" && !findMadagascarCity(trimmed);

  return (
    <>
      {isCustomLegacyValue ? (
        <option value={trimmed}>{trimmed}</option>
      ) : null}
      {madagascarCitiesByRegion().map((group) => (
        <optgroup key={group.region} label={group.region}>
          {group.cities.map((city) => (
            <option key={city.name} value={city.name}>
              {city.name}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
