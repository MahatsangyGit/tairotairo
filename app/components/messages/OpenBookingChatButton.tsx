"use client";

import OpenUserChatButton from "./OpenUserChatButton";

interface OpenBookingChatButtonProps {
  bookingId: string;
  className?: string;
}

export default function OpenBookingChatButton({
  bookingId,
  className,
}: OpenBookingChatButtonProps) {
  return (
    <OpenUserChatButton bookingId={bookingId} className={className} />
  );
}
