import UserAvatar from "@/components/profile/UserAvatar";
import { StarIcon } from "@/components/ui/app-icons";
import { formatRelativeFr } from "@/lib/datetime-relative";
import type { HomeReviewCard } from "@/lib/featured-home";

export default function HomeReviewsFeed({
  reviews,
}: {
  reviews: HomeReviewCard[];
}) {
  if (reviews.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8 text-center">
        <p className="text-brand-600 text-xs font-semibold uppercase tracking-widest mb-2">
          Avis clients
        </p>
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          Un niveau de satisfaction élevé
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <UserAvatar
                name={review.provider.name}
                avatar={review.provider.avatar}
                size="md"
              />
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {review.provider.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {review.category ? `${review.category}` : "Prestation"}
                  {review.location ? ` · ${review.location}` : ""}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground line-clamp-1">
              {review.serviceTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-4">
              {review.comment}
            </p>
            <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-amber-600">
                <StarIcon /> {review.rating.toFixed(1)}
              </span>
              <span>
                Par {review.authorName},{" "}
                {formatRelativeFr(new Date(review.createdAt))}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
