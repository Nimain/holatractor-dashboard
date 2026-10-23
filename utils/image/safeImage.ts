/**
 * Utility to safely validate and sanitize image sources for Next.js <Image /> components.
 * Prevents unhandled runtime errors when backend returns placeholder/test strings like "test", "Imagelink", etc.
 */
export function isValidImageSrc(src?: any): boolean {
  if (!src || typeof src !== "string") return false;
  const s = src.trim();
  if (
    s === "" ||
    s.toLowerCase() === "test" ||
    s.toLowerCase() === "imagelink" ||
    s.toLowerCase() === "null" ||
    s.toLowerCase() === "undefined" ||
    s.toLowerCase() === "no" ||
    s.toLowerCase() === "n/a" ||
    s.startsWith("file://") ||
    s.startsWith("file:/")
  ) {
    return false;
  }
  return (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("/") ||
    s.startsWith("data:image/")
  );
}

export function getSafeImageSrc(
  src?: any,
  fallback = "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=1200&q=80"
): string {
  if (isValidImageSrc(src)) {
    return src.trim();
  }
  return fallback;
}
