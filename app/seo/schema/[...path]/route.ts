import { resolveSeoSchema } from "@/lib/seo-schema-routes";

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { path } = await params;
  const result = await resolveSeoSchema(path);

  if (!result) {
    return new Response("Not found", { status: 404 });
  }

  const swr = result.cacheSeconds * 2;

  return new Response(JSON.stringify(result.data), {
    headers: {
      "Content-Type": "application/ld+json; charset=utf-8",
      "Cache-Control": `public, s-maxage=${result.cacheSeconds}, stale-while-revalidate=${swr}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
