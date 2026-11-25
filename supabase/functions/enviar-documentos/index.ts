// Envia por e-mail, à paciente, os PDFs de documentos já emitidos.
// Segurança: roda com o login da médica (RLS), então só alcança os documentos dela.
// Segredos necessários (Supabase > Edge Functions > Secrets):
//   RESEND_API_KEY   — chave da conta Resend (resend.com)
//   EMAIL_REMETENTE  — ex.: "Dra. Ana Paula Vianna <consultorio@seudominio.com.br>" (domínio verificado no Resend)
import { createClient } from 'npm:@supabase/supabase-js@2';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const resp = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return resp(405, { erro: 'Método não permitido.' });

  const chave = Deno.env.get('RESEND_API_KEY');
  const remetente = Deno.env.get('EMAIL_REMETENTE');
  if (!chave || !remetente) return resp(503, { erro: 'O envio por e-mail ainda não foi configurado no servidor (faltam RESEND_API_KEY e EMAIL_REMETENTE).' });

  const auth = req.headers.get('Authorization') ?? '';
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return resp(401, { erro: 'Sessão expirada. Entre novamente.' });

  let corpo: { documentos?: string[]; para?: string; assunto?: string; mensagem?: string; paciente_id?: string };
  try { corpo = await req.json(); } catch { return resp(400, { erro: 'Pedido inválido.' }); }
  const ids = Array.isArray(corpo.documentos) ? corpo.documentos.slice(0, 10) : [];
  const para = String(corpo.para ?? '').trim();
  if (!ids.length) return resp(400, { erro: 'Nenhum documento escolhido.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para)) return resp(400, { erro: 'E-mail da paciente inválido.' });

  const { data: docs, error } = await sb.from('documentos').select('id, paciente_id, titulo, nome_arquivo, arquivo_path, anulado_em').in('id', ids);
  if (error || !docs || docs.length !== ids.length) return resp(404, { erro: 'Documento não encontrado.' });
  if (docs.some(d => d.anulado_em)) return resp(400, { erro: 'Há documento anulado na seleção.' });
  if (new Set(docs.map(d => d.paciente_id)).size !== 1) return resp(400, { erro: 'Os documentos precisam ser da mesma paciente.' });

  const anexos = [];
  for (const d of docs) {
    if (!d.arquivo_path) return resp(409, { erro: `O PDF de “${d.titulo}” não está no armazenamento. Abra o documento e baixe para enviar manualmente.` });
    const { data: arq, error: e2 } = await sb.storage.from('documentos').download(d.arquivo_path);
    if (e2 || !arq) return resp(500, { erro: `Não foi possível ler o PDF de “${d.titulo}”.` });
    anexos.push({ filename: d.nome_arquivo, content: encodeBase64(new Uint8Array(await arq.arrayBuffer())) });
  }

  const { data: perfil } = await sb.from('perfis').select('tratamento, nome, email').eq('id', user.id).maybeSingle();
  const medica = [perfil?.tratamento, perfil?.nome].filter(Boolean).join(' ') || 'Consultório';
  const mensagem = String(corpo.mensagem ?? '').slice(0, 4000);
  const lista = docs.map(d => `<li>${esc(d.titulo)}</li>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#2A1B21;line-height:1.5">
    <p>${esc(mensagem).replace(/\n/g, '<br>')}</p>
    <p style="margin-top:16px">Documentos em anexo:</p><ul>${lista}</ul>
    <p style="margin-top:24px;color:#6A555D;font-size:13px">${esc(medica)}<br>Este e-mail contém informações de saúde e é destinado exclusivamente à paciente.</p></div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: remetente, to: [para], subject: String(corpo.assunto ?? `Seus documentos — ${medica}`).slice(0, 200),
      html, text: `${mensagem}\n\nDocumentos em anexo:\n${docs.map(d => '- ' + d.titulo).join('\n')}\n\n${medica}`,
      reply_to: perfil?.email || undefined, attachments: anexos
    })
  });
  if (!r.ok) { const t = await r.text(); console.error('Resend', r.status, t); return resp(502, { erro: 'O serviço de e-mail recusou o envio. Confira a configuração do remetente.' }); }

  await sb.from('envios').insert({ paciente_id: docs[0].paciente_id, canal: 'email', destino: para, documentos: docs.map(d => d.id) }).then(() => {}, () => {});
  return resp(200, { ok: true });
});
