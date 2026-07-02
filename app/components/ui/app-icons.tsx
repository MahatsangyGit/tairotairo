import { IconMapPin, IconStarFilled } from "@tabler/icons-react";

/**
 * Icônes utilitaires partagées (Tabler Icons) pour garder un style
 * uniforme dans toute l'app : trait 1.8, alignées sur le texte.
 */

interface InlineIconProps {
  size?: number;
  className?: string;
}

export function MapPinIcon({ size = 14, className = "" }: InlineIconProps) {
  return (
    <IconMapPin
      size={size}
      stroke={1.8}
      aria-hidden
      className={`inline-block align-[-2px] shrink-0 ${className}`}
    />
  );
}

export function StarIcon({ size = 13, className = "" }: InlineIconProps) {
  return (
    <IconStarFilled
      size={size}
      aria-hidden
      className={`inline-block align-[-1.5px] shrink-0 ${className}`}
    />
  );
}
