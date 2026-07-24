import { NextResponse } from "next/server";
import { ROLE_COOKIE_NAME } from "../../../../lib/roleToken";

/**
 * Clears the server-set session cookies on logout. `signOut(auth)` on the
 * client tears down the Firebase session and the client-set `__session`
 * cookie, but the signed, httpOnly `__role` cookie can only be removed by the
 * server — otherwise it lingers (up to its 1h TTL) after the user signs out.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ROLE_COOKIE_NAME);
  response.cookies.delete("__session");
  return response;
}
