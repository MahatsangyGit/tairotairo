import type { Metadata } from "next";
import DashboardSuspensionGuard from "@/components/layout/DashboardSuspensionGuard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardSuspensionGuard />
      {children}
    </>
  );
}
