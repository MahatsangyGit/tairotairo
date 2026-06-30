import { headers } from "next/headers";
import { connection } from "next/server";

export default async function JsonLd({ data }: { data: object | object[] }) {
  await connection();

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const payload = Array.isArray(data) ? data : [data];

  return (
    <>
      {payload.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
