# Consultório Dra. Ana Paula Vianna

App web de prontuário e receituário (Ginecologia e Fertilidade): login, pacientes por clínica, consultas organizadas, modelos e PDFs com a logomarca.

Funciona no celular, tablet e computador. Site estático (HTML, CSS e JavaScript) com banco e login no Supabase.

## 1. Criar o banco (Supabase) — 5 minutos
1. Em https://supabase.com crie um projeto (de preferência na conta da própria
   Dra. Ana Paula, região **South America (São Paulo)**).
2. Abra **SQL Editor → New query**, cole todo o arquivo `supabase/schema.sql` e clique **Run**.
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

## Pacientes
Busca por nome, CPF, telefone, e-mail ou convênio; ordenação por nome (A–Z/Z–A), última consulta,
clínica (agrupado), idade ou cadastro; filtros por clínica, período da última consulta e convênio.

## Sobre os documentos
- **Receituário simples**: medicamentos agrupados por via de uso, orientações, assinatura e rodapé da clínica.
- **Antimicrobianos** (RDC Anvisa 471/2021): saem automaticamente em **2 vias**, com idade e sexo
  da paciente e o quadro de registro de dispensação para a farmácia (validade de 10 dias).
- **Controle especial** (Portaria 344/98, ex.: antidepressivos): ficam **fora** deste PDF — desde a
  RDC 1.000/2025 a Receita de Controle Especial segue o modelo oficial da Anvisa.
- Também gera **Solicitação de exames** e **Registro da consulta** (cópia do prontuário).
- O PDF é para imprimir e assinar à mão, ou assinar digitalmente com certificado ICP-Brasil.

## Guarda do prontuário
O prontuário deve ser guardado por no mínimo 20 anos (Lei 13.787/2018). No plano gratuito
do Supabase não há backup automático: use **Perfil → Baixar cópia de segurança**
periodicamente, ou assine o plano Pro (backup diário).

## Estrutura
- `index.html`, `styles.css`, `app.js` — interface
- `pdf.js` — geração dos documentos em PDF (receituário, exames, atestado, registro)
- `data.js` — acesso ao banco (Supabase) ou modo demonstração
- `config.js` — URL e chave pública do Supabase
- `modelos-base.js` — modelos básicos de atestado
- `assets.js` — fontes e logomarca embutidas para o PDF (gerado a partir de `assets/`)
- `supabase/schema.sql` — tabelas e regras de segurança do banco

## Créditos
Fontes Cormorant Garamond e Jost (SIL Open Font License). Bibliotecas jsPDF e supabase-js (licença MIT).
