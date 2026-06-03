-- GPS Docente Premium — Migration B.0
-- Tabela de gerações: armazena o conteúdo gerado pelos módulos
-- C.O.N.T.A., S.A.L.A. e R.A.P.I.D.O. por usuário autenticado.
-- As Edge Functions inserem via service_role após geração bem-sucedida.
-- O RLS protege o acesso direto via client-side SDK.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABELA: public.generations
-- ============================================================
CREATE TABLE public.generations (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method     text        NOT NULL CHECK (method IN ('CONTA', 'SALA', 'RAPIDO')),
  title      text        NOT NULL DEFAULT '',
  content    text        NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT generations_pkey PRIMARY KEY (id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_generations_user_id
  ON public.generations (user_id);

CREATE INDEX idx_generations_user_id_created_at
  ON public.generations (user_id, created_at DESC);

CREATE INDEX idx_generations_user_id_method
  ON public.generations (user_id, method);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado lê apenas suas próprias gerações
CREATE POLICY "generations_select_own"
  ON public.generations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Usuário autenticado insere apenas para si mesmo
CREATE POLICY "generations_insert_own"
  ON public.generations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Sem UPDATE nem DELETE por design nesta microetapa.
-- As Edge Functions usam service_role para INSERT, contornando RLS quando necessário.
