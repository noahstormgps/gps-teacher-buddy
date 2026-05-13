import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppSidebar } from "@/components/app-sidebar";
import { Compass } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Só redireciona APÓS o loading terminar e confirmar que não há usuário
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, user, navigate]);

  // Enquanto carrega, mostra spinner
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Compass className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não há usuário após loading, não renderiza nada (o useEffect vai redirecionar)
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar autoral */}
      <AppSidebar />
      {/* Conteúdo principal */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
