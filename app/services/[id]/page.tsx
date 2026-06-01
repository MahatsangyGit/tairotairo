"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Provider {
  id:     string;
  name:   string;
  avatar: string | null;
  bio:    string | null;
  phone:  string | null;
}

interface Service {
  id:          string;
  title:       string;
  description: string;
  price:       number;
  category:    string;
  location:    string;
  available:   boolean;
  provider:    Provider;
}

interface ReviewAuthor {
  id:     string;
  name:   string;
  avatar: string | null;
}

interface Review {
  id:        string;
  rating:    number;
  comment:   string | null;
  createdAt: string;
  author:    ReviewAuthor;
}

// ─── Sous-composant : étoiles ─────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "text-yellow-400" : "text-gray-200"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

// ─── Component principal ──────────────────────────────────────────────────────

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Données
  const [service,       setService]       = useState<Service | null>(null);
  const [reviews,       setReviews]       = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews,  setTotalReviews]  = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");

  // Réservation
  const [date,         setDate]         = useState("");
  const [booking,      setBooking]      = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingDone,  setBookingDone]  = useState(false);

  // ── Fetch service + avis ──────────────────────────────────────────────────

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res  = await fetch(`/api/services/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Service introuvable");
          return;
        }

        setService(data.service);
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews);
      } catch {
        setError("Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  // ── Réservation ────────────────────────────────────────────────────────────

  const handleBooking = async () => {
    if (!date) {
      setBookingError("Veuillez choisir une date");
      return;
    }

    setBooking(true);
    setBookingError("");

    try {
      const res  = await fetch("/api/bookings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ serviceId: id, date }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        setBookingError(data.error ?? "Erreur lors de la réservation");
        return;
      }

      setBookingDone(true);
    } catch {
      setBookingError("Une erreur est survenue");
    } finally {
      setBooking(false);
    }
  };

  // Date minimum = demain
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Retour */}
        <Link
          href="/services"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors"
        >
          ← Retour aux services
        </Link>

        {/* ── Skeleton loading ── */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-7 bg-gray-200 rounded w-3/4 mb-6" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        )}

        {/* ── Erreur ── */}
        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Link href="/services" className="text-emerald-600 font-medium hover:underline">
              Retour aux services
            </Link>
          </div>
        )}

        {/* ── Contenu ── */}
        {!loading && !error && service && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Colonne principale (2/3) ── */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Card service */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full mb-4">
                  {service.category}
                </span>

                <h1 className="text-2xl font-bold text-gray-800 mb-3">
                  {service.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                  <span>📍 {service.location}</span>
                  {totalReviews > 0 && (
                    <span className="flex items-center gap-1">
                      <StarRating rating={Math.round(averageRating)} />
                      <span className="font-medium text-gray-700">{averageRating}</span>
                      <span>({totalReviews} avis)</span>
                    </span>
                  )}
                  <span className={`font-medium ${service.available ? "text-emerald-600" : "text-red-500"}`}>
                    {service.available ? "● Disponible" : "● Indisponible"}
                  </span>
                </div>

                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {service.description}
                </p>
              </div>

              {/* Card prestataire */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-gray-800 mb-4">À propos du prestataire</h2>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg shrink-0">
                    {service.provider.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/providers/${service.provider.id}`}
                      className="font-semibold text-gray-800 hover:text-emerald-600"
                    >
                      {service.provider.name}
                    </Link>
                    <Link
                      href={`/providers/${service.provider.id}`}
                      className="block text-sm text-emerald-600 font-medium hover:underline mt-1"
                    >
                      Voir le profil →
                    </Link>
                    {service.provider.bio && (
                      <p className="text-gray-500 text-sm mt-1">{service.provider.bio}</p>
                    )}
                    {service.provider.phone && (
                      <p className="text-gray-500 text-sm mt-1">📞 {service.provider.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Avis */}
              {reviews.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-semibold text-gray-800 mb-4">
                    Avis clients
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      ({totalReviews})
                    </span>
                  </h2>
                  <div className="flex flex-col gap-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-xs shrink-0">
                              {review.author.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {review.author.name}
                            </span>
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                        {review.comment && (
                          <p className="text-gray-500 text-sm mt-1 ml-9">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Colonne réservation (1/3) ── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-6">
                <p className="text-3xl font-bold text-emerald-600 mb-1">
                  {service.price.toLocaleString("fr-MG")} Ar
                </p>
                <p className="text-gray-400 text-sm mb-6">par prestation</p>

                {bookingDone ? (
                  <div className="text-center py-4">
                    <p className="text-emerald-600 font-semibold mb-1">
                      ✓ Réservation envoyée !
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                      Le prestataire va confirmer votre demande.
                    </p>
                    <Link
                      href="/dashboard/client"
                      className="block text-emerald-600 text-sm font-medium hover:underline mb-2"
                    >
                      Voir mes réservations →
                    </Link>
                    <Link
                      href="/services"
                      className="text-gray-500 text-sm hover:underline"
                    >
                      Voir d&apos;autres services
                    </Link>
                  </div>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Choisir une date
                    </label>
                    <input
                      type="date"
                      value={date}
                      min={minDateStr}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setBookingError("");
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 mb-4"
                    />

                    {bookingError && (
                      <p className="text-red-500 text-sm mb-4">{bookingError}</p>
                    )}

                    <button
                      onClick={handleBooking}
                      disabled={booking || !service.available}
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {booking ? "Envoi..." : "Réserver ce service"}
                    </button>

                    {!service.available && (
                      <p className="text-gray-400 text-xs text-center mt-3">
                        Ce service n'est plus disponible
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}