import type { Metadata } from "next";
import { servicesListMetadata } from "@/lib/seo";

export const metadata: Metadata = servicesListMetadata();

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
