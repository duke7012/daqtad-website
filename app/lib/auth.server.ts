import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getConfig } from "~/lib/supabase.server";

export interface UserClient {
  supabase: SupabaseClient;
  headers: Headers;
}

function cookiePairs(request: Request) {
  return parseCookieHeader(request.headers.get("Cookie") ?? "").map((cookie) => ({
    name: cookie.name,
    value: cookie.value ?? "",
  }));
}

export function createUserClient(request: Request): UserClient {
  const cfg = getConfig();
  if (!cfg) {
    throw new Error("Database is not configured");
  }

  const headers = new Headers();
  const supabase = createServerClient(cfg.url, cfg.key, {
    cookies: {
      getAll() {
        return cookiePairs(request);
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          headers.append("Set-Cookie", serializeCookieHeader(name, value, options));
        }
      },
    },
  });

  return { supabase, headers };
}

export function mergeHeaders(from: Headers, init?: HeadersInit): Headers {
  const merged = new Headers(init);
  from.forEach((value, key) => merged.append(key, value));
  return merged;
}

export async function getUser(request: Request): Promise<{
  user: User | null;
  supabase: SupabaseClient;
  headers: Headers;
}> {
  const { supabase, headers } = createUserClient(request);
  const { data } = await supabase.auth.getUser();
  return { user: data.user ?? null, supabase, headers };
}

export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  return !!data;
}

export async function signIn(request: Request, email: string, password: string) {
  const { supabase, headers } = createUserClient(request);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user ?? null, error: error?.message ?? null, headers };
}

export async function signOut(request: Request) {
  const { supabase, headers } = createUserClient(request);
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null, headers };
}
