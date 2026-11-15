/**
 * Sosyal medya adresinin gerçek bir hesaba mı, yoksa yer tutucuya mı gittiğini söyler.
 * İstemci bileşenleri de kullanır; bu yüzden veritabanına bağımlı olmamalıdır.
 *
 * Yer tutucu sayılanlar: boş değer, "https://facebook.com/" gibi yalnızca alan adı olan
 * adresler ve "wa.me/905550000000" gibi art arda çok sıfır içeren örnek numaralar.
 * Gerçek bir hesap adresinin her zaman bir yol (path) bölümü vardır.
 */
export function isRealSocialUrl(href: string): boolean {
  const text = href.trim();
  if (!text) return false;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const path = url.pathname.replace(/\/+$/, "");
    if (path.length === 0) return false;
    if (/0{7,}/.test(path)) return false;
    return true;
  } catch {
    return false;
  }
}
