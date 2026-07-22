export const SESSION_COOKIE = "oakmun_session";

// Web Crypto (globalThis.crypto.subtle) works in both the Node runtime (API
// routes) and the Edge runtime (middleware), so this file is safe to import
// from either.
export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`oakmun-checkin:${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
