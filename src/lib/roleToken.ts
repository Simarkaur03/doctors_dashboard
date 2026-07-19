import { SignJWT, jwtVerify } from "jose";

export const ROLE_COOKIE_NAME = "__role";

export type RoleClaims = {
  uid: string;
  role: string | null;
};

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET missing");
  return new TextEncoder().encode(secret);
}

/** Signs a short-lived, server-only assertion of {uid, role} for the __role cookie. */
export async function signRoleToken(claims: RoleClaims): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.uid)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secretKey());
}

/** Verifies the __role cookie's signature; returns null if missing/invalid/expired. */
export async function verifyRoleToken(token: string): Promise<RoleClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    const role = typeof payload.role === "string" ? payload.role : null;
    return { uid: payload.sub, role };
  } catch {
    return null;
  }
}
