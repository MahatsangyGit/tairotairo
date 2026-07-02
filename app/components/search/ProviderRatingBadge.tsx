import { StarIcon } from "@/components/ui/app-icons";

interface ProviderRatingBadgeProps {
  averageRating: number | null;
  reviewCount: number;
  className?: string;
}

export default function ProviderRatingBadge({
  averageRating,
  reviewCount,
  className = "",
}: ProviderRatingBadgeProps) {
  if (averageRating == null || reviewCount === 0) {
    return (
      <span className={`text-xs text-muted-foreground ${className}`}>
        Pas encore noté
      </span>
    );
  }

  return (
    <span
      className={`text-xs font-medium text-amber-600 ${className}`}
      title={`${reviewCount} avis`}
    >
      <StarIcon /> {averageRating.toFixed(1)} ({reviewCount})
    </span>
  );
}
