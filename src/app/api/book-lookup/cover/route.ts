import { coverSourceUrl } from "@/lib/book-lookup";

// Обложка идёт через наш сервер: телефон участника не обращается к чужому сайту.
// Принимаем только числовой id, поэтому запросить произвольный адрес нельзя.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^\d{1,12}$/.test(id)) return new Response(null, { status: 400 });

  try {
    const upstream = await fetch(coverSourceUrl(Number(id)), { signal: AbortSignal.timeout(8000) });
    const type = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || !type.startsWith("image/")) return new Response(null, { status: 404 });
    return new Response(upstream.body, {
      headers: { "content-type": type, "cache-control": "public, max-age=86400" },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
