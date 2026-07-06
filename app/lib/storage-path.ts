import path from "path";

const CUID_PATTERN = /^c[a-z0-9]{24,}$/;

export class InvalidStorageIdError extends Error {
  constructor(message = "Identifiant invalide") {
    super(message);
    this.name = "InvalidStorageIdError";
  }
}

/** Reject path traversal and non-CUID ids used as storage directory segments. */
export function assertSafeStorageId(id: string): void {
  if (!id || id.length > 64) {
    throw new InvalidStorageIdError();
  }
  if (id.includes("..") || id.includes("/") || id.includes("\\")) {
    throw new InvalidStorageIdError();
  }
  if (!CUID_PATTERN.test(id)) {
    throw new InvalidStorageIdError();
  }
}

/** Resolve a path under root and ensure it cannot escape root. */
export function resolveStoragePath(root: string, ...segments: string[]): string {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...segments);
  const relative = path.relative(resolvedRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new InvalidStorageIdError();
  }
  return resolved;
}
