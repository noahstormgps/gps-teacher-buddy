-- GPS Docente Premium — Migration R.A.P.I.D.O. R.1.1
-- Tabela de controle de trial gratuito para o módulo R.A.P.I.D.O.
-- Cada linha representa um uso do trial por um usuário.
-- O limite de usos (2) é verificado pela Edge Function rapido-generate
-- contando os registros existentes para o user_id antes de gerar.

-- Garantir disponibilidade de gen_random_uuid() no Supabase/PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABELA: public.rapido_trials
-- ============================================================
CREATE TABLE public.rapido_trials (
  id       uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rapido_trials_pkey PRIMARY KEY (id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Índice principal: busca de todos os trials de um usuário
CREATE INDEX idx_rapido_trials_user_id
  ON public.rapido_trials (user_id);

-- Índice composto: busca ordenada por data (útil para auditoria e paginação)
CREATE INDEX idx_rapido_trials_user_id_used_at
  ON public.rapido_trials (user_id, used_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.rapido_trials ENABLE ROW LEVEL SECURITY;

-- Política 1: usuário autenticado lê apenas os próprios registros
CREATE POLICY "rapido_trials_select_own"
  ON public.rapido_trials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política 2: usuário autenticado insere apenas registro para si mesmo
CREATE POLICY "rapido_trials_insert_own"
  ON public.rapido_trials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Sem política de UPDATE: registros de trial são imutáveis por design.
-- Sem política de DELETE: registros de trial são permanentes por design.
-- A Edge Function rapido-generate usará service role para INSERT,
-- contornando o RLS quando necessário para registrar o uso após geração.
