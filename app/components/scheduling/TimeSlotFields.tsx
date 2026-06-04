"use client";

interface TimeSlotFieldsProps {
  dateSet: boolean;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  slotStart: string;
  slotEnd: string;
  onSlotStartChange: (value: string) => void;
  onSlotEndChange: (value: string) => void;
  variant?: "brand" | "amber";
}

export default function TimeSlotFields({
  dateSet,
  enabled,
  onEnabledChange,
  slotStart,
  slotEnd,
  onSlotStartChange,
  onSlotEndChange,
  variant = "brand",
}: TimeSlotFieldsProps) {
  const focusClass =
    variant === "amber"
      ? "focus:border-amber-500"
      : "focus:border-brand-500";
  const accentClass =
    variant === "amber" ? "text-amber-600" : "text-brand-600";

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          disabled={!dateSet}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className={`w-4 h-4 rounded border-gray-300 ${accentClass}`}
        />
        <span className="text-sm text-gray-700">
          Préciser un créneau horaire (optionnel)
        </span>
      </label>

      {!dateSet && (
        <p className="text-xs text-gray-400">
          Sélectionnez d&apos;abord une date pour activer le créneau.
        </p>
      )}

      {enabled && dateSet && (
        <div className="grid grid-cols-2 gap-3 pl-0 sm:pl-6">
          <label className="block">
            <span className="text-xs font-medium text-gray-600 mb-1 block">
              Début
            </span>
            <input
              type="time"
              value={slotStart}
              onChange={(e) => onSlotStartChange(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none ${focusClass}`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-600 mb-1 block">
              Fin (optionnel)
            </span>
            <input
              type="time"
              value={slotEnd}
              onChange={(e) => onSlotEndChange(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none ${focusClass}`}
            />
          </label>
        </div>
      )}
    </div>
  );
}
