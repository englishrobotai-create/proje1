import type { SiteSettings } from "@/lib/settings";
import { getActiveSocialLinks } from "@/lib/settings";

function SocialIcon({ name }: { name: string }) {
  switch (name) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M14 8h3V5h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm5.2-.9a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1zM12 9.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5z"
          />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6.5 9.5H4V20h2.5zm-1.25-1A1.5 1.5 0 1 0 3.75 7a1.5 1.5 0 0 0 1.5 1.5zM20 20h-2.5v-5.4c0-1.3-.5-2.2-1.7-2.2a1.8 1.8 0 0 0-1.7 1.2 2 2 0 0 0-.1.8V20H11v-7.8A7.3 7.3 0 0 1 11.2 10c.6-1.2 1.9-2 3.5-2 2.5 0 4.3 1.6 4.3 5.1z"
          />
        </svg>
      );
    case "twitter":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 4h4.1l4 5.6L16.8 4H20l-6.2 7.2L20 20h-4.1l-4.2-5.8L7.2 20H4l6.5-7.5z"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M22 8.2a3 3 0 0 0-2.1-2.1C18.2 5.6 12 5.6 12 5.6s-6.2 0-7.9.5A3 3 0 0 0 2 8.2 31.5 31.5 0 0 0 1.5 12a31.5 31.5 0 0 0 .5 3.8 3 3 0 0 0 2.1 2.1c1.7.5 7.9.5 7.9.5s6.2 0 7.9-.5a3 3 0 0 0 2.1-2.1 31.5 31.5 0 0 0 .5-3.8 31.5 31.5 0 0 0-.5-3.8zM10 15.2V8.8l5.2 3.2z"
          />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 3a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.9-1.3A8.5 8.5 0 1 0 12 3zm4.8 12a6.2 6.2 0 0 1-6.7 1.4l-.5-.2-2.9.8.8-2.8-.2-.5a6.2 6.2 0 1 1 9.5 1.3zm-2.1-3.4c-.1-.2-.5-.3-1-.6s-.6-.2-.8.1l-.5.6c-.2.2-.3.2-.6.1a5 5 0 0 1-1.5-.9 5.5 5.5 0 0 1-1-1.3c-.1-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.2-.5s0-.4-.1-.5l-.6-1.4c-.2-.4-.3-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.1 5 5 0 0 0 1.1 2.6 11.5 11.5 0 0 0 4.4 3.7c.5.2 1 .4 1.4.5a3.3 3.3 0 0 0 1.5.1 2.5 2.5 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c-.1 0-.2-.1-.4-.2z"
          />
        </svg>
      );
    default:
      return null;
  }
}

export function SocialLinks({
  settings,
  variant = "default",
}: {
  settings: SiteSettings;
  variant?: "default" | "light" | "hero";
}) {
  const links = getActiveSocialLinks(settings);
  if (links.length === 0) return null;

  return (
    <div className={`social-links social-${variant}`} aria-label="Sosyal medya">
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
          aria-label={link.label}
          title={link.label}
        >
          <SocialIcon name={link.key} />
        </a>
      ))}
    </div>
  );
}
