import Link from "next/link";
import { headers } from "next/headers";
import { getMarketplaceHomeHref } from "@/lib/origins";

const CLASS_NAME =
  "text-sm text-muted-foreground hover:text-foreground";

/** Retour Tairo ampio sans changer d'hôte (préserve le cookie de session). */
export default async function MarketplaceHomeLink() {
  const href = getMarketplaceHomeHref((await headers()).get("host"));
  const label = "← Tairo ampio";

  if (href.startsWith("http")) {
    return (
      <a href={href} className={CLASS_NAME}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={CLASS_NAME}>
      {label}
    </Link>
  );
}
