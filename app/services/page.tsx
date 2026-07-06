import PublicServicesExplorer from "@/components/search/PublicServicesExplorer";

export const revalidate = 120;

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicServicesExplorer />
    </div>
  );
}
