"use client";

import ConversationInbox from "@/components/messages/ConversationInbox";
import ClientPageHeader from "@/components/layout/ClientPageHeader";

export default function ClientMessagesPage() {
  return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <ClientPageHeader subtitle="Messagerie" />
        <ConversationInbox emptyHint="Contactez un prestataire depuis son profil, une fiche service ou une proposition — ou ouvrez une conversation depuis une réservation." />
      </div>
  );
}
