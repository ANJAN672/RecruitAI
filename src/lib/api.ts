import { supabase } from './supabase';

export async function api(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

export async function safeJson(res: Response): Promise<any> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const msg = res.status === 504 ? 'Request timed out — please try again.'
              : res.status === 502 ? 'Server error — please try again.'
              : `Server error (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}

export function parseJSON<T>(str: string, fallback: T): T {
  try { return JSON.parse(str); } catch { return fallback; }
}
