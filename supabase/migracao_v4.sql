-- =====================================================================
--  Migração v4 — rodar no banco já existente (Supabase > SQL Editor).
--  Inclui: tabela de envios (pendente), folhetos de orientação, orçamentos
--  e assinatura digital. Pode ser rodada mais de uma vez.
-- =====================================================================
-- =====================================================================
--  Histórico de envios à paciente (e-mail / WhatsApp)
-- =====================================================================
create table if not exists public.envios (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  paciente_id uuid not null references public.pacientes(id) on delete restrict,
  canal       text not null check (canal in ('email','whatsapp')),
  destino     text not null default '',
  documentos  uuid[] not null default '{}',
  criado_em   timestamptz not null default now()
);
create index if not exists envios_pac_idx on public.envios(paciente_id, criado_em desc);
create index if not exists envios_owner_idx on public.envios(owner_id);
alter table public.envios enable row level security;
drop policy if exists envios_ler on public.envios;
create policy envios_ler on public.envios for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists envios_criar on public.envios;
create policy envios_criar on public.envios for insert to authenticated
  with check (owner_id = (select auth.uid()) and exists (select 1 from public.pacientes p where p.id = paciente_id and p.owner_id = (select auth.uid())));
revoke all on public.envios from anon;

-- =====================================================================
--  v4 — folhetos de orientação, orçamentos e assinatura digital
-- =====================================================================
alter table public.modelos drop constraint if exists modelos_tipo_check;
alter table public.modelos add constraint modelos_tipo_check
  check (tipo in ('prescricao','exames','atestado','texto','orientacao','orcamento'));
alter table public.documentos drop constraint if exists documentos_tipo_check;
alter table public.documentos add constraint documentos_tipo_check
  check (tipo in ('receita','exames','atestado','orientacoes','registro','orcamento'));

alter table public.perfis add column if not exists assinatura_provedor text not null default '';
alter table public.perfis add column if not exists assinatura_cpf      text not null default '';
alter table public.perfis add column if not exists assinatura_duracao  integer not null default 43200;
alter table public.perfis add column if not exists sugestoes_versao    integer not null default 1;

-- Autorizações do certificado em nuvem (tokens). Só a função assinar-documento (service role) acessa.
create table if not exists public.assinatura_sessoes (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  provedor      text not null check (provedor in ('vidaas','teste')),
  estado        text not null check (estado in ('pendente','ativa')),
  code          text,
  code_verifier text,
  access_token  text,
  duracao       integer,
  expira_em     timestamptz not null,
  criado_em     timestamptz not null default now()
);
create index if not exists assinatura_sessoes_owner_idx on public.assinatura_sessoes(owner_id, estado, expira_em desc);
alter table public.assinatura_sessoes enable row level security;
revoke all on public.assinatura_sessoes from anon, authenticated;
