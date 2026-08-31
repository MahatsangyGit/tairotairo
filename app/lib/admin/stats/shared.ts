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
