export const EXPORT_PAGE_SIZE = 200;

export const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

export function idCursorWhere(
  cursorId: string | null
): { id: { gt: string } } | undefined {
  return cursorId ? { id: { gt: cursorId } } : undefined;
}

export function providerIdCursorWhere(
  cursorId: string | null
): { providerId: { gt: string } } | undefined {
  return cursorId ? { providerId: { gt: cursorId } } : undefined;
}

export async function collectAsyncRows(
  iter: AsyncIterable<unknown[]>
): Promise<unknown[][]> {
  const rows: unknown[][] = [];
  for await (const row of iter) rows.push(row);
  return rows;
}
