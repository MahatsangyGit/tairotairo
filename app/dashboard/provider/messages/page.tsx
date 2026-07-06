"use client";

import ConversationInbox from "@/components/messages/ConversationInbox";

export default function ProviderMessagesPage() {
  return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">Espace pro</h1>
          <p className="text-muted-foreground text-sm">Messagerie</p>
        </div>
        <ConversationInbox emptyHint="Contactez un client depuis vos propositions ou ouvrez une conversation depuis une réservation." />
      </div>
  );
}
