import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/seo";

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground mb-4">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden="true">/</span>}
              {isLast ? (
                <span className="text-foreground font-medium">{item.name}</span>
              ) : (
                <Link
                  href={item.path}
                  className="hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
