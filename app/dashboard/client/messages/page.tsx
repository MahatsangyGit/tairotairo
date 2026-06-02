"use client";

import Navbar from "@/components/layout/Navbar";
import ClientNav from "@/components/layout/ClientNav";
import ConversationInbox from "@/components/messages/ConversationInbox";

export default function ClientMessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Espace client</h1>
          <p className="text-gray-500 text-sm">Messagerie</p>
        </div>
        <ClientNav />
        <ConversationInbox emptyHint="Contactez un prestataire depuis son profil, une fiche service ou une proposition — ou ouvrez une conversation depuis une réservation." />
      </div>
    </div>
  );
}
