import { getSession } from "@/lib/auth";
import { getFile, markFileRead } from "@/lib/portal-db";
import { fileResponse, readStored } from "@/lib/portal-files";

// Yönetici dosya indirir. Yetkisizse hiçbir ayrıntı vermeden 404 döner.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("Bulunamadı", { status: 404 });

  const { id } = await params;
  const file = await getFile(id);
  if (!file) return new Response("Bulunamadı", { status: 404 });

  const bytes = await readStored(file);
  if (!bytes) return new Response("Dosya diskte bulunamadı", { status: 404 });

  // Mükellefin yüklediği belgeyi ofis açınca "yeni" işareti kalkar.
  if (file.direction === "from_mukellef") await markFileRead(file.id);
  return fileResponse(file, bytes);
}
