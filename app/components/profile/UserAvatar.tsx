"use client";

const sizeClasses = {
  xs: "w-7 h-7 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-2xl",
} as const;

interface UserAvatarProps {
  name: string;
  avatar: string | null | undefined;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export default function UserAvatar({
  name,
  avatar,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const dim = sizeClasses[size];

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${dim} rounded-full object-cover shrink-0 bg-gray-100 ${className}`}
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
