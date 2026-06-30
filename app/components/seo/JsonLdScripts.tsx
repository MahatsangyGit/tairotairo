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
        <script
          key={toSrc(segments)}
          src={toSrc(segments)}
          type="application/ld+json"
        />
      ))}
    </>
  );
}
