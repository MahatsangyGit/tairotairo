"use client";

import DashboardMessagesInbox from "@/components/dashboard/DashboardMessagesInbox";
import ClientPageHeader from "@/components/layout/ClientPageHeader";

export default function ClientMessagesPage() {
  return (
    <DashboardMessagesInbox
      emptyHint="Contactez un prestataire depuis son profil, une fiche service ou une proposition — ou ouvrez une conversation depuis une réservation."
      header={<ClientPageHeader subtitle="Messagerie" />}
    />
  );
}
