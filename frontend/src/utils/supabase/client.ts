import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Fallback to placeholder credentials during Next.js static prerendering
  // to prevent build crashes when env variables are not yet defined.
  if (!supabaseUrl || !supabaseKey) {
    return createBrowserClient(
      "https://placeholder-project.supabase.co",
      "placeholder-anon-key"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
};
