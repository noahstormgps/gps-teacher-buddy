import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const user = session?.user ?? null;

  useEffect(() => {
    let mounted = true;

    // Subscribe to auth state changes FIRST (before getSession)
    // This ensures we capture the SIGNED_IN event fired after exchangeCodeForSession
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      console.log("[useAuth] onAuthStateChange:", event, s ? "session OK" : "no session");
      setSession(s);
      // Always stop loading on any auth event
      setLoading(false);
    });

    // Then hydrate from localStorage (synchronous read via getSession)
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("[useAuth] getSession error:", error.message);
      }
      console.log("[useAuth] getSession:", data.session ? "session OK" : "no session");
      setSession(data.session ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error("[useAuth] getSession unexpected error:", error);
      if (!mounted) return;
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, signOut }),
    [user, session, loading, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
