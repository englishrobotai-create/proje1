// Basit bellek içi sınırlayıcı. Tek süreçli (tek VPS) kurulum için yeterlidir;
// sunucu yeniden başlayınca sıfırlanır. Süresi dolan kayıtlar düzenli olarak silinir.
const hits = new Map<string, number[]>();
let lastSweep = 0;
const SWEEP_EVERY_MS = 60_000;

export function allowRequest(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): boolean {
  if (now - lastSweep >= SWEEP_EVERY_MS) {
    lastSweep = now;
    for (const [mapKey, times] of hits) {
      if (times.every((time) => now - time >= windowMs)) hits.delete(mapKey);
    }
  }

  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
