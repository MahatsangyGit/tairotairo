import ClientNav from "@/components/layout/ClientNav";
import ClientCompanyBanner from "@/components/layout/ClientCompanyBanner";

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ClientCompanyBanner />
        <ClientNav />
        {children}
      </div>
    </div>
  );
}
