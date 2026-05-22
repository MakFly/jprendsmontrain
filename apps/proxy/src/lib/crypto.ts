import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { config } from "../config.js";

const secret = new TextEncoder().encode(config.sessionSecret);
const ALG = "HS256";

export interface SessionPayload extends JWTPayload {
  sid: string;
}

export async function signSessionToken(sessionId: string): Promise<string> {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
