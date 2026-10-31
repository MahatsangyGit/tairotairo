"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProviderKycBanner from "@/components/kyc/ProviderKycBanner";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import ListingFormFields from "@/components/listings/ListingFormFields";
import { syncListingCover } from "@/lib/listings/listing-cover-sync";
import { useListingCrud } from "@/hooks/useListingCrud";
import { apiFetch, apiFetchJson } from "@/lib/api-client";
import {
  ListingActionError,
  ListingDeleteDialog,
  ListingEmptyState,
  ListingErrorState,
  ListingListSkeleton,
  useListingEditor,
  useListingFormFocus,
} from "@/components/dashboard/ListingCrudChrome";
import {
  ProviderServiceCard,
  ProviderSpotlightBanner,
  type ProviderServiceItem,
  type SpotlightState,
  type SubscriptionState,
} from "@/components/dashboard/ProviderServiceList";

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
  } = useListingCrud<ProviderServiceItem>({
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

  const startEdit = (service: ProviderServiceItem) => {
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
        ? await apiFetchJson<{ service: ProviderServiceItem }>(
            `/api/services/${editingId}`,
            { method: "PATCH", body: payload, router }
          )
        : await apiFetchJson<{ service: ProviderServiceItem }>(
            "/api/services",
            { method: "POST", body: payload, router }
          );

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
        const refreshData = await apiFetch<{ services: ProviderServiceItem[] }>(
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

  const toggleAvailable = async (service: ProviderServiceItem) => {
    editor.setActionError("");
    try {
      const data = await apiFetchJson<{ service: ProviderServiceItem }>(
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

  const toggleFeaturedService = async (service: ProviderServiceItem) => {
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
        <ProviderSpotlightBanner subscription={subscription} spotlight={spotlight} />

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
              <ProviderServiceCard
                key={service.id}
                service={service}
                canFeature={Boolean(spotlight?.canFeature)}
                spotlightBusyId={spotlightBusyId}
                onEdit={startEdit}
                onToggleAvailable={toggleAvailable}
                onToggleFeatured={toggleFeaturedService}
                onDelete={editor.setDeleteTarget}
              />
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
