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

  useEffect(() => {
    let mounted = true;
    let latestSession: Session | null = null;

    const applySession = (nextSession: Session | null) => {
      latestSession = nextSession;
      setSession(nextSession);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      applySession(s);

      if (s) {
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      applySession(data.session ?? latestSession);
      setLoading(false);
    }).catch((error) => {
      console.error("Erro ao hidratar sessão", error);
      if (!mounted) return;
      applySession(latestSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log("session", session);
    console.log("user", session?.user ?? null);
    console.log("loading", loading);
  }, [session, loading]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user: session?.user ?? null, session, loading, signOut }),
    [session, loading, signOut],
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
