"use client";

import DashboardMessageThread from "@/components/dashboard/DashboardMessageThread";

export default function ClientMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DashboardMessageThread
      title="Espace client"
      subtitle="Conversation"
      backHref="/dashboard/client/messages"
      params={params}
    />
  );
}
