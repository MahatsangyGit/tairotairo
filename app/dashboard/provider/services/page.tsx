"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ProviderNav from "@/components/layout/ProviderNav";
import ProviderKycBanner from "@/components/kyc/ProviderKycBanner";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { SUBSCRIPTION_PERIOD_DAYS } from "@/lib/subscription";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import ListingCoverField from "@/components/listings/ListingCoverField";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { syncListingCover } from "@/lib/listing-cover-sync";
import { MapPinIcon } from "@/components/ui/app-icons";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  coverImageMime: string | null;
  coverImageUrl: string | null;
  available: boolean;
  featuredOnHomepage: boolean;
  createdAt: string;
}

interface SpotlightState {
  providerFeatured: boolean;
  canFeature: boolean;
  featuredService: { id: string; title: string } | null;
}

type SubscriptionState = {
  expiresAt: string;
  isActive: boolean;
} | null;

interface ServiceForm {
  title: string;
  description: string;
  price: string;
  category: string;
  location: string;
}

const EMPTY_FORM: ServiceForm = {
  title: "",
  description: "",
  price: "",
  category: SERVICE_CATEGORIES[0],
  location: "",
};

export default function ProviderServicesPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionState>(null);
  const [spotlight, setSpotlight] = useState<SpotlightState | null>(null);
  const [spotlightBusyId, setSpotlightBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/services?mine=true");
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        if (res.status === 403) {
          router.push("/dashboard/client");
          return;
        }
        setError(data.error ?? "Erreur lors du chargement");
        return;
      }

      setServices(data.services);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchSpotlight = useCallback(async () => {
    try {
      const res = await fetch("/api/provider/subscription");
      const data = await res.json();
      if (!res.ok) return;
      setSubscription(data.subscription ?? null);
      setSpotlight(data.spotlight ?? null);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchServices();
    fetchSpotlight();
  }, [fetchServices, fetchSpotlight]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setActionError("");
    setCoverFile(null);
    setRemoveCover(false);
    setCurrentCoverUrl(null);
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      title: service.title,
      description: service.description,
      price: String(service.price),
      category: service.category,
      location: service.location,
    });
    setCoverFile(null);
    setRemoveCover(false);
    setCurrentCoverUrl(service.coverImageUrl);
    setShowForm(true);
    setActionError("");
  };

  const handleSubmit = async () => {
    setActionError("");

    if (!form.title || !form.description || !form.price || !form.location) {
      setActionError("Tous les champs sont obligatoires");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        location: form.location,
      };

      const res = editingId
        ? await fetch(`/api/services/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        setActionError(data.error ?? "Erreur lors de l'enregistrement");
        return;
      }

      const savedId = editingId ?? data.service.id;
      const coverSync = await syncListingCover("service", savedId, {
        file: coverFile,
        removeExisting: removeCover,
      });

      if (!coverSync.ok) {
        setActionError(
          editingId
            ? `Annonce enregistrée, mais photo : ${coverSync.error}`
            : coverSync.error
        );
      }

      const refreshRes = await fetch("/api/services?mine=true");
      const refreshData = await refreshRes.json();
      if (refreshRes.ok) {
        setServices(refreshData.services);
      } else if (editingId) {
        setServices((prev) =>
          prev.map((s) => (s.id === editingId ? data.service : s))
        );
      } else {
        setServices((prev) => [data.service, ...prev]);
      }

      if (coverSync.ok) resetForm();
    } catch {
      setActionError("Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (service: Service) => {
    setActionError("");

    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !service.available }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error ?? "Impossible de modifier la disponibilité");
        return;
      }

      const updated = data.service as Service;
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? updated : s))
      );
      if (!updated.available && updated.featuredOnHomepage === false) {
        setSpotlight((prev) =>
          prev?.featuredService?.id === service.id
            ? { ...prev, featuredService: null }
            : prev
        );
      }
    } catch {
      setActionError("Une erreur est survenue");
    }
  };

  const toggleFeaturedService = async (service: Service) => {
    setActionError("");
    setSpotlightBusyId(service.id);

    const nextId = service.featuredOnHomepage ? null : service.id;

    try {
      const res = await fetch("/api/provider/featured-service", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: nextId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error ?? "Impossible de modifier la mise en avant");
        return;
      }

      setServices((prev) =>
        prev.map((s) => ({
          ...s,
          featuredOnHomepage: nextId !== null && s.id === nextId,
        }))
      );
      setSpotlight((prev) =>
        prev
          ? {
              ...prev,
              providerFeatured: nextId !== null || prev.providerFeatured,
              featuredService:
                nextId === null
                  ? null
                  : { id: service.id, title: service.title },
            }
          : prev
      );
    } catch {
      setActionError("Une erreur est survenue");
    } finally {
      setSpotlightBusyId(null);
    }
  };

  const runDelete = async (id: string) => {
    setActionError("");

    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error ?? "Impossible de supprimer");
        return;
      }

      setServices((prev) => prev.filter((s) => s.id !== id));
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
          <h1 className="text-2xl font-bold text-foreground mb-1">Espace prestataire</h1>
          <p className="text-muted-foreground text-sm">Publiez et gérez vos annonces de services</p>
        </div>

        <ProviderNav />
        <ProviderKycBanner />

        {subscription?.isActive && spotlight?.canFeature && (
          <div className="mb-6 bg-brand-50 border border-brand-100 rounded-xl px-4 py-4 text-sm text-brand-900">
            <p className="font-medium">Abonnement actif — mise en avant automatique</p>
            <p className="text-brand-800 mt-1">
              Votre profil apparaît dans « Nos prestataires du mois » sur l&apos;accueil
              jusqu&apos;au{" "}
              {new Date(subscription.expiresAt).toLocaleDateString("fr-MG")}.
              Choisissez une annonce en ligne à mettre en avant dans « Annonces du
              moment ».
            </p>
          </div>
        )}

        {subscription?.isActive && !spotlight?.canFeature && (
          <div className="mb-6 bg-amber-50 border border-amber-100 rounded-xl px-4 py-4 text-sm text-amber-900">
            <p className="font-medium">Abonnement actif</p>
            <p className="mt-1">
              Complétez la vérification d&apos;identité (KYC) pour activer la mise en
              avant sur l&apos;accueil.
            </p>
          </div>
        )}

        {!subscription?.isActive && (
          <div className="mb-6 bg-muted/40 border border-border rounded-xl px-4 py-4 text-sm text-muted-foreground">
            <p>
              L&apos;abonnement mensuel ({SUBSCRIPTION_PERIOD_DAYS} jours) met votre
              profil en avant sur l&apos;accueil et dans les suggestions.{" "}
              <Link
                href="/dashboard/provider/subscription"
                className="text-brand-600 font-medium hover:underline"
              >
                Souscrire maintenant →
              </Link>
            </p>
          </div>
        )}

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
              setCoverFile(null);
              setRemoveCover(false);
              setCurrentCoverUrl(null);
            }}
            className="mb-6 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            + Nouvelle annonce
          </button>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-foreground mb-4">
              {editingId ? "Modifier l'annonce" : "Nouvelle annonce"}
            </h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Titre (ex: Réparation fuite d'eau)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand-500"
              />
              <textarea
                placeholder="Description détaillée"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand-500 resize-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Prix (Ar)"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand-500"
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand-500 bg-card"
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
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-brand-500"
              />
              <ListingCoverField
                currentImageUrl={currentCoverUrl}
                file={coverFile}
                onFileChange={setCoverFile}
                removeExisting={removeCover}
                onRemoveExistingChange={setRemoveCover}
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
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
              onClick={fetchServices}
              className="text-brand-600 font-medium hover:underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground mb-2">Aucune annonce publiée</p>
            <p className="text-muted-foreground text-sm mb-4">
              Créez votre première offre pour recevoir des réservations
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="text-brand-600 font-medium hover:underline"
              >
                Créer une annonce
              </button>
            )}
          </div>
        )}

        {!loading && !error && services.length > 0 && (
          <div className="flex flex-col gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-4 p-6">
                  {service.coverImageUrl ? (
                    <OptimizedImage
                      src={service.coverImageUrl}
                      alt={service.title}
                      width={128}
                      height={128}
                      sizes="128px"
                      className="w-full sm:w-32 sm:h-32 h-40 object-cover rounded-xl bg-muted shrink-0"
                    />
                  ) : (
                    <div className="w-full sm:w-32 sm:h-32 h-40 rounded-xl bg-muted/60 border border-dashed border-border flex items-center justify-center shrink-0">
                      <span className="text-xs text-muted-foreground text-center px-2">
                        Aucune photo
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <span className="inline-block bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full mb-2">
                          {service.category}
                        </span>
                        <h3 className="font-semibold text-foreground">{service.title}</h3>
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                          {service.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                            service.available
                              ? "bg-brand-50 text-brand-700 border-brand-200"
                              : "bg-muted/40 text-muted-foreground border-border"
                          }`}
                        >
                          {service.available ? "En ligne" : "Hors ligne"}
                        </span>
                        {service.featuredOnHomepage && (
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                            En avant sur l&apos;accueil
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="text-brand-600 font-bold">
                        {service.price.toLocaleString("fr-MG")} Ar
                      </span>
                      <span><MapPinIcon /> {service.location}</span>
                      <Link
                        href={`/services/${service.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        Voir la fiche publique →
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 px-6 pb-6 pt-4 border-t border-border">
                  <button
                    onClick={() => startEdit(service)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:border-brand-400"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => toggleAvailable(service)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:border-brand-400"
                  >
                    {service.available ? "Désactiver" : "Réactiver"}
                  </button>
                  {spotlight?.canFeature && service.available && (
                    <button
                      onClick={() => toggleFeaturedService(service)}
                      disabled={spotlightBusyId != null}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-50 ${
                        service.featuredOnHomepage
                          ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          : "border-brand-200 text-brand-700 hover:bg-brand-50"
                      }`}
                    >
                      {spotlightBusyId === service.id
                        ? "…"
                        : service.featuredOnHomepage
                          ? "Retirer de l'accueil"
                          : "Mettre en avant sur l'accueil"}
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(service.id)}
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
        title="Supprimer l'annonce"
        description="Supprimer cette annonce ?"
        confirmLabel="Supprimer"
        destructive
        onConfirm={() => {
          if (deleteTarget) runDelete(deleteTarget);
        }}
      />
    </div>
  );
}
