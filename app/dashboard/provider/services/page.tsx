"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProviderKycBanner from "@/components/kyc/ProviderKycBanner";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { SUBSCRIPTION_PERIOD_DAYS } from "@/lib/subscription";
import ListingFormFields from "@/components/listings/ListingFormFields";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { syncListingCover } from "@/lib/listing-cover-sync";
import { MapPinIcon } from "@/components/ui/app-icons";
import { useListingCrud } from "@/hooks/useListingCrud";
import { apiFetch, apiFetchJson } from "@/lib/api-client";
import ServiceCommissionHint from "@/components/economy/ServiceCommissionHint";
import {
  ListingActionError,
  ListingDeleteDialog,
  ListingEmptyState,
  ListingErrorState,
  ListingListSkeleton,
  useListingEditor,
  useListingFormFocus,
} from "@/components/dashboard/ListingCrudChrome";

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
  const {
    items: services,
    setItems: setServices,
    loading,
    error,
    fetchList: fetchServices,
    showForm,
    setShowForm,
    editingId,
    setEditingId,
  } = useListingCrud<Service>({
    listUrl: "/api/services?mine=true",
    listKey: "services",
    router,
    forbiddenRedirect: "/dashboard/client",
  });

  const editor = useListingEditor();
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [spotlight, setSpotlight] = useState<SpotlightState | null>(null);
  const [spotlightBusyId, setSpotlightBusyId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState>(null);
  useListingFormFocus(showForm, editingId, editor.focusListingForm);

  const fetchSpotlight = useCallback(async () => {
    try {
      const data = await apiFetch<{
        subscription?: SubscriptionState;
        spotlight?: SpotlightState;
      }>("/api/provider/subscription", { router });
      setSubscription(data.subscription ?? null);
      setSpotlight(data.spotlight ?? null);
    } catch {
      /* ignore */
    }
  }, [router]);

  useEffect(() => {
    fetchSpotlight();
  }, [fetchSpotlight]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    editor.setActionError("");
    editor.resetCover();
  };

  const openNewForm = () => {
    setShowForm(true);
    setEditingId(null);
    setForm(EMPTY_FORM);
    editor.resetCover();
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
    editor.setCoverFile(null);
    editor.setRemoveCover(false);
    editor.setCurrentCoverUrl(service.coverImageUrl);
    setShowForm(true);
    editor.setActionError("");
  };

  const handleSubmit = async () => {
    editor.setActionError("");
    if (!form.title || !form.description || !form.price || !form.location) {
      editor.setActionError("Tous les champs sont obligatoires");
      return;
    }
    editor.setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        location: form.location,
      };
      const data = editingId
        ? await apiFetchJson<{ service: Service }>(`/api/services/${editingId}`, {
            method: "PATCH",
            body: payload,
            router,
          })
        : await apiFetchJson<{ service: Service }>("/api/services", {
            method: "POST",
            body: payload,
            router,
          });

      const savedId = editingId ?? data.service.id;
      const coverSync = await syncListingCover("service", savedId, {
        file: editor.coverFile,
        removeExisting: editor.removeCover,
      });
      if (!coverSync.ok) {
        editor.setActionError(
          editingId
            ? `Annonce enregistrée, mais photo : ${coverSync.error}`
            : coverSync.error
        );
      }
      try {
        const refreshData = await apiFetch<{ services: Service[] }>(
          "/api/services?mine=true",
          { router }
        );
        setServices(refreshData.services);
      } catch {
        if (editingId) {
          setServices((prev) =>
            prev.map((s) => (s.id === editingId ? data.service : s))
          );
        } else {
          setServices((prev) => [data.service, ...prev]);
        }
      }
      if (coverSync.ok) resetForm();
    } catch (err) {
      editor.reportActionError(err);
    } finally {
      editor.setSaving(false);
    }
  };

  const toggleAvailable = async (service: Service) => {
    editor.setActionError("");
    try {
      const data = await apiFetchJson<{ service: Service }>(
        `/api/services/${service.id}`,
        { method: "PATCH", body: { available: !service.available }, router }
      );
      const updated = data.service;
      setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
      if (!updated.available && updated.featuredOnHomepage === false) {
        setSpotlight((prev) =>
          prev?.featuredService?.id === service.id
            ? { ...prev, featuredService: null }
            : prev
        );
      }
    } catch (err) {
      editor.reportActionError(err);
    }
  };

  const toggleFeaturedService = async (service: Service) => {
    editor.setActionError("");
    setSpotlightBusyId(service.id);
    const nextId = service.featuredOnHomepage ? null : service.id;
    try {
      await apiFetchJson("/api/provider/featured-service", {
        method: "PATCH",
        body: { serviceId: nextId },
        router,
      });
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
                nextId === null ? null : { id: service.id, title: service.title },
            }
          : prev
      );
    } catch (err) {
      editor.reportActionError(err);
    } finally {
      setSpotlightBusyId(null);
    }
  };

  const runDelete = async (id: string) => {
    editor.setActionError("");
    try {
      await apiFetchJson(`/api/services/${id}`, { method: "DELETE", router });
      setServices((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) resetForm();
      editor.setDeleteTarget(null);
    } catch (err) {
      editor.reportActionError(err);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">Espace prestataire</h1>
          <p className="text-muted-foreground text-sm">Publiez et gérez vos annonces de services</p>
        </div>
        <ProviderKycBanner />

        {subscription?.isActive && spotlight?.canFeature && (
          <div className="mb-6 bg-brand-50 border border-brand-100 rounded-xl px-4 py-4 text-sm text-brand-900">
            <p className="font-medium">Abonnement actif — mise en avant automatique</p>
            <p className="text-brand-800 mt-1">
              Votre profil apparaît dans « Nos prestataires du mois » sur l&apos;accueil
              jusqu&apos;au {new Date(subscription.expiresAt).toLocaleDateString("fr-MG")}.
              Choisissez une annonce en ligne à mettre en avant dans « Annonces du moment ».
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

        <ListingActionError message={editor.actionError} />

        {!showForm ? (
          <button
            type="button"
            onClick={openNewForm}
            className="mb-6 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            + Nouvelle annonce
          </button>
        ) : (
          <div
            ref={editor.formSectionRef}
            id="listing-form"
            className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6 scroll-mt-24"
          >
            <h2 className="font-semibold text-foreground mb-4">
              {editingId ? "Modifier l'annonce" : "Nouvelle annonce"}
            </h2>
            <div className="flex flex-col gap-3">
              <ListingFormFields
                kind="service"
                form={{
                  title: form.title,
                  description: form.description,
                  amount: form.price,
                  category: form.category,
                  location: form.location,
                }}
                onChange={(next) =>
                  setForm({
                    title: next.title,
                    description: next.description,
                    price: next.amount,
                    category: next.category,
                    location: next.location,
                  })
                }
                categories={SERVICE_CATEGORIES}
                currentCoverUrl={editor.currentCoverUrl}
                coverFile={editor.coverFile}
                onCoverFileChange={editor.setCoverFile}
                removeCover={editor.removeCover}
                onRemoveCoverChange={editor.setRemoveCover}
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={editor.saving}
                  className="bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                >
                  {editor.saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Publier"}
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

        {loading && <ListingListSkeleton />}
        {!loading && error && (
          <ListingErrorState error={error} onRetry={() => fetchServices()} />
        )}
        {!loading && !error && services.length === 0 && (
          <ListingEmptyState
            title="Aucune annonce publiée"
            hint="Créez votre première offre pour recevoir des réservations"
            ctaLabel="Créer une annonce"
            onCta={() => setShowForm(true)}
            ctaClassName="text-brand-600 font-medium hover:underline"
            showCta={!showForm}
          />
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
                      <span>
                        <MapPinIcon /> {service.location}
                      </span>
                      <Link href={`/services/${service.id}`} className="text-brand-600 hover:underline">
                        Voir la fiche publique →
                      </Link>
                    </div>
                    <ServiceCommissionHint
                      className="mt-3"
                      category={service.category}
                      price={service.price}
                      variant="compact"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 px-6 pb-6 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => startEdit(service)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:border-brand-400"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
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
                    onClick={() => editor.setDeleteTarget(service.id)}
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
      <ListingDeleteDialog
        open={editor.deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) editor.setDeleteTarget(null);
        }}
        title="Supprimer l'annonce"
        description="Supprimer cette annonce ?"
        onConfirm={() => {
          if (editor.deleteTarget) runDelete(editor.deleteTarget);
        }}
      />
    </>
  );
}
