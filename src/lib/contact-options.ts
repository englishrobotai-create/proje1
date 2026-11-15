// İletişim (görüşme talebi) formundaki seçenekler. Hem form hem sunucu eylemi kullanır.
export const CONTACT_CHANNELS = [
  "Telefonla",
  "E-postayla",
  "Ofiste yüz yüze",
] as const;

export const CONTACT_TIMES = [
  "Fark etmez",
  "Sabah saatleri",
  "Öğleden sonra",
] as const;

export const GENERAL_SUBJECT = "Genel bilgi almak istiyorum";

export function pickOption<T extends readonly string[]>(
  list: T,
  value: unknown,
): T[number] {
  const text = String(value ?? "");
  return (list as readonly string[]).includes(text) ? text : list[0];
}
