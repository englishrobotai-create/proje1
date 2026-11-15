import type { ReactElement } from "react";
import {
  IconBook,
  IconBriefcase,
  IconBuilding,
  IconChart,
  IconPercent,
  IconUsers,
} from "@/components/Icons";

export type Tone = "blue" | "green" | "amber" | "red";
const tones: Tone[] = ["blue", "green", "amber", "red"];

/** Sırayla dönen renk tonu. */
export function toneAt(index: number): Tone {
  return tones[((index % tones.length) + tones.length) % tones.length];
}

/** Hizmet adından uygun ikonu seçer; tanınmazsa çanta. */
export function serviceGlyph(title: string, size: number): ReactElement {
  const t = title.toLocaleLowerCase("tr");
  if (/muhasebe|defter/.test(t)) return <IconBook size={size} />;
  if (/vergi|beyan|kdv|stopaj/.test(t)) return <IconPercent size={size} />;
  if (/bordro|sgk|personel|işçi|sigorta/.test(t)) return <IconUsers size={size} />;
  if (/kuruluş|şirket|ticaret|firma|tescil/.test(t)) return <IconBuilding size={size} />;
  if (/danışman|rapor|analiz|finans|planlama/.test(t)) return <IconChart size={size} />;
  return <IconBriefcase size={size} />;
}
