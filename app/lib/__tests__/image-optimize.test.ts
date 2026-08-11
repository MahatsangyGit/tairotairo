import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { optimizeUploadImage } from "@/lib/image-optimize";
import { optimizeUploadImageDispatched } from "@/lib/image-optimize-dispatch";

describe("optimizeUploadImage", () => {
  it("normalizes jpeg to webp avatar preset", async () => {
    const input = await sharp({
      create: {
        width: 120,
        height: 80,
        channels: 3,
        background: "#335577",
      },
    })
      .jpeg()
      .toBuffer();

    const out = await optimizeUploadImage(input, "avatar");
    expect(out.mime).toBe("image/webp");
    expect(out.extension).toBe(".webp");
    expect(out.width).toBeGreaterThan(0);
    expect(out.height).toBeGreaterThan(0);
    expect(out.sizeBytes).toBe(out.buffer.length);
    expect(out.buffer.buffer instanceof SharedArrayBuffer).toBe(false);
  });
});
describe("optimizeUploadImageDispatched", () => {
  it("uses inline Sharp when IMAGE_OPTIMIZE_MODE=inline", async () => {
    process.env.IMAGE_OPTIMIZE_MODE = "inline";
    const input = await sharp({
      create: {
        width: 40,
        height: 40,
        channels: 3,
        background: "#112233",
      },
    })
      .png()
      .toBuffer();

    const out = await optimizeUploadImageDispatched(input, "cover");
    expect(out.mime).toBe("image/webp");
  });
});
