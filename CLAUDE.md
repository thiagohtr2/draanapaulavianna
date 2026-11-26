# Consultório Dra. Ana Paula Vianna — instruções para o Claude Code

App web de atendimento da Dra. Ana Paula Vianna (Ginecologia e Fertilidade, Salvador/BA): pacientes em
várias clínicas, prontuário, documentos em PDF com a logomarca (receita, exames, atestado, folhetos de
orientação, orçamento), assinatura digital ICP-Brasil, tabela de valores e produção.
Usuários: a médica (no consultório, muitas vezes pelo celular). Responder e escrever a interface em
**português do Brasil**, com acentuação correta.

## Arquitetura
- **Front-end estático, sem build**: `index.html` + JS puro (sem framework, sem bundler). Abra servindo a
  pasta (`python3 -m http.server`) — não abra o arquivo direto (file://).
- `config.js` com `SUPABASE_URL`/`SUPABASE_KEY` (chave *publishable*, pode ser pública). **Vazio = modo
  demonstração** (dados no localStorage). Os testes trocam o config.js por um vazio automaticamente.
- `data.js` → `window.DB`: dois adaptadores com a MESMA API — Supabase e demonstração. Toda mudança de
  dados precisa ser feita **nos dois**.
- `app.js` → telas, rotas por hash (`#inicio`, `#pacientes`, `#paciente-<id>`, `#consulta-<id>`, `#modelos`,
  `#clinicas`, `#valores`, `#producao`, `#perfil`), diálogos com `<dialog>` (`abrirDialogo`).
- `pdf.js` → `window.DocumentosPDF` (jsPDF): motor de blocos com paginação, fontes embutidas em `assets.js`
  (subconjuntos — evite caracteres fora do Latin-1, ex.: setas e “✓”; desenhe ícones vetoriais).
- `modelos-base.js` → modelos sugeridos (receitas, exames, atestados, textos, folhetos, orçamentos).
- `vendor/` → jsPDF, supabase-js, qrcode, pdf-lib (este só é carregado ao juntar PDFs).
- `supabase/schema.sql` → banco completo e **idempotente** (rodar de novo não quebra). Cada mudança de banco
  entra no fim do arquivo como um bloco `vN` e é aplicada como migração.
- `supabase/functions/` → `enviar-documentos` (e-mail via Resend), `assinar-documento` (ICP-Brasil em
  nuvem, VIDaaS), `receita` (endereço público do QR Code, **sem** verificação de JWT), `_shared/`.

## Regras do domínio (não quebrar)
- Prontuário: consulta **finalizada é imutável** (trigger no banco); correções só por adendo. Plano/serviço/
  valor podem mudar depois (faturamento não é prontuário). Documentos emitidos são imutáveis; só anulação
  com motivo. Nada é apagado (Lei 13.787/2018, guarda de 20 anos).
- Receita: nome e CPF da paciente; CID só com autorização (CFM 2.381/2024); antimicrobiano em 2 vias e
  validade de 10 dias (RDC 471/2021) — no modelo eletrônico, documento único; **controlados nunca saem no
  PDF** (Portaria 344 / RDC 1.000/2025 → plataforma do CFM).
- Assinatura digital: metadados OID do ITI gravados antes de assinar, CMS destacado SHA-256 + DocMDP P=2,
  QR Code + código de acesso. Ver `supabase/functions/_shared/pdf-assinatura.ts`. A integração com o VIDaaS
  aguarda as credenciais da Valid (`VIDAAS_CLIENT_ID`/`VIDAAS_CLIENT_SECRET`); os caminhos da API estão
  isolados no objeto `vidaas` da função e devem ser conferidos com o manual quando chegarem.
- Área da consulta (Ginecológica, Obstétrica, Fertilidade, Planejamento familiar, Climatério, Outra) é
  separada do atendimento (Primeira consulta / Retorno / Procedimento); o nº do retorno é **calculado** por
  área (`rotulosConsultas`), nunca gravado.
- Nomes de arquivo: `Primeiro_Ultimo_Documento_dd-mm-aaaa.pdf` (`DocumentosPDF.nomeDoArquivo`).

## Interface — exigências da dona do projeto
- Responsivo de 320 a 1920 px, mobile-first, alvos de toque ≥ 44 px, acessível (rótulos, foco, contraste).
- **Nenhum elemento pode sobrepor outro** em nenhuma tela ou largura. Use os tokens de `styles.css`.
- Visual: vinho `#6D1A36`, fundo rosado, detalhes cobre; títulos Cormorant/Italiana, texto Jost.

## Testes — rode antes de cada commit
```bash
pip install playwright pyhanko pyhanko-certvalidator pillow && python -m playwright install chromium   # uma vez
python testes/fluxos.py            # 60 verificações de ponta a ponta (modo demonstração, 390 e 1366 px)
python testes/sobreposicao.py      # sobreposição/corte/rolagem horizontal em 7 larguras — tem que dar 0
bash testes/assinatura/rodar.sh    # assinatura digital validada pelo pyHanko (precisa de deno e openssl)
```
Mudou o banco? Valide o `schema.sql` (idempotente) e aplique a migração pelo MCP do Supabase.

## Supabase
- Projeto `draanapaula`, ref `juftswxsdmffxznsdoyu`. O `.mcp.json` já aponta o MCP do Supabase para ele:
  na primeira vez, rode `/mcp` no Claude Code e autentique.
- Tabelas: perfis, clinicas, pacientes, paciente_clinicas, consultas, favoritos (medicamentos), modelos,
  documentos (+ storage `documentos/<uid>/<paciente>/<id>.pdf`), cid10 (14.496 códigos, só leitura),
  envios, valores, assinatura_sessoes (só service role). RLS por dono em tudo.
- Segredos das funções: `RESEND_API_KEY`, `EMAIL_REMETENTE`, `VIDAAS_CLIENT_ID`, `VIDAAS_CLIENT_SECRET`
  (e, opcional, `ASSINATURA_TESTE_CHAVE`/`ASSINATURA_TESTE_CERT`).

## Pendências conhecidas
- Livreto do ciclo de tratamento (aguarda os textos-modelo que a família vai enviar).
- Emissão de nota fiscal da PJ (adiada).
- Credenciais do VIDaaS (Valid) e da Resend; ligar a proteção contra senhas vazadas no Supabase Auth.

## Git
Commits em português, descrevendo o que mudou para a médica. Não commitar segredos.
