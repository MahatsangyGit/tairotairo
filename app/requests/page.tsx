import PublicRequestsExplorer from "@/components/search/PublicRequestsExplorer";

export const revalidate = 120;

export default function RequestsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicRequestsExplorer />
    </div>
  );
}
