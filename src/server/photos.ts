import "server-only";

import { randomBytes } from "node:crypto";
import sharp, { type OutputInfo } from "sharp";
import { putFile } from "./storage";

// Обработка фото (PRD, раздел 11): поворот по метаданным, удаление метаданных,
// WebP шириной 320, 800 и 1600 пикселей. `sharp` не переносит метаданные в результат,
// пока не попросить об этом явно, — координаты съёмки не сохраняются.

export const PHOTO_WIDTHS = [320, 800, 1600] as const;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_PHOTOS = 3;

export type StoredPhoto = { path: string; width: number; height: number };

export class PhotoError extends Error {}

export function photoUrl(path: string, width: (typeof PHOTO_WIDTHS)[number] = 800) {
  return `/media/${path}-${width}.webp`;
}

export async function storeBookPhoto(bookId: number, input: Buffer): Promise<StoredPhoto> {
  if (input.byteLength > MAX_PHOTO_BYTES) throw new PhotoError("Фото больше 10 МБ");

  let oriented: { data: Buffer; info: OutputInfo };
  try {
    oriented = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new PhotoError("Не получилось открыть фото");
  }

  const key = `books/${bookId}/${randomBytes(6).toString("hex")}`;
  for (const width of PHOTO_WIDTHS) {
    const data = await sharp(oriented.data)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: width === 320 ? 72 : 80 })
      .toBuffer();
    await putFile(`${key}-${width}.webp`, data);
  }
  const width = Math.min(oriented.info.width, 1600);
  const height = Math.round((oriented.info.height * width) / oriented.info.width);
  return { path: key, width, height };
}
