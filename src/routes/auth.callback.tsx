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

        // PKCE flow: exchange authorization code for session
        if (code) {
          console.log("[auth/callback] PKCE code found, exchanging for session...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;
          if (error) {
            console.error("[auth/callback] exchangeCodeForSession error:", error.message);
          }
          if (!error && data.session) {
            console.log("[auth/callback] Session established via PKCE, redirecting to /painel");
            // Clean the URL before navigating
            window.history.replaceState({}, document.title, "/auth/callback");
            return go("/painel");
          }
        }

        // Implicit flow fallback: tokens in URL hash
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");

        if (access_token && refresh_token) {
          console.log("[auth/callback] Implicit tokens found in hash, setting session...");
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (cancelled) return;
          if (error) {
            console.error("[auth/callback] setSession error:", error.message);
          }
          if (!error && data.session) {
            console.log("[auth/callback] Session established via implicit flow, redirecting to /painel");
            window.history.replaceState({}, document.title, "/auth/callback");
            return go("/painel");
          }
        }

        // Last resort: check if session already exists (e.g., detectSessionInUrl handled it)
        console.log("[auth/callback] Checking existing session...");
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          console.log("[auth/callback] Existing session found, redirecting to /painel");
          return go("/painel");
        }

        // No session found — redirect to login
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
