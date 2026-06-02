"use client";

import Navbar from "@/components/layout/Navbar";
import ProviderNav from "@/components/layout/ProviderNav";
import ConversationInbox from "@/components/messages/ConversationInbox";

export default function ProviderMessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Espace pro</h1>
          <p className="text-gray-500 text-sm">Messagerie</p>
        </div>
        <ProviderNav />
        <ConversationInbox emptyHint="Contactez un client depuis vos propositions ou ouvrez une conversation depuis une réservation." />
      </div>
    </div>
  );
}
