import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Fallback to placeholder credentials during Next.js static prerendering
  // to prevent build crashes when env variables are not yet defined.
  if (!supabaseUrl || !supabaseKey) {
    return createServerClient(
      "https://placeholder-project.supabase.co",
      "placeholder-anon-key",
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      }
    );
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
