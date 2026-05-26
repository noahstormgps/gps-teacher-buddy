import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/sala")({
  component: SalaPage,
  head: () => ({
    meta: [
      {
        title:
          "S.A.L.A. — Gestão de Conflitos Escolares | GPS Docente Premium",
      },
    ],
  }),
});

// ─── Constantes ──────────────────────────────────────────────────────────────

const TIPOS_CONFLITO = [
  "Bullying/Cyberbullying",
  "Agressão verbal entre alunos",
  "Agressão física",
  "Indisciplina recorrente",
  "Desrespeito ao professor",
  "Conflito entre grupos",
  "Exclusão social",
  "Uso indevido de celular",
  "Vandalismo",
  "Conflito família-escola",
  "Outro",
];

const FREQUENCIAS = [
  "Primeira vez",
  "Ocasional",
  "Frequente",
  "Diário",
  "Crônico",
];

const ABORDAGENS = [
  "Mediação entre as partes",
  "Conversa individual",
  "Roda de conversa",
  "Encaminhamento coordenação",
  "Reunião com famílias",
  "Abordagem restaurativa",
];

const TONS_COMUNICACAO = [
  "Firme e acolhedor",
  "Empático",
  "Assertivo",
  "Calmo",
];

const TOTAL_STEPS = 4;

// ─── Extrator de mensagem amigável de erro da Edge Function ──────────────────

function extractFriendlyError(data: unknown): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.errorCode === "PROVIDER_UNAVAILABLE") {
      return "O serviço de IA está com alta demanda no momento. Aguarde alguns segundos e tente gerar novamente.";
    }
    if (d.errorCode === "CONTENT_FILTERED") {
      return "Não foi possível gerar o protocolo para esta situação. Tente reformular a descrição.";
    }
    if (d.errorCode === "TRIAL_EXHAUSTED") {
      return "Você atingiu o limite gratuito do S.A.L.A. Faça upgrade para continuar gerando protocolos.";
    }
    if (d.errorCode === "VALIDATION_ERROR") {
      return typeof d.error === "string" && d.error.trim()
        ? d.error
        : "Preencha o tipo de conflito e a descrição da situação.";
    }
    if (typeof d.error === "string" && d.error.trim() !== "") {
      return d.error;
    }
  }
  return "Não foi possível gerar o protocolo agora. Tente novamente em alguns instantes.";
}

// ─── Componente principal ────────────────────────────────────────────────────

function SalaPage() {
  useAuth();

  // ── Estado do wizard ──────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // Step 1 — Sondagem
  const [tipoConflito, setTipoConflito] = useState("");
  const [descricaoSituacao, setDescricaoSituacao] = useState("");
  const [alunosEnvolvidos, setAlunosEnvolvidos] = useState("");
  const [frequencia, setFrequencia] = useState("");

  // Step 2 — Antecipação
  const [sinaisAlerta, setSinaisAlerta] = useState("");
  const [gatilhos, setGatilhos] = useState("");

  // Step 3 — Linguagem
  const [abordagemPreferida, setAbordagemPreferida] = useState("");
  const [tomComunicacao, setTomComunicacao] = useState("");

  // Step 4 — Ação
  const [objetivoResolucao, setObjetivoResolucao] = useState("");
  const [recursosDisponiveis, setRecursosDisponiveis] = useState("");

  // ── Estado de geração ─────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ content: string; title: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Validação do Step 1 ───────────────────────────────────────────────────
  const step1Valid = tipoConflito.trim() !== "" && descricaoSituacao.trim() !== "";

  // ── Navegação entre steps ─────────────────────────────────────────────────
  function handleNext() {
    if (step === 1 && !step1Valid) return;
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  // ── Geração do protocolo ──────────────────────────────────────────────────
  async function handleGerar() {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setError("Sua sessão expirou. Faça login novamente para gerar o protocolo.");
        toast.error("Sua sessão expirou. Faça login novamente.");
        setLoading(false);
        return;
      }

      const body: Record<string, string | undefined> = {
        tipoConflito: tipoConflito.trim(),
        descricaoSituacao: descricaoSituacao.trim(),
        ...(alunosEnvolvidos.trim() && { alunosEnvolvidos: alunosEnvolvidos.trim() }),
        ...(frequencia && { frequencia }),
        ...(sinaisAlerta.trim() && { sinaisAlerta: sinaisAlerta.trim() }),
        ...(gatilhos.trim() && { gatilhos: gatilhos.trim() }),
        ...(abordagemPreferida && { abordagemPreferida }),
        ...(tomComunicacao && { tomComunicacao }),
        ...(objetivoResolucao.trim() && { objetivoResolucao: objetivoResolucao.trim() }),
        ...(recursosDisponiveis.trim() && { recursosDisponiveis: recursosDisponiveis.trim() }),
      };

      const { data, error: fnError } = await supabase.functions.invoke(
        "sala-generate",
        {
          body,
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (fnError) {
        const friendlyMsg = extractFriendlyError(data);
        throw new Error(friendlyMsg);
      }
      if (!data?.success) {
        throw new Error(
          data?.error || "Não foi possível gerar o protocolo. Tente novamente.",
        );
      }
      if (!data?.content) {
        throw new Error("O modelo não retornou conteúdo. Tente novamente.");
      }

      setResult({ content: data.content, title: data.title });
      toast.success("Protocolo gerado com sucesso!");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro inesperado. Tente novamente.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Copiar resultado ──────────────────────────────────────────────────────
  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      toast.success("Protocolo copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  }

  // ── Novo protocolo ────────────────────────────────────────────────────────
  function handleNovoProtocolo() {
    setResult(null);
    setError(null);
    setStep(1);
    setTipoConflito("");
    setDescricaoSituacao("");
    setAlunosEnvolvidos("");
    setFrequencia("");
    setSinaisAlerta("");
    setGatilhos("");
    setAbordagemPreferida("");
    setTomComunicacao("");
    setObjetivoResolucao("");
    setRecursosDisponiveis("");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TELA DE RESULTADO
  // ─────────────────────────────────────────────────────────────────────────
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
          <span className="text-foreground font-medium">S.A.L.A.</span>
        </div>

        <div className="space-y-5">
          {/* Cabeçalho do resultado */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {result.title}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNovoProtocolo}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Novo protocolo
              </Button>
            </div>
          </div>

          {/* Aviso pedagógico obrigatório */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <span>
              <strong>Aviso:</strong> Este protocolo é um suporte orientativo
              para o professor. Situações graves devem ser encaminhadas à equipe
              gestora e a profissionais especializados.
            </span>
          </div>

          <Separator />

          {/* Conteúdo Markdown */}
          <div
            className="rounded-2xl border border-border bg-white p-6 prose prose-sm max-w-none
            prose-headings:font-display prose-headings:text-foreground
            prose-p:text-foreground/90 prose-li:text-foreground/90
            prose-strong:text-foreground prose-table:text-sm
            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.content}
            </ReactMarkdown>
          </div>

          {/* Botão copiar inferior */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copiado!" : "Copiar protocolo completo"}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WIZARD
  // ─────────────────────────────────────────────────────────────────────────
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
        <span className="text-foreground font-medium">S.A.L.A.</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              S.A.L.A.
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestão de Conflitos Escolares
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Descreva a situação de conflito e receba um protocolo de ação
          pedagógico, empático e pronto para aplicar.
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Passo {step} de {TOTAL_STEPS}
          </span>
          <span className="text-xs text-muted-foreground">
            {step === 1 && "Sondagem"}
            {step === 2 && "Antecipação"}
            {step === 3 && "Linguagem"}
            {step === 4 && "Ação"}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        {/* Indicadores de step */}
        <div className="mt-3 flex gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                s === step
                  ? "bg-blue-500 text-white"
                  : s < step
                    ? "bg-blue-100 text-blue-600"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Card do step */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">

        {/* ── STEP 1 — Sondagem ──────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-1">
                Sondagem
              </h2>
              <p className="text-sm text-muted-foreground">
                Descreva o conflito. Estes campos são obrigatórios para gerar o
                protocolo.
              </p>
            </div>

            <div className="space-y-4">
              {/* Tipo de conflito */}
              <div className="space-y-1.5">
                <Label htmlFor="tipoConflito">
                  Tipo de conflito{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select value={tipoConflito} onValueChange={setTipoConflito}>
                  <SelectTrigger id="tipoConflito">
                    <SelectValue placeholder="Selecione o tipo de conflito" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CONFLITO.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descrição da situação */}
              <div className="space-y-1.5">
                <Label htmlFor="descricaoSituacao">
                  Descrição da situação{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="descricaoSituacao"
                  placeholder="Descreva o que aconteceu, quando, onde e quem estava envolvido..."
                  rows={4}
                  value={descricaoSituacao}
                  onChange={(e) => setDescricaoSituacao(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Quanto mais detalhada a descrição, mais preciso será o
                  protocolo.
                </p>
              </div>

              {/* Alunos envolvidos (opcional) */}
              <div className="space-y-1.5">
                <Label htmlFor="alunosEnvolvidos">
                  Alunos envolvidos{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id="alunosEnvolvidos"
                  placeholder="Ex: Aluno A (14 anos), Aluno B (13 anos) — evite nomes reais"
                  value={alunosEnvolvidos}
                  onChange={(e) => setAlunosEnvolvidos(e.target.value)}
                />
              </div>

              {/* Frequência (opcional) */}
              <div className="space-y-1.5">
                <Label htmlFor="frequencia">
                  Frequência do conflito{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Select value={frequencia} onValueChange={setFrequencia}>
                  <SelectTrigger id="frequencia">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIAS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2 — Antecipação ───────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-1">
                Antecipação
              </h2>
              <p className="text-sm text-muted-foreground">
                Informações adicionais que ajudam a antecipar e prevenir o
                conflito. Todos os campos são opcionais.
              </p>
            </div>

            <div className="space-y-4">
              {/* Sinais de alerta */}
              <div className="space-y-1.5">
                <Label htmlFor="sinaisAlerta">
                  Sinais de alerta observados{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Textarea
                  id="sinaisAlerta"
                  placeholder="Ex: isolamento, mudança de comportamento, queixas frequentes..."
                  rows={3}
                  value={sinaisAlerta}
                  onChange={(e) => setSinaisAlerta(e.target.value)}
                />
              </div>

              {/* Gatilhos */}
              <div className="space-y-1.5">
                <Label htmlFor="gatilhos">
                  Gatilhos identificados{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Textarea
                  id="gatilhos"
                  placeholder="Ex: início das aulas, intervalo, trabalhos em grupo, redes sociais..."
                  rows={3}
                  value={gatilhos}
                  onChange={(e) => setGatilhos(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3 — Linguagem ─────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-1">
                Linguagem
              </h2>
              <p className="text-sm text-muted-foreground">
                Defina como você prefere abordar e comunicar a situação. Todos
                os campos são opcionais.
              </p>
            </div>

            <div className="space-y-4">
              {/* Abordagem preferida */}
              <div className="space-y-1.5">
                <Label htmlFor="abordagemPreferida">
                  Abordagem preferida{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Select
                  value={abordagemPreferida}
                  onValueChange={setAbordagemPreferida}
                >
                  <SelectTrigger id="abordagemPreferida">
                    <SelectValue placeholder="Selecione a abordagem" />
                  </SelectTrigger>
                  <SelectContent>
                    {ABORDAGENS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tom de comunicação */}
              <div className="space-y-1.5">
                <Label htmlFor="tomComunicacao">
                  Tom de comunicação{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Select
                  value={tomComunicacao}
                  onValueChange={setTomComunicacao}
                >
                  <SelectTrigger id="tomComunicacao">
                    <SelectValue placeholder="Selecione o tom" />
                  </SelectTrigger>
                  <SelectContent>
                    {TONS_COMUNICACAO.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 4 — Ação ──────────────────────────────────────────────── */}
        {step === 4 && (
          <>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-1">
                Ação
              </h2>
              <p className="text-sm text-muted-foreground">
                Defina o objetivo e os recursos disponíveis. Clique em{" "}
                <strong>Gerar Protocolo</strong> quando estiver pronto.
              </p>
            </div>

            <div className="space-y-4">
              {/* Objetivo da resolução */}
              <div className="space-y-1.5">
                <Label htmlFor="objetivoResolucao">
                  Objetivo da resolução{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Textarea
                  id="objetivoResolucao"
                  placeholder="Ex: restaurar o clima de sala, reintegrar o aluno ao grupo, acionar a família..."
                  rows={3}
                  value={objetivoResolucao}
                  onChange={(e) => setObjetivoResolucao(e.target.value)}
                />
              </div>

              {/* Recursos disponíveis */}
              <div className="space-y-1.5">
                <Label htmlFor="recursosDisponiveis">
                  Recursos disponíveis{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Textarea
                  id="recursosDisponiveis"
                  placeholder="Ex: psicólogo escolar, coordenação presente, sala de mediação, apoio da família..."
                  rows={3}
                  value={recursosDisponiveis}
                  onChange={(e) => setRecursosDisponiveis(e.target.value)}
                />
              </div>

              {/* Resumo do que será gerado */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 space-y-1">
                <p className="font-medium">Resumo do protocolo a gerar:</p>
                <p>
                  <span className="font-medium">Conflito:</span> {tipoConflito}
                </p>
                <p className="line-clamp-2">
                  <span className="font-medium">Situação:</span>{" "}
                  {descricaoSituacao}
                </p>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navegação */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1 || loading}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {step < TOTAL_STEPS ? (
          <Button
            onClick={handleNext}
            disabled={step === 1 && !step1Valid}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Avançar
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleGerar}
            disabled={loading}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white min-w-[160px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Gerar Protocolo
              </>
            )}
          </Button>
        )}
      </div>

      {/* Nota de segurança pedagógica */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        O protocolo gerado é orientativo. Situações de risco devem ser
        escaladas à equipe gestora.
      </p>
    </main>
  );
}
