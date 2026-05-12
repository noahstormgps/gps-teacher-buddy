import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Entrar — GPS Docente Premium" }] }),
});

function LoginPage() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!loading && (user || session)) {
      navigate({ to: "/painel", replace: true });
    }
  }, [user, session, loading, navigate]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Digite seu e-mail para continuar.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback",
        shouldCreateUser: true,
      },
    });
    setBusy(false);
    if (error) {
      console.error("[login] signInWithOtp error:", error.message);
      toast.error("Não foi possível enviar o link. Verifique o e-mail e tente novamente.");
    } else {
      setSent(true);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Compass className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-soft">
            <Compass className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-semibold">GPS Docente</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-gradient-card p-8 shadow-elegant md:p-10">

            {sent ? (
              // Success state — link sent
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">Verifique seu e-mail</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Enviamos um link de acesso para <strong>{email}</strong>.<br />
                  Clique no link para entrar no GPS Docente.
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Não recebeu? Verifique a pasta de spam ou{" "}
                  <button
                    onClick={() => setSent(false)}
                    className="underline hover:text-foreground transition-colors"
                  >
                    tente novamente
                  </button>
                  .
                </p>
              </div>
            ) : (
              // Email form
              <>
                <h1 className="font-display text-3xl font-semibold tracking-tight">Bem-vindo, professor</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Digite seu e-mail e enviaremos um link de acesso instantâneo.
                </p>

                <form onSubmit={handleMagicLink} className="mt-8 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="bg-surface"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={busy}
                    size="lg"
                    className="w-full"
                  >
                    {busy ? "Enviando..." : "Enviar link de acesso"}
                  </Button>
                </form>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Ao entrar você concorda com nossos termos e política de privacidade.
                </p>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">← Voltar para o início</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
