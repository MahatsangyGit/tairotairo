"use client";

import type { ReactNode } from "react";
import ConversationInbox from "@/components/messages/ConversationInbox";

export default function DashboardMessagesInbox({
  title,
  subtitle,
  emptyHint,
  header,
}: {
  title?: string;
  subtitle?: string;
  emptyHint: string;
  header?: ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {header ?? (
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">{title}</h1>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
      )}
      <ConversationInbox emptyHint={emptyHint} />
    </div>
  );
}
