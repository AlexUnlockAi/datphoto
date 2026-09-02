import "server-only";

// Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically; NEXT_PUBLIC_SITE_URL
// is an escape hatch for a future custom domain. Server-side only — client
// components should keep using window.location.origin (see CopyLinkButton).
export function siteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://dat-photo-command-center.vercel.app");
  return `${base}${path}`;
}
