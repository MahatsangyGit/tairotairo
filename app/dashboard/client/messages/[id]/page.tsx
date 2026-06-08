"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ClientNav from "@/components/layout/ClientNav";
import MessageThreadView from "@/components/messages/MessageThreadView";

export default function ClientMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const requestResponseId = searchParams.get("response");
  const serviceId = searchParams.get("service");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">Espace client</h1>
          <p className="text-muted-foreground text-sm">Conversation</p>
        </div>
        <ClientNav />
        <MessageThreadView
          conversationId={id}
          backHref="/dashboard/client/messages"
          requestResponseId={requestResponseId}
          serviceId={serviceId}
        />
      </div>
    </div>
  );
}
