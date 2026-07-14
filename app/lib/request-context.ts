import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export type RequestContext = {
  requestId: string;
  userId?: string;
};

const requestStorage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(
  ctx: RequestContext,
  fn: () => Promise<T>
): Promise<T> {
  return requestStorage.run(ctx, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return requestStorage.getStore();
}

export function getRequestId(): string | undefined {
  return requestStorage.getStore()?.requestId;
}

export function createRequestId(incoming?: string | null): string {
  const trimmed = incoming?.trim();
  if (trimmed && /^[\w\-.=]{8,128}$/.test(trimmed)) return trimmed;
  return randomUUID();
}
