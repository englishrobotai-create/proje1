import { getPortalSession } from "@/lib/portal-auth";
import { getFile, markFileRead } from "@/lib/portal-db";
import { fileResponse, readStored } from "@/lib/portal-files";

// Mükellef yalnızca KENDİ dosyalarını indirebilir. Başkasının dosyası, olmayan dosya ve
// oturumsuz istek aynı yanıtı (404) alır; böylece dosyanın var olup olmadığı sızmaz.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getPortalSession();
  if (!session) return new Response("Bulunamadı", { status: 404 });

  const { id } = await params;
  const file = await getFile(id);
  if (!file || file.mukellefId !== session.id || file.hiddenByClientAt) {
    return new Response("Bulunamadı", { status: 404 });
  }

  const bytes = await readStored(file);
  if (!bytes) return new Response("Bulunamadı", { status: 404 });

  if (file.direction === "from_office") await markFileRead(file.id);
  return fileResponse(file, bytes);
}
