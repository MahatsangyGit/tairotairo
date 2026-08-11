import { describe, expect, it } from "vitest";
import { toIsolatedBuffer } from "@/lib/isolated-buffer";

describe("toIsolatedBuffer", () => {
  it("copie hors SharedArrayBuffer pour undici / Vercel Blob", () => {
    const sab = new SharedArrayBuffer(4);
    const view = new Uint8Array(sab);
    view.set([10, 20, 30, 40]);

    const isolated = toIsolatedBuffer(view);

    expect(isolated).toBeInstanceOf(Buffer);
    expect([...isolated]).toEqual([10, 20, 30, 40]);
    expect(isolated.buffer).toBeInstanceOf(ArrayBuffer);
    expect(isolated.buffer instanceof SharedArrayBuffer).toBe(false);
  });

  it("copie un Buffer classique sans partager la mémoire", () => {
    const source = Buffer.from([1, 2, 3]);
    const isolated = toIsolatedBuffer(source);
    source[0] = 99;
    expect(isolated[0]).toBe(1);
  });
});
