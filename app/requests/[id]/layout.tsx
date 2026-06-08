import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import prisma from "@/lib/prisma";
import { buildPageMetadata, jsonLdBreadcrumbList } from "@/lib/seo";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

async function loadRequest(id: string) {
  return prisma.serviceRequest.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      budget: true,
      category: true,
      location: true,
      open: true,
    },
  });
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const request = await loadRequest(id);

  if (!request || !request.open) {
    return { title: "Demande introuvable" };
  }

  const description =
    request.description.length > 160
      ? `${request.description.slice(0, 157)}…`
      : request.description;

  return buildPageMetadata({
    title: `${request.title} — ${request.category}`,
    description: `${description} · Budget ${request.budget.toLocaleString("fr-MG")} Ar · ${request.location}`,
    path: `/requests/${id}`,
    type: "article",
  });
}

export default async function RequestDetailLayout({
  children,
  params,
}: LayoutProps) {
  const { id } = await params;
  const request = await loadRequest(id);

  const jsonLd =
    request && request.open ? (
      <JsonLd
        data={jsonLdBreadcrumbList([
          { name: "Accueil", path: "/" },
          { name: "Demandes", path: "/requests" },
          { name: request.title, path: `/requests/${id}` },
        ])}
      />
    ) : null;

  return (
    <>
      {jsonLd}
      {children}
    </>
  );
}
