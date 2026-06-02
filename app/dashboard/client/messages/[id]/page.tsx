"use client";

import { use } from "react";
import Navbar from "@/components/layout/Navbar";
import ClientNav from "@/components/layout/ClientNav";
import MessageThreadView from "@/components/messages/MessageThreadView";

export default function ClientMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Espace client</h1>
          <p className="text-gray-500 text-sm">Conversation</p>
        </div>
        <ClientNav />
        <MessageThreadView
          conversationId={id}
          backHref="/dashboard/client/messages"
        />
      </div>
    </div>
  );
}
