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
        // Magic link delivers tokens via URL hash (#access_token=...&refresh_token=...)
        // detectSessionInUrl is disabled; we handle it manually here for reliability
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : "";
        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");

        if (access_token && refresh_token) {
          console.log("[auth/callback] Magic link tokens found, setting session...");
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (cancelled) return;
          if (error) {
            console.error("[auth/callback] setSession error:", error.message);
            return go("/login");
          }
          if (data.session) {
            console.log("[auth/callback] Session established, redirecting to /painel");
            window.history.replaceState({}, document.title, "/auth/callback");
            return go("/painel");
          }
        }

        // Fallback: check if session already exists in storage
        console.log("[auth/callback] No tokens in hash, checking existing session...");
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          console.log("[auth/callback] Existing session found, redirecting to /painel");
          return go("/painel");
        }

        console.warn("[auth/callback] No session found, redirecting to /login");
        go("/login");
      } catch (err) {
        console.error("[auth/callback] Unexpected error:", err);
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
