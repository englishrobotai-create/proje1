/** Dekoratif yuvarlak mühür (yavaş döner). Renk: currentColor. */
export function Seal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <path id="seal-circle" d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0" />
      </defs>
      <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="100" cy="100" r="87" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <text fontSize="13.5" fontWeight="800" fill="currentColor" textLength="432" lengthAdjust="spacing">
        <textPath href="#seal-circle">MALİ MÜŞAVİRLİK ★ VERGİ ★ MUHASEBE ★</textPath>
      </text>
      <text
        x="100"
        y="109"
        textAnchor="middle"
        fontSize="27"
        fontWeight="800"
        letterSpacing="1.5"
        fill="currentColor"
      >
        SMMM
      </text>
    </svg>
  );
}
