import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Хранилище фото — том на сервере (PRD, раздел 11). Всё остальное знает только ключи:
// чтобы переехать в Object Storage, достаточно переписать этот файл.

const KEY_PATTERN = /^[a-z0-9/_.-]+$/;

function root() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || path.join(process.cwd(), ".data", "uploads"));
}

function resolve(key: string) {
  if (!KEY_PATTERN.test(key) || key.includes("..")) throw new Error(`bad storage key: ${key}`);
  return path.join(/*turbopackIgnore: true*/ root(), key);
}

export async function putFile(key: string, data: Buffer) {
  const file = resolve(key);
  await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ file, data);
}

export async function readStoredFile(key: string) {
  try {
    return await readFile(/*turbopackIgnore: true*/ resolve(key));
  } catch {
    return null;
  }
}

/** Удаляет файл или папку целиком, например все фото книги. */
export async function removeFiles(prefix: string) {
  await rm(/*turbopackIgnore: true*/ resolve(prefix), { recursive: true, force: true });
}
