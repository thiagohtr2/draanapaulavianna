# CID-10 (DATASUS)

`cid10.tsv` — 2.045 categorias e 12.451 subcategorias da CID-10 em português, convertidas para UTF-8
a partir dos arquivos oficiais do DATASUS (`CID-10-CAPITULOS.CSV`, `CID-10-CATEGORIAS.CSV`,
`CID-10-SUBCATEGORIAS.CSV`) por `gerar_cid10.py`.

Colunas: código (ex.: N76.0), descrição, nível (categoria/subcategoria), capítulo, restrição de sexo
e um campo de busca sem acentos.

Para (re)carregar no Supabase, rode `supabase/cid10_importar.sql` no SQL Editor.
