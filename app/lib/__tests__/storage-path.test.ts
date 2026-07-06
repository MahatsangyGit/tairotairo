import { describe, expect, it } from "vitest";
import {
  assertSafeStorageId,
  InvalidStorageIdError,
  resolveStoragePath,
} from "@/lib/storage-path";
import path from "path";

describe("storage-path", () => {
  it("rejects path traversal in storage id", () => {
    expect(() => assertSafeStorageId("../etc")).toThrow(InvalidStorageIdError);
    expect(() => assertSafeStorageId("foo/bar")).toThrow(InvalidStorageIdError);
  });

  it("accepts valid cuid", () => {
    expect(() =>
      assertSafeStorageId("clh9k2x3y0000qj8z8z8z8z8z")
    ).not.toThrow();
  });

  it("keeps resolved path under root", () => {
    const root = path.join(process.cwd(), "storage", "avatars");
    const resolved = resolveStoragePath(root, "clh9k2x3y0000qj8z8z8z8z8z");
    expect(resolved.startsWith(path.resolve(root))).toBe(true);
  });
});
