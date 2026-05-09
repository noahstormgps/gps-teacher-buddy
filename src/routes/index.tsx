import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Sparkles, BookOpen, ClipboardList, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import heroImg from "@/assets/hero-gps.jpg";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const features = [
  { icon: ClipboardList, title: "Planejamento inteligente", desc: "Crie planos de aula, sequências didáticas e avaliações com apoio de IA." },
  { icon: BookOpen, title: "Biblioteca de ferramentas", desc: "Atividades, rubricas, modelos BNCC e gerador de questões em um só lugar." },
  { icon: Users, title: "Foco no aluno", desc: "Acompanhamento individualizado e relatórios pedagógicos automáticos." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28 lg:gap-16">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-premium" />
              Plataforma premium para professores
            </div>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Sua bússola para a <span className="text-gradient-primary">prática docente</span> moderna.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground leading-relaxed">
              GPS Docente Premium reúne ferramentas, IA pedagógica e recursos selecionados para você ensinar melhor — com menos tempo e mais impacto.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-elegant group">
                <Link to="/login">
                  Começar gratuitamente
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Ver demonstração</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Login com Google em segundos. Sem cartão de crédito.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-hero opacity-20 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-elegant">
              <img
                src={heroImg}
                alt="Bússola educacional cercada por livros e ícones de aprendizagem"
                width={1536}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-border/60 bg-surface-elevated">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              Tudo o que você precisa para ensinar com excelência.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Uma suíte completa pensada para a realidade do educador brasileiro.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border bg-gradient-card p-6 transition-all hover:shadow-elegant hover:-translate-y-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 md:p-16 shadow-elegant">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-premium/30 blur-3xl" />
          <div className="relative max-w-2xl text-primary-foreground">
            <div className="inline-flex items-center gap-2 rounded-full bg-premium/20 px-3 py-1 text-xs font-medium text-premium">
              <Crown className="h-3.5 w-3.5" /> Plano Premium
            </div>
            <h2 className="mt-6 font-display text-4xl font-semibold leading-tight md:text-5xl">
              Desbloqueie todo o potencial da sua docência.
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Acesso ilimitado a todas as ferramentas, IA pedagógica e atualizações exclusivas.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8 shadow-premium">
              <Link to="/login">
                <Compass className="mr-2 h-4 w-4" />
                Conhecer o Premium
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} GPS Docente Premium. Feito com cuidado para professores.
        </div>
      </footer>
    </div>
  );
}
