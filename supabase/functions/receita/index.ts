// Endereço do QR Code dos documentos assinados (padrão do VALIDAR/ITI, Guia do Desenvolvedor, cap. IV).
//   GET /functions/v1/receita/<id>?_format=application/validador-iti+json&_secretCode=<código>
//     → { version: "1.0.0", prescription: { signatureFiles: [{ url }] } }  (401 código errado, 404 não existe)
//   GET /functions/v1/receita/<id>            → página para a farmácia/paciente digitar o código e baixar o PDF.
// Implantar SEM verificação de JWT (é público; a proteção é o código impresso no documento).
import { createClient } from 'npm:@supabase/supabase-js@2';

const adm = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const json = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pagina(titulo: string, corpo: string, status = 200) {
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)}</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#FBF4F5;color:#2A1B21;margin:0;padding:24px;display:flex;justify-content:center}
main{max-width:440px;width:100%;background:#fff;border-radius:16px;padding:28px;box-shadow:0 8px 30px rgba(94,21,48,.08)}h1{font-family:Georgia,serif;font-weight:500;color:#5E1530;font-size:1.6rem;margin:0 0 12px}
p{line-height:1.5}label{display:block;font-weight:600;margin:18px 0 6px}input{width:100%;box-sizing:border-box;font-size:1.2rem;padding:12px;border:1px solid #D9A0AC;border-radius:10px;letter-spacing:.2em;text-transform:uppercase}
button{margin-top:16px;width:100%;min-height:48px;border:0;border-radius:10px;background:#5E1530;color:#fff;font-size:1rem;font-weight:600}small{color:#68565D}a{color:#5E1530}</style></head>
<body><main>${corpo}</main></body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const id = url.pathname.split('/').filter(Boolean).pop() || '';
  const formato = (url.searchParams.get('_format') || '').replace(/ /g, '+'); // '+' chega como espaço na query
  const codigo = (url.searchParams.get('_secretCode') || url.searchParams.get('codigo') || '').trim().toUpperCase();
  const iti = formato === 'application/validador-iti+json';
  if (!UUID.test(id)) return iti ? json(404, { erro: 'não encontrado' }) : pagina('Documento não encontrado', '<h1>Documento não encontrado</h1><p>Confira o QR Code.</p>', 404);

  const { data: d } = await adm.from('documentos').select('id, titulo, emitido_em, arquivo_path, anulado_em, dados').eq('id', id).maybeSingle();
  const ass = d?.dados?.assinatura;
  if (!d || !ass || !d.arquivo_path || d.anulado_em) {
    if (iti) return json(404, { erro: 'não encontrado' });
    return pagina('Documento indisponível', d?.anulado_em ? '<h1>Documento anulado</h1><p>Este documento foi anulado pela médica e não deve ser utilizado.</p>' : '<h1>Documento não encontrado</h1><p>Confira o QR Code.</p>', 404);
  }
  const codigoOk = codigo && codigo === String(ass.codigo || '').toUpperCase();
  if (iti) {
    if (!codigoOk) return json(401, { erro: 'código inválido' });
    const { data: s } = await adm.storage.from('documentos').createSignedUrl(d.arquivo_path, 600);
    return json(200, { version: '1.0.0', prescription: { signatureFiles: [{ url: s?.signedUrl }] } });
  }
  if (codigo && codigoOk) {
    const { data: s } = await adm.storage.from('documentos').createSignedUrl(d.arquivo_path, 600, { download: true });
    if (s?.signedUrl) return Response.redirect(s.signedUrl, 302);
  }
  const quando = new Date(d.emitido_em).toLocaleString('pt-BR', { timeZone: 'America/Bahia', dateStyle: 'short', timeStyle: 'short' });
  return pagina(d.titulo, `<h1>${esc(d.titulo)}</h1>
    <p>Documento assinado digitalmente com certificado ICP-Brasil, emitido em ${esc(quando)}.</p>
    ${codigo ? '<p style="color:#9B1C31"><b>Código incorreto.</b> Confira o código impresso no documento.</p>' : ''}
    <form method="get"><label for="c">Código do documento</label><input id="c" name="codigo" autocomplete="off" maxlength="12" required>
    <button type="submit">Baixar o PDF assinado</button></form>
    <p><small>Farmácia: valide a assinatura em <a href="https://validar.iti.gov.br" rel="noopener">validar.iti.gov.br</a> (leia este QR Code pelo site ou envie o PDF).</small></p>`);
});
