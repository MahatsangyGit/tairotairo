"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import TimeSlotFields from "@/components/scheduling/TimeSlotFields";
import { formatSchedule } from "@/lib/datetime-slot";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MapPinIcon } from "@/components/ui/app-icons";
import ListingFormFields from "@/components/listings/ListingFormFields";
import { syncListingCover } from "@/lib/listing-cover-sync";
import { useListingCrud } from "@/hooks/useListingCrud";
import { apiFetch, apiFetchJson, ApiClientError } from "@/lib/api-client";

interface ServiceRequest {
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

  const {
    items: requests,
    setItems: setRequests,
    loading,
    error,
    fetchList: fetchRequests,
    showForm,
    setShowForm,
    editingId,
    setEditingId,
  } = useListingCrud<ServiceRequest>({
    listUrl: "/api/requests?mine=true",
    listKey: "requests",
    router,
    loginPath: "/auth/login?callbackUrl=/dashboard/client/requests",
    forbiddenRedirect: "/dashboard/provider",
  });

  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  const focusListingForm = useCallback(() => {
    formSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    const titleInput = document.getElementById(
      "listing-title"
    ) as HTMLInputElement | null;
    titleInput?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const id = window.setTimeout(focusListingForm, 50);
    return () => window.clearTimeout(id);
  }, [showForm, editingId, focusListingForm]);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setActionError("");
    setCoverFile(null);
    setRemoveCover(false);
    setCurrentCoverUrl(null);
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
    setCoverFile(null);
    setRemoveCover(false);
    setCurrentCoverUrl(request.coverImageUrl);
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

      const data = editingId
        ? await apiFetchJson<{ request: ServiceRequest }>(
            `/api/requests/${editingId}`,
            { method: "PATCH", body: payload, router, loginPath: "/auth/login?callbackUrl=/dashboard/client/requests" }
          )
        : await apiFetchJson<{ request: ServiceRequest }>("/api/requests", {
            method: "POST",
            body: payload,
            router,
            loginPath: "/auth/login?callbackUrl=/dashboard/client/requests",
          });

      const savedId = editingId ?? data.request.id;
      const coverSync = await syncListingCover("request", savedId, {
        file: coverFile,
        removeExisting: removeCover,
      });

      if (!coverSync.ok) {
        setActionError(
          editingId
            ? `Demande enregistrée, mais photo : ${coverSync.error}`
            : coverSync.error
        );
      }

      try {
        const refreshData = await apiFetch<{ requests: ServiceRequest[] }>(
          "/api/requests?mine=true",
          {
            router,
            loginPath: "/auth/login?callbackUrl=/dashboard/client/requests",
          }
        );
        setRequests(refreshData.requests);
      } catch {
        if (editingId) {
          setRequests((prev) =>
            prev.map((r) => (r.id === editingId ? data.request : r))
          );
        } else {
          setRequests((prev) => [data.request, ...prev]);
        }
      }

      if (coverSync.ok) resetForm();
    } catch (err) {
      if (err instanceof ApiClientError && err.status !== 401) {
        setActionError(err.message);
      } else if (!(err instanceof ApiClientError)) {
        setActionError("Une erreur est survenue");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleOpen = async (request: ServiceRequest) => {
    setActionError("");

    try {
      const data = await apiFetchJson<{ request: ServiceRequest }>(
        `/api/requests/${request.id}`,
        {
          method: "PATCH",
          body: { open: !request.open },
          router,
          loginPath: "/auth/login?callbackUrl=/dashboard/client/requests",
        }
      );

      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? data.request : r))
      );
    } catch (err) {
      if (err instanceof ApiClientError && err.status !== 401) {
        setActionError(err.message);
      } else if (!(err instanceof ApiClientError)) {
        setActionError("Une erreur est survenue");
      }
    }
  };

  const runDelete = async (id: string) => {
    setActionError("");

    try {
      await apiFetchJson(`/api/requests/${id}`, {
        method: "DELETE",
        router,
        loginPath: "/auth/login?callbackUrl=/dashboard/client/requests",
      });

      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) resetForm();
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status !== 401) {
        setActionError(err.message);
      } else if (!(err instanceof ApiClientError)) {
        setActionError("Une erreur est survenue");
      }
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">Espace client</h1>
          <p className="text-muted-foreground text-sm">
            Publiez une demande pour trouver un prestataire près de chez vous
          </p>
        </div>

        {actionError && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {actionError}
          </p>
        )}

        {!showForm ? (
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(EMPTY_FORM);
              setCoverFile(null);
              setRemoveCover(false);
              setCurrentCoverUrl(null);
            }}
            className="mb-6 bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            + Nouvelle demande
          </button>
        ) : (
          <div
            ref={formSectionRef}
            id="listing-form"
            className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6 scroll-mt-24"
          >
            <h2 className="font-semibold text-foreground mb-4">
              {editingId ? "Modifier la demande" : "Nouvelle demande de service"}
            </h2>
            <div className="flex flex-col gap-3">
              <ListingFormFields
                kind="request"
                form={{
                  title: form.title,
                  description: form.description,
                  amount: form.budget,
                  category: form.category,
                  location: form.location,
                }}
                onChange={(next) =>
                  setForm({
                    ...form,
                    title: next.title,
                    description: next.description,
                    budget: next.amount,
                    category: next.category,
                    location: next.location,
                  })
                }
                categories={SERVICE_CATEGORIES}
                currentCoverUrl={currentCoverUrl}
                coverFile={coverFile}
                onCoverFileChange={setCoverFile}
                removeCover={removeCover}
                onRemoveCoverChange={setRemoveCover}
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
              onClick={() => fetchRequests()}
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
                  <span><MapPinIcon /> {request.location}</span>
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
                    type="button"
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
    </>
  );
}
