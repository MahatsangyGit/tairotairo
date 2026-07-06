import ProviderNav from "@/components/layout/ProviderNav";

export default function ProviderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProviderNav />
        {children}
      </div>
    </div>
  );
}
