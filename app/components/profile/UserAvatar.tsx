"use client";

import { useState } from "react";
import { buildAvatarApiPath } from "@/lib/avatar";
import OptimizedImage from "@/components/ui/OptimizedImage";

const sizeClasses = {
  xs: "w-7 h-7 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-2xl",
} as const;

const sizePixels = {
  xs: 28,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
} as const;

interface UserAvatarProps {
  name: string;
  avatar: string | null | undefined;
  userId?: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export default function UserAvatar({
  name,
  avatar,
  userId,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const dim = sizeClasses[size];
  const pixels = sizePixels[size];
  const imageSrc = avatar ?? (userId ? buildAvatarApiPath(userId) : null);

  if (imageSrc && !imageFailed) {
    return (
      <OptimizedImage
        src={imageSrc}
        alt={name}
        width={pixels}
        height={pixels}
        sizes={`${pixels}px`}
        className={`${dim} rounded-full object-cover shrink-0 bg-gray-100 ${className}`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-full bg-brand-100 text-brand-600 font-semibold flex items-center justify-center shrink-0 ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
