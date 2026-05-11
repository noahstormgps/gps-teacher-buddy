import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const checkedAfterHydration = useRef(false);

  useEffect(() => {
    if (loading || user || checkedAfterHydration.current) return;

    checkedAfterHydration.current = true;
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && !data.session) navigate({ to: "/login", replace: true });
    });

    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate]);

  if (loading || (!user && !session)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Compass className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Outlet />
    </div>
  );
}
