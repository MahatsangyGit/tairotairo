import type { Metadata } from "next";
import JsonLdScripts from "@/components/seo/JsonLdScripts";
import prisma from "@/lib/prisma";
import { isKycApproved } from "@/lib/kyc";
import { buildPageMetadata } from "@/lib/seo";
import { SEO_SCHEMA_PATHS } from "@/lib/seo-schema-routes";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

async function loadService(id: string) {
  return prisma.service.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      category: true,
      location: true,
      available: true,
      provider: { select: { name: true, kycStatus: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const service = await loadService(id);

  if (
    !service ||
    !service.available ||
    !isKycApproved(service.provider.kycStatus)
  ) {
    return { title: "Service introuvable" };
  }

  const description =
    service.description.length > 160
      ? `${service.description.slice(0, 157)}…`
      : service.description;

  return buildPageMetadata({
    title: `${service.title} — ${service.category}`,
    description: `${description} · ${service.price.toLocaleString("fr-MG")} Ar · ${service.location}`,
    path: `/services/${id}`,
    type: "article",
  });
}

export default async function ServiceDetailLayout({
  children,
  params,
}: LayoutProps) {
  const { id } = await params;
  const service = await loadService(id);

  const jsonLd =
    service &&
    service.available &&
    isKycApproved(service.provider.kycStatus) ? (
      <JsonLdScripts paths={SEO_SCHEMA_PATHS.service(id)} />
    ) : null;

  return (
    <>
      {jsonLd}
      {children}
    </>
  );
}
