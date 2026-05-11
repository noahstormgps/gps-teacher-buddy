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

    const run = async () => {
      try {
        const search = new URLSearchParams(window.location.search);
        const code = search.get("code");

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;
          if (!error && data.session) {
            window.history.replaceState({}, document.title, "/auth/callback");
            return go("/painel");
          }
        }

        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (cancelled) return;
          if (!error && data.session) {
            window.history.replaceState({}, document.title, "/auth/callback");
            return go("/painel");
          }
        }

        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) return go("/painel");

        go("/login");
      } catch (err) {
        console.error("[auth/callback] error", err);
        if (!cancelled) go("/login");
      }
    };

    run();
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
