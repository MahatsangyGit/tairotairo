"use client";

import Link from "next/link";
import { MapPinIcon, StarIcon } from "@/components/ui/app-icons";
import EntrepriseIndividuelleBadge from "@/components/profile/EntrepriseIndividuelleBadge";
import ContactProviderButton from "@/components/messages/ContactProviderButton";
import NegotiateServiceButton from "@/components/messages/NegotiateServiceButton";
import TimeSlotFields from "@/components/scheduling/TimeSlotFields";
import UserAvatar from "@/components/profile/UserAvatar";
import OptimizedImage from "@/components/ui/OptimizedImage";

export interface ServiceDetailProvider {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  isEntrepriseIndividuelle?: boolean;
}

export interface ServiceDetailData {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  coverImageUrl: string | null;
  available: boolean;
  provider: ServiceDetailProvider;
}

export interface ServiceReviewAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

export interface ServiceReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: ServiceReviewAuthor;
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "text-yellow-400" : "text-gray-200"}
        >
          <StarIcon size={15} />
        </span>
      ))}
    </span>
  );
}

export function ServiceDetailMainColumn({
  service,
  reviews,
  averageRating,
  totalReviews,
}: {
  service: ServiceDetailData;
  reviews: ServiceReviewItem[];
  averageRating: number;
  totalReviews: number;
}) {
  return (
    <div className="lg:col-span-2 flex flex-col gap-6">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {service.coverImageUrl && (
          <div className="relative w-full h-80 max-h-80 bg-muted">
            <OptimizedImage
              src={service.coverImageUrl}
              alt={service.title}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
            />
          </div>
        )}
        <div className="p-8">
          <span className="inline-block bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full mb-4">
            {service.category}
          </span>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            {service.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span>
              <MapPinIcon /> {service.location}
            </span>
            {totalReviews > 0 && (
              <span className="flex items-center gap-1">
                <StarRating rating={Math.round(averageRating)} />
                <span className="font-medium text-foreground">{averageRating}</span>
                <span>({totalReviews} avis)</span>
              </span>
            )}
            <span
              className={`font-medium ${service.available ? "text-brand-600" : "text-red-500"}`}
            >
              {service.available ? "● Disponible" : "● Indisponible"}
            </span>
          </div>

          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {service.description}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h2 className="font-semibold text-foreground mb-4">À propos du prestataire</h2>
        <div className="flex items-start gap-4">
          <UserAvatar
            name={service.provider.name}
            avatar={service.provider.avatar}
            size="md"
          />
          <div>
            <Link
              href={`/providers/${service.provider.id}`}
              className="font-semibold text-foreground hover:text-brand-600 inline-flex items-center gap-1.5"
            >
              {service.provider.name}
              {service.provider.isEntrepriseIndividuelle ? (
                <EntrepriseIndividuelleBadge />
              ) : null}
            </Link>
            <Link
              href={`/providers/${service.provider.id}`}
              className="block text-sm text-brand-600 font-medium hover:underline mt-1"
            >
              Voir le profil →
            </Link>
            {service.provider.bio && (
              <p className="text-muted-foreground text-sm mt-1">
                {service.provider.bio}
              </p>
            )}
            <div className="mt-3">
              <ContactProviderButton providerId={service.provider.id} />
            </div>
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h2 className="font-semibold text-foreground mb-4">
            Avis clients
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({totalReviews})
            </span>
          </h2>
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={review.author.name}
                      avatar={review.author.avatar}
                      size="xs"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {review.author.name}
                    </span>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="text-muted-foreground text-sm mt-1 ml-9">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ServiceBookingSidebar({
  service,
  minDate,
  date,
  slotEnabled,
  slotStart,
  slotEnd,
  booking,
  bookingError,
  bookingDone,
  onDateChange,
  onSlotEnabledChange,
  onSlotStartChange,
  onSlotEndChange,
  onBook,
}: {
  service: ServiceDetailData;
  minDate: string;
  date: string;
  slotEnabled: boolean;
  slotStart: string;
  slotEnd: string;
  booking: boolean;
  bookingError: string;
  bookingDone: boolean;
  onDateChange: (value: string) => void;
  onSlotEnabledChange: (enabled: boolean) => void;
  onSlotStartChange: (value: string) => void;
  onSlotEndChange: (value: string) => void;
  onBook: () => void;
}) {
  return (
    <div className="lg:col-span-1">
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sticky top-6">
        <p className="text-3xl font-bold text-brand-600 mb-1">
          {service.price.toLocaleString("fr-MG")} Ar
        </p>
        <p className="text-muted-foreground text-sm mb-6">par prestation</p>

        {bookingDone ? (
          <div className="text-center py-4">
            <p className="text-brand-600 font-semibold mb-1">
              ✓ Réservation envoyée !
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              Le prestataire va confirmer votre demande.
            </p>
            <Link
              href="/dashboard/client"
              className="block text-brand-600 text-sm font-medium hover:underline mb-2"
            >
              Voir mes réservations →
            </Link>
            <Link
              href="/services"
              className="text-muted-foreground text-sm hover:underline"
            >
              Voir d&apos;autres services
            </Link>
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Choisir une date
            </label>
            <input
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-brand-500 mb-3"
            />
            <TimeSlotFields
              dateSet={Boolean(date)}
              enabled={slotEnabled}
              onEnabledChange={onSlotEnabledChange}
              slotStart={slotStart}
              slotEnd={slotEnd}
              onSlotStartChange={onSlotStartChange}
              onSlotEndChange={onSlotEndChange}
            />
            <div className="mb-4" />

            {bookingError && (
              <p className="text-red-500 text-sm mb-4">{bookingError}</p>
            )}

            <div className="flex flex-col gap-2 mb-2">
              <NegotiateServiceButton serviceId={service.id} />
              <button
                onClick={onBook}
                disabled={booking || !service.available}
                className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {booking ? "Envoi..." : "Réserver ce service"}
              </button>
            </div>

            {!service.available && (
              <p className="text-muted-foreground text-xs text-center mt-3">
                Ce service n&apos;est plus disponible
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
