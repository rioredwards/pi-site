export function safeAuthRedirect(url: string, baseUrl: string): string {
  try {
    const base = new URL(baseUrl);
    const target = new URL(url, base);
    if (
      target.origin !== base.origin ||
      target.username ||
      target.password ||
      !["http:", "https:"].includes(target.protocol)
    )
      return baseUrl;
    target.searchParams.delete("callbackUrl");
    return target.pathname === "/" ? baseUrl : target.toString();
  } catch {
    return baseUrl;
  }
}
