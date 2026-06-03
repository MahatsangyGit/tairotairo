import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import ContactProviderButton from "@/components/messages/ContactProviderButton";
import prisma from "@/lib/prisma";
import { SITE_NAME } from "@/lib/site";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadProvider(id: string) {
  const provider = await prisma.user.findUnique({
    where: { id, role: { in: ["PROVIDER", "ADMIN"] } },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      emailVerified: true,
      createdAt: true,
      services: {
        where: { available: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          category: true,
          location: true,
        },
      },
    },
  });

  if (!provider) return null;

  const reviews = await prisma.review.findMany({
    where: { targetId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      author: { select: { id: true, name: true, avatar: true } },
    },
  });

  const averageRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
        ) / 10
      : 0;

  return { provider, reviews, averageRating, totalReviews: reviews.length };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await loadProvider(id);
  if (!data) return { title: `Prestataire introuvable — ${SITE_NAME}` };

  return {
    title: `${data.provider.name} — Prestataire sur ${SITE_NAME}`,
    description:
      data.provider.bio ??
      `Services proposés par ${data.provider.name} à Madagascar`,
  };
}

export default async function ProviderProfilePage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadProvider(id);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-red-500 mb-4">Prestataire introuvable</p>
          <Link href="/services" className="text-brand-600 hover:underline">
            Voir les services
          </Link>
        </div>
      </div>
    );
  }

  const { provider, reviews, averageRating, totalReviews } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
          <div className="flex items-start gap-4">
            {provider.avatar ? (
              <img
                src={provider.avatar}
                alt={provider.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl">
                {provider.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{provider.name}</h1>
              {provider.emailVerified && (
                <span className="text-xs text-brand-600 font-medium">
                  ✓ Email vérifié
                </span>
              )}
              {totalReviews > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  ★ {averageRating} ({totalReviews} avis)
                </p>
              )}
              {provider.bio && (
                <p className="text-gray-600 mt-3 leading-relaxed">{provider.bio}</p>
              )}
              <div className="mt-4">
                <ContactProviderButton providerId={provider.id} />
              </div>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Services proposés ({provider.services.length})
          </h2>
          {provider.services.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun service en ligne</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {provider.services.map((service) => (
                <Link
                  key={service.id}
                  href={`/services/${service.id}`}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:border-brand-200 transition-colors"
                >
                  <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                    {service.category}
                  </span>
                  <h3 className="font-semibold text-gray-800 mt-2">{service.title}</h3>
                  <p className="text-brand-600 font-bold text-sm mt-2">
                    {service.price.toLocaleString("fr-MG")} Ar
                  </p>
                  <p className="text-gray-400 text-xs mt-1">📍 {service.location}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {reviews.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Avis clients</h2>
            <div className="flex flex-col gap-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-800 text-sm">
                      {review.author.name}
                    </span>
                    <span className="text-yellow-400 text-sm">
                      {"★".repeat(review.rating)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-500 text-sm">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
