import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/assinatura")({
  component: SubscriptionPage,
  head: () => ({ meta: [{ title: "Assinatura — GPS Docente Premium" }] }),
});

const freeFeatures = [
  "Plano de aula básico",
  "Gerador de questões",
  "Sequência didática",
  "Modelos de comunicados",
];
const premiumFeatures = [
  "Tudo do plano gratuito",
  "Rubricas de avaliação inteligentes",
  "IA pedagógica avançada",
  "Feedback automatizado para alunos",
  "Diário de notas e relatórios",
  "Banco de ideias criativas",
  "Suporte prioritário",
  "Atualizações exclusivas",
];

function SubscriptionPage() {
  const { user } = useAuth();
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isPremium = subscription?.plan === "premium" && subscription?.status === "active";

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
          <Sparkles className="h-3.5 w-3.5 text-premium" /> Sua assinatura
        </div>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Escolha o plano ideal para você
        </h1>
        <p className="mt-3 text-muted-foreground">
          Comece grátis ou desbloqueie tudo com o Premium.
        </p>
      </div>

      {/* Status */}
      {!isLoading && subscription && (
        <div className="mt-10 mx-auto max-w-md rounded-2xl border border-border bg-gradient-card p-5 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">Status atual</p>
          <p className="mt-1 font-display text-xl font-semibold capitalize">
            Plano {subscription.plan} · {subscription.status}
          </p>
          {subscription.expires_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              Renova em {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      )}

      {/* Plans */}
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-3xl border border-border bg-gradient-card p-8 shadow-soft">
          <h3 className="font-display text-2xl font-semibold">Gratuito</h3>
          <p className="mt-1 text-sm text-muted-foreground">Para conhecer a plataforma</p>
          <p className="mt-6 font-display text-4xl font-semibold">R$ 0<span className="text-base text-muted-foreground font-normal">/mês</span></p>
          <ul className="mt-6 space-y-3 text-sm">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-primary" /> {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" disabled className="mt-8 w-full">
            {isPremium ? "Disponível" : "Plano atual"}
          </Button>
        </div>

        {/* Premium */}
        <div className="relative overflow-hidden rounded-3xl border border-transparent bg-gradient-hero p-8 text-primary-foreground shadow-elegant">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-premium/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold">Premium</h3>
              <Badge className="bg-gradient-premium border-transparent text-premium-foreground shadow-soft">
                <Crown className="mr-1 h-3 w-3" /> Mais escolhido
              </Badge>
            </div>
            <p className="mt-1 text-sm text-primary-foreground/80">Para o professor que quer mais</p>
            <p className="mt-6 font-display text-4xl font-semibold">
              R$ 29<span className="text-base text-primary-foreground/70 font-normal">,90/mês</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {premiumFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-premium" /> {f}
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 w-full shadow-premium"
              disabled={isPremium}
              onClick={() => {
                // TODO: integrar com checkout da Kiwify
                window.alert("Integração com Kiwify em breve! Em produção, este botão abre o checkout.");
              }}
            >
              {isPremium ? "Você já é Premium" : "Assinar Premium"}
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Cancele quando quiser. Pagamento processado pela Kiwify.
      </p>
    </main>
  );
}
