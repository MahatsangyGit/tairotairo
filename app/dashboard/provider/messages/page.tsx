"use client";

import DashboardMessagesInbox from "@/components/dashboard/DashboardMessagesInbox";

export default function ProviderMessagesPage() {
  return (
    <DashboardMessagesInbox
      title="Espace pro"
      subtitle="Messagerie"
      emptyHint="Contactez un client depuis vos propositions ou ouvrez une conversation depuis une réservation."
    />
  );
}
