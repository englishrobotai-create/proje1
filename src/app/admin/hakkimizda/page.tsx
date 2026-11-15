import { redirect } from "next/navigation";
import { AboutForm } from "@/components/admin/AboutForm";
import { AboutPhotoForm } from "@/components/admin/AboutPhotoForm";
import {
  PHOTO_MAX_BYTES,
  SAMPLE_PHOTO_SRC,
  getAboutPhoto,
} from "@/lib/about-photo";
import { getSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const [settings, photo] = await Promise.all([getSiteSettings(), getAboutPhoto()]);

  return (
    <>
      <div className="admin-top">
        <h2>Hakkımda Sayfası</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760, marginBottom: "1.25rem" }}>
        <h3 className="admin-subtitle" style={{ margin: "0 0 0.9rem" }}>
          Fotoğraf
        </h3>
        <AboutPhotoForm
          show={photo.show}
          hasUpload={photo.ext !== null}
          version={photo.version}
          sampleSrc={SAMPLE_PHOTO_SRC}
          maxMb={PHOTO_MAX_BYTES / 1024 / 1024}
        />
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <AboutForm settings={settings} />
      </div>
    </>
  );
}
