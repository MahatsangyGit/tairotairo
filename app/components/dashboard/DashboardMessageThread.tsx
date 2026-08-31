"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import MessageThreadView from "@/components/messages/MessageThreadView";

export default function DashboardMessageThread({
  title,
  subtitle,
  backHref,
  params,
}: {
  title: string;
  subtitle: string;
  backHref: string;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const requestResponseId = searchParams.get("response");
  const serviceId = searchParams.get("service");

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground mb-1">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>
      <MessageThreadView
        conversationId={id}
        backHref={backHref}
        requestResponseId={requestResponseId}
        serviceId={serviceId}
      />
    </div>
  );
}
