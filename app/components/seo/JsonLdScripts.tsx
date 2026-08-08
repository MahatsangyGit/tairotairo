type SchemaPath = readonly string[];

function toSrc(segments: SchemaPath): string {
  return `/seo/schema/${segments.join("/")}`;
}

export default function JsonLdScripts({
  paths,
}: {
  paths: readonly SchemaPath[];
}) {
  return (
    <>
      {paths.map((segments) => (
        // JSON-LD must be present in the server-rendered HTML for crawlers.
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script
          key={toSrc(segments)}
          src={toSrc(segments)}
          type="application/ld+json"
        />
      ))}
    </>
  );
}
