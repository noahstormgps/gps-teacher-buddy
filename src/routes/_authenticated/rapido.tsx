import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft, FileText, Loader2, Copy, Check, AlertCircle, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/rapido")({
  component: RapidoPage,
  head: () => ({
    meta: [{ title: "R.A.P.I.D.O. — Redação Assistida para Professores | GPS Docente Premium" }],
  }),
});

// ─── Tipos de documento disponíveis no MVP ────────────────────────────────────
const TIPOS_DOCUMENTO = [
  "Relatório Individual de Aluno",
  "Relatório de Turma",
  "Ata de Reunião",
  "Parecer Descritivo (Pedagógico)",
  "Comunicado aos Responsáveis",
  "Plano de Ação Pedagógica",
  "Relatório de Ocorrência",
  "Carta de Recomendação",
  "Relatório de Acompanhamento",
  "Ofício",
  "Memorando",
  "Declaração",
  "Outro",
];

// ─── Extrator de mensagem amigável de erro da Edge Function ──────────────────
function extractFriendlyError(data: unknown): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.errorCode === "PROVIDER_UNAVAILABLE") {
      return "O serviço de IA está com alta demanda no momento. Aguarde alguns segundos e tente gerar novamente.";
    }
    if (d.errorCode === "CONTENT_FILTERED") {
      return "Não foi possível gerar o documento com essas anotações. Revise o texto e tente reformular.";
    }
    if (d.errorCode === "TRIAL_EXHAUSTED") {
      return "Você atingiu o limite gratuito do R.A.P.I.D.O. Faça upgrade para continuar gerando documentos.";
    }
    if (d.errorCode === "VALIDATION_ERROR") {
      if (typeof d.error === "string" && d.error.trim() !== "") return d.error;
    }
    if (typeof d.error === "string" && d.error.trim() !== "") {
      return d.error;
    }
  }
  return "Não foi possível gerar o documento agora. Tente novamente em alguns instantes.";
}

// ─── Componente principal ─────────────────────────────────────────────────────
function RapidoPage() {
  const { user } = useAuth();

  // Campos do formulário
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [anotacoes, setAnotacoes] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [contexto, setContexto] = useState("");
  const [tomFormal, setTomFormal] = useState(true); // true = Formal, false = Semi-formal

  // Estado da geração
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ content: string; title: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Validação
  const camposObrigatoriosOk =
    tipoDocumento.trim() !== "" && anotacoes.trim() !== "";

  // ─── Copiar resultado ───────────────────────────────────────────────────────
  const handleCopy = async () => {
    if (!result?.content) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    toast.success("Documento copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2500);
  };

  // ─── Novo documento ─────────────────────────────────────────────────────────
  const handleNovoDocumento = () => {
    setResult(null);
    setError(null);
    setTipoDocumento("");
    setAnotacoes("");
    setDestinatario("");
    setContexto("");
    setTomFormal(true);
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camposObrigatoriosOk) {
      toast.error("Preencha o tipo de documento e as anotações para gerar o R.A.P.I.D.O.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setError("Sua sessão expirou. Faça login novamente para gerar o documento.");
        toast.error("Sua sessão expirou. Faça login novamente para gerar o documento.");
        setLoading(false);
        return;
      }

      // Montar body — enviar campos opcionais somente se preenchidos
      const body: Record<string, unknown> = {
        tipoDocumento,
        anotacoes,
        tomFormal,
      };
      if (destinatario.trim() !== "") body.destinatario = destinatario.trim();
      if (contexto.trim() !== "") body.contexto = contexto.trim();

      const { data, error: fnError } = await supabase.functions.invoke("rapido-generate", {
        body,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (fnError) {
        // Extrair mensagem amigável do corpo JSON retornado pela Edge Function
        const friendlyMsg = extractFriendlyError(data);
        throw new Error(friendlyMsg);
      }
      if (!data?.success) throw new Error(extractFriendlyError(data));
      if (!data?.content) throw new Error("O modelo não retornou conteúdo. Tente novamente.");

      setResult({ content: data.content, title: data.title || tipoDocumento });
      toast.success("Documento gerado com sucesso!");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Não foi possível gerar o documento agora. Tente novamente em alguns instantes.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Tela de resultado ───────────────────────────────────────────────────────
  if (result) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/ferramentas"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Ferramentas
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">R.A.P.I.D.O.</span>
        </div>

        {/* Aviso obrigatório */}
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>
            <strong>Revise antes de enviar:</strong> Revise o documento antes de assinar, enviar ou
            arquivar. O R.A.P.I.D.O. organiza suas anotações, mas a responsabilidade final pelo
            conteúdo é do professor.
          </span>
        </div>

        {/* Cabeçalho do resultado */}
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span className="text-foreground font-medium">Documento gerado</span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">{result.title}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleNovoDocumento}>
                Novo documento
              </Button>
            </div>
          </div>

          <Separator />

          <div
            className="rounded-2xl border border-border bg-white p-6 prose prose-sm max-w-none
            prose-headings:font-display prose-headings:text-foreground
            prose-p:text-foreground/90 prose-li:text-foreground/90
            prose-strong:text-foreground prose-table:text-sm
            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.content}</ReactMarkdown>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copiado!" : "Copiar documento completo"}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ─── Formulário ─────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/ferramentas"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Ferramentas
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">R.A.P.I.D.O.</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              R.A.P.I.D.O.
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Redação Assistida para Professores com Inteligência e Documentação Organizada
            </p>
          </div>
        </div>
        <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl text-sm">
          Cole suas anotações brutas e o GPS Docente transforma em um documento profissional,
          claro e pronto para revisão. Relatórios, pareceres, atas, comunicados e muito mais.
        </p>
      </div>

      {/* Erro */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de documento */}
        <div className="space-y-2">
          <Label htmlFor="tipoDocumento" className="text-sm font-medium">
            Tipo de documento <span className="text-red-500">*</span>
          </Label>
          <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
            <SelectTrigger id="tipoDocumento" className="w-full">
              <SelectValue placeholder="Selecione o tipo de documento…" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_DOCUMENTO.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Anotações brutas */}
        <div className="space-y-2">
          <Label htmlFor="anotacoes" className="text-sm font-medium">
            Suas anotações brutas <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="anotacoes"
            value={anotacoes}
            onChange={(e) => setAnotacoes(e.target.value)}
            placeholder="Cole aqui suas anotações brutas: fatos observados, contexto, pontos importantes, encaminhamentos desejados…"
            rows={8}
            className="resize-y text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Escreva como preferir — o R.A.P.I.D.O. organiza e profissionaliza o texto para você.
          </p>
        </div>

        {/* Destinatário (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="destinatario" className="text-sm font-medium">
            Destinatário{" "}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="destinatario"
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            placeholder="Ex: Familiares do aluno, Coordenação Pedagógica, Conselho de Classe…"
            className="text-sm"
          />
        </div>

        {/* Contexto adicional (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="contexto" className="text-sm font-medium">
            Contexto adicional{" "}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="contexto"
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            placeholder="Ex: Turma do 7º ano, escola municipal, reunião de pais semestral…"
            rows={3}
            className="resize-y text-sm"
          />
        </div>

        {/* Tom do documento */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Tom do documento</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tomFormal ? "Formal e profissional" : "Semi-formal e acessível"}
            </p>
          </div>
          <Switch
            checked={tomFormal}
            onCheckedChange={setTomFormal}
            aria-label="Alternar tom do documento"
          />
        </div>

        <Separator />

        {/* Botão gerar */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading || !camposObrigatoriosOk}
            className="gap-2 min-w-[180px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando documento…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar Documento
              </>
            )}
          </Button>
        </div>

        {!camposObrigatoriosOk && !loading && (
          <p className="text-center text-xs text-muted-foreground">
            Preencha o tipo de documento e as anotações para gerar o R.A.P.I.D.O.
          </p>
        )}
      </form>
    </main>
  );
}
