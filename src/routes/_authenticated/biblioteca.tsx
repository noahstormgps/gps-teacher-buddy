// GPS Docente Premium — Rota: /biblioteca
// Microetapa B.0 — Biblioteca mínima
// Lista gerações do usuário autenticado com filtro por método e visualizador de conteúdo.

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Copy, Check, BookOpen, Shield, FileText, Library } from "lucide-react";

export const Route = createFileRoute("/_authenticated/biblioteca")({
  component: BibliotecaPage,
  head: () => ({ meta: [{ title: "Biblioteca — GPS Docente Premium" }] }),
});

// ── Tipos ──────────────────────────────────────────────────────────────────

type Method = "CONTA" | "SALA" | "RAPIDO";
type FilterOption = "TODOS" | Method;

interface Generation {
  id: string;
  module: Method;
  title: string;
  output_content: string;
  created_at: string;
}

// ── Helpers visuais ────────────────────────────────────────────────────────

const METHOD_CONFIG: Record<Method, { label: string; icon: typeof BookOpen; color: string; bg: string }> = {
  CONTA: {
    label: "C.O.N.T.A.",
    icon: BookOpen,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  SALA: {
    label: "S.A.L.A.",
    icon: Shield,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  RAPIDO: {
    label: "R.A.P.I.D.O.",
    icon: FileText,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Componente principal ───────────────────────────────────────────────────

function BibliotecaPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterOption>("TODOS");
  const [selected, setSelected] = useState<Generation | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Query: buscar gerações do usuário autenticado ──────────────────────
  const { data: generations, isLoading, error } = useQuery<Generation[]>({
    queryKey: ["generations", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generations")
        .select("id, module, title, output_content, created_at")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as Generation[];
    },
  });

  // ── Filtro ─────────────────────────────────────────────────────────────
  const filtered = generations?.filter(
    (g) => filter === "TODOS" || g.module === filter
  ) ?? [];

  // ── Copiar conteúdo ────────────────────────────────────────────────────
  async function handleCopy() {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.output_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── VISUALIZADOR ──────────────────────────────────────────────────────
  if (selected) {
    const cfg = METHOD_CONFIG[selected.module];
    const Icon = cfg.icon;
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header do visualizador */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{selected.title}</p>
            <p className="text-xs text-gray-500">{formatDate(selected.created_at)}</p>
          </div>
          <Badge variant="outline" className={`${cfg.bg} ${cfg.color} border flex items-center gap-1 shrink-0`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-1.5 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </Button>
        </div>

        {/* Conteúdo gerado */}
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selected.output_content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LISTA ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da lista */}
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Library className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">Biblioteca</h1>
          </div>
          <p className="text-sm text-gray-500">
            Seus materiais gerados, organizados por método.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2 flex-wrap">
          {(["TODOS", "CONTA", "SALA", "RAPIDO"] as FilterOption[]).map((opt) => {
            const isActive = filter === opt;
            const cfg = opt !== "TODOS" ? METHOD_CONFIG[opt] : null;
            return (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {opt === "TODOS" ? "Todos" : cfg?.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            Não foi possível carregar a biblioteca. Tente recarregar a página.
          </div>
        )}

        {/* Lista vazia */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <Library className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {filter === "TODOS"
                ? "Nenhum material gerado ainda."
                : `Nenhum material do ${METHOD_CONFIG[filter as Method]?.label} ainda.`}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Gere um C.O.N.T.A., S.A.L.A. ou R.A.P.I.D.O. para começar.
            </p>
          </div>
        )}

        {/* Itens */}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((gen) => {
              const cfg = METHOD_CONFIG[gen.module];
              const Icon = cfg.icon;
              return (
                <button
                  key={gen.id}
                  onClick={() => setSelected(gen)}
                  className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-lg border ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                        {gen.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{formatDate(gen.created_at)}</span>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
                      Abrir →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
