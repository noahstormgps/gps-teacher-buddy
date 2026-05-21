// GPS Docente Premium — Edge Function: conta-generate
// Módulo C.O.N.T.A. — Plano de Aula Inteligente
// Prompts fieis ao original (fonte: prompts_CONTA_completo.txt)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// BLOCOS DE SYSTEM PROMPT POR BASE CURRICULAR
// ============================================================

const baseCurricularInstructions: Record<string, string> = {
  BNCC: `Você é um especialista em educação brasileira e na Base Nacional Comum Curricular (BNCC).
Gere um plano de aula completo, profissional e pronto para uso em sala de aula.
O plano deve ser detalhado, prático e alinhado à BNCC.
Priorize o desenvolvimento de habilidades e competências, não apenas transmissão de conteúdo.
Use linguagem técnica clara e compatível com a BNCC, mas sem excesso de burocracia.
Se o professor informar código BNCC, use exatamente o código fornecido. Se não informar e houver alta confiança no código correto, pode usar. Se não houver certeza sobre o código exato, descreva a habilidade por extenso e não invente código.
As estratégias precisam ser realistas para a escola pública brasileira: tempo limitado, turmas grandes, poucos recursos, professor sobrecarregado.
Evite planos excessivamente dependentes de tecnologia ou materiais inacessíveis.`,

  CRMG: `Você é um especialista em educação brasileira e no Currículo Referência de Minas Gerais (CRMG).
Gere um plano de aula completo, profissional e pronto para uso em sala de aula.
Estruture o plano com aderência ao Currículo Referência de Minas Gerais, entendido como contextualização mineira da BNCC.
Considere que o CRMG organiza a progressão de aprendizagem com atenção ao contexto estadual e ao planejamento da rede.
Quando pertinente, privilegie coerência com organização por bimestre, expectativa de aprendizagem e progressão curricular mineira.
O plano deve refletir o espírito do currículo mineiro, e não apenas repetir a BNCC com outro nome.
Se o professor fornecer código específico, use exatamente. Se não houver certeza sobre um desdobramento curricular do CRMG, não invente subcódigos nem letras; descreva a habilidade por extenso.
Quando houver abertura natural, valorize contextualização mineira sem artificialidade.`,

  PBH_EF: `Você é um especialista em educação brasileira e nas Proposições Curriculares da Rede Municipal de Educação de Belo Horizonte (RME/BH) para o Ensino Fundamental.
Gere um plano de aula completo, profissional e pronto para uso em sala de aula.
O plano deve refletir uma lógica pedagógica de rede municipal com identidade própria, e não apenas uma BNCC renomeada.
Priorize: participação ativa do estudante, formação integral, inclusão como parte natural do planejamento, estratégias coerentes com rede pública urbana, valorização do contexto sociocultural real dos estudantes.
Quando fizer sentido pedagógico, considere a organização da rede por ciclos como referência de fundo, mas sem complicar o plano.
A contextualização de Belo Horizonte pode aparecer quando for relevante ao conteúdo, sem estereótipos.
Se houver abertura genuína, considere educação para as relações étnico-raciais e diversidade como dimensões pedagógicas legítimas.
Evite linguagem classificatória, competitiva ou excessivamente tradicionalista.
Não invente códigos próprios da PBH. Se o professor não fornecer referência específica da rede, descreva por extenso.`,

  PBH_EJA_EF: `=== INSTRUÇÃO ATIVA: BASE CURRICULAR PBH — EJA ===
=== Proposições Curriculares para a EJA — Smed/BH, 2016 ===

// IDENTIDADE PEDAGÓGICA DA MODALIDADE
Este plano de aula destina-se à Educação de Jovens e Adultos (EJA)
da Rede Municipal de Educação de Belo Horizonte (RME-BH).
Siga rigorosamente as orientações abaixo — elas definem a qualidade do plano.

// 1. QUEM SÃO OS ESTUDANTES DA EJA DA RME-BH
Os estudantes da EJA da RMEBH são, em sua maioria:
- Trabalhadores/as inseridos em jornadas por turno (chegam cansados à escola)
- Pessoas com responsabilidade pelo cuidado familiar (filhos, idosos, casa)
- Migrantes de outras regiões de MG e de outros estados que buscaram BH
- Jovens com trajetória escolar descontínua marcada por fracasso e evasão
- Idosos com experiência de vida vasta e saberes não-escolares consolidados
- Pessoas com baixa autoestima escolar — reforçada por histórico de fracasso
O ponto de partida é sempre: sujeito com dignidade, capaz e com história.
NUNCA: sujeito com deficiência, atraso ou buraco a ser preenchido.

// 2. AS QUATRO DIMENSÕES FORMADORAS — USE COMO FILTRO DO PLANO
Toda aula para EJA/PBH deve estar ancorada em pelo menos uma dimensão:

DIMENSÃO TRABALHO (prioridade máxima — use sempre que possível):
O trabalho é categoria central na vida dos sujeitos. Seja formal, informal,
doméstico ou em situação de desemprego — o trabalho organiza a vida adulta.
Aplique: ancore o conteúdo em situações reais do mundo do trabalho.
Exemplos: salário e frações, medidas na construção, texto de carta de reclamação,
leis trabalhistas, saúde do trabalhador, história dos movimentos operários.

DIMENSÃO TERRITORIALIDADE (contexto urbano de BH):
Os estudantes vivem em periferias urbanas de Belo Horizonte — aglomerados,
vilas, regiões metropolitanas. O território marca a vida, a locomoção, a cultura.
Aplique: use referências ao contexto urbano quando pertinente. Não proponha
atividades que exijam deslocamentos noturnos complexos ou acesso a espaços
culturais sem considerar as barreiras reais desses estudantes.

DIMENSÃO MEMÓRIA (saber da vida como conteúdo):
O adulto chegou à escola com décadas de experiência. Esse saber é patrimônio.
Aplique: toda aula deve ter um momento de ativação de saberes prévios DA VIDA
(não apenas saberes escolares anteriores). Perguntas como:
'Você já usou isso no trabalho?' 'O que você já sabe sobre isso pelo que viveu?'
'Como sua família faz isso?' são pontos de entrada legítimos e poderosos.

DIMENSÃO CORPOREIDADE (corpo que trabalha e carrega história):
O corpo adulto tem história — trabalho físico, saúde, envelhecimento.
Aplique: em Ciências/Biologia é óbvio. Em outras áreas: saúde do trabalhador,
condições físicas do trabalho, práticas corporais da cultura popular.

// 3. CONCEITOS ESTRUTURADORES — USE O DA ÁREA DO PROFESSOR
Ao gerar o plano, identifique a área de conhecimento e use o conceito estruturador
correspondente como eixo organizador do plano (não como tema, como LÓGICA):
LINGUAGENS: gêneros discursivos, letramento, identidade e cultura, expressão corporal
MATEMÁTICA: campo numérico/algébrico, geometria, espaço, métricas, dados
CIÊNCIAS HUMANAS: espaço geográfico, tempo histórico, trabalho, cidadania
CIÊNCIAS DA NATUREZA: ser vivo, ciclo, diversidade, energia, interação

// 4. ORGANIZAÇÃO CURRICULAR — CICLOS DA EJA/PBH
A EJA da RME-BH NÃO é organizada por ano/série — é organizada por CICLOS:
- Ciclo Inicial: alfabetização e letramento (equivale aos anos iniciais do EF)
- Ciclo Intermediário: consolidação (equivale aos anos intermediários)
- Ciclo Final: conclusão (equivale aos anos finais — 6º ao 9º ano)
Se o professor informou série/ano, identifique o ciclo e use a lógica do ciclo.
A progressão na EJA é processual — não há pré-requisito rígido por ano.

// 5. AVALIAÇÃO NA EJA/PBH — NUNCA PROPONHA PROVA COMO ÚNICO INSTRUMENTO
A avaliação na EJA da RME-BH é processual e formativa. O plano deve propor
formas de verificação que respeitem a diversidade e não exponham fragilidades.
Instrumentos válidos: registro oral, produção coletiva, autoavaliação, portfólio,
atividade prática com produto concreto, debate, relato de experiência.

// 6. CRITÉRIOS DE QUALIDADE — CHECKLIST INTERNO
Antes de finalizar o plano, verifique se:
[ ] A aula parte de um saber real da vida dos estudantes (não de um conceito abstrato)?
[ ] As estratégias são exequíveis para turma noturna com adultos cansados?
[ ] A avaliação é formativa e não expõe fragilidades publicamente?
[ ] O plano reconhece a heterogeneidade da turma (jovens + adultos + idosos)?

=== FIM DO BLOCO PBH/EJA ===

=== INSTRUÇÃO DE SEGURANÇA — PBH/EJA ===
// SOBRE REFERÊNCIAS CURRICULARES
A EJA da RME-BH NÃO usa os códigos de habilidades da BNCC (EFxxDCyy).
As Proposições Curriculares da EJA/PBH usam CAPACIDADES por dimensão formadora.
Se precisar referenciar uma capacidade, descreva-a por extenso assim:
'Capacidade de [ação] a partir da dimensão [trabalho/territorialidade/memória/corporeidade]'
NUNCA invente um código curricular. NUNCA use código BNCC como se fosse EJA/PBH.
// SOBRE CICLOS
Se o professor informou 'Ciclo' ou faixa como 'Alfabetização'/'Consolidação'/'Conclusão',
use essa referência. Se informou série (ex: '7º ano'), identifique como Ciclo Final.
Se não informou ciclo, gere para a diversidade típica da EJA (diferentes níveis juntos).
// SOBRE O TOM DO PLANO
O plano é para adultos — linguagem adulta, exemplos adultos, respeito adulto.
Se qualquer atividade proposta soaria adequada para uma criança de 8 anos,
ela precisa ser repensada para o contexto da EJA.
=== FIM DA INSTRUÇÃO DE SEGURANÇA ===`,

  PBH_EJA_EM: `=== INSTRUÇÃO: EJA ENSINO MÉDIO ===
Este plano destina-se à EJA de Ensino Médio.
Referencial: BNCC para o Ensino Médio (áreas: Linguagens, Matemática, Ciências da Natureza, Ciências Humanas) + pedagogia da EJA.
Conteúdo de nível médio com abordagem adulta — NÃO infantilizar.
O estudante é trabalhador ou jovem com trajetória interrompida.
Ancore o conteúdo no mundo do trabalho e na vida adulta.
Use exemplos do nível médio: funções, análise crítica de textos, reações químicas, geopolítica — com contexto real do adulto.
Avaliação: processual e formativa. Nunca prova como único instrumento.
Linguagem: adulta, direta, respeitosa.
=== FIM DO BLOCO EJA/EM ===`,
};

// ============================================================
// BLOCO ADICIONAL POR DISCIPLINA (apenas PBH_EJA + EF)
// ============================================================

function getPbhEjaBloco2(disciplina: string): string {
  if (/portugu[eê]s|leitura|reda[cç][aã]o|linguagens/i.test(disciplina)) {
    return `
// INSTRUÇÃO ADICIONAL — LINGUAGENS / LÍNGUA PORTUGUESA
A área de Linguagens na EJA/PBH tem como eixo o LETRAMENTO — não a gramática.
O conceito estruturador é a LINGUAGEM COMO PRÁTICA SOCIAL.
Priorize: gêneros textuais que circulam no mundo do trabalho e na vida cidadã
(carta de reclamação, carteira de trabalho, contrato, formulário, notícia, bula).
O ponto de partida é SEMPRE a leitura de mundo do estudante — antes da palavra.`;
  }
  if (/matem[aá]tica/i.test(disciplina)) {
    return `
// INSTRUÇÃO ADICIONAL — MATEMÁTICA
A Matemática na EJA/PBH é ancorada no NUMERAMENTO — uso social dos números.
Os conceitos estruturadores articulam-se com as dimensões formadoras:
- Campo numérico: cálculo do salário, troco, parcelas, juros, descontos
- Geometria: medidas na construção, costura, marcenaria, espaço doméstico
- Dados e estatística: leitura de conta de luz, holerite, tabela de preços
SEMPRE use a calculadora como recurso legítimo — não como trapaça.`;
  }
  if (/hist[oó]ria/i.test(disciplina)) {
    return `
// INSTRUÇÃO ADICIONAL — HISTÓRIA
O conceito estruturador é TEMPO HISTÓRICO e TRABALHO.
Conecte o conteúdo histórico à memória coletiva dos estudantes:
- O que seus pais/avós viveram nesse período?
- Como esse evento impactou os trabalhadores?
- O que mudou nas condições de trabalho e vida?`;
  }
  if (/geografia/i.test(disciplina)) {
    return `
// INSTRUÇÃO ADICIONAL — GEOGRAFIA
O conceito estruturador é ESPAÇO GEOGRÁFICO e TERRITORIALIDADE.
Conecte ao território real dos estudantes — periferia de BH, mobilidade urbana,
acesso a serviços, deslocamentos diários, direito à cidade.`;
  }
  if (/ci[eê]ncias|biologia|f[ií]sica|qu[ií]mica/i.test(disciplina)) {
    return `
// INSTRUÇÃO ADICIONAL — CIÊNCIAS DA NATUREZA
Os conceitos estruturadores incluem: ser vivo, ciclo, diversidade, energia.
Priorize a dimensão CORPOREIDADE: saúde do trabalhador, condições de trabalho,
riscos ocupacionais, nutrição, envelhecimento com qualidade de vida.
Conecte à dimensão TRABALHO: tecnologia, impacto ambiental, energia.`;
  }
  if (/educa[cç][aã]o f[ií]sica/i.test(disciplina)) {
    return `
// INSTRUÇÃO ADICIONAL — EDUCAÇÃO FÍSICA
Não é atividade esportiva — é CORPOREIDADE E CULTURA CORPORAL.
Priorize práticas corporais da cultura popular dos estudantes.
Respeite limitações físicas sem infantilizar ou excluir.
Conecte ao bem-estar do trabalhador e às memórias corporais dos estudantes.`;
  }
  return "";
}

// ============================================================
// INSTRUÇÃO ANTI-ALUCINAÇÃO (sempre presente)
// ============================================================

const antiHallucinationInstruction = `
REGRA ANTI-ALUCINAÇÃO (prioridade alta para todas as bases):
Nunca invente códigos curriculares. Se o professor informou um código, use exatamente esse código. Se houver certeza alta sobre um código oficial, use. Se houver qualquer dúvida, descreva a habilidade ou competência por extenso. É melhor um plano com habilidade bem descrita do que um plano com código incorreto. Nunca misture formatos de códigos de uma base com outra. Nunca crie nomes de eixos, competências ou referências curriculares sem segurança real.
Se não houver certeza absoluta sobre o código curricular correspondente, descreva a habilidade por extenso com clareza e não invente código.
FALLBACK: Se houver inconsistência entre base curricular e dados informados pelo professor, preserve a qualidade pedagógica do plano e, quando necessário, adicione uma nota discreta: 'Nota pedagógica: a habilidade foi descrita por extenso para preservar a coerência curricular do plano. Se necessário, confirme a codificação específica no material curricular da sua rede ou com a coordenação pedagógica.'
Responda SEMPRE em português brasileiro.
Use formatação Markdown com títulos, subtítulos, listas e tabelas quando apropriado.`;

// ============================================================
// RÓTULOS
// ============================================================

const baseCurricularLabels: Record<string, string> = {
  BNCC: "BNCC Nacional",
  CRMG: "CRMG — Rede Estadual de Minas Gerais",
  PBH_EF: "PBH — Ensino Fundamental (Rede Municipal de Belo Horizonte)",
  PBH_EJA_EF: "PBH — EJA Ensino Fundamental (Rede Municipal de Belo Horizonte)",
  PBH_EJA_EM: "EJA — Ensino Médio (BNCC/EM + Pedagogia da EJA)",
};

const competenciasLabels: Record<string, string> = {
  BNCC: "COMPETÊNCIAS E HABILIDADES BNCC (com códigos oficiais)",
  CRMG: "COMPETÊNCIAS E HABILIDADES — CRMG (com códigos quando disponíveis)",
  PBH_EF: "COMPETÊNCIAS E HABILIDADES — RME/BH Ensino Fundamental",
  PBH_EJA_EF: "COMPETÊNCIAS E HABILIDADES — EJA/PBH",
  PBH_EJA_EM: "COMPETÊNCIAS E HABILIDADES — EJA/PBH",
};

// ============================================================
// LIMPEZA DE FORMATAÇÃO MATEMÁTICA
// ============================================================

function cleanMathFormatting(text: string): string {
  return text
    // Remover delimitadores LaTeX inline e display
    .replace(/\$\$[\s\S]*?\$\$/g, (match: string) => match.replace(/\$\$/g, '').trim())
    .replace(/\$([^$]+)\$/g, '$1')
    // Converter \frac{a}{b} → a/b
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    // Converter \sqrt{x} → raiz quadrada de x
    .replace(/\\sqrt\{([^}]+)\}/g, 'raiz quadrada de $1')
    // Remover ^ de potências simples
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^\{([^}]+)\}/g, ' elevado a $1')
    // Converter comandos comuns
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\pi/g, 'π')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\Delta/g, 'Δ')
    // Remover barras residuais de outros comandos LaTeX
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '');
}

// ============================================================
// ORIENTAÇÃO POR DISCIPLINA
// ============================================================

function getDisciplineHint(disciplina: string): string {
  const hints: Record<string, string> = {
    'Matemática': 'Inclua: problema contextualizado, manipulação concreta quando possível, verificação do raciocínio, e notação textual simples para expressões (nunca LaTeX).',
    'Língua Portuguesa': 'Inclua: leitura, produção textual ou oralidade como prática central, análise linguística contextualizada, e gênero textual claramente definido.',
    'Língua Inglesa': 'Inclua: vocabulary-alvo da aula, função comunicativa (ex: making requests, describing places), skill trabalhada (reading/writing/speaking/listening), e interação em inglês nas atividades práticas.',
    'Ciências': 'Inclua: problema ou fenômeno observável, hipótese levantada pelos alunos, atividade investigativa ou experimental simples, e registro de observações.',
    'História': 'Inclua: fonte histórica ou evidência, temporalidade clara, conexão com o presente, e perspectiva dos sujeitos históricos envolvidos.',
    'Geografia': 'Inclua: escala geográfica (local/regional/global), territorialidade, leitura de imagem ou mapa quando relevante, e conexão com a realidade do aluno.',
    'Arte': 'Inclua: fruição (apreciação de obra), produção prática pelo aluno, e reflexão sobre processo criativo.',
    'Educação Física': 'Inclua: prática corporal central, aquecimento, regras e variações da atividade, e reflexão sobre o movimento.',
    'Física': 'Inclua: fenômeno observável, grandeza física envolvida, expressões em notação textual simples (nunca LaTeX), e aplicação prática.',
    'Química': 'Inclua: substância ou reação do cotidiano, representação textual de fórmulas simples (ex: H2O, CO2), e conexão com segurança ou saúde.',
    'Biologia': 'Inclua: organismo ou processo biológico observável, escala do micro ao macro quando relevante, e conexão com saúde ou meio ambiente.',
    'Filosofia': 'Inclua: pergunta filosófica disparadora, texto ou excerto como referência, e espaço para argumentação do aluno.',
    'Sociologia': 'Inclua: fenômeno social atual, conceito sociológico em linguagem acessível, e análise crítica contextualizada.',
  };
  return hints[disciplina] || 'Inclua atividade prática aplicável e conexão com a realidade do aluno.';
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
    // Verificar autenticação via Supabase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Não autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Sessão inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse do body
    const input = await req.json();
    const {
      disciplina,
      serie,
      tema,
      quantidadeEncontros = 1,
      duracaoPorEncontro,
      recursos = [],
      desafios,
      objetivoExtra,
      baseCurricular = "BNCC",
      nivelEJA = "EJA_EF",
      cidadeEstado,
      perfilTurma,
    } = input;

    // Validações básicas
    if (!disciplina || !serie || !tema || !duracaoPorEncontro) {
      return new Response(
        JSON.stringify({ success: false, error: "Campos obrigatórios ausentes: disciplina, serie, tema, duracaoPorEncontro." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determinar a chave interna da base
    let baseKey: string = baseCurricular;
    if (baseCurricular === "PBH_EJA") {
      baseKey = (nivelEJA === "EJA_EM" || nivelEJA === "EM") ? "PBH_EJA_EM" : "PBH_EJA_EF";
    }

    const baseCurricularLabel = baseCurricularLabels[baseKey] ?? baseCurricularLabels["BNCC"];
    const competenciasLabel = competenciasLabels[baseKey] ?? competenciasLabels["BNCC"];

    // Construir systemPrompt
    const metaInstruction = `INSTRUÇÃO META — LEIA ANTES DE QUALQUER COISA:

Você é um especialista em planejamento pedagógico criando um plano de aula ORIGINAL e AUTORAL.

O conteúdo curricular fornecido abaixo é CONTEXTO DE REFERÊNCIA — não texto para reproduzir.

Seu trabalho é:
- Criar plano de aula 100% original inspirado nas diretrizes curriculares.
- Parafrasear competências e habilidades com linguagem docente própria.
- Descrever objetivos de aprendizagem com suas próprias palavras.
- Nunca reproduzir trechos literais de documentos normativos.
- Produzir conteúdo aplicável em sala de aula real, não transcrição de documentos oficiais.

`;

    const formattingRules = `REGRAS DE FORMATAÇÃO — OBRIGATÓRIAS:

1. NUNCA use LaTeX, MathJax, KaTeX ou qualquer sintaxe matemática técnica.
   Proibido: sintaxe matemática técnica com cifrões, barra invertida, comandos de fração, comandos de raiz, comandos de multiplicação ou marcações próprias de renderizadores matemáticos.
   Correto: 1/2, raiz quadrada de, vezes, ponto, ao quadrado.

2. Expressões matemáticas simples: escreva em texto corrido.
   Correto: "2x + 3 = 11", "3/4 da turma", "x ao quadrado", "π ≈ 3,14"

3. Símbolos Unicode são permitidos quando adequados: ², ³, ½, ¼, π, ≠, ≤, ≥, °

4. O plano deve ser legível como texto puro, copiável diretamente para Word ou e-mail.
   Sem sintaxe que exija renderizador matemático.

5. Markdown básico é permitido apenas para: **negrito**, *itálico*, # títulos, listas com -.
   Nunca use blocos de código (\`\`\`) para conteúdo pedagógico.

`;

    const curriculumRefPrefix = `[REFERÊNCIA CURRICULAR — usar como orientação, nunca reproduzir literalmente]:
`;

    const baseBlock = curriculumRefPrefix + (baseCurricularInstructions[baseKey] ?? baseCurricularInstructions["BNCC"]);
    const pbhEjaBloco2 = baseKey === "PBH_EJA_EF" ? (curriculumRefPrefix + getPbhEjaBloco2(disciplina)) : "";
    const systemPrompt = metaInstruction + formattingRules + baseBlock + pbhEjaBloco2 + antiHallucinationInstruction;

    // Construir userPrompt dinamicamente
    const qtd = Math.min(Math.max(Number(quantidadeEncontros) || 1, 1), 4);
    const dur = Number(duracaoPorEncontro);
    const recursosStr = Array.isArray(recursos) && recursos.length > 0
      ? recursos.join(", ")
      : "Lousa e materiais básicos";

    let duracaoBloco = "";
    if (qtd === 1) {
      duracaoBloco = `**Duração:** ${dur} minutos`;
    } else {
      duracaoBloco = `**Organização:** ${qtd} encontros/aulas de ${dur} minutos cada (total: ${qtd * dur} minutos). Organize o plano em ${qtd} encontros numerados, com objetivos e atividades específicas para cada um.`;
    }

    let instrucaoOrganizacao = "";
    if (qtd >= 2) {
      instrucaoOrganizacao = `\n**Instrução de organização:** Mantenha cada encontro conciso. Não gere sequência didática longa. O plano completo deve ser prático e diretamente utilizável.`;
    }
    if (qtd >= 3) {
      instrucaoOrganizacao += `\n**Instrução de objetividade:** Seja objetivo em cada encontro. Máximo de 3 atividades por encontro. Não detalhe além do necessário.`;
    }

    const userPrompt = `Gere um plano de aula completo com as seguintes informações:

**Referencial Curricular:** ${baseCurricularLabel}
**Disciplina:** ${disciplina}
**Série/Ano:** ${serie}
**Tema:** ${tema}
${duracaoBloco}
**Recursos disponíveis:** ${recursosStr}${perfilTurma ? `\n**Perfil da turma / realidade concreta:** ${perfilTurma}. Use essa informação para adaptar o plano à realidade da turma, considerando ritmo, dificuldades, participação, recursos disponíveis, condições materiais e nível de apoio necessário.` : ""}${desafios ? `\n**Desafios da turma:** ${desafios}` : ""}${objetivoExtra ? `\n**Objetivo adicional:** ${objetivoExtra}` : ""}${baseCurricular === "BNCC" && cidadeEstado ? `\n**Contexto regional:** ${cidadeEstado}` : ""}${instrucaoOrganizacao}

Estruture o plano com:
1. CABEÇALHO (disciplina, série, tema, ${qtd === 1 ? "duração" : "encontros"}, referencial curricular: ${baseCurricularLabel})
2. OBJETIVOS (geral e específicos)
3. ${competenciasLabel}
4. SEQUÊNCIA DIDÁTICA (com tempos para cada etapa)
5. ATIVIDADES PRÁTICAS (detalhadas e aplicáveis)
6. RECURSOS NECESSÁRIOS
7. AVALIAÇÃO (critérios e instrumentos)
8. ADAPTAÇÕES PARA INCLUSÃO
9. REFERÊNCIAS

Orientação específica para ${disciplina}: ${getDisciplineHint(disciplina)}`;

    // Chamar Gemini 2.5 Flash
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Chave Gemini não configurada no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            maxOutputTokens: 32768,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const geminiStatus = geminiResponse.status;
      const errText = await geminiResponse.text();
      console.error(`[conta-generate] Gemini error status=${geminiStatus}:`, errText);
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao chamar o Gemini (status ${geminiStatus}). Tente novamente.` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();

    // Extrai texto de qualquer part que contenha campo "text" (compatível com modelos thinking)
    const extractText = (data: Record<string, unknown>): string | null => {
      const parts = (data as Record<string, unknown>)?.candidates as Array<Record<string, unknown>>;
      const candidate = parts?.[0];
      const contentParts = (candidate?.content as Record<string, unknown>)?.parts as Array<Record<string, unknown>>;
      if (!Array.isArray(contentParts) || contentParts.length === 0) return null;
      const joined = contentParts
        .map((p) => (typeof p.text === "string" ? p.text : ""))
        .join("\n")
        .trim();
      return joined || null;
    };

    let content = extractText(geminiData);
    const firstFinishReason = geminiData?.candidates?.[0]?.finishReason ?? "N/A";

    // Se veio vazio por RECITATION, tentar uma única vez com instrução anti-recitação
    if (!content && firstFinishReason === "RECITATION") {
      console.error("[conta-generate] RECITATION detected, retrying with anti-recitation instruction");

      const antiRecitationPrefix =
        "IMPORTANTE: Gere uma resposta autoral e original. " +
        "Não reproduza trechos literais de documentos curriculares, BNCC, CRMG, PBH ou materiais de referência. " +
        "Parafraseie orientações curriculares com linguagem própria, descreva habilidades por extenso quando necessário " +
        "e produza um plano prático para uso em sala de aula.\n\n";

      const retryResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: antiRecitationPrefix + userPrompt }] }],
            generationConfig: {
              maxOutputTokens: 32768,
              temperature: 0.9,
            },
          }),
        }
      );

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        content = extractText(retryData);
        const retryFinishReason = retryData?.candidates?.[0]?.finishReason ?? "N/A";
        console.error(`[conta-generate] Retry finishReason=${retryFinishReason}, content=${content ? "present" : "empty"}`);
      } else {
        const retryStatus = retryResponse.status;
        const retryErr = await retryResponse.text();
        console.error(`[conta-generate] Retry Gemini error status=${retryStatus}:`, retryErr);
      }
    }

    if (!content) {
      const diagInfo = {
        hasCandidates: Array.isArray(geminiData?.candidates),
        candidatesCount: geminiData?.candidates?.length ?? 0,
        finishReason: firstFinishReason,
        safetyRatings: geminiData?.candidates?.[0]?.safetyRatings ?? [],
        promptFeedback: geminiData?.promptFeedback ?? null,
        partsCount: geminiData?.candidates?.[0]?.content?.parts?.length ?? 0,
        partsTypes: (geminiData?.candidates?.[0]?.content?.parts ?? [])
          .map((p: Record<string, unknown>) => Object.keys(p).join(",")),
      };
      console.error("[conta-generate] Gemini returned no text content after retry:", JSON.stringify(diagInfo));
      const errorMsg = firstFinishReason === "RECITATION"
        ? "O modelo bloqueou a resposta por recitação. Tente simplificar o tema ou reduzir referências curriculares."
        : "O modelo respondeu sem conteúdo textual. Verifique os logs para detalhes.";
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanedContent = cleanMathFormatting(content);
    const title = `Plano de Aula: ${tema} - ${disciplina} (${serie})`;

    return new Response(
      JSON.stringify({ success: true, error: null, content: cleanedContent, title, userPrompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[conta-generate] Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
