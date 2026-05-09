import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ClipboardList, Wand2, BookOpen, FileCheck2, Brain, MessageSquareText,
  Calculator, FileText, Lightbulb, Lock, Crown,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/ferramentas")({
  component: ToolsPage,
  head: () => ({ meta: [{ title: "Ferramentas — GPS Docente Premium" }] }),
});

type Tool = { icon: typeof ClipboardList; title: string; desc: string; premium: boolean };

const tools: Tool[] = [
  { icon: ClipboardList, title: "Plano de aula", desc: "Gere planos completos alinhados à BNCC.", premium: false },
  { icon: Wand2, title: "Gerador de questões", desc: "Crie provas e exercícios em segundos.", premium: false },
  { icon: BookOpen, title: "Sequência didática", desc: "Estruture unidades de ensino.", premium: false },
  { icon: FileCheck2, title: "Rubricas de avaliação", desc: "Critérios claros para avaliar.", premium: true },
  { icon: Brain, title: "IA pedagógica avançada", desc: "Adapte materiais para diferentes perfis.", premium: true },
  { icon: MessageSquareText, title: "Feedback automatizado", desc: "Gere devolutivas personalizadas.", premium: true },
  { icon: Calculator, title: "Diário de notas", desc: "Controle e relatórios de turmas.", premium: true },
  { icon: FileText, title: "Comunicados", desc: "Modelos prontos para famílias.", premium: false },
  { icon: Lightbulb, title: "Ideias criativas", desc: "Banco de atividades inovadoras.", premium: true },
];

function ToolsPage() {
  const { user } = useAuth();
  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const isPremium = subscription?.plan === "premium" && subscription?.status === "active";

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Biblioteca de ferramentas</h1>
          <p className="mt-2 text-muted-foreground">Tudo o que você precisa para sua prática docente.</p>
        </div>
        {!isPremium && (
          <Button asChild className="shadow-soft">
            <Link to="/assinatura"><Crown className="mr-2 h-4 w-4" /> Desbloquear Premium</Link>
          </Button>
        )}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => {
          const locked = t.premium && !isPremium;
          return (
            <div
              key={t.title}
              className={`group relative overflow-hidden rounded-2xl border border-border p-6 transition-all ${
                locked ? "bg-muted/40" : "bg-gradient-card hover:shadow-elegant hover:-translate-y-0.5"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                }`}>
                  <t.icon className="h-5 w-5" />
                </div>
                {t.premium && (
                  <Badge variant="outline" className={
                    isPremium
                      ? "bg-gradient-premium border-transparent text-premium-foreground"
                      : "border-premium/40 bg-premium/10 text-premium"
                  }>
                    <Crown className="mr-1 h-3 w-3" /> Premium
                  </Badge>
                )}
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>

              {locked && (
                <div className="mt-5 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  Disponível no plano Premium
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
