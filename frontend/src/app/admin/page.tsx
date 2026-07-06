'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import AdminLogin from '@/components/AdminLogin';
import { AdminSession } from '@/types';
import { ADMIN_SESSION_KEY } from '@/lib/auth';
import { createClient } from '@/utils/supabase/client';

export default function AdminPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [errorParam, setErrorParam] = useState<string | null>(null);

  const supabase = createClient();

  // Check for oauth/callback errors in the URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        setErrorParam(
          err === 'auth-failed'
            ? 'Google authentication failed. Please try again.'
            : decodeURIComponent(err)
        );
        // Clear the error parameter from URL to prevent showing on refresh
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  useEffect(() => {
    // Load session storage and sync with Supabase Auth client-side only
    if (typeof window !== 'undefined') {
      const syncSession = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user) {
            const adminSession: AdminSession = {
              username: session.user.email || '',
              accessToken: session.access_token,
            };
            setAdminUser(adminSession);
            window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminSession));
          } else {
            // Check fallback for session storage
            const rawValue = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
            if (rawValue) {
              try {
                const session = JSON.parse(rawValue) as AdminSession;
                setAdminUser(session);
              } catch {
                window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
              }
            }
          }
        } catch {
          // Ignore sync errors
        } finally {
          setIsInitialized(true);
        }
      };
      syncSession();
    }
  }, [supabase.auth]);

  const handleLogin = (session: AdminSession) => {
    setAdminUser(session);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    }
  };

  const handleLogout = async () => {
    setAdminUser(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
    await supabase.auth.signOut();
  };

  const handleBackToStore = () => {
    router.push('/');
  };

  if (!isInitialized) {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen">
        <p className="text-slate-500 font-medium animate-pulse">Loading console...</p>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen">
      {adminUser ? (
        <AdminShell
          adminUser={adminUser}
          onBackToStore={handleBackToStore}
          onLogout={handleLogout}
        />
      ) : (
        <AdminLogin
          onBackToStore={handleBackToStore}
          onLogin={handleLogin}
          initialError={errorParam}
        />
      )}
    </div>
  );
}

