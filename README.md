# Consultório Dra. Ana Paula Vianna

App web de prontuário e receituário (Ginecologia e Fertilidade): login, pacientes por clínica, consultas organizadas, modelos e PDFs com a logomarca.

Funciona no celular, tablet e computador. Site estático (HTML, CSS e JavaScript) com banco e login no Supabase.

## 1. Criar o banco (Supabase) — 5 minutos
1. Em https://supabase.com crie um projeto (de preferência na conta da própria
   Dra. Ana Paula, região **South America (São Paulo)**).
2. Abra **SQL Editor → New query**, cole todo o arquivo `supabase/schema.sql` e clique **Run**.
   Depois rode `supabase/cid10_importar.sql` para carregar a CID-10.
   Ele cria as tabelas e a segurança (cada usuária só enxerga os próprios dados;
   consulta finalizada não pode ser alterada nem apagada — só recebe adendos).
3. Em **Project Settings → API** copie o *Project URL* e a chave *publishable* (ou *anon public*)
   e cole em `config.js`:
   ```js
   SUPABASE_URL: 'https://xxxx.supabase.co',
   SUPABASE_KEY: 'sb_publishable_...'
   ```
   Essa chave pode ficar no site: quem protege os dados são as regras de segurança do banco.

## 2. Publicar o site
É um site estático (só arquivos). Qualquer uma destas opções serve:
- **Netlify Drop**: arraste a pasta inteira em https://app.netlify.com/drop
- **Vercel** ou **GitHub Pages**: suba a pasta num repositório e publique.
Depois aponte um domínio próprio, se quiser.

## 3. Ajustes de login no Supabase
- **Authentication → URL Configuration**: em *Site URL* coloque o endereço do site
  (para os e-mails de confirmação e de "esqueci a senha" voltarem ao lugar certo).
- Depois que a Dra. Ana Paula criar a conta dela, desligue novos cadastros em
  **Authentication → Sign In / Providers → Email → Allow new users to sign up** (recomendado).

## 4. Primeiro uso
1. Criar conta (nome, CRM e UF) e entrar.
2. **Perfil**: conferir nome, CRM, RQE e escolher A4 ou A5. Use "Ver modelo do receituário".
3. **Clínicas**: cadastrar cada local de atendimento (nome, endereço e telefone saem no PDF).
4. **Pacientes → Nova paciente** → vincular às clínicas → **Nova consulta**.

## Modelos e textos padrão
- **Modelos** (menu): prescrições prontas, pacotes de exames, atestados e textos padrão
  de qualquer campo da consulta (exame físico, exame ginecológico, conduta…).
- No primeiro acesso, a conta recebe **modelos sugeridos** para todos os campos e documentos
  (selo “Sugerido”). Abra, ajuste e salve: vira o seu padrão. “Restaurar sugestões” traz de volta
  as que tiverem sido apagadas.
- Na consulta: **Usar modelo** (substitui ou adiciona ao que já existe) e **Salvar como modelo**.
- Em toda área de texto há o botão **Padrões**: insere um texto salvo para só editar.
  Um padrão marcado como **automático** já vem preenchido em toda nova consulta.
- Atestados aceitam campos automáticos: {paciente} {cpf} {data} {hora} {idade} {clinica};
  {dias} e qualquer outro {campo} são perguntados na hora. O CID só sai com a autorização
  expressa da paciente (Resolução CFM 2.381/2024).

## Documentos da paciente
- Na consulta, a seção **Documentos** emite quantos documentos forem precisos — receita, solicitação de
  exames, atestado e orientações — cada um com seu próprio editor.
- Ao tocar em **Salvar e gerar PDF**, o documento fica guardado na ficha da paciente (aba Documentos), com
  data e hora, e pode ser aberto, impresso, baixado ou reenviado depois. Documento emitido não é alterado
  nem apagado: só pode ser **anulado**, com motivo, e continua no histórico.
- Nome dos arquivos: `Primeiro_Ultimo_Documento_dd-mm-aaaa.pdf` (ex.: `Mariana_Lima_Receita_25-11-2026.pdf`).
- **Enviar para a paciente**: por e-mail (PDFs anexados) ou WhatsApp — no celular os PDFs vão anexados pelo
  compartilhamento; no computador abre o WhatsApp com a mensagem pronta e links seguros válidos por 7 dias.

## Medicamentos, receitas padrão e CID-10
- **Modelos → Medicamentos**: seu banco de medicamentos. Na receita, um toque adiciona o medicamento já com
  apresentação, quantidade e posologia, e tudo pode ser editado no próprio formulário.
- **Receitas padrão**: escolha medicamentos do banco, ajuste e salve com um nome; use em outras pacientes.
- **CID-10 completa (DATASUS)** no banco, com busca por código ou nome, na avaliação e no atestado.

## Envio por e-mail (configuração única)
1. Crie uma conta em https://resend.com e verifique um domínio seu (ex.: consultorio.seudominio.com.br).
2. Gere uma API key.
3. No Supabase: **Edge Functions → Secrets** e crie `RESEND_API_KEY` (a chave) e `EMAIL_REMETENTE`
   (ex.: `Dra. Ana Paula Vianna <consultorio@seudominio.com.br>`).
A função `enviar-documentos` (pasta `supabase/functions`) já está publicada no projeto.

## Folhetos de orientação por protocolo
Em **Modelos → Folhetos de orientação** ficam os folhetos prontos (inseminação, coito programado,
punção, transferência e aplicação de injetável) — **conteúdo sugerido, para revisar e ajustar**.
Na consulta ou na ficha da paciente: **Novo documento → Orientações / folheto → Usar folheto padrão**,
informe a data e hora do procedimento e as datas do folheto são calculadas sozinhas.

Marcação do texto (uma instrução por linha):

| Linha | Vira no PDF |
|---|---|
| `# Título` | título de seção |
| `+ texto` | o que pode / deve fazer (ícone verde) |
| `x texto` | o que evitar (ícone vinho) |
| `1. texto` | passo numerado |
| `- texto` | tópico simples |
| `> texto` | caixa de destaque |
| `@ quando \| o quê` | linha do tempo |
| `{D+3}` `{D-2}` | dia relativo à data de referência (ex.: “sex., 28/11”) |
| `{H-36}` `{H+0}` | dia e hora relativos (ex.: “qui., 26/11, 21h00”) |
| `{data_ref}` `{hora_ref}` | a própria data e hora de referência |

## Orçamentos
**Novo documento → Orçamento → Usar orçamento padrão**: itens agrupados (honorários médicos,
procedimentos, laboratório, medicações estimadas), desconto, formas de pagamento, o que inclui e o que
não inclui, validade e campo de ciência da paciente. Os modelos sugeridos vêm sem valores: preencha uma
vez e salve como o seu padrão. (A emissão da nota fiscal da PJ fica para uma etapa futura.)

## Assinatura digital (receita, atestado e exames enviados sem imprimir)
Ao marcar **Assinar digitalmente** no documento, o PDF sai no modelo eletrônico e é assinado com o
certificado ICP-Brasil em nuvem da médica:
- data e hora de emissão, nome e CPF da paciente (obrigatório), CRM/UF e RQE;
- metadados exigidos pelo ITI para documentos de saúde (OID do tipo de documento, do CRM e da UF);
- assinatura PDF com CMS destacado (SHA-256) e DocMDP, como pede o Guia do Desenvolvedor do VALIDAR;
- **QR Code + código de acesso**: a farmácia lê o QR pelo site validar.iti.gov.br, digita o código e
  confere a receita; ou envia o PDF ao validador.

Sem marcar, continua saindo o receituário próprio, para imprimir e assinar à mão.
Medicamentos de controle especial seguem na plataforma do CFM (integração obrigatória ao SNCR/Anvisa).

**Configuração (uma vez):**
1. Rodar `supabase/migracao_v4.sql` no SQL Editor (ou o `schema.sql` inteiro — é idempotente).
2. Publicar as funções `assinar-documento` (com verificação de JWT) e `receita`
   (**sem** verificação de JWT — é o endereço público do QR Code).
3. Pedir à Valid o acesso à API de integração do VIDaaS (formulário “Solicitar Acesso para API de
   Integração” em validcertificadora.com.br/pages/vidaas-health, pede CNPJ) e cadastrar os segredos
   `VIDAAS_CLIENT_ID` e `VIDAAS_CLIENT_SECRET` em **Edge Functions → Secrets**.
4. No app: **Perfil → Assinatura digital** → certificado VIDaaS + CPF → **Autorizar agora**
   (aprovação no app VIDaaS do celular; vale pelo período escolhido, de 1 hora a 7 dias).

Para testar o fluxo antes das credenciais da Valid, dá para cadastrar um certificado de teste
(`ASSINATURA_TESTE_CHAVE` em PKCS#8 PEM e `ASSINATURA_TESTE_CERT` em PEM) — o PDF sai com a marca
“TESTE — SEM VALIDADE”.

## Pacientes
Cada consulta tem a **área** (ginecológica, obstétrica/pré-natal, fertilidade, planejamento familiar,
climatério ou outra — cada uma com ícone e cor) e o **atendimento** (primeira consulta, retorno ou
procedimento). O número do retorno é contado sozinho dentro de cada área (1º, 2º, 3º retorno…), e uma
nova “primeira consulta” reinicia a contagem. Na lista de pacientes aparece, ao lado do nome, o selo da
área da última consulta, qual atendimento foi e as consultas anteriores.

Busca por nome, CPF, telefone, e-mail, convênio ou área; ordenação por nome (A–Z/Z–A), última consulta,
clínica (agrupado), idade ou cadastro; filtros por clínica, período da última consulta, área da última consulta e convênio.

## Valores e produção
- **Clínicas → Tabela de valores**: quanto você recebe em cada clínica, por **serviço** e por **plano**
  (ex.: “Coleta de preventivo · Unimed · R$ 45”, “Consulta + preventivo · Bradesco · R$ 150”).
  Dá para copiar a tabela de uma clínica para outra e ajustar o que for diferente.
- **Na consulta**: o plano vem da ficha da paciente; ao escolher o serviço, o valor da tabela entra
  sozinho (e pode ser ajustado caso a caso). O valor fica gravado na consulta: mudar a tabela depois não
  altera o que já foi atendido. Em consulta finalizada, plano/serviço/valor ainda podem ser corrigidos
  (o prontuário continua protegido).
- **Produção** (atalho no Início e em Clínicas): total a receber por período (hoje, semana, mês, mês
  passado, ano ou datas escolhidas), por clínica, por plano e por serviço, lista dos atendimentos,
  alerta de atendimentos sem valor e **planilha** (CSV, abre no Excel/Google Planilhas).

## Sobre os documentos
- **Receituário simples**: medicamentos agrupados por via de uso, orientações, assinatura e rodapé da clínica.
- **Antimicrobianos** (RDC Anvisa 471/2021): saem automaticamente em **2 vias**, com idade e sexo
  da paciente e o quadro de registro de dispensação para a farmácia (validade de 10 dias).
- **Controle especial** (Portaria 344/98, ex.: antidepressivos): ficam **fora** deste PDF — desde a
  RDC 1.000/2025 a Receita de Controle Especial segue o modelo oficial da Anvisa.
- Também gera **Solicitação de exames** e **Registro da consulta** (cópia do prontuário).
- O PDF é para imprimir e assinar à mão, ou sai **assinado digitalmente** (veja acima).
- **Orientações** (folhetos com datas calculadas) e **Orçamento** também saem com a mesma identidade visual.

## Guarda do prontuário
O prontuário deve ser guardado por no mínimo 20 anos (Lei 13.787/2018). No plano gratuito
do Supabase não há backup automático: use **Perfil → Baixar cópia de segurança**
periodicamente, ou assine o plano Pro (backup diário).

## Estrutura
- `index.html`, `styles.css`, `app.js` — interface
- `pdf.js` — geração dos documentos em PDF (receituário, exames, atestado, folhetos, orçamento, registro)
- `data.js` — acesso ao banco (Supabase) ou modo demonstração
- `config.js` — URL e chave pública do Supabase
- `modelos-base.js` — modelos básicos de atestado
- `assets.js` — fontes e logomarca embutidas para o PDF (gerado a partir de `assets/`)
- `supabase/schema.sql` — tabelas e regras de segurança do banco (`migracao_v4.sql`: só as novidades)
- `supabase/functions/` — `enviar-documentos` (e-mail), `assinar-documento` (assinatura ICP-Brasil), `receita` (QR Code), `_shared/pdf-assinatura.ts`
- `vendor/qrcode.js` — gerador de QR Code (MIT, Kazuhiko Arase)

## Créditos
Fontes Cormorant Garamond e Jost (SIL Open Font License). Bibliotecas jsPDF e supabase-js (licença MIT).
