-- Carrega (ou atualiza) a CID-10 a partir do arquivo deste repositório.
-- Usa a extensão http só durante a importação e a remove em seguida.
create extension if not exists http with schema extensions;

with arquivo as (
  select content from extensions.http_get('https://raw.githubusercontent.com/thiagohtr2/draanapaulavianna/main/supabase/dados/cid10.tsv')
), linhas as (
  select string_to_array(l, E'\t') a
  from arquivo, string_to_table(content, E'\n') l
  where l <> '' and l not like 'codigo%'
)
insert into public.cid10 (codigo, descricao, nivel, capitulo, restr_sexo, busca)
select a[1], a[2], a[3], nullif(a[4], '')::smallint, nullif(a[5], ''), a[6] from linhas
on conflict (codigo) do update set descricao = excluded.descricao, nivel = excluded.nivel,
  capitulo = excluded.capitulo, restr_sexo = excluded.restr_sexo, busca = excluded.busca;

drop extension if exists http;
