import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { PHOTO_WIDTHS, storeBookPhoto } from "@/server/photos";

/** JPEG с EXIF: координаты съёмки, модель камеры и поворот. */
export async function photoWithGps() {
  return sharp({ create: { width: 1200, height: 900, channels: 3, background: "#d9b36a" } })
    .withExif({
      IFD0: { Make: "TestCam", Model: "Secret Phone" },
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: "55/1 49/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "37/1 19/1 0/1" },
    })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
}

// В сохранённых файлах нет метаданных, включая координаты (PRD, раздел 6, «Готово, когда»).
describe("обработка фото", () => {
  it("снимает метаданные и готовит три размера WebP", async () => {
    const input = await photoWithGps();
    expect((await sharp(input).metadata()).exif).toBeDefined();

    const stored = await storeBookPhoto(999, input);
    for (const width of PHOTO_WIDTHS) {
      const file = await readFile(path.join(".data/test-uploads", `${stored.path}-${width}.webp`));
      const meta = await sharp(file).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.exif).toBeUndefined();
      expect(meta.xmp).toBeUndefined();
      expect(meta.iptc).toBeUndefined();
      expect(file.includes(Buffer.from("Secret Phone"))).toBe(false);
      expect(file.includes(Buffer.from("GPS"))).toBe(false);
    }
  });

  it("поворачивает по метаданным: 1200×900 с поворотом 6 становится вертикальным", async () => {
    const stored = await storeBookPhoto(998, await photoWithGps());
    expect(stored.height).toBeGreaterThan(stored.width);
  });

  it("не принимает не-картинку", async () => {
    await expect(storeBookPhoto(997, Buffer.from("not an image"))).rejects.toThrow("Не получилось открыть фото");
  });
});
