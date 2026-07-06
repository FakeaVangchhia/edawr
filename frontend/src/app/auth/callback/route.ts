import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // If next parameter is provided, redirect to that route, default to /admin
  const next = searchParams.get('next') ?? '/admin';

  if (code) {
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      // Catch-all for cookie store or network errors
    }
  }

  // If there's no code or exchange fails, redirect to /admin with error message
  return NextResponse.redirect(`${origin}/admin?error=auth-failed`);
}
