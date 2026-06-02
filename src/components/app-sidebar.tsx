import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  LayoutDashboard,
  Shield,
  FileText,
  Library,
  Crown,
  LogOut,
  Menu,
  X,
  Compass,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ─── Definição dos itens de navegação ───────────────────────────────────────

const NAV_ITEMS = [
  {
    label: "Painel",
    sublabel: "Início",
    href: "/painel",
    icon: LayoutDashboard,
    color: "text-[oklch(0.55_0.18_265)]",
    activeBg: "bg-[oklch(0.55_0.18_265/0.08)]",
    activeBorder: "border-l-[oklch(0.55_0.18_265)]",
  },
  {
    label: "C.O.N.T.A.",
    sublabel: "Planos de Aula",
    href: "/conta",
    icon: BookOpen,
    color: "text-emerald-600",
    activeBg: "bg-emerald-50",
    activeBorder: "border-l-emerald-500",
  },
  {
    label: "S.A.L.A.",
    sublabel: "Gestão de Conflitos",
    href: "/sala",
    icon: Shield,
    color: "text-blue-500",
    activeBg: "bg-blue-50",
    activeBorder: "border-l-blue-500",
  },
  {
    label: "R.A.P.I.D.O.",
    sublabel: "Documentos",
    href: "/rapido",
    icon: FileText,
    color: "text-amber-500",
    activeBg: "bg-amber-50",
    activeBorder: "border-l-amber-500",
  },
  {
    label: "Biblioteca",
    sublabel: "Seus Materiais",
    href: "/biblioteca",
    icon: Library,
    color: "text-violet-500",
    activeBg: "bg-violet-50",
    activeBorder: "border-l-violet-500",
    comingSoon: true,
  },
] as const;

// ─── Componente principal ────────────────────────────────────────────────────

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: userRecord } = useQuery({
    queryKey: ["user_premium", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("is_premium, premium_expires_at")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isPremium =
    !!userRecord?.is_premium &&
    (userRecord?.premium_expires_at == null ||
      new Date(userRecord.premium_expires_at) > new Date());

  const displayName = (() => {
    const meta = (user as any)?.user_metadata;
    if (meta?.full_name) return meta.full_name.split(" ")[0];
    if (meta?.name) return meta.name.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "Professor(a)";
  })();

  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* ── Botão hambúrguer (mobile) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white/90 shadow-soft backdrop-blur-sm md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-4 w-4 text-foreground" />
      </button>

      {/* ── Overlay mobile ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          // Base — fundo branco levemente azulado, premium e limpo
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col",
          "border-r border-border/70 bg-[oklch(0.995_0.006_240)]",
          // Mobile: slide in/out
          "transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: sempre visível
          "md:translate-x-0 md:static md:z-auto",
        )}
      >
        {/* ── Cabeçalho da sidebar ── */}
        <div className="flex h-[70px] items-center justify-between px-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-soft shrink-0">
              <Compass className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <p className="font-display text-[15px] font-semibold tracking-tight text-foreground">
                GPS Docente
              </p>
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[oklch(0.78_0.14_75/0.18)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[oklch(0.45_0.12_60)]">
                <Crown className="h-2.5 w-2.5" />
                Premium
              </span>
            </div>
          </div>
          {/* Fechar no mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors md:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Tagline ── */}
        <div className="px-5 py-2.5 border-b border-border/40 bg-[oklch(0.97_0.01_240/0.5)]">
          <p className="text-[11.5px] font-medium text-[oklch(0.48_0.025_255)] leading-relaxed tracking-wide">
            ♡ Saúde Docente Também Importa
          </p>
        </div>

        {/* ── Navegação ── */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* ── Rodapé: Premium CTA + Perfil ── */}
        <div className="border-t border-border/60 px-3 py-3 space-y-2">
          {/* CTA Premium — condicional ao status real do usuário */}
          {isPremium ? (
            <Link
              to="/assinatura"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3.5 py-3",
                "bg-gradient-to-r from-[oklch(0.82_0.14_80)] to-[oklch(0.72_0.16_60)]",
                "shadow-[0_4px_16px_-4px_oklch(0.72_0.16_60/0.45)]",
                "border border-[oklch(0.72_0.16_60/0.2)]",
                "transition-all duration-150 hover:shadow-[0_6px_20px_-4px_oklch(0.72_0.16_60/0.55)] hover:scale-[1.01]",
              )}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/30">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-900" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-950 leading-none tracking-wide">
                  Acesso Premium
                </p>
                <p className="text-[10px] text-amber-800/75 mt-0.5 truncate">
                  Todos os métodos desbloqueados
                </p>
              </div>
            </Link>
          ) : (
            <Link
              to="/assinatura"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3.5 py-3",
                "bg-muted/60 border border-border/60",
                "transition-all duration-150 hover:bg-muted hover:scale-[1.01]",
              )}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground leading-none tracking-wide">
                  Assinar Premium
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  Desbloqueie todos os métodos
                </p>
              </div>
            </Link>
          )}

          {/* Perfil do professor */}
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-muted/50 transition-colors group">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-hero text-white text-xs font-bold shadow-soft">
              {avatarInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground leading-none">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                {user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Item de navegação ───────────────────────────────────────────────────────

type NavItemDef = (typeof NAV_ITEMS)[number];

function NavItem({
  item,
  onNavigate,
}: {
  item: NavItemDef;
  onNavigate: () => void;
}) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // Considera ativo se o pathname começa com o href do item
  const isActive =
    item.href === "/painel"
      ? pathname === "/painel" || pathname.startsWith("/painel")
      : pathname.startsWith(item.href);

  const Icon = item.icon;

  if ((item as any).comingSoon) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 border-l-2 border-transparent",
          "opacity-55 cursor-not-allowed select-none",
        )}
        title="Em breve"
      >
        <Icon className={cn("h-4 w-4 shrink-0", item.color)} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground/70 leading-none">
            {item.label}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {item.sublabel}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-muted/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Em breve
        </span>
      </div>
    );
  }

  return (
    <Link
      to={item.href as string}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 border-l-2 transition-all duration-150",
        isActive
          ? cn("border-l-2", item.activeBorder, item.activeBg)
          : "border-transparent hover:bg-muted/50 hover:border-l-border",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? item.color : "text-muted-foreground",
        )}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[13px] font-semibold leading-none transition-colors",
            isActive ? "text-foreground" : "text-foreground/70",
          )}
        >
          {item.label}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {item.sublabel}
        </p>
      </div>
    </Link>
  );
}
