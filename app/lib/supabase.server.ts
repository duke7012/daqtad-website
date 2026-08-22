const TIMEOUT = 8000;

export function getConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim() ?? "";
  const key = process.env.SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function isConfigured(): boolean {
  return getConfig() !== null;
}

export async function rest<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    prefer?: string;
    accessToken?: string;
  } = {},
): Promise<T | null> {
  const cfg = getConfig();
  if (!cfg) throw new Error("Database is not configured");

  const token = options.accessToken || cfg.key;
  const headers: Record<string, string> = {
    apikey: cfg.key,
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.prefer) headers.Prefer = options.prefer;

  const response = await fetch(`${cfg.url}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${response.status}: ${text}`);
  }
  return response.status === 204 ? null : ((await response.json()) as T);
}

export function withTimeout<T>(promise: Promise<T>, ms = TIMEOUT): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Database request timed out"));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
