import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Sparkles, ArrowRight, BookOpen, ClipboardList, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/painel")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Painel — GPS Docente Premium" }] }),
});

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

  const quickTools = [
    { icon: ClipboardList, title: "Plano de aula", desc: "Gere planos com IA pedagógica.", href: "/ferramentas" as const },
    { icon: Wand2, title: "Gerador de questões", desc: "Provas e exercícios personalizados.", href: "/ferramentas" as const },
    { icon: BookOpen, title: "Sequência didática", desc: "Estruture suas unidades.", href: "/ferramentas" as const },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
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
                Acesso ilimitado a todas as ferramentas, IA pedagógica e atualizações exclusivas.
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

      {/* Quick tools */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Acesso rápido</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {quickTools.map((t) => (
            <Link
              key={t.title}
              to={t.href}
              className="group rounded-2xl border border-border bg-gradient-card p-6 transition-all hover:shadow-elegant hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <t.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              <div className="mt-4 inline-flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Abrir <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
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
