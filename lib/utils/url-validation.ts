/**
 * Allowed avatar image hosts that support SVG and should skip Next.js optimization.
 * These hosts are checked exactly to prevent URL substring bypass attacks (CWE-20).
 */
const ALLOWED_SVG_HOSTS = ['api.dicebear.com', 'avatars.dicebear.com']

/**
 * Checks if a URL should skip Next.js image optimization.
 * This includes SVG files and URLs from trusted avatar providers like DiceBear.
 *
 * Uses proper URL parsing to prevent substring bypass attacks.
 * For example, "http://evil.com/dicebear.com" or "http://dicebear.com.evil.com"
 * will correctly return false.
 *
 * @param url - The URL to check
 * @returns true if the image should be unoptimized (SVG or trusted avatar host)
 */
export function shouldSkipImageOptimization(url: string | null | undefined): boolean {
  if (!url) return false

  // Check for SVG file extension
  if (url.includes('.svg')) return true

  // Parse URL and check hostname against allowed list
  try {
    const parsedUrl = new URL(url)
    return ALLOWED_SVG_HOSTS.includes(parsedUrl.hostname)
  } catch {
    // Invalid URL - don't skip optimization
    return false
  }
}
