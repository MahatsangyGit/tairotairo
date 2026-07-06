"use client";

import ConversationInbox from "@/components/messages/ConversationInbox";

export default function ClientMessagesPage() {
  return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">Espace client</h1>
          <p className="text-muted-foreground text-sm">Messagerie</p>
        </div>
        <ConversationInbox emptyHint="Contactez un prestataire depuis son profil, une fiche service ou une proposition — ou ouvrez une conversation depuis une réservation." />
      </div>
  );
}
