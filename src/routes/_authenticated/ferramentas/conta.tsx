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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, ClipboardList, Loader2, Copy, Check, AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/ferramentas/conta")({
  component: ContaPage,
  head: () => ({ meta: [{ title: "C.O.N.T.A. — Plano de Aula Inteligente | GPS Docente Premium" }] }),
});

// Opções de recursos disponíveis
const RECURSOS_OPCOES = [
  "Lousa",
  "Projetor",
  "Computadores",
  "Tablets",
  "Impressora",
  "Material impresso",
  "Livro didático",
  "Internet",
  "Laboratório",
  "Materiais de arte",
  "Instrumentos musicais",
];

function ContaPage() {
  const { user } = useAuth();

  // Estados do formulário
  const [disciplina, setDisciplina] = useState("");
  const [serie, setSerie] = useState("");
  const [tema, setTema] = useState("");
  const [quantidadeEncontros, setQuantidadeEncontros] = useState("1");
  const [duracaoPorEncontro, setDuracaoPorEncontro] = useState("50");
  const [recursos, setRecursos] = useState<string[]>(["Lousa"]);
  const [desafios, setDesafios] = useState("");
  const [objetivoExtra, setObjetivoExtra] = useState("");
  const [baseCurricular, setBaseCurricular] = useState("BNCC");
  const [nivelEJA, setNivelEJA] = useState("EF");
  const [cidadeEstado, setCidadeEstado] = useState("");
  const [showAvancado, setShowAvancado] = useState(false);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ content: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleRecurso = (recurso: string) => {
    setRecursos((prev) =>
      prev.includes(recurso) ? prev.filter((r) => r !== recurso) : [...prev, recurso]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplina.trim() || !serie.trim() || !tema.trim()) {
      toast.error("Preencha os campos obrigatórios: Disciplina, Série/Ano e Tema.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("conta-generate", {
        body: {
          disciplina: disciplina.trim(),
          serie: serie.trim(),
          tema: tema.trim(),
          quantidadeEncontros: Number(quantidadeEncontros),
          duracaoPorEncontro: Number(duracaoPorEncontro),
          recursos,
          desafios: desafios.trim() || undefined,
          objetivoExtra: objetivoExtra.trim() || undefined,
          baseCurricular,
          nivelEJA,
          cidadeEstado: cidadeEstado.trim() || undefined,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || "Erro ao chamar a função.");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Não foi possível gerar o plano. Tente novamente.");
      }

      if (!data?.content) {
        throw new Error("O modelo não retornou conteúdo. Tente novamente.");
      }

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">C.O.N.T.A.</h1>
            <p className="text-sm text-muted-foreground">Plano de Aula Inteligente</p>
          </div>
        </div>
        <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
          Gere planos de aula completos, profissionais e prontos para uso — alinhados à BNCC, CRMG, PBH ou EJA.
          Preencha os dados da sua aula e o GPS Docente faz o resto.
        </p>
      </div>

      {/* Resultado */}
      {result ? (
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
          <div className="rounded-2xl border border-border bg-card p-6 prose prose-sm max-w-none
            prose-headings:font-display prose-headings:text-foreground
            prose-p:text-foreground/90 prose-li:text-foreground/90
            prose-strong:text-foreground prose-table:text-sm
            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
            dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.content}
            </ReactMarkdown>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar plano completo"}
            </Button>
          </div>
        </div>
      ) : (
        /* Formulário */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campos obrigatórios */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">Campos obrigatórios</Badge>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="disciplina">
                  Disciplina <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="disciplina"
                  placeholder="Ex: Matemática, Língua Portuguesa, História..."
                  value={disciplina}
                  onChange={(e) => setDisciplina(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serie">
                  Série / Ano <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="serie"
                  placeholder="Ex: 7º ano, 2º ano EM, Ciclo Final EJA..."
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tema">
                Tema da aula <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tema"
                placeholder="Ex: Frações no cotidiano, Revolução Industrial, Gêneros textuais..."
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duracaoPorEncontro">Duração por encontro (minutos)</Label>
                <Select value={duracaoPorEncontro} onValueChange={setDuracaoPorEncontro}>
                  <SelectTrigger id="duracaoPorEncontro">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="40">40 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="50">50 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="90">90 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidadeEncontros">Quantidade de encontros</Label>
                <Select value={quantidadeEncontros} onValueChange={setQuantidadeEncontros}>
                  <SelectTrigger id="quantidadeEncontros">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 encontro</SelectItem>
                    <SelectItem value="2">2 encontros</SelectItem>
                    <SelectItem value="3">3 encontros</SelectItem>
                    <SelectItem value="4">4 encontros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Base curricular */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="baseCurricular">Base curricular</Label>
                <Select value={baseCurricular} onValueChange={setBaseCurricular}>
                  <SelectTrigger id="baseCurricular">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BNCC">BNCC Nacional</SelectItem>
                    <SelectItem value="CRMG">CRMG — Rede Estadual MG</SelectItem>
                    <SelectItem value="PBH_EF">PBH — Ensino Fundamental (BH)</SelectItem>
                    <SelectItem value="PBH_EJA">PBH — EJA (Belo Horizonte)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {baseCurricular === "PBH_EJA" && (
                <div className="space-y-2">
                  <Label htmlFor="nivelEJA">Nível EJA</Label>
                  <Select value={nivelEJA} onValueChange={setNivelEJA}>
                    <SelectTrigger id="nivelEJA">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EF">Ensino Fundamental</SelectItem>
                      <SelectItem value="EM">Ensino Médio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Recursos */}
            <div className="space-y-3">
              <Label>Recursos disponíveis</Label>
              <div className="flex flex-wrap gap-2">
                {RECURSOS_OPCOES.map((recurso) => (
                  <label
                    key={recurso}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      recursos.includes(recurso)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      checked={recursos.includes(recurso)}
                      onCheckedChange={() => toggleRecurso(recurso)}
                      className="sr-only"
                    />
                    {recurso}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Campos opcionais (avançados) */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAvancado(!showAvancado)}
              className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Campos opcionais (personalização avançada)</span>
              {showAvancado ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showAvancado && (
              <div className="px-6 pb-6 space-y-5 border-t border-border pt-5">
                <div className="space-y-2">
                  <Label htmlFor="desafios">Desafios da turma</Label>
                  <Textarea
                    id="desafios"
                    placeholder="Ex: Turma com muitos alunos com dificuldade de leitura, alta dispersão, inclusão de aluno com TEA..."
                    value={desafios}
                    onChange={(e) => setDesafios(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objetivoExtra">Objetivo adicional</Label>
                  <Textarea
                    id="objetivoExtra"
                    placeholder="Ex: Preparar para a prova do SAEB, trabalhar habilidade específica EF07MA21..."
                    value={objetivoExtra}
                    onChange={(e) => setObjetivoExtra(e.target.value)}
                    rows={2}
                  />
                </div>
                {baseCurricular === "BNCC" && (
                  <div className="space-y-2">
                    <Label htmlFor="cidadeEstado">Contexto regional (cidade/estado)</Label>
                    <Input
                      id="cidadeEstado"
                      placeholder="Ex: São Paulo/SP, Recife/PE, interior do Maranhão..."
                      value={cidadeEstado}
                      onChange={(e) => setCidadeEstado(e.target.value)}
                      maxLength={80}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botão de envio */}
          <Button
            type="submit"
            disabled={loading || !disciplina.trim() || !serie.trim() || !tema.trim()}
            className="w-full h-12 text-base gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando plano de aula...
              </>
            ) : (
              <>
                <ClipboardList className="h-5 w-5" />
                Gerar Plano de Aula
              </>
            )}
          </Button>

          {loading && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              O GPS Docente está preparando seu plano. Isso pode levar até 30 segundos...
            </p>
          )}
        </form>
      )}
    </main>
  );
}
