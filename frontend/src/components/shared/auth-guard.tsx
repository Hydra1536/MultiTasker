import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ACCESS_TOKEN_COOKIE = "mt_access_token";

export async function requireAuth() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }
}

// Client helper to check auth on navigation without immediately redirecting server-side
export function useClientAuthGuard() {
  // lazy import to avoid server usage
  if (typeof window === "undefined") return false;
  const matches = document.cookie.split("; ").find((c) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
  return Boolean(matches);
}
