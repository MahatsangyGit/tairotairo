"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ClientNav from "@/components/layout/ClientNav";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import TimeSlotFields from "@/components/scheduling/TimeSlotFields";
import { formatSchedule } from "@/lib/datetime-slot";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  location: string;
  desiredDate: string | null;
  desiredSlotStart: string | null;
  desiredSlotEnd: string | null;
  open: boolean;
  createdAt: string;
  _count?: { responses: number };
}

interface RequestForm {
  title: string;
  description: string;
  budget: string;
  category: string;
  location: string;
  desiredDate: string;
  slotEnabled: boolean;
  slotStart: string;
  slotEnd: string;
}

const EMPTY_FORM: RequestForm = {
  title: "",
  description: "",
  budget: "",
  category: SERVICE_CATEGORIES[0],
  location: "",
  desiredDate: "",
  slotEnabled: false,
  slotStart: "",
  slotEnd: "",
};

export default function ClientRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/requests?mine=true");
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login?callbackUrl=/dashboard/client/requests");
          return;
        }
        if (res.status === 403) {
          router.push("/dashboard/provider");
          return;
        }
        setError(data.error ?? "Erreur lors du chargement");
        return;
      }

      setRequests(data.requests);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setActionError("");
  };

  const startEdit = (request: ServiceRequest) => {
    setEditingId(request.id);
    setForm({
      title: request.title,
      description: request.description,
      budget: String(request.budget),
      category: request.category,
      location: request.location,
      desiredDate: request.desiredDate
        ? new Date(request.desiredDate).toISOString().split("T")[0]
        : "",
      slotEnabled: Boolean(
        request.desiredSlotStart || request.desiredSlotEnd
      ),
      slotStart: request.desiredSlotStart ?? "",
      slotEnd: request.desiredSlotEnd ?? "",
    });
    setShowForm(true);
    setActionError("");
  };

  const handleSubmit = async () => {
    setActionError("");

    if (!form.title || !form.description || !form.budget || !form.location) {
      setActionError("Titre, description, budget et ville sont obligatoires");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        budget: parseFloat(form.budget),
        category: form.category,
        location: form.location,
        desiredDate: form.desiredDate || null,
        desiredSlotStart:
          form.desiredDate && form.slotEnabled
            ? form.slotStart || null
            : null,
        desiredSlotEnd:
          form.desiredDate && form.slotEnabled
            ? form.slotEnd || null
            : null,
      };

      const res = editingId
        ? await fetch(`/api/requests/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login?callbackUrl=/dashboard/client/requests");
          return;
        }
        setActionError(data.error ?? "Erreur lors de l'enregistrement");
        return;
      }

      if (editingId) {
        setRequests((prev) =>
          prev.map((r) => (r.id === editingId ? data.request : r))
        );
      } else {
        setRequests((prev) => [data.request, ...prev]);
      }

      resetForm();
    } catch {
      setActionError("Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const toggleOpen = async (request: ServiceRequest) => {
    setActionError("");

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open: !request.open }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error ?? "Impossible de modifier le statut");
        return;
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? data.request : r))
      );
    } catch {
      setActionError("Une erreur est survenue");
    }
  };

  const runDelete = async (id: string) => {
    setActionError("");

    try {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error ?? "Impossible de supprimer");
        return;
      }

      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) resetForm();
      setDeleteTarget(null);
    } catch {
      setActionError("Une erreur est survenue");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">Espace client</h1>
          <p className="text-muted-foreground text-sm">
            Publiez une demande pour trouver un prestataire près de chez vous
          </p>
        </div>

        <ClientNav />

        {actionError && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {actionError}
          </p>
        )}

        {!showForm ? (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(EMPTY_FORM);
            }}
            className="mb-6 bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            + Nouvelle demande
          </button>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4">
              {editingId ? "Modifier la demande" : "Nouvelle demande de service"}
            </h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Titre (ex: Réparation robinet qui fuit)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-amber-500"
              />
              <textarea
                placeholder="Décrivez votre besoin en détail"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-amber-500 resize-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Budget proposé (Ar)"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-amber-500"
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-amber-500 bg-card"
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Ville (ex: Antananarivo)"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-amber-500"
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Date souhaitée (optionnel)
                </label>
                <input
                  type="date"
                  min={minDateStr}
                  value={form.desiredDate}
                  onChange={(e) => {
                    const desiredDate = e.target.value;
                    setForm({
                      ...form,
                      desiredDate,
                      ...(desiredDate
                        ? {}
                        : {
                            slotEnabled: false,
                            slotStart: "",
                            slotEnd: "",
                          }),
                    });
                  }}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-amber-500"
                />
                <TimeSlotFields
                  variant="amber"
                  dateSet={Boolean(form.desiredDate)}
                  enabled={form.slotEnabled}
                  onEnabledChange={(slotEnabled) =>
                    setForm({ ...form, slotEnabled })
                  }
                  slotStart={form.slotStart}
                  slotEnd={form.slotEnd}
                  onSlotStartChange={(slotStart) =>
                    setForm({ ...form, slotStart })
                  }
                  onSlotEndChange={(slotEnd) => setForm({ ...form, slotEnd })}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Publier"}
                </button>
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-lg font-medium border border-border text-muted-foreground hover:bg-muted/50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border p-6 animate-pulse h-32"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchRequests}
              className="text-brand-600 font-medium hover:underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground mb-2">Aucune demande publiée</p>
            <p className="text-muted-foreground text-sm mb-4">
              Décrivez votre besoin pour que les prestataires vous contactent
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="text-amber-600 font-medium hover:underline"
              >
                Publier une demande
              </button>
            )}
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="flex flex-col gap-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-card rounded-2xl border border-border shadow-sm p-6"
              >
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
                  <span>📍 {request.location}</span>
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
                  <Link
                    href={`/requests/${request.id}`}
                    className="text-amber-600 hover:underline"
                  >
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
                    onClick={() => startEdit(request)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:border-amber-400"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => toggleOpen(request)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:border-amber-400"
                  >
                    {request.open ? "Fermer" : "Rouvrir"}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(request.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Supprimer la demande"
        description="Supprimer cette demande ?"
        confirmLabel="Supprimer"
        destructive
        onConfirm={() => {
          if (deleteTarget) runDelete(deleteTarget);
        }}
      />
    </div>
  );
}
