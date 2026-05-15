import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Shield, FileText, Library, Crown, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/ferramentas")({
  component: ToolsPage,
  head: () => ({ meta: [{ title: "Ferramentas — GPS Docente Premium" }] }),
});

type Method = {
  icon: typeof BookOpen;
  label: string;
  title: string;
  desc: string;
  color: string;
  iconBg: string;
  borderAvailable: string;
  borderSoon: string;
  route?: string;
  comingSoon?: boolean;
};

const methods: Method[] = [
  {
    icon: BookOpen,
    label: "C.O.N.T.A.",
    title: "Plano de Aula Inteligente",
    desc: "Gere planos completos alinhados à BNCC, CRMG, PBH ou EJA em segundos.",
    color: "text-emerald-600",
    iconBg: "bg-emerald-50 text-emerald-600",
    borderAvailable: "border-emerald-200 hover:border-emerald-400",
    borderSoon: "border-emerald-200/40",
    route: "/ferramentas/conta",
  },
  {
    icon: Shield,
    label: "S.A.L.A.",
    title: "Gestor de Conflitos",
    desc: "Protocolos de sondagem, antecipação e ação para situações reais em sala de aula.",
    color: "text-blue-600",
    iconBg: "bg-blue-50 text-blue-600",
    borderAvailable: "border-blue-200 hover:border-blue-400",
    borderSoon: "border-blue-200/40",
    comingSoon: true,
  },
  {
    icon: FileText,
    label: "R.A.P.I.D.O.",
    title: "Documentos Profissionais",
    desc: "Transforme anotações em relatórios, atas, pareceres e documentos escolares.",
    color: "text-amber-600",
    iconBg: "bg-amber-50 text-amber-600",
    borderAvailable: "border-amber-200 hover:border-amber-400",
    borderSoon: "border-amber-200/40",
    comingSoon: true,
  },
  {
    icon: Library,
    label: "Biblioteca",
    title: "Seus Materiais",
    desc: "Acesse e gerencie todos os planos, protocolos e documentos gerados.",
    color: "text-violet-600",
    iconBg: "bg-violet-50 text-violet-600",
    borderAvailable: "border-violet-200 hover:border-violet-400",
    borderSoon: "border-violet-200/40",
    comingSoon: true,
  },
];

function ToolsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

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

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
        {methods.map((m) =>
          m.comingSoon ? (
            <div
              key={m.label}
              className={`relative rounded-2xl border bg-muted/40 p-6 opacity-60 cursor-not-allowed select-none ${m.borderSoon}`}
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${m.iconBg}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Em breve
                </span>
              </div>
              <p className={`mt-5 text-xs font-semibold uppercase tracking-widest ${m.color}`}>{m.label}</p>
              <h3 className="mt-0.5 font-display text-lg font-semibold">{m.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
            </div>
          ) : (
            <div
              key={m.label}
              onClick={() => navigate({ to: m.route! })}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-card p-6 transition-all hover:shadow-elegant hover:-translate-y-0.5 cursor-pointer ${m.borderAvailable}`}
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${m.iconBg}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="border-emerald-400/40 bg-emerald-50 text-emerald-700 text-xs">
                  Disponível
                </Badge>
              </div>
              <p className={`mt-5 text-xs font-semibold uppercase tracking-widest ${m.color}`}>{m.label}</p>
              <h3 className="mt-0.5 font-display text-lg font-semibold">{m.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
              <div className={`mt-5 flex items-center gap-1 text-xs font-medium ${m.color} group-hover:gap-2 transition-all`}>
                Acessar ferramenta <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          )
        )}
      </div>
    </main>
  );
}
