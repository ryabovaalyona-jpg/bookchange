import { lookupBooks } from "@/lib/book-lookup";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3 || query.length > 100) {
    return Response.json({ suggestions: [] });
  }
  return Response.json({ suggestions: await lookupBooks(query) });
}
