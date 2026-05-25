CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- GPS Docente Premium — Migration S.A.L.A. 1.1
-- Tabela de controle de trial gratuito para o módulo S.A.L.A.
-- Cada linha representa um uso do trial por um usuário.
-- O limite de usos (2) é verificado pela Edge Function sala-generate
-- contando os registros existentes para o user_id antes de gerar.

-- ============================================================
-- TABELA: public.sala_trials
-- ============================================================
CREATE TABLE public.sala_trials (
  id       uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT sala_trials_pkey PRIMARY KEY (id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Índice principal: busca de todos os trials de um usuário
CREATE INDEX idx_sala_trials_user_id
  ON public.sala_trials (user_id);

-- Índice composto: busca ordenada por data (útil para auditoria e paginação)
CREATE INDEX idx_sala_trials_user_id_used_at
  ON public.sala_trials (user_id, used_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.sala_trials ENABLE ROW LEVEL SECURITY;

-- Política 1: usuário autenticado lê apenas seus próprios registros
CREATE POLICY "sala_trials_select_own"
  ON public.sala_trials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política 2: usuário autenticado insere apenas registro para si mesmo
CREATE POLICY "sala_trials_insert_own"
  ON public.sala_trials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Nota: não há política de UPDATE nem DELETE por design.
-- A Edge Function sala-generate usará service_role para contagem
-- e inserção, contornando o RLS quando necessário.
-- O RLS acima protege o acesso direto via client-side SDK.
