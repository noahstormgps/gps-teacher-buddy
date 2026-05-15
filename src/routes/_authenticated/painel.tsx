import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Sparkles, ArrowRight, BookOpen, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/painel")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Painel — GPS Docente Premium" }] }),
});

type QuickTool = {
  icon: typeof BookOpen;
  label: string;
  sublabel: string;
  desc: string;
  color: string;
  iconBg: string;
  borderColor: string;
  href?: string;
  comingSoon?: boolean;
};

const quickTools: QuickTool[] = [
  {
    icon: BookOpen,
    label: "C.O.N.T.A.",
    sublabel: "Planos de Aula",
    desc: "Gere planos completos alinhados à BNCC, CRMG, PBH ou EJA.",
    color: "text-emerald-600",
    iconBg: "bg-emerald-50 text-emerald-600",
    borderColor: "border-emerald-200 hover:border-emerald-400",
    href: "/ferramentas/conta",
  },
  {
    icon: Shield,
    label: "S.A.L.A.",
    sublabel: "Gestão de Conflitos",
    desc: "Protocolos de sondagem, antecipação e ação para situações reais.",
    color: "text-blue-600",
    iconBg: "bg-blue-50 text-blue-600",
    borderColor: "border-blue-200/60",
    comingSoon: true,
  },
  {
    icon: FileText,
    label: "R.A.P.I.D.O.",
    sublabel: "Documentos Profissionais",
    desc: "Transforme anotações em relatórios, atas, pareceres e documentos escolares.",
    color: "text-amber-600",
    iconBg: "bg-amber-50 text-amber-600",
    borderColor: "border-amber-200/60",
    comingSoon: true,
  },
];

function DashboardPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("subscriptions").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isPremium = subscription?.plan === "premium" && subscription?.status === "active";
  const rawName = profile?.full_name ?? (user?.email ? user.email.split("@")[0] : "");
  const firstName = rawName.split(" ")[0];

  return (
    <main className="bg-authenticated-premium min-h-screen mx-auto max-w-6xl px-6 pt-16 pb-12 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Olá novamente,</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">
            Professor(a) {firstName} 👋
          </h1>
        </div>
        <Badge
          variant="outline"
          className={
            isPremium
              ? "bg-gradient-premium border-transparent text-premium-foreground shadow-soft"
              : "border-border bg-surface"
          }
        >
          {isPremium ? <><Crown className="mr-1 h-3 w-3" /> Premium ativo</> : "Plano gratuito"}
        </Badge>
      </div>

      {/* Premium upsell */}
      {!isPremium && (
        <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-hero p-8 shadow-elegant">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-premium/30 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-6 text-primary-foreground">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-premium/20 px-3 py-1 text-xs font-medium text-premium">
                <Sparkles className="h-3.5 w-3.5" /> Desbloqueie tudo
              </div>
              <h2 className="mt-3 font-display text-2xl font-semibold">Atualize para o Premium</h2>
              <p className="mt-2 text-sm text-primary-foreground/80">
                Acesse os métodos do GPS Docente sem limites e acompanhe as próximas liberações.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="shadow-premium">
              <Link to="/assinatura">
                Conhecer o Premium <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Acesso rápido — métodos oficiais */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Acesso rápido</h2>
        <div className="mt-6 grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {quickTools.map((t) =>
            t.comingSoon ? (
              <div
                key={t.label}
                className={`relative rounded-2xl border bg-muted/30 p-6 opacity-70 cursor-not-allowed select-none ${t.borderColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.iconBg}`}>
                    <t.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Em breve
                  </span>
                </div>
                <p className={`mt-4 text-xs font-semibold uppercase tracking-widest ${t.color}`}>{t.sublabel}</p>
                <h3 className="mt-0.5 font-display text-lg font-semibold">{t.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              </div>
            ) : (
              <Link
                key={t.label}
                to={t.href!}
                className={`group rounded-2xl border-2 bg-gradient-card p-6 transition-all hover:shadow-elegant hover:-translate-y-0.5 ${t.borderColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.iconBg}`}>
                    <t.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="border-emerald-400/40 bg-emerald-50 text-emerald-700 text-xs">
                    Disponível
                  </Badge>
                </div>
                <p className={`mt-4 text-xs font-semibold uppercase tracking-widest ${t.color}`}>{t.sublabel}</p>
                <h3 className="mt-0.5 font-display text-lg font-semibold">{t.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                <div className={`mt-4 inline-flex items-center text-sm font-medium ${t.color} opacity-0 transition-opacity group-hover:opacity-100`}>
                  Acessar <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </div>
              </Link>
            )
          )}
        </div>
      </section>

      {/* Profile card */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Seu perfil</h2>
        <div className="mt-6 rounded-2xl border border-border bg-gradient-card p-6">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-full border border-border" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold">{profile?.full_name ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{profile?.email ?? user?.email}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
