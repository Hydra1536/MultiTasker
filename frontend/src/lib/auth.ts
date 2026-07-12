import { cookies } from "next/headers";

const ACCESS_TOKEN_COOKIE = "mt_access_token";
const REFRESH_TOKEN_COOKIE = "mt_refresh_token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setAuthCookies(accessToken: string, refreshToken: string): void {
  void cookies().then((cookieStore) => {
    cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
      ...cookieOptions,
      maxAge: 60 * 15,
    });
    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });
  });
}

export function clearAuthCookies(): void {
  void cookies().then((cookieStore) => {
    cookieStore.set(ACCESS_TOKEN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    cookieStore.set(REFRESH_TOKEN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  });
}

export function readAuthCookies() {
  return cookies().then((cookieStore) => ({
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
  }));
}

export function hasTokens() {
  return readAuthCookies().then(({ accessToken, refreshToken }) => Boolean(accessToken && refreshToken));
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return null;
    }
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { exp?: number };
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }
  return payload.exp * 1000 <= Date.now();
}

export async function refreshAuthTokens(refreshToken: string): Promise<{ access: string }> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token.");
  }

  return (await response.json()) as { access: string };
}
