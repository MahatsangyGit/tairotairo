"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ServiceBookingSidebar,
  ServiceDetailMainColumn,
  type ServiceDetailData,
  type ServiceReviewItem,
} from "@/components/services/ServiceDetailSections";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [service, setService] = useState<ServiceDetailData | null>(null);
  const [reviews, setReviews] = useState<ServiceReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [date, setDate] = useState("");
  const [slotEnabled, setSlotEnabled] = useState(false);
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingDone, setBookingDone] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/services/${id}`);
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

  const handleBooking = async () => {
    if (!date) {
      setBookingError("Veuillez choisir une date");
      return;
    }

    setBooking(true);
    setBookingError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: id,
          date,
          slotStart: slotEnabled ? slotStart || null : null,
          slotEnd: slotEnabled ? slotEnd || null : null,
        }),
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

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link
          href="/services"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-600 mb-6 transition-colors"
        >
          ← Retour aux services
        </Link>

        {loading && (
          <div className="bg-card rounded-2xl border border-border p-8 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-7 bg-gray-200 rounded w-3/4 mb-6" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Link href="/services" className="text-brand-600 font-medium hover:underline">
              Retour aux services
            </Link>
          </div>
        )}

        {!loading && !error && service && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ServiceDetailMainColumn
              service={service}
              reviews={reviews}
              averageRating={averageRating}
              totalReviews={totalReviews}
            />
            <ServiceBookingSidebar
              service={service}
              minDate={minDateStr}
              date={date}
              slotEnabled={slotEnabled}
              slotStart={slotStart}
              slotEnd={slotEnd}
              booking={booking}
              bookingError={bookingError}
              bookingDone={bookingDone}
              onDateChange={(value) => {
                setDate(value);
                setBookingError("");
                if (!value) {
                  setSlotEnabled(false);
                  setSlotStart("");
                  setSlotEnd("");
                }
              }}
              onSlotEnabledChange={setSlotEnabled}
              onSlotStartChange={setSlotStart}
              onSlotEndChange={setSlotEnd}
              onBook={handleBooking}
            />
          </div>
        )}
      </div>
    </div>
  );
}
