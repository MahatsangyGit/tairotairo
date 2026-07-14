import { describe, expect, it } from "vitest";
import {
  isUploadApiPath,
  maxBodyBytesForPath,
  MAX_API_BODY_BYTES,
  MAX_UPLOAD_BODY_BYTES,
} from "@/lib/request-limits";
import { rejectOversizedApiBody } from "@/lib/http-security";

describe("request body limits", () => {
  it("keeps JSON APIs at 1 MiB", () => {
    expect(maxBodyBytesForPath("/api/bookings")).toBe(MAX_API_BODY_BYTES);
    expect(isUploadApiPath("/api/bookings")).toBe(false);
  });

  it("allows larger bodies on cover and media upload routes", () => {
    expect(isUploadApiPath("/api/services/abc123/cover")).toBe(true);
    expect(isUploadApiPath("/api/requests/abc123/cover")).toBe(true);
    expect(isUploadApiPath("/api/users/me/avatar")).toBe(true);
    expect(isUploadApiPath("/api/provider/portfolio")).toBe(true);
    expect(isUploadApiPath("/api/provider/kyc/upload")).toBe(true);
    expect(maxBodyBytesForPath("/api/services/abc123/cover")).toBe(
      MAX_UPLOAD_BODY_BYTES
    );
  });

  it("rejects a 2 MiB JSON body but accepts a 2 MiB cover upload", () => {
    const headers = { "content-length": String(2 * 1024 * 1024) };
    expect(
      rejectOversizedApiBody("POST", "/api/bookings", headers)
    ).toBe(true);
    expect(
      rejectOversizedApiBody("POST", "/api/services/cuidcovertestid0001/cover", headers)
    ).toBe(false);
  });

  it("rejects cover uploads above the upload ceiling", () => {
    const headers = { "content-length": String(MAX_UPLOAD_BODY_BYTES + 1) };
    expect(
      rejectOversizedApiBody("POST", "/api/services/cuidcovertestid0001/cover", headers)
    ).toBe(true);
  });

  it("rejects upload paths when Content-Length is missing", () => {
    expect(
      rejectOversizedApiBody("POST", "/api/users/me/avatar", {})
    ).toBe(true);
    expect(
      rejectOversizedApiBody("POST", "/api/bookings", {})
    ).toBe(false);
  });
});
