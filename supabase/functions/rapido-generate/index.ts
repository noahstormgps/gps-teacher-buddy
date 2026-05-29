// GPS Docente Premium — Edge Function: rapido-generate
// Módulo R.A.P.I.D.O. — Redação Assistida para Professores com Inteligência e Documentação Organizada
// systemPrompt: prompts2_RAPIDO_completo.docx (Seção 4) — fonte oficial única
// Versão: R.1.2 | Mai/2026

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// CORS HEADERS
// ============================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================================
// SYSTEM PROMPT — Seção 4 do prompts2_RAPIDO_completo.docx
// Copiar na íntegra. Não resumir. Não reescrever.
// ============================================================
const SYSTEM_PROMPT = `Você é um especialista em redação de documentos educacionais profissionais do sistema escolar brasileiro.

Sua função é transformar anotações brutas de professores em documentos profissionais, claros, respeitosos e prontos para uso no contexto escolar.

Responda SEMPRE em português brasileiro.
Use formatação Markdown com títulos, subtítulos, listas e espaçamento adequado.

## REGRAS DE TOM E LINGUAGEM

1. O documento deve ter tom profissional, claro e respeitoso.
NUNCA acusatório, punitivo, definitivo ou que emita julgamento sobre o futuro do aluno.

2. Use linguagem pedagógica e institucional.
NUNCA use linguagem clínica, médica, psicológica ou jurídica.

3. NUNCA use os seguintes termos ou similares:
"diagnóstico", "laudo", "transtorno", "patologia", "distúrbio",
"conduta antissocial", "comportamento patológico", "quadro clínico",
"déficit", "síndrome" ou qualquer terminologia médica ou psiquiátrica.

4. NUNCA faça prognósticos sobre o futuro do aluno.
O documento registra observações e fatos — não define destinos nem capacidades futuras.

5. NUNCA use linguagem acusatória. Prefira linguagem factual e neutra:
Em vez de "o aluno agrediu", use "registra-se a ocorrência de..." ou
"foi observado comportamento de...".

6. NUNCA cite números de leis, artigos ou decretos.
Se necessário referenciar legislação, use apenas:
"conforme a legislação educacional vigente"
OU
"de acordo com as normas escolares e a legislação vigente".

7. NUNCA inclua promessas, garantias ou compromissos institucionais
que o professor não possa cumprir de forma independente.

## REGRAS ESPECÍFICAS POR TIPO DE DOCUMENTO

8. PARECER DESCRITIVO: deixe explícito no início do documento que se trata de
parecer pedagógico de acompanhamento. NUNCA de avaliação psicológica ou clínica.
Use sempre o sub-título: "Parecer Pedagógico de Acompanhamento".

9. RELATÓRIO DE OCORRÊNCIA: mantenha tom estritamente neutro e factual.
Registre apenas o que foi observado — sem interpretar motivações, sem atribuir
culpa, sem recomendar sanções. Encaminhamentos são sempre para a equipe gestora.

10. RELATÓRIO INDIVIDUAL DE ALUNO: descreva desempenho e comportamento observados.
NUNCA use termos definitivos como "não tem capacidade", "não consegue",
"nunca vai" — prefira "apresenta dificuldade em", "necessita de apoio para".

## REGRAS DE PRIVACIDADE

11. Se o professor informar nome real de aluno, use-o apenas quando for
essencial para o tipo de documento (ex: ata de reunião, comunicado).
Em relatórios e pareceres, prefira "o(a) aluno(a)" ou as iniciais informadas.

12. NUNCA inclua no documento: CPF, data de nascimento, endereço ou qualquer
dado pessoal além do nome, se fornecido.

13. Se o professor mencionar diagnóstico médico ou psicológico do aluno nas
anotações (ex: TDAH, autismo, depressão), NÃO reproduza o diagnóstico no
documento gerado. Referencie como "necessidades educacionais específicas" ou
"acompanhamento especializado" se for relevante para o contexto.

## REGRAS DE ESCOPO

14. O documento deve registrar observações, fatos e encaminhamentos.
NUNCA emitir diagnóstico, laudo, avaliação clínica ou parecer psicológico.

15. Campos não informados pelo professor devem aparecer entre colchetes
para preenchimento posterior: [Nome da Escola], [Data], [Disciplina],
[Nome do Professor]. O professor DEVE preencher antes de assinar ou enviar.

## ESTRUTURA OBRIGATÓRIA DO DOCUMENTO

Todo documento gerado DEVE seguir esta estrutura em 4 seções:

### 1. CABEÇALHO
- Nome da escola (ou [Nome da Escola] se não informado)
- Tipo de documento
- Data (ou [Data])
- Destinatário (se informado)
- Nome do professor/emissor (ou [Nome do Professor])

### 2. CORPO DO DOCUMENTO
- Conteúdo principal, estruturado conforme o tipo de documento
- Parágrafos claros, objetivos e bem organizados

### 3. CONCLUSÃO OU ENCERRAMENTO
- Fechamento adequado ao tipo de documento
- Encaminhamentos sugeridos (quando aplicável) — sempre direcionando
a equipe gestora para decisões formais

### 4. ASSINATURA
_________________________
[Nome do Professor]
[Cargo/Disciplina]
[Data]

## AVISO FINAL OBRIGATÓRIO

TODO documento gerado DEVE terminar com o seguinte aviso, exatamente assim,
sem alterações:

---
Aviso antes de enviar: Este documento foi gerado com base nas anotações
fornecidas. Revise o conteúdo, substitua os campos entre colchetes e confirme
os fatos antes de assinar ou enviar. Documentos escolares que contenham dados
de alunos devem ser tratados com confidencialidade.
---`;

// ============================================================
// TIPOS
// ============================================================
interface RapidoInput {
  tipoDocumento: string;
  anotacoes: string;
  destinatario?: string;
  contexto?: string;
  tomFormal?: boolean;
}

// ============================================================
// HELPER: montar userPrompt dinâmico — Seção 5 do docx
// ============================================================
function buildUserPrompt(input: RapidoInput): string {
  let prompt = `Transforme as seguintes anotações brutas em um documento profissional:\n\n`;
  prompt += `**Tipo de documento:** ${input.tipoDocumento}\n\n`;
  prompt += `**IMPORTANTE:** Este é um documento educacional do sistema escolar brasileiro.\n`;
  prompt += `Use linguagem pedagógica adequada para este tipo de documento.\n`;
  prompt += `Se for "Parecer Descritivo", deixe claro no início: "Parecer Pedagógico de Acompanhamento".\n`;
  prompt += `Se for "Relatório de Ocorrência", mantenha tom estritamente neutro e factual.\n\n`;
  prompt += `**Anotações brutas:** ${input.anotacoes}\n\n`;

  if (input.destinatario && input.destinatario.trim() !== "") {
    prompt += `**Destinatário:** ${input.destinatario}\n\n`;
  }

  if (input.contexto && input.contexto.trim() !== "") {
    prompt += `**Contexto adicional:** ${input.contexto}\n\n`;
  }

  const tom = input.tomFormal !== false ? "Formal e profissional" : "Semi-formal e acessível";
  prompt += `**Tom:** ${tom}\n\n`;

  prompt += `Crie o documento completo com as 4 seções obrigatórias:\n`;
  prompt += `1. CABEÇALHO adequado ao tipo de documento\n`;
  prompt += `2. CORPO do documento bem estruturado\n`;
  prompt += `3. CONCLUSÃO ou ENCERRAMENTO apropriado\n`;
  prompt += `4. ASSINATURA (espaço para)\n\n`;
  prompt += `Termine com o aviso de revisão obrigatório conforme instrução do sistema.\n\n`;
  prompt += `O documento deve estar pronto para revisão, ajuste e assinatura pelo professor.`;

  return prompt;
}

// ============================================================
// HELPER: extrair texto de qualquer part do Gemini
// (compatível com modelos thinking que retornam múltiplas parts)
// ============================================================
function extractText(data: Record<string, unknown>): string | null {
  const candidates = data?.candidates as Array<Record<string, unknown>>;
  const candidate = candidates?.[0];
  const contentParts = (candidate?.content as Record<string, unknown>)
    ?.parts as Array<Record<string, unknown>>;
  if (!Array.isArray(contentParts) || contentParts.length === 0) return null;
  const joined = contentParts
    .map((p) => (typeof p.text === "string" ? p.text : ""))
    .join("\n")
    .trim();
  return joined || null;
}

// ============================================================
// HELPER: chamar Gemini com parâmetros configuráveis
// ============================================================
async function callGemini(
  geminiKey: string,
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.7,
): Promise<Response> {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: 16384,
          temperature,
        },
      }),
    },
  );
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. AUTENTICAÇÃO via Bearer token ──────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado.", errorCode: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cliente autenticado com o token do usuário (respeita RLS)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Sessão inválida.", errorCode: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.log(`[rapido-generate] user=${user.id}`);

    // ── 2. PARSE DO BODY ──────────────────────────────────────
    let body: RapidoInput;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Corpo da requisição inválido.", errorCode: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { tipoDocumento, anotacoes, destinatario, contexto, tomFormal } = body;

    // ── 3. VALIDAÇÃO DOS CAMPOS OBRIGATÓRIOS ──────────────────
    if (!tipoDocumento || tipoDocumento.trim() === "" || !anotacoes || anotacoes.trim() === "") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Preencha o tipo de documento e as anotações para gerar o R.A.P.I.D.O.",
          errorCode: "VALIDATION_ERROR",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 4. CONTROLE DE TRIAL ──────────────────────────────────
    // Verificar assinatura premium na tabela subscriptions
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .maybeSingle();

    const isPremium =
      subscription?.plan === "premium" && subscription?.status === "active";

    if (!isPremium) {
      // Contar usos do trial para este usuário
      const { count, error: countError } = await supabaseClient
        .from("rapido_trials")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countError) {
        console.error("[rapido-generate] Error counting trial usage:", countError.message);
        // Em caso de erro na consulta, não bloquear — deixar prosseguir com log
      } else if ((count ?? 0) >= 2) {
        console.log(`[rapido-generate] Trial exhausted for user=${user.id}, count=${count}`);
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Você atingiu o limite gratuito do R.A.P.I.D.O. Faça upgrade para continuar gerando documentos.",
            errorCode: "TRIAL_EXHAUSTED",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // ── 5. VERIFICAR CHAVE GEMINI ─────────────────────────────
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      console.error("[rapido-generate] GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Chave Gemini não configurada no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 6. MONTAR PROMPTS ─────────────────────────────────────
    const userPrompt = buildUserPrompt({
      tipoDocumento,
      anotacoes,
      destinatario,
      contexto,
      tomFormal,
    });

    // ── 7. CHAMADA GEMINI COM RETRY 503/429 ───────────────────
    let geminiResponse = await callGemini(geminiKey, SYSTEM_PROMPT, userPrompt, 0.7);

    if (!geminiResponse.ok && (geminiResponse.status === 503 || geminiResponse.status === 429)) {
      const retryStatus = geminiResponse.status;
      console.error(
        `[rapido-generate] Gemini temporary unavailable status=${retryStatus}, retrying once after 3s`,
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
      geminiResponse = await callGemini(geminiKey, SYSTEM_PROMPT, userPrompt, 0.7);
      if (!geminiResponse.ok && (geminiResponse.status === 503 || geminiResponse.status === 429)) {
        const finalStatus = geminiResponse.status;
        const finalErr = await geminiResponse.text();
        console.error(
          `[rapido-generate] Gemini still unavailable after retry status=${finalStatus}:`,
          finalErr,
        );
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "O serviço de IA está com alta demanda no momento. Aguarde alguns segundos e tente gerar novamente.",
            errorCode: "PROVIDER_UNAVAILABLE",
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    if (!geminiResponse.ok) {
      const errStatus = geminiResponse.status;
      const errText = await geminiResponse.text();
      console.error(`[rapido-generate] Gemini error status=${errStatus}:`, errText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao chamar o Gemini (status ${errStatus}). Tente novamente.`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse.json();
    let content = extractText(geminiData);
    const firstFinishReason = geminiData?.candidates?.[0]?.finishReason ?? "N/A";

    // ── 8. TRATAMENTO DE SAFETY ───────────────────────────────
    if (!content && firstFinishReason === "SAFETY") {
      console.error(
        `[rapido-generate] SAFETY filter triggered for tipoDocumento="${tipoDocumento}"`,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Não foi possível gerar o documento com essas anotações. Revise o texto e tente reformular.",
          errorCode: "CONTENT_FILTERED",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 9. TRATAMENTO DE RECITATION COM RETRY ─────────────────
    if (!content && firstFinishReason === "RECITATION") {
      console.warn(
        `[rapido-generate] RECITATION triggered for tipoDocumento="${tipoDocumento}", retrying with anti-recitation prompt`,
      );
      // Retry com temperatura mais alta e instrução anti-recitação
      const antiRecitationPrompt =
        userPrompt +
        "\n\nIMPORTANTE: Crie um documento original e criativo baseado nas anotações fornecidas. " +
        "Não reproduza textos, modelos ou templates existentes literalmente. " +
        "Use as informações como base para criar um documento único e personalizado.";

      const retryResponse = await callGemini(
        geminiKey,
        SYSTEM_PROMPT,
        antiRecitationPrompt,
        0.9,
      );

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        const retryContent = extractText(retryData);
        const retryFinishReason = retryData?.candidates?.[0]?.finishReason ?? "N/A";

        if (retryContent) {
          content = retryContent;
          console.log(
            `[rapido-generate] Anti-recitation retry succeeded, finishReason=${retryFinishReason}`,
          );
        } else if (retryFinishReason === "RECITATION") {
          console.error(
            `[rapido-generate] RECITATION persists after retry for tipoDocumento="${tipoDocumento}"`,
          );
          return new Response(
            JSON.stringify({
              success: false,
              error:
                "Não foi possível gerar o documento com essas anotações. Tente reformular o conteúdo.",
              errorCode: "CONTENT_FILTERED",
            }),
            { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    // ── 10. VERIFICAR CONTEÚDO FINAL ──────────────────────────
    if (!content) {
      console.error(
        `[rapido-generate] Empty content after all attempts, finishReason=${firstFinishReason}`,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Não foi possível gerar o documento agora. Tente novamente em alguns instantes.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 11. REGISTRAR USO DO TRIAL (somente após sucesso) ─────
    if (!isPremium) {
      const { error: insertError } = await supabaseClient
        .from("rapido_trials")
        .insert({ user_id: user.id });

      if (insertError) {
        // Log do erro mas não bloquear — o documento já foi gerado
        console.error(
          `[rapido-generate] Failed to insert trial record for user=${user.id}:`,
          insertError.message,
        );
      } else {
        console.log(`[rapido-generate] Trial recorded for user=${user.id}`);
      }
    }

    // ── 12. RETORNO DE SUCESSO ────────────────────────────────
    console.log(
      `[rapido-generate] Success for user=${user.id}, tipoDocumento="${tipoDocumento}", finishReason=${firstFinishReason}`,
    );
    return new Response(
      JSON.stringify({
        success: true,
        content,
        title: tipoDocumento,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    // ── CATCH GLOBAL ──────────────────────────────────────────
    const message = err instanceof Error ? err.message : String(err);
    console.error("[rapido-generate] Unhandled error:", message);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Erro interno. Tente novamente.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
