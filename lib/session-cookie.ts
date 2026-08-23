export function shouldUseSecureSessionCookie(appUrl: string) {
  return new URL(appUrl).protocol === "https:";
}
