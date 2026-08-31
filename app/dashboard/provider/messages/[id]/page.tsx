"use client";

import DashboardMessageThread from "@/components/dashboard/DashboardMessageThread";

export default function ProviderMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DashboardMessageThread
      title="Espace pro"
      subtitle="Conversation"
      backHref="/dashboard/provider/messages"
      params={params}
    />
  );
}
