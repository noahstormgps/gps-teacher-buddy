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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft, ClipboardList, Loader2, Copy, Check, AlertCircle,
  BookOpen, Clock, Users, Wrench, MessageSquare, FileQuestion, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/conta")({
  component: ContaPage,
  head: () => ({ meta: [{ title: "C.O.N.T.A. — Plano de Aula Inteligente | GPS Docente Premium" }] }),
});

// ─── Constantes ──────────────────────────────────────────────────────────────

const DISCIPLINAS = [
  "Língua Portuguesa", "Matemática", "História", "Geografia", "Ciências",
  "Arte", "Educação Física", "Ensino Religioso", "Língua Inglesa",
  "Física", "Química", "Biologia", "Sociologia", "Filosofia",
  "Projeto interdisciplinar", "Outra",
];

const SERIES = [
  "Educação Infantil",
  "1º ano EF", "2º ano EF", "3º ano EF", "4º ano EF", "5º ano EF",
  "6º ano EF", "7º ano EF", "8º ano EF", "9º ano EF",
  "1º ano EM", "2º ano EM", "3º ano EM",
  "EJA", "Turma multisseriada", "Outra",
];

const RECURSOS_OPCOES = [
  "Lousa e giz/pincel",
  "Projetor/TV",
  "Computadores/Tablets",
  "Material impresso",
  "Jogos pedagógicos",
  "Material reciclável",
  "Livro didático",
  "Biblioteca",
  "Espaço externo",
  "Sem internet",
];

// ─── Componente de seção ─────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  badge,
  children,
  iconColor = "text-emerald-600",
  iconBg = "bg-emerald-50",
}: {
  icon: typeof BookOpen;
  title: string;
  badge?: string;
  children: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60 bg-white">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="font-semibold text-foreground text-sm">{title}</h2>
        {badge && (
          <Badge variant="outline" className="ml-auto text-xs text-muted-foreground">
            {badge}
          </Badge>
        )}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

// ─── Extrator de mensagem amigável de erro da Edge Function ─────────────────────

function extractFriendlyError(data: unknown): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.errorCode === "PROVIDER_UNAVAILABLE") {
      return "O serviço de IA está com alta demanda no momento. Aguarde alguns segundos e tente gerar novamente.";
    }
    if (d.errorCode === "CONTENT_FILTERED") {
      return "Não foi possível gerar o plano para este tema. Tente reformular o tema da aula e gerar novamente.";
    }
    if (typeof d.error === "string" && d.error.trim() !== "") {
      return d.error;
    }
  }
  return "Não foi possível gerar o plano agora. Tente novamente em alguns instantes.";
}

// ─── Componente principal ────────────────────────────────────────────────────

function ContaPage() {
  const { user } = useAuth();

  // Seção 1 — Sobre a aula
  const [disciplina, setDisciplina] = useState("");
  const [disciplinaOutra, setDisciplinaOutra] = useState("");
  const [serie, setSerie] = useState("");
  const [serieOutra, setSerieOutra] = useState("");
  const [nivelEJA, setNivelEJA] = useState("");
  // nivelEJA só é relevante quando baseCurricular === "PBH_EJA"
  const [tema, setTema] = useState("");
  const [baseCurricular, setBaseCurricular] = useState("BNCC");
  const [cidadeEstado, setCidadeEstado] = useState("");

  // Seção 2 — Organização do tempo
  const [quantidadeEncontros, setQuantidadeEncontros] = useState("1");
  const [duracao, setDuracao] = useState("50");

  // Seção 3 — Perfil da turma
  const [perfilTurma, setPerfilTurma] = useState("");

  // Seção 4 — Recursos
  const [recursos, setRecursos] = useState<string[]>([]);

  // Seção 5 — Contexto adicional
  const [objetivoExtra, setObjetivoExtra] = useState("");

  // Seção 6 — Exercícios
  const [incluirExercicios, setIncluirExercicios] = useState(false);
  const [tipoQuestoes, setTipoQuestoes] = useState("Objetivas");
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState("10");
  const [nivelDificuldade, setNivelDificuldade] = useState("Médio");
  const [finalidade, setFinalidade] = useState("Fixação");
  const [momentoAula, setMomentoAula] = useState("Não especificar");
  const [saidaDesejada, setSaidaDesejada] = useState("Ambas");
  const [observacaoExercicios, setObservacaoExercicios] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ content: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ─── Derivados ─────────────────────────────────────────────────────────────

  const isEJA = baseCurricular === "PBH_EJA";
  const isBNCC = baseCurricular === "BNCC";
  const momentoDesativado = finalidade === "Avaliação" || finalidade === "Simulado";

  const disciplinaFinal = disciplina === "Outra" ? disciplinaOutra.trim() : disciplina;
  const serieFinal = serie === "Outra" ? serieOutra.trim() : serie;
  const duracaoFinal = duracao;

  const camposObrigatoriosOk =
    disciplinaFinal.trim() !== "" &&
    serieFinal.trim() !== "" &&
    (!isEJA || nivelEJA !== "") &&
    tema.trim() !== "" &&
    baseCurricular !== "" &&
    quantidadeEncontros !== "" &&
    duracaoFinal !== "" &&
    perfilTurma.trim() !== "";

  const toggleRecurso = (recurso: string) => {
    setRecursos((prev) =>
      prev.includes(recurso) ? prev.filter((r) => r !== recurso) : [...prev, recurso]
    );
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camposObrigatoriosOk) {
      toast.error("Preencha todos os campos obrigatórios antes de gerar.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setError("Sua sessão expirou. Faça login novamente para gerar o plano de aula.");
        toast.error("Sua sessão expirou. Faça login novamente para gerar o plano de aula.");
        setLoading(false);
        return;
      }

      const body: Record<string, unknown> = {
        disciplina: disciplinaFinal,
        serie: serieFinal,
        tema: tema.trim(),
        quantidadeEncontros: Number(quantidadeEncontros),
        duracaoPorEncontro: duracaoFinal,
        recursos,
        baseCurricular,
        perfilTurma: perfilTurma.trim(),
        ...(isEJA && nivelEJA && { nivelEJA }),
        ...(isBNCC && cidadeEstado.trim() && { cidadeEstado: cidadeEstado.trim() }),
        ...(objetivoExtra.trim() && { objetivoExtra: objetivoExtra.trim() }),
        ...(incluirExercicios && {
          exercicios: {
            tipo: tipoQuestoes,
            quantidade: Number(quantidadeQuestoes),
            nivel: nivelDificuldade,
            finalidade,
            momento: momentoDesativado ? null : momentoAula,
            saida: saidaDesejada,
            observacao: observacaoExercicios.trim() || undefined,
          },
        }),
      };

      const { data, error: fnError } = await supabase.functions.invoke("conta-generate", {
        body,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (fnError) {
        // Extrair mensagem amigável do corpo JSON retornado pela Edge Function
        const friendlyMsg = extractFriendlyError(data);
        throw new Error(friendlyMsg);
      }
      if (!data?.success) throw new Error(data?.error || "Não foi possível gerar o plano. Tente novamente.");
      if (!data?.content) throw new Error("O modelo não retornou conteúdo. Tente novamente.");

      setResult({ content: data.content, title: data.title });
      toast.success("Plano de aula gerado com sucesso!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado. Tente novamente.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.content) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    toast.success("Plano copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNovoPlano = () => {
    setResult(null);
    setError(null);
  };

  // ─── Resultado ──────────────────────────────────────────────────────────────

  if (result) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <button type="button" onClick={handleNovoPlano} className="flex items-center gap-1 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Novo plano
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">Resultado</span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">{result.title}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleNovoPlano}>
                Novo plano
              </Button>
            </div>
          </div>
          <Separator />
          <div className="rounded-2xl border border-border bg-white p-6 prose prose-sm max-w-none
            prose-headings:font-display prose-headings:text-foreground
            prose-p:text-foreground/90 prose-li:text-foreground/90
            prose-strong:text-foreground prose-table:text-sm
            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.content}</ReactMarkdown>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar plano completo"}
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
        <Link to="/ferramentas" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Ferramentas
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">C.O.N.T.A.</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">C.O.N.T.A.</h1>
            <p className="text-sm text-muted-foreground font-medium">Plano de Aula Inteligente</p>
          </div>
        </div>
        <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl text-sm">
          Crie planos de aula completos, organizados e prontos para usar, alinhados à BNCC, CRMG, PBH ou EJA.
          Preencha as informações principais e o GPS Docente estrutura o plano para você.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Seção 1: Sobre a aula ─────────────────────────────────────────── */}
        <SectionCard icon={BookOpen} title="Sobre a aula" iconColor="text-emerald-600" iconBg="bg-emerald-50">

          {/* Disciplina */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="disciplina">
                Disciplina <span className="text-destructive">*</span>
              </Label>
              <Select value={disciplina} onValueChange={setDisciplina}>
                <SelectTrigger id="disciplina">
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {DISCIPLINAS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {disciplina === "Outra" && (
                <Input
                  placeholder="Informe a disciplina"
                  value={disciplinaOutra}
                  onChange={(e) => setDisciplinaOutra(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Série/Ano */}
            <div className="space-y-2">
              <Label htmlFor="serie">
                Série / Ano <span className="text-destructive">*</span>
              </Label>
              <Select value={serie} onValueChange={setSerie}>
                <SelectTrigger id="serie">
                  <SelectValue placeholder="Selecione a série/ano" />
                </SelectTrigger>
                <SelectContent>
                  {SERIES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {serie === "Outra" && (
                <Input
                  placeholder="Informe a série/ano"
                  value={serieOutra}
                  onChange={(e) => setSerieOutra(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          {/* Tema */}
          <div className="space-y-2">
            <Label htmlFor="tema">
              Tema da aula <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tema"
              placeholder="Ex.: Frações no cotidiano, Globalização, Gênero textual carta..."
              value={tema}
              onChange={(e) => setTema(e.target.value)}
            />
          </div>

          {/* Base curricular */}
          <div className="space-y-2">
            <Label htmlFor="baseCurricular">
              Base curricular <span className="text-destructive">*</span>
            </Label>
            <Select value={baseCurricular} onValueChange={(v) => { setBaseCurricular(v); if (v !== "PBH_EJA") setNivelEJA(""); }}>
              <SelectTrigger id="baseCurricular">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BNCC">BNCC Nacional / rede sem currículo próprio</SelectItem>
                <SelectItem value="CRMG">CRMG — Rede Estadual de Minas Gerais</SelectItem>
                <SelectItem value="PBH_EF">PBH — Ensino Fundamental (Rede Municipal de BH)</SelectItem>
                <SelectItem value="PBH_EJA">PBH — EJA (Rede Municipal de BH)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Escolha a referência curricular mais próxima da sua realidade.
            </p>
          </div>

          {/* Nível EJA — condicional: aparece SOMENTE quando baseCurricular === PBH_EJA */}
          {isEJA && (
            <div className="space-y-2">
              <Label htmlFor="nivelEJA">
                Nível EJA <span className="text-destructive">*</span>
              </Label>
              <Select value={nivelEJA} onValueChange={setNivelEJA}>
                <SelectTrigger id="nivelEJA" className="max-w-xs">
                  <SelectValue placeholder="Selecione o nível EJA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EJA_EF">EJA — Ensino Fundamental</SelectItem>
                  <SelectItem value="EJA_EM">EJA — Ensino Médio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Cidade e Estado — condicional BNCC */}
          {isBNCC && (
            <div className="space-y-2">
              <Label htmlFor="cidadeEstado">Cidade e Estado <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input
                id="cidadeEstado"
                placeholder="Ex.: Belo Horizonte, MG"
                value={cidadeEstado}
                onChange={(e) => setCidadeEstado(e.target.value)}
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground">
                Quando preenchido, o plano pode incluir contextualizações regionais leves.
              </p>
            </div>
          )}
        </SectionCard>

        {/* ── Seção 2: Organização do tempo ────────────────────────────────── */}
        <SectionCard icon={Clock} title="Organização do tempo" iconColor="text-blue-600" iconBg="bg-blue-50">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantidadeEncontros">
                Quantidade de encontros/aulas <span className="text-destructive">*</span>
              </Label>
              <Select value={quantidadeEncontros} onValueChange={setQuantidadeEncontros}>
                <SelectTrigger id="quantidadeEncontros">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 encontro/aula</SelectItem>
                  <SelectItem value="2">2 encontros/aulas</SelectItem>
                  <SelectItem value="3">3 encontros/aulas</SelectItem>
                  <SelectItem value="4">4 encontros/aulas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao">
                Duração de cada encontro <span className="text-destructive">*</span>
              </Label>
              <Select value={duracao} onValueChange={setDuracao}>
                <SelectTrigger id="duracao">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="40">40 minutos</SelectItem>
                  <SelectItem value="50">50 minutos</SelectItem>
                  <SelectItem value="60">60 minutos</SelectItem>
                  <SelectItem value="90">90 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>

        {/* ── Seção 3: Perfil da turma ─────────────────────────────────────── */}
        <SectionCard icon={Users} title="Perfil da turma" iconColor="text-violet-600" iconBg="bg-violet-50">
          <div className="space-y-2">
            <Label htmlFor="perfilTurma">
              Perfil da turma / realidade da turma <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="perfilTurma"
              placeholder="Ex.: turma agitada no último horário, muita defasagem em leitura, alunos com trabalho no turno contrário, boa convivência mas concentração baixa, ritmos muito diferentes..."
              value={perfilTurma}
              onChange={(e) => setPerfilTurma(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Quanto mais você descrever a sua turma real, mais útil será o plano gerado.
              Não precisa ser longo — algumas palavras já fazem diferença.
            </p>
          </div>
        </SectionCard>

        {/* ── Seção 4: Recursos disponíveis ───────────────────────────────── */}
        <SectionCard icon={Wrench} title="Recursos disponíveis" iconColor="text-amber-600" iconBg="bg-amber-50" badge="Múltipla seleção">
          <div className="flex flex-wrap gap-2">
            {RECURSOS_OPCOES.map((recurso) => (
              <button
                key={recurso}
                type="button"
                onClick={() => toggleRecurso(recurso)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                  recursos.includes(recurso)
                    ? "border-amber-400 bg-amber-50 text-amber-700 shadow-sm"
                    : "border-border bg-white text-muted-foreground hover:border-amber-300 hover:text-amber-700"
                }`}
              >
                {recurso}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* ── Seção 5: Contexto adicional ──────────────────────────────────── */}
        <SectionCard icon={MessageSquare} title="Contexto adicional" iconColor="text-sky-600" iconBg="bg-sky-50" badge="Opcional">
          <div className="space-y-2">
            <Label htmlFor="objetivoExtra">Objetivo adicional</Label>
            <Textarea
              id="objetivoExtra"
              placeholder="Ex.: preparar para prova, revisar conteúdo, desenvolver leitura crítica, trabalhar projeto interdisciplinar, reforçar habilidade específica..."
              value={objetivoExtra}
              onChange={(e) => setObjetivoExtra(e.target.value)}
              rows={3}
            />
          </div>
        </SectionCard>

        {/* ── Seção 6: Exercícios com gabarito ─────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          {/* Cabeçalho com toggle */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60 bg-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <FileQuestion className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground text-sm">Exercícios com gabarito</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gere questões prontas para aplicar, com gabarito e resolução para o professor.
              </p>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground hidden sm:inline">Incluir exercícios</span>
              <Switch
                checked={incluirExercicios}
                onCheckedChange={setIncluirExercicios}
                aria-label="Incluir exercícios com gabarito"
              />
            </div>
          </div>

          {/* Subcampos — aparecem apenas quando toggle ligado */}
          {incluirExercicios && (
            <div className="px-6 py-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Tipo de questões */}
                <div className="space-y-2">
                  <Label htmlFor="tipoQuestoes">Tipo de questões</Label>
                  <Select value={tipoQuestoes} onValueChange={setTipoQuestoes}>
                    <SelectTrigger id="tipoQuestoes"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Objetivas">Objetivas</SelectItem>
                      <SelectItem value="Discursivas">Discursivas</SelectItem>
                      <SelectItem value="Mistas">Mistas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantidade */}
                <div className="space-y-2">
                  <Label htmlFor="quantidadeQuestoes">Quantidade</Label>
                  <Select value={quantidadeQuestoes} onValueChange={setQuantidadeQuestoes}>
                    <SelectTrigger id="quantidadeQuestoes"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 questões</SelectItem>
                      <SelectItem value="10">10 questões</SelectItem>
                      <SelectItem value="15">15 questões</SelectItem>
                      <SelectItem value="20">20 questões</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nível de dificuldade */}
                <div className="space-y-2">
                  <Label htmlFor="nivelDificuldade">Nível de dificuldade</Label>
                  <Select value={nivelDificuldade} onValueChange={setNivelDificuldade}>
                    <SelectTrigger id="nivelDificuldade"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fácil">Fácil</SelectItem>
                      <SelectItem value="Médio">Médio</SelectItem>
                      <SelectItem value="Difícil">Difícil</SelectItem>
                      <SelectItem value="Progressivo">Progressivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Finalidade */}
                <div className="space-y-2">
                  <Label htmlFor="finalidade">Finalidade</Label>
                  <Select value={finalidade} onValueChange={setFinalidade}>
                    <SelectTrigger id="finalidade"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixação">Fixação</SelectItem>
                      <SelectItem value="Revisão">Revisão</SelectItem>
                      <SelectItem value="Avaliação">Avaliação</SelectItem>
                      <SelectItem value="Simulado">Simulado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Momento da aula — desativa para Avaliação/Simulado */}
                <div className="space-y-2">
                  <Label htmlFor="momentoAula" className={momentoDesativado ? "text-muted-foreground/50" : ""}>
                    Momento da aula
                    {momentoDesativado && (
                      <span className="ml-2 text-xs text-muted-foreground/60">(não aplicável para {finalidade})</span>
                    )}
                  </Label>
                  <Select
                    value={momentoAula}
                    onValueChange={setMomentoAula}
                    disabled={momentoDesativado}
                  >
                    <SelectTrigger id="momentoAula" disabled={momentoDesativado}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não especificar">Não especificar</SelectItem>
                      <SelectItem value="Abertura">Abertura</SelectItem>
                      <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                      <SelectItem value="Fechamento">Fechamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Saída desejada — radio cards */}
              <div className="space-y-2">
                <Label>Saída desejada</Label>
                <p className="text-xs text-muted-foreground">
                  "Versão do professor" inclui gabarito completo + resolução de cada exercício.
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["Versão do aluno", "Versão do professor", "Ambas"].map((opcao) => (
                    <button
                      key={opcao}
                      type="button"
                      onClick={() => setSaidaDesejada(opcao)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                        saidaDesejada === opcao
                          ? "border-rose-400 bg-rose-50 text-rose-700 shadow-sm"
                          : "border-border bg-white text-muted-foreground hover:border-rose-300"
                      }`}
                    >
                      {opcao}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observação */}
              <div className="space-y-2">
                <Label htmlFor="observacaoExercicios">Observação <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Input
                  id="observacaoExercicios"
                  placeholder="Ex.: priorizar interpretação, linguagem simples, foco em BNCC, incluir situações do cotidiano..."
                  value={observacaoExercicios}
                  onChange={(e) => setObservacaoExercicios(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Erro ─────────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Seção 7: Botão final ─────────────────────────────────────────── */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading || !camposObrigatoriosOk}
            className="w-full h-13 text-base gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando plano de aula...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {incluirExercicios ? "Gerar Plano + Exercícios" : "Gerar Plano de Aula"}
              </>
            )}
          </Button>

          {!camposObrigatoriosOk && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Preencha os campos obrigatórios para habilitar o botão.
            </p>
          )}

          {loading && (
            <p className="text-center text-sm text-muted-foreground animate-pulse mt-3">
              O GPS Docente está preparando seu plano. Isso pode levar até 30 segundos...
            </p>
          )}
        </div>

      </form>
    </main>
  );
}
