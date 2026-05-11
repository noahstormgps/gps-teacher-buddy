import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
  head: () => ({ meta: [{ title: "Entrando…" }] }),
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const go = (path: string) => {
      if (!cancelled) navigate({ to: path, replace: true });
    };

    const check = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (!error && data.session) return go("/painel");
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) return go("/painel");

      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (session) {
          sub.subscription.unsubscribe();
          go("/painel");
        }
      });

      // Safety fallback: give storage hydration enough time before declaring unauthenticated.
      setTimeout(() => {
        if (!cancelled) {
          supabase.auth.getSession().then(({ data }) => {
            if (cancelled) return;
            sub.subscription.unsubscribe();
            go(data.session ? "/painel" : "/login");
          });
        }
      }, 8000);
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Compass className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
