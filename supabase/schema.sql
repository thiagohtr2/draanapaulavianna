-- =====================================================================
--  Consultório Dra. Ana Paula Vianna — esquema do banco (Supabase)
--  Como usar: Supabase > SQL Editor > New query > cole tudo > Run.
--  Cada médica(o) cadastrada(o) só enxerga os próprios dados (RLS).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Perfil profissional (1 linha por usuário) ----------
create table if not exists public.perfis (
  id            uuid primary key references auth.users(id) on delete cascade,
  nome          text not null default '',
  tratamento    text not null default 'Dra.',
  especialidade text not null default 'Ginecologia e Fertilidade',
  crm           text not null default '',
  crm_uf        text not null default 'BA',
  rqe           text not null default '',
  telefone      text not null default '',
  email         text not null default '',
  cidade        text not null default '',
  pdf_tamanho   text not null default 'A4' check (pdf_tamanho in ('A4','A5')),
  pdf_marca_dagua boolean not null default true,
  modelos_iniciados boolean not null default false,  -- modelos sugeridos já carregados?
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------- Clínicas onde ela atende ----------
create table if not exists public.clinicas (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome       text not null check (length(trim(nome)) > 0),
  endereco   text not null default '',
  bairro     text not null default '',
  cidade     text not null default '',
  uf         text not null default '',
  cep        text not null default '',
  telefone   text not null default '',
  email      text not null default '',
  ativa      boolean not null default true,
  criado_em  timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------- Pacientes ----------
create table if not exists public.pacientes (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome             text not null check (length(trim(nome)) > 0),
  nome_social      text not null default '',
  data_nascimento  date,
  sexo             text not null default 'F' check (sexo in ('F','M','O')),
  cpf              text not null default '',
  telefone         text not null default '',
  email            text not null default '',
  endereco         text not null default '',
  cidade           text not null default '',
  uf               text not null default '',
  convenio         text not null default '',
  carteirinha      text not null default '',
  profissao        text not null default '',
  alergias         text not null default '',
  antecedentes     text not null default '',
  medicacoes_uso   text not null default '',
  observacoes      text not null default '',
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

-- ---------- Vínculo paciente x clínica (uma paciente, várias clínicas) ----------
create table if not exists public.paciente_clinicas (
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  clinica_id  uuid not null references public.clinicas(id) on delete restrict,
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  prontuario_local text not null default '',
  criado_em   timestamptz not null default now(),
  primary key (paciente_id, clinica_id)
);

-- ---------- Consultas (prontuário) ----------
create table if not exists public.consultas (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  paciente_id   uuid not null references public.pacientes(id) on delete restrict,
  clinica_id    uuid not null references public.clinicas(id) on delete restrict,
  data          timestamptz not null default now(),
  tipo          text not null default 'Consulta',
  status        text not null default 'rascunho' check (status in ('rascunho','finalizada')),
  registro      jsonb not null default '{}'::jsonb,   -- anamnese, exame físico, diagnóstico, conduta…
  prescricao    jsonb not null default '[]'::jsonb,   -- itens do receituário
  exames        jsonb not null default '[]'::jsonb,   -- exames solicitados
  orientacoes   text not null default '',
  adendos       jsonb not null default '[]'::jsonb,   -- acréscimos após finalizar
  finalizada_em timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------- Medicamentos favoritos ----------
create table if not exists public.favoritos (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome          text not null,
  apresentacao  text not null default '',
  via           text not null default 'Oral',
  quantidade    text not null default '',
  posologia     text not null default '',
  antimicrobiano boolean not null default false,
  controlado    boolean not null default false,
  criado_em     timestamptz not null default now()
);

-- ---------- Índices ----------
create index if not exists clinicas_owner_idx   on public.clinicas(owner_id);
create index if not exists pacientes_owner_idx  on public.pacientes(owner_id, nome);
create index if not exists pc_owner_idx         on public.paciente_clinicas(owner_id);
create index if not exists pc_clinica_idx       on public.paciente_clinicas(clinica_id);
create index if not exists consultas_owner_idx  on public.consultas(owner_id, data desc);
create index if not exists consultas_pac_idx    on public.consultas(paciente_id, data desc);
create index if not exists consultas_cli_idx    on public.consultas(clinica_id);
create index if not exists favoritos_owner_idx  on public.favoritos(owner_id, nome);

-- ---------- atualizado_em automático ----------
create or replace function public.tg_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.atualizado_em := now(); return new; end $$;

drop trigger if exists touch_perfis on public.perfis;
create trigger touch_perfis before update on public.perfis for each row execute function public.tg_touch();
drop trigger if exists touch_clinicas on public.clinicas;
create trigger touch_clinicas before update on public.clinicas for each row execute function public.tg_touch();
drop trigger if exists touch_pacientes on public.pacientes;
create trigger touch_pacientes before update on public.pacientes for each row execute function public.tg_touch();

-- ---------- Integridade do prontuário ----------
-- Depois de finalizada, a consulta não muda: só aceita adendos (com data) e
-- a reimpressão. Também não pode ser apagada.
create or replace function public.tg_consulta_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'finalizada' then
      raise exception 'Consulta finalizada não pode ser excluída (prontuário).';
    end if;
    return old;
  end if;
  if old.status = 'finalizada' then
    if new.registro is distinct from old.registro
       or new.prescricao is distinct from old.prescricao
       or new.exames is distinct from old.exames
       or new.orientacoes is distinct from old.orientacoes
       or new.data is distinct from old.data
       or new.paciente_id is distinct from old.paciente_id
       or new.clinica_id is distinct from old.clinica_id
       or new.status <> 'finalizada'
       or jsonb_array_length(new.adendos) < jsonb_array_length(old.adendos) then
      raise exception 'Consulta finalizada: use um adendo para acrescentar informações.';
    end if;
  end if;
  if new.status = 'finalizada' and old.status = 'rascunho' then
    new.finalizada_em := now();
  end if;
  new.atualizado_em := now();
  return new;
end $$;

drop trigger if exists consulta_guard_upd on public.consultas;
create trigger consulta_guard_upd before update on public.consultas for each row execute function public.tg_consulta_guard();
drop trigger if exists consulta_guard_del on public.consultas;
create trigger consulta_guard_del before delete on public.consultas for each row execute function public.tg_consulta_guard();

-- ---------- Perfil criado no cadastro ----------
create or replace function public.tg_novo_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfis (id, nome, crm, crm_uf, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'crm', ''),
    coalesce(nullif(new.raw_user_meta_data->>'crm_uf', ''), 'BA'),
    coalesce(new.email, '')
  ) on conflict (id) do nothing;
  return new;
end $$;

revoke execute on function public.tg_novo_usuario() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.tg_novo_usuario();

-- ---------- Segurança: cada usuário só vê o que é seu ----------
alter table public.perfis            enable row level security;
alter table public.clinicas          enable row level security;
alter table public.pacientes         enable row level security;
alter table public.paciente_clinicas enable row level security;
alter table public.consultas         enable row level security;
alter table public.favoritos         enable row level security;

drop policy if exists perfis_dono on public.perfis;
create policy perfis_dono on public.perfis for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists clinicas_dono on public.clinicas;
create policy clinicas_dono on public.clinicas for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists pacientes_dono on public.pacientes;
create policy pacientes_dono on public.pacientes for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists pc_dono on public.paciente_clinicas;
create policy pc_dono on public.paciente_clinicas for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.pacientes p where p.id = paciente_id and p.owner_id = (select auth.uid()))
    and exists (select 1 from public.clinicas c where c.id = clinica_id and c.owner_id = (select auth.uid()))
  );

drop policy if exists consultas_dono on public.consultas;
create policy consultas_dono on public.consultas for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.pacientes p where p.id = paciente_id and p.owner_id = (select auth.uid()))
    and exists (select 1 from public.clinicas c where c.id = clinica_id and c.owner_id = (select auth.uid()))
  );

drop policy if exists favoritos_dono on public.favoritos;
create policy favoritos_dono on public.favoritos for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- Sem acesso anônimo a nada.
revoke all on all tables in schema public from anon;

-- =====================================================================
--  Modelos prontos (prescrição, solicitação de exames, atestado)
--  conteudo:
--    prescricao → { itens:[{nome,apresentacao,via,quantidade,posologia,antimicrobiano,controlado}], orientacoes }
--    exames     → { exames:[{nome}], indicacao }
--    atestado   → { titulo, texto }   (texto aceita {paciente} {cpf} {data} {hora} {dias} …)
--    texto      → { campo, texto, auto }  (texto padrão de um campo da consulta; auto = já vem preenchido)
-- =====================================================================
create table if not exists public.modelos (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo          text not null check (tipo in ('prescricao','exames','atestado','texto')),
  nome          text not null check (length(trim(nome)) > 0),
  conteudo      jsonb not null default '{}'::jsonb,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists modelos_owner_idx on public.modelos(owner_id, tipo, nome);
drop trigger if exists touch_modelos on public.modelos;
create trigger touch_modelos before update on public.modelos for each row execute function public.tg_touch();
alter table public.modelos enable row level security;
drop policy if exists modelos_dono on public.modelos;
create policy modelos_dono on public.modelos for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
revoke all on public.modelos from anon;

-- Bancos criados antes desta coluna existir
alter table public.perfis add column if not exists modelos_iniciados boolean not null default false;

-- =====================================================================
--  CID-10 (DATASUS) — referência compartilhada, somente leitura
--  Dados: rode supabase/cid10_importar.sql depois deste arquivo.
-- =====================================================================
create table if not exists public.cid10 (
  codigo     text primary key,
  descricao  text not null,
  nivel      text not null check (nivel in ('categoria','subcategoria')),
  capitulo   smallint,
  restr_sexo text check (restr_sexo in ('F','M')),
  busca      text not null
);
create index if not exists cid10_busca_idx on public.cid10 (busca text_pattern_ops);
alter table public.cid10 enable row level security;
drop policy if exists cid10_leitura on public.cid10;
create policy cid10_leitura on public.cid10 for select to authenticated using (true);
revoke all on public.cid10 from anon;
revoke insert, update, delete, truncate on public.cid10 from authenticated;

-- =====================================================================
--  Documentos emitidos (receitas, atestados, exames, orientações, registros)
--  Imutáveis: só podem ser anulados (com motivo). PDFs no bucket privado.
-- =====================================================================
create table if not exists public.documentos (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  paciente_id      uuid not null references public.pacientes(id) on delete restrict,
  consulta_id      uuid references public.consultas(id) on delete set null,
  clinica_id       uuid references public.clinicas(id) on delete restrict,
  tipo             text not null check (tipo in ('receita','exames','atestado','orientacoes','registro')),
  titulo           text not null,
  nome_arquivo     text not null,
  emitido_em       timestamptz not null default now(),
  dados            jsonb not null default '{}'::jsonb,
  resumo           text not null default '',
  arquivo_path     text,
  paginas          smallint,
  anulado_em       timestamptz,
  motivo_anulacao  text not null default ''
);
create index if not exists documentos_pac_idx on public.documentos(paciente_id, emitido_em desc);
create index if not exists documentos_owner_idx on public.documentos(owner_id, emitido_em desc);
create index if not exists documentos_consulta_idx on public.documentos(consulta_id);
create index if not exists documentos_clinica_idx on public.documentos(clinica_id);

create or replace function public.tg_documento_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Documento emitido não pode ser excluído; use "Anular".';
  end if;
  if new.paciente_id is distinct from old.paciente_id or new.tipo is distinct from old.tipo
     or new.titulo is distinct from old.titulo or new.dados is distinct from old.dados
     or new.emitido_em is distinct from old.emitido_em or new.nome_arquivo is distinct from old.nome_arquivo
     or new.clinica_id is distinct from old.clinica_id or new.owner_id is distinct from old.owner_id
     or (old.arquivo_path is not null and new.arquivo_path is distinct from old.arquivo_path)
     or (old.anulado_em is not null and new.anulado_em is distinct from old.anulado_em) then
    raise exception 'Documento emitido não pode ser alterado.';
  end if;
  if new.consulta_id is distinct from old.consulta_id and new.consulta_id is not null then
    raise exception 'Documento emitido não pode ser alterado.';
  end if;
  return new;
end $$;
drop trigger if exists documento_guard_upd on public.documentos;
create trigger documento_guard_upd before update on public.documentos for each row execute function public.tg_documento_guard();
drop trigger if exists documento_guard_del on public.documentos;
create trigger documento_guard_del before delete on public.documentos for each row execute function public.tg_documento_guard();

alter table public.documentos enable row level security;
drop policy if exists documentos_ler on public.documentos;
create policy documentos_ler on public.documentos for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists documentos_criar on public.documentos;
create policy documentos_criar on public.documentos for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.pacientes p where p.id = paciente_id and p.owner_id = (select auth.uid()))
    and (clinica_id is null or exists (select 1 from public.clinicas c where c.id = clinica_id and c.owner_id = (select auth.uid())))
    and (consulta_id is null or exists (select 1 from public.consultas c where c.id = consulta_id and c.owner_id = (select auth.uid())))
  );
drop policy if exists documentos_anular on public.documentos;
create policy documentos_anular on public.documentos for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
revoke all on public.documentos from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 10485760, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['application/pdf'];
drop policy if exists documentos_pdf_ler on storage.objects;
create policy documentos_pdf_ler on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists documentos_pdf_enviar on storage.objects;
create policy documentos_pdf_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);

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
