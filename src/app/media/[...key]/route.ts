import { readStoredFile } from "@/server/storage";

const MEDIA_KEY = /^books\/\d+\/[0-9a-f]{12}-(320|800|1600)\.webp$/;

export async function GET(_: Request, ctx: RouteContext<"/media/[...key]">) {
  const key = (await ctx.params).key.join("/");
  if (!MEDIA_KEY.test(key)) return new Response(null, { status: 404 });
  const data = await readStoredFile(key);
  if (!data) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": "image/webp",
      // Ключ фото случайный и не меняется: файл можно кешировать навсегда.
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
