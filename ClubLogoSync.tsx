import { useEffect } from 'react';

const DEFAULT_LOGO = 'https://s3.thr3.sotoon.ir/app-builder/icons/3b0f6123-0712-4712-8e02-928fb8751be2/mtlc642p.png';

function applyClubLogo(url: string) {
  document.querySelectorAll<HTMLImageElement>('img[alt="نشان رسمی باشگاه فوتبال ایرانمهر"]').forEach((image) => {
    image.src = url;
  });
}

export default function ClubLogoSync() {
  useEffect(() => {
    let active = true;
    let logoUrl = DEFAULT_LOGO;

    const observer = new MutationObserver(() => applyClubLogo(logoUrl));
    observer.observe(document.body, { childList: true, subtree: true });

    const loadLogo = async () => {
      try {
        const response = await fetch('/api/content');
        if (!response.ok) return;
        const data = await response.json() as { items?: Array<{ kind?: string; logo?: unknown }> };
        const club = data.items?.find((item) => item.kind === 'club');
        if (club && typeof club.logo === 'string' && club.logo.trim()) {
          logoUrl = club.logo;
          applyClubLogo(logoUrl);
        }
      } catch {
        // The visible app keeps its current club mark if content is unavailable.
      }
    };

    void loadLogo();
    if (active) applyClubLogo(logoUrl);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);

  return null;
}
