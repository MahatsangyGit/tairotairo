"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ProviderNav from "@/components/layout/ProviderNav";
import { SERVICE_CATEGORIES } from "@/lib/categories";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  available: boolean;
  createdAt: string;
}

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

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setActionError("");
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

      if (editingId) {
        setServices((prev) =>
          prev.map((s) => (s.id === editingId ? data.service : s))
        );
      } else {
        setServices((prev) => [data.service, ...prev]);
      }

      resetForm();
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

      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? data.service : s))
      );
    } catch {
      setActionError("Une erreur est survenue");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;

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
    } catch {
      setActionError("Une erreur est survenue");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Espace prestataire</h1>
          <p className="text-gray-500 text-sm">Publiez et gérez vos annonces de services</p>
        </div>

        <ProviderNav />

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
            className="mb-6 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            + Nouvelle annonce
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">
              {editingId ? "Modifier l'annonce" : "Nouvelle annonce"}
            </h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Titre (ex: Réparation fuite d'eau)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
              <textarea
                placeholder="Description détaillée"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 resize-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Prix (Ar)"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Publier"}
                </button>
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-lg font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
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
                className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-32"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchServices}
              className="text-emerald-600 font-medium hover:underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 mb-2">Aucune annonce publiée</p>
            <p className="text-gray-400 text-sm mb-4">
              Créez votre première offre pour recevoir des réservations
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="text-emerald-600 font-medium hover:underline"
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
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full mb-2">
                      {service.category}
                    </span>
                    <h3 className="font-semibold text-gray-800">{service.title}</h3>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${
                      service.available
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}
                  >
                    {service.available ? "En ligne" : "Hors ligne"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="text-emerald-600 font-bold">
                    {service.price.toLocaleString("fr-MG")} Ar
                  </span>
                  <span>📍 {service.location}</span>
                  <Link
                    href={`/services/${service.id}`}
                    className="text-emerald-600 hover:underline"
                  >
                    Voir la fiche publique →
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => startEdit(service)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:border-emerald-400"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => toggleAvailable(service)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:border-emerald-400"
                  >
                    {service.available ? "Désactiver" : "Réactiver"}
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
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
    </div>
  );
}
