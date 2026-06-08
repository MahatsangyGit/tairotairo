import DashboardSuspensionGuard from "@/components/layout/DashboardSuspensionGuard";

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
