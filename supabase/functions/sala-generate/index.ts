// GPS Docente Premium — Edge Function: sala-generate
// Módulo S.A.L.A. — Gestão de Conflitos Escolares
// Prompt oficial: prompts2_SALA_completo.docx (Versão 2 | Mai/2026)
// Aprovado pelo Diretor | Revisão técnico-pedagógica: Claude (Anthropic)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// SYSTEM PROMPT — S.A.L.A. VERSÃO 2 (REVISADA)
// Fonte: prompts2_SALA_completo.docx
// ⚠ NÃO simplificar, resumir ou substituir por versão anterior.
// ============================================================
const SYSTEM_PROMPT = `## REGRA DE NOMENCLATURA — SEÇÃO 1

A primeira seção do protocolo DEVE ser sempre nomeada como:

"1. LEITURA PEDAGÓGICA DA SITUAÇÃO"

NUNCA usar as seguintes variações — são terminações proibidas neste produto:
- "Diagnóstico do Conflito"
- "Diagnóstico da Situação"
- "Análise Diagnóstica"
- Qualquer variação com a palavra "diagnóstico"

Justificativa: o GPS Docente é uma ferramenta pedagógica para professores. A palavra "diagnóstico" tem conotação clínica (médica/psicológica) e não reflete o papel do professor neste protocolo. "Leitura pedagógica da situação" é o termo correto para este produto.

## REGRA ANTI-JURÍDICA — REFERÊNCIAS LEGAIS

NUNCA citar números de leis, artigos ou decretos no protocolo gerado.

Exemplos de citações PROIBIDAS:
- "Lei 13.185/2015"
- "Lei 8.069/1990 (ECA)"
- "Art. 5º da Lei..."
- "Decreto nº..."
- Qualquer número de lei, artigo ou norma específica

Quando for necessário referenciar legislação, usar APENAS:
"conforme a legislação vigente sobre bullying e convivência escolar"
OU
"de acordo com as normas escolares e a legislação educacional vigente"

Justificativa: o GPS Docente não é um software jurídico nem oferece assessoria legal. Citar leis específicas pode induzir o professor a assumir responsabilidades que pertencem à equipe gestora e jurídica da instituição. Encaminhamentos formais e jurídicos devem ser sempre direcionados à coordenação/direção escolar.

## REGRA DE ABERTURA — VOZ DO PROTOCOLO

O protocolo DEVE começar diretamente com o título e a Seção 1.

NUNCA iniciar o protocolo com frases de empatia simulada como:
- "Compreendo perfeitamente a situação."
- "Entendo o quanto essa situação é difícil."
- "Sei que lidar com isso é desafiador."
- "Como especialista, compreendo..."
- Qualquer frase de abertura que personifique o protocolo como um profissional de saúde, psicólogo ou terapeuta.

A voz do protocolo é pedagógica, profissional e orientativa. O tom acolhedor deve estar DENTRO do conteúdo das seções, nunca em uma frase de abertura que simule empatia de um agente.

FORMATO CORRETO DE ABERTURA:
## Protocolo de Ação — [Tipo de Conflito]

### 1. LEITURA PEDAGÓGICA DA SITUAÇÃO

[conteúdo da seção...]

## INSTRUÇÃO PARA MODELOS DE COMUNICAÇÃO COM FAMÍLIAS

Na Seção 5 (Comunicação com Famílias), SEMPRE incluir a seguinte nota antes de cada modelo de mensagem:

> Modelo orientativo — adapte antes de enviar.
> Substitua os campos entre colchetes pelo nome real do aluno, data e disciplina.

Justificativa: modelos prontos podem ser copiados e enviados sem adaptação, com campos como "[Nome do Aluno A]" literais na mensagem. A nota protege o professor de erros de comunicação com famílias.

---

Você é um especialista em gestão de conflitos escolares,
mediação pedagógica e convivência escolar, com experiência
em psicologia educacional aplicada ao contexto brasileiro.

Seu papel é apoiar professores e educadores na elaboração
de protocolos de ação práticos, empáticos e pedagogicamente
fundamentados para situações de conflito em ambiente escolar.

IDENTIDADE E LIMITES DO SEU PAPEL:
- Você é um suporte pedagógico orientativo, não um
  profissional de saúde mental, advogado ou gestor escolar.
- Você não emite diagnósticos psicológicos, laudos clínicos
  ou transtornos comportamentais.
- Você não determina punições disciplinares definitivas
  (suspensão, expulsão, transferência) — apenas orienta
  encaminhamentos à equipe gestora quando necessário.
- Em situações de risco imediato à integridade física ou
  psicológica de qualquer aluno, seu protocolo deve sempre
  priorizar o acionamento da coordenação/direção escolar
  e, quando necessário, do Conselho Tutelar.
- Você nunca minimiza relatos de sofrimento, violência
  ou discriminação.

TOM E ABORDAGEM:
- Acolhedor com o professor: reconheça que lidar com
  conflitos é desafiador e que o educador precisa de apoio.
- Empático com todos os envolvidos: vítima, agressor
  e testemunhas são estudantes em desenvolvimento.
- Responsabilizador sem ser punitivo: o foco é
  aprendizagem e reparação, não castigo.
- Prático e aplicável: cada orientação deve ser possível
  de executar por um professor com recursos reais de escola
  pública ou privada brasileira.
- Linguagem direta, sem jargão clínico excessivo.

DIRETRIZES PEDAGÓGICAS:
- Considere o contexto escolar brasileiro: turmas
  heterogêneas, recursos limitados, professores
  sobrecarregados, famílias com diferentes graus de
  participação.
- Diferencie situações episódicas de padrões crônicos —
  a gravidade da resposta deve ser proporcional.
- Inclua sempre orientações de registro formal do ocorrido —
  isso protege o professor e a instituição.
- Quando houver conflito com conotação racial, de gênero,
  orientação sexual ou deficiência, trate com sensibilidade
  adicional e referencie conforme a legislação vigente sobre
  bullying e convivência escolar.
- Modelos de comunicação com famílias devem ser respeitosos,
  sem linguagem acusatória.

FORMATO DE RESPOSTA:
- Responda SEMPRE em português brasileiro.
- Use formatação Markdown com títulos ##, subtítulos ###,
  listas e destaques em negrito.
- O protocolo deve ter exatamente 8 seções numeradas.
- Cada seção deve ser acionável — o professor deve saber
  o que fazer ao terminar de ler.
- Inicie diretamente com o título ## Protocolo de Ação — [Tipo de Conflito] e a Seção 1. NÃO inicie com frases de empatia simulada.
- Finalize com um lembrete discreto de que o protocolo
  é orientativo e que situações graves devem ser escaladas
  para a equipe gestora.`;

// ============================================================
// HELPER: montar userPrompt dinâmico
// Campos opcionais só entram se preenchidos (sem campos vazios)
// Fonte: prompts2_SALA_completo.docx — seção 3. USER PROMPT
// ============================================================
function buildUserPrompt(input: Record<string, string | undefined>): string {
  const {
    tipoConflito,
    descricaoSituacao,
    alunosEnvolvidos,
    frequencia,
    sinaisAlerta,
    gatilhos,
    abordagemPreferida,
    tomComunicacao,
    objetivoResolucao,
    recursosDisponiveis,
  } = input;

  let prompt = `Crie um protocolo de ação para o seguinte conflito em sala de aula:\n\n`;
  prompt += `**Tipo de conflito:** ${tipoConflito}\n\n`;
  prompt += `**Descrição da situação:** ${descricaoSituacao}\n`;

  if (alunosEnvolvidos?.trim()) {
    prompt += `\n**Alunos envolvidos:** ${alunosEnvolvidos}`;
  }
  if (frequencia?.trim()) {
    prompt += `\n**Frequência:** ${frequencia}`;
  }
  if (sinaisAlerta?.trim()) {
    prompt += `\n**Sinais de alerta observados:** ${sinaisAlerta}`;
  }
  if (gatilhos?.trim()) {
    prompt += `\n**Gatilhos identificados:** ${gatilhos}`;
  }
  if (abordagemPreferida?.trim()) {
    prompt += `\n**Abordagem preferida:** ${abordagemPreferida}`;
  }
  if (tomComunicacao?.trim()) {
    prompt += `\n**Tom de comunicação:** ${tomComunicacao}`;
  }
  if (objetivoResolucao?.trim()) {
    prompt += `\n**Objetivo da resolução:** ${objetivoResolucao}`;
  }
  if (recursosDisponiveis?.trim()) {
    prompt += `\n**Recursos disponíveis:** ${recursosDisponiveis}`;
  }

  prompt += `\n\nEstruture o protocolo com:\n`;
  prompt += `1. ANÁLISE DA SITUAÇÃO (diagnóstico do conflito)\n`;
  prompt += `2. INTERVENÇÃO IMEDIATA (ações para agora)\n`;
  prompt += `3. ESTRATÉGIAS DE MEDIAÇÃO (passo a passo)\n`;
  prompt += `4. PLANO DE ACOMPANHAMENTO (próximos dias/semanas)\n`;
  prompt += `5. COMUNICAÇÃO COM FAMÍLIAS (modelo de mensagem)\n`;
  prompt += `6. ESTRATÉGIAS DE PREVENÇÃO (para evitar recorrência)\n`;
  prompt += `7. INDICADORES DE SUCESSO (como medir progresso)\n`;
  prompt += `8. RECURSOS DE APOIO (encaminhamentos se necessário)`;

  return prompt;
}

// ============================================================
// HELPER: extrair texto de qualquer part do Gemini
// (compatível com modelos thinking que retornam múltiplas parts)
// ============================================================
function extractText(data: Record<string, unknown>): string | null {
  const candidates = data?.candidates as Array<Record<string, unknown>>;
  const candidate = candidates?.[0];
  const contentParts = (candidate?.content as Record<string, unknown>)?.parts as Array<Record<string, unknown>>;
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

    // ── 2. PARSE DO BODY ──────────────────────────────────────
    const input = await req.json() as Record<string, string | undefined>;
    const {
      tipoConflito,
      descricaoSituacao,
      alunosEnvolvidos,
      frequencia,
      sinaisAlerta,
      gatilhos,
      abordagemPreferida,
      tomComunicacao,
      objetivoResolucao,
      recursosDisponiveis,
    } = input;

    // ── 3. VALIDAÇÃO DOS CAMPOS OBRIGATÓRIOS ──────────────────
    if (!tipoConflito?.trim() || !descricaoSituacao?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Preencha o tipo de conflito e a descrição da situação.",
          errorCode: "VALIDATION_ERROR",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 4. CONTROLE DE TRIAL ──────────────────────────────────
    // Verificar assinatura premium na tabela subscriptions
    // (mesmo padrão do frontend: plan === 'premium' && status === 'active')
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
        .from("sala_trials")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countError) {
        console.error("[sala-generate] Error counting trial usage:", countError.message);
        // Em caso de erro na consulta, não bloquear — deixar prosseguir com log
      } else if ((count ?? 0) >= 2) {
        console.log(`[sala-generate] Trial exhausted for user=${user.id}, count=${count}`);
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Você atingiu o limite gratuito do S.A.L.A. Faça upgrade para continuar gerando protocolos.",
            errorCode: "TRIAL_EXHAUSTED",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // ── 5. VERIFICAR CHAVE GEMINI ─────────────────────────────
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      console.error("[sala-generate] GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Chave Gemini não configurada no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 6. MONTAR PROMPTS ─────────────────────────────────────
    const userPrompt = buildUserPrompt({
      tipoConflito,
      descricaoSituacao,
      alunosEnvolvidos,
      frequencia,
      sinaisAlerta,
      gatilhos,
      abordagemPreferida,
      tomComunicacao,
      objetivoResolucao,
      recursosDisponiveis,
    });

    // ── 7. CHAMADA GEMINI COM RETRY 503/429 ───────────────────
    let geminiResponse = await callGemini(geminiKey, SYSTEM_PROMPT, userPrompt, 0.7);

    if (!geminiResponse.ok && (geminiResponse.status === 503 || geminiResponse.status === 429)) {
      const retryStatus = geminiResponse.status;
      console.error(
        `[sala-generate] Gemini temporary unavailable status=${retryStatus}, retrying once after 3s`,
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
      geminiResponse = await callGemini(geminiKey, SYSTEM_PROMPT, userPrompt, 0.7);

      if (!geminiResponse.ok && (geminiResponse.status === 503 || geminiResponse.status === 429)) {
        const finalStatus = geminiResponse.status;
        const finalErr = await geminiResponse.text();
        console.error(
          `[sala-generate] Gemini still unavailable after retry status=${finalStatus}:`,
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
      console.error(`[sala-generate] Gemini error status=${errStatus}:`, errText);
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
    // SAFETY é específico do S.A.L.A. — descrições de violência
    // escolar (bullying, agressão física) podem acionar filtros.
    if (!content && firstFinishReason === "SAFETY") {
      console.error(
        `[sala-generate] SAFETY filter triggered for tipoConflito="${tipoConflito}"`,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Não foi possível gerar o protocolo para esta situação. Tente reformular a descrição.",
          errorCode: "CONTENT_FILTERED",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 9. RETRY ANTI-RECITAÇÃO ───────────────────────────────
    if (!content && firstFinishReason === "RECITATION") {
      console.error(
        "[sala-generate] RECITATION detected, retrying with anti-recitation instruction",
      );
      const antiRecitationPrefix =
        "IMPORTANTE: Gere uma resposta autoral e original. " +
        "Não reproduza trechos literais de publicações, leis, manuais ou materiais de referência. " +
        "Parafraseie orientações com linguagem própria e produza um protocolo prático e aplicável.\n\n";

      const retryResponse = await callGemini(
        geminiKey,
        SYSTEM_PROMPT,
        antiRecitationPrefix + userPrompt,
        0.9,
      );

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        content = extractText(retryData);
        const retryFinishReason = retryData?.candidates?.[0]?.finishReason ?? "N/A";
        console.error(
          `[sala-generate] Anti-recitation retry finishReason=${retryFinishReason}, content=${content ? "present" : "empty"}`,
        );
      } else {
        const retryStatus = retryResponse.status;
        console.error(`[sala-generate] Anti-recitation retry failed status=${retryStatus}`);
      }
    }

    // ── 10. FALLBACK PLACEHOLDER (RECITATION PERSISTENTE) ─────
    if (!content && firstFinishReason === "RECITATION") {
      console.error(
        "[sala-generate] RECITATION persisted after retry, using placeholder fallback",
      );
      const placeholderInstruction =
        "\n\nINSTRUÇÃO ADICIONAL:\n" +
        "Gere o protocolo completo com todas as 8 seções.\n" +
        "Se precisar citar legislação (ex: Lei 13.185/2015), mencione apenas o nome da lei e seu objetivo geral — não transcreva artigos literais.\n" +
        "Produza orientações autorais, práticas e aplicáveis ao contexto escolar brasileiro.";

      const fallbackResponse = await callGemini(
        geminiKey,
        SYSTEM_PROMPT,
        userPrompt + placeholderInstruction,
        0.7,
      );

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        content = extractText(fallbackData);
        const fallbackFinishReason = fallbackData?.candidates?.[0]?.finishReason ?? "N/A";
        console.error(
          `[sala-generate] Placeholder fallback finishReason=${fallbackFinishReason}, content=${content ? "present" : "empty"}`,
        );
      } else {
        const fallbackStatus = fallbackResponse.status;
        if (fallbackStatus === 503 || fallbackStatus === 429) {
          return new Response(
            JSON.stringify({
              success: false,
              error:
                "O serviço de IA está com alta demanda. Aguarde alguns segundos e tente novamente.",
              errorCode: "PROVIDER_UNAVAILABLE",
            }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        console.error(`[sala-generate] Placeholder fallback failed status=${fallbackStatus}`);
      }
    }

    // ── 11. CONTEÚDO VAZIO APÓS TODAS AS TENTATIVAS ───────────
    if (!content) {
      const diagInfo = {
        hasCandidates: Array.isArray(geminiData?.candidates),
        candidatesCount: geminiData?.candidates?.length ?? 0,
        finishReason: firstFinishReason,
        safetyRatings: geminiData?.candidates?.[0]?.safetyRatings ?? [],
        promptFeedback: geminiData?.promptFeedback ?? null,
      };
      console.error(
        "[sala-generate] Gemini returned no text content after all attempts:",
        JSON.stringify(diagInfo),
      );
      const errorBody =
        firstFinishReason === "RECITATION"
          ? {
              success: false,
              error:
                "Não foi possível gerar o protocolo para esta situação. Tente reformular a descrição.",
              errorCode: "CONTENT_FILTERED",
            }
          : {
              success: false,
              error: "O modelo respondeu sem conteúdo textual. Verifique os logs para detalhes.",
            };
      return new Response(JSON.stringify(errorBody), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 12. REGISTRAR TRIAL APÓS GERAÇÃO BEM-SUCEDIDA ─────────
    // Só registra se não for premium (trial não tem sentido para premium)
    // Registra APÓS a geração para não consumir trial em caso de falha
    if (!isPremium) {
      const { error: insertError } = await supabaseClient
        .from("sala_trials")
        .insert({ user_id: user.id });

      if (insertError) {
        // Log do erro mas não falha a resposta — o conteúdo já foi gerado
        console.error("[sala-generate] Failed to record trial usage:", insertError.message);
      } else {
        console.log(`[sala-generate] Trial recorded for user=${user.id}`);
      }
    }

    // ── 13. RETORNO DE SUCESSO ────────────────────────────────
    const title = `Protocolo: ${tipoConflito}`;
    console.log(
      `[sala-generate] Success for user=${user.id}, tipoConflito="${tipoConflito}", isPremium=${isPremium}`,
    );

    // ── SALVAR GERAÇÃO NA BIBLIOTECA (fire-and-forget) ────────────────────────
    try {
      const { error: saveErr } = await supabaseClient
        .from("generations")
        .insert({ user_id: user.id, method: "SALA", title, content });
      if (saveErr) {
        console.error("[sala-generate] Failed to save generation:", saveErr.message);
      } else {
        console.log(`[sala-generate] Generation saved for user=${user.id}`);
      }
    } catch (saveEx) {
      console.error("[sala-generate] Unexpected error saving generation:", saveEx);
    }

    return new Response(
      JSON.stringify({ success: true, error: null, content, title }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[sala-generate] Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
