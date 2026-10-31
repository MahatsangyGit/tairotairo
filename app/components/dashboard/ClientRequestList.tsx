"use client";

import Link from "next/link";
import TimeSlotFields from "@/components/scheduling/TimeSlotFields";
import { formatSchedule } from "@/lib/datetime-slot";
import { MapPinIcon } from "@/components/ui/app-icons";

export interface ClientServiceRequest {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  location: string;
  coverImageMime: string | null;
  coverImageUrl: string | null;
  desiredDate: string | null;
  desiredSlotStart: string | null;
  desiredSlotEnd: string | null;
  open: boolean;
  createdAt: string;
  _count?: { responses: number };
}

export function RequestScheduleFields({
  minDate,
  desiredDate,
  slotEnabled,
  slotStart,
  slotEnd,
  onDesiredDateChange,
  onSlotEnabledChange,
  onSlotStartChange,
  onSlotEndChange,
}: {
  minDate: string;
  desiredDate: string;
  slotEnabled: boolean;
  slotStart: string;
  slotEnd: string;
  onDesiredDateChange: (value: string) => void;
  onSlotEnabledChange: (enabled: boolean) => void;
  onSlotStartChange: (value: string) => void;
  onSlotEndChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        Date souhaitée (optionnel)
      </label>
      <input
        type="date"
        min={minDate}
        value={desiredDate}
        onChange={(e) => onDesiredDateChange(e.target.value)}
        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-amber-500"
      />
      <TimeSlotFields
        variant="amber"
        dateSet={Boolean(desiredDate)}
        enabled={slotEnabled}
        onEnabledChange={onSlotEnabledChange}
        slotStart={slotStart}
        slotEnd={slotEnd}
        onSlotStartChange={onSlotStartChange}
        onSlotEndChange={onSlotEndChange}
      />
    </div>
  );
}

export function ClientRequestCard({
  request,
  onEdit,
  onToggleOpen,
  onDelete,
}: {
  request: ClientServiceRequest;
  onEdit: (request: ClientServiceRequest) => void;
  onToggleOpen: (request: ClientServiceRequest) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <span className="inline-block bg-amber-50 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full mb-2">
            {request.category}
          </span>
          <h3 className="font-semibold text-foreground">{request.title}</h3>
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
            {request.description}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${
            request.open
              ? "bg-brand-50 text-brand-700 border-brand-200"
              : "bg-muted/40 text-muted-foreground border-gray-200"
          }`}
        >
          {request.open ? "Ouverte" : "Fermée"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
        <span className="text-amber-700 font-bold">
          {request.budget.toLocaleString("fr-MG")} Ar
        </span>
        <span>
          <MapPinIcon /> {request.location}
        </span>
        {request.desiredDate && (
          <span>
            📅{" "}
            {formatSchedule(
              request.desiredDate,
              request.desiredSlotStart,
              request.desiredSlotEnd
            )}
          </span>
        )}
        <Link href={`/requests/${request.id}`} className="text-amber-600 hover:underline">
          Voir la fiche publique →
        </Link>
      </div>
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
        <Link
          href={`/dashboard/client/requests/${request.id}`}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-amber-200 text-amber-700 hover:bg-amber-50"
        >
          Propositions
          {(request._count?.responses ?? 0) > 0
            ? ` (${request._count?.responses})`
            : ""}
        </Link>
        <button
          onClick={() => onEdit(request)}
          type="button"
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:border-amber-400"
        >
          Modifier
        </button>
        <button
          onClick={() => onToggleOpen(request)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:border-amber-400"
        >
          {request.open ? "Fermer" : "Rouvrir"}
        </button>
        <button
          onClick={() => onDelete(request.id)}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
