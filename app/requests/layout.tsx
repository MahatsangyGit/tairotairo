import type { Metadata } from "next";
import { requestsListMetadata } from "@/lib/seo";

export const metadata: Metadata = requestsListMetadata();

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
