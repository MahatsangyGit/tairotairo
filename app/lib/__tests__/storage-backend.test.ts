import { afterEach, describe, expect, it } from "vitest";
import {
  resetStorageBackendForTests,
  resolveStorageBackendMode,
} from "@/lib/storage/backend";

describe("resolveStorageBackendMode", () => {
  afterEach(() => {
    resetStorageBackendForTests();
  });

  it("defaults to local outside Vercel", () => {
    expect(resolveStorageBackendMode({})).toBe("local");
  });

  it("uses blob on Vercel when Blob credentials exist", () => {
    expect(
      resolveStorageBackendMode({
        VERCEL: "1",
        BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_test",
      })
    ).toBe("blob");
  });

  it("honors explicit STORAGE_BACKEND", () => {
    expect(
      resolveStorageBackendMode({
        VERCEL: "1",
        BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_test",
        STORAGE_BACKEND: "s3",
      })
    ).toBe("s3");
  });

  it("rejects unknown backends", () => {
    expect(() =>
      resolveStorageBackendMode({ STORAGE_BACKEND: "ftp" })
    ).toThrow(/invalide/);
  });
});
