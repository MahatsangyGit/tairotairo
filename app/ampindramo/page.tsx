import Link from "next/link";
import { searchEquipment, serializeEquipment, EQUIPMENT_CATEGORY_LABELS } from "@/lib/rental/equipment";
import { EQUIPMENT_CATEGORIES } from "@/lib/schemas/rental";
import { Button } from "@/components/ui/button";
import AmpindramoSearch from "@/ampindramo/AmpindramoSearch";

export const dynamic = "force-dynamic";

export default async function AmpindramoHomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const result = await searchEquipment({
    search: params.search,
    category: params.category,
    page,
    limit: 12,
  });
  const items = result.items.map(serializeEquipment);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Location de matériel
        </p>
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
          Empruntez l&apos;outil qu&apos;il vous faut
        </h1>
        <p className="text-muted-foreground">
          Catalogue Tairo et prêt entre particuliers. Compte Tairo ampio requis
          pour réserver.
        </p>
      </div>

      <AmpindramoSearch
        initialSearch={params.search ?? ""}
        initialCategory={params.category ?? ""}
        categories={EQUIPMENT_CATEGORIES.map((c) => ({
          value: c,
          label: EQUIPMENT_CATEGORY_LABELS[c] ?? c,
        }))}
      />

      {items.length === 0 ? (
        <p className="text-muted-foreground">Aucun matériel publié pour le moment.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/ampindramo/materiel/${item.id}`}
                className="block overflow-hidden rounded-xl border border-border bg-card transition hover:border-brand-500"
              >
                <div className="aspect-[4/3] bg-muted">
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {item.categoryLabel}
                    </span>
                    {item.isPlatformOwned ? (
                      <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                        Tairo
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mb-1 font-semibold leading-snug">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">{item.location}</p>
                  <p className="mt-2 text-sm font-medium">
                    {item.dailyPrice.toLocaleString("fr-MG")} Ar / jour
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · caution {item.depositAmount.toLocaleString("fr-MG")} Ar
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {result.totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          {page > 1 ? (
            <Button asChild variant="outline">
              <Link
                href={`/ampindramo?page=${page - 1}${params.search ? `&search=${encodeURIComponent(params.search)}` : ""}${params.category ? `&category=${params.category}` : ""}`}
              >
                Précédent
              </Link>
            </Button>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {page} / {result.totalPages}
          </span>
          {page < result.totalPages ? (
            <Button asChild variant="outline">
              <Link
                href={`/ampindramo?page=${page + 1}${params.search ? `&search=${encodeURIComponent(params.search)}` : ""}${params.category ? `&category=${params.category}` : ""}`}
              >
                Suivant
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
