// Assina digitalmente (ICP-Brasil, certificado em nuvem) os PDFs de receita, atestado e solicitação de exames.
// Roda com o login da médica. A chave privada nunca sai da certificadora: o servidor envia só o hash.
//
// Ações (POST JSON { acao, ... }):
//   status                         → provedores configurados + sessão de assinatura ativa
//   autorizar { provedor, cpf, duracao } → pede a autorização no app do certificado (notificação no celular)
//   verificar { id }               → consulta se a médica já aprovou no app
//   assinar { pdf, tipo }          → devolve o PDF assinado (base64)
//   encerrar                       → encerra a autorização
//
// Segredos (Supabase > Edge Functions > Secrets):
//   VIDAAS_CLIENT_ID, VIDAAS_CLIENT_SECRET  — credenciais do aplicativo integrador, liberadas pela Valid
//   VIDAAS_URL (opcional)                   — padrão https://certificado.vidaas.com.br
//   ASSINATURA_TESTE_CHAVE / ASSINATURA_TESTE_CERT (opcional) — certificado de TESTE (PEM) para homologar o fluxo;
//        o PDF sai marcado "TESTE — SEM VALIDADE".
import { createClient } from 'npm:@supabase/supabase-js@2';
import { encodeBase64, decodeBase64 } from '../_shared/base64.ts';
import { prepararPDF, atributosAssinados, montarCMS, embutir, pemParaDER, certsDoPEM, nomeDoCert, OID_DOC } from '../_shared/pdf-assinatura.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const resp = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const env = (k: string) => Deno.env.get(k) ?? '';
const b64url = (u: Uint8Array) => encodeBase64(u).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sha256 = async (u: Uint8Array) => new Uint8Array(await crypto.subtle.digest('SHA-256', u as BufferSource));

/* ------------------------------------------------------------------
   VIDaaS (Valid) — certificado em nuvem gratuito do CFM.
   Fluxo OAuth 2.0 com PKCE e autorização por notificação no app (redirect_uri push://),
   conforme o Manual de Integração do PSC Valid. Conferir os caminhos quando as credenciais forem liberadas.
   ------------------------------------------------------------------ */
const VIDAAS = () => env('VIDAAS_URL') || 'https://certificado.vidaas.com.br';
const vidaasConfigurado = () => !!(env('VIDAAS_CLIENT_ID') && env('VIDAAS_CLIENT_SECRET'));
async function vidaasJSON(r: Response, etapa: string) {
  const t = await r.text(); let j: any = {}; try { j = t ? JSON.parse(t) : {}; } catch { /* resposta não-JSON */ }
  if (!r.ok) throw new Error(`VIDaaS (${etapa}): ${j.error_description || j.message || j.error || r.status}`);
  return j;
}
const vidaas = {
  async temCertificado(cpf: string) {
    const r = await fetch(`${VIDAAS()}/v0/oauth/user-discovery`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: env('VIDAAS_CLIENT_ID'), client_secret: env('VIDAAS_CLIENT_SECRET'), user_cpf_cnpj: 'CPF', val_cpf_cnpj: cpf }) });
    const j = await vidaasJSON(r, 'consulta do certificado');
    return j.status === 'S';
  },
  async autorizar(cpf: string, duracao: number) {
    const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
    const challenge = b64url(await sha256(new TextEncoder().encode(verifier)));
    const q = new URLSearchParams({ client_id: env('VIDAAS_CLIENT_ID'), code_challenge: challenge, code_challenge_method: 'S256', response_type: 'code',
      scope: 'signature_session', login_hint: cpf, lifetime: String(duracao), redirect_uri: 'push://' });
    const j = await vidaasJSON(await fetch(`${VIDAAS()}/v0/oauth/authorize?${q}`), 'autorização');
    if (!j.code) throw new Error('VIDaaS não devolveu o código de autorização.');
    return { code: String(j.code), verifier };
  },
  async verificar(code: string, verifier: string): Promise<{ token: string; expira: number } | null> {
    const r = await fetch(`${VIDAAS()}/valid/api/v1/trusted-services/authentications?code=${encodeURIComponent(code)}`);
    if (r.status === 202 || r.status === 204 || r.status === 404) return null; // ainda não aprovado
    const j = await vidaasJSON(r, 'confirmação');
    if (!j.authorizationToken) return null;
    const t = await vidaasJSON(await fetch(`${VIDAAS()}/v0/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', client_id: env('VIDAAS_CLIENT_ID'), client_secret: env('VIDAAS_CLIENT_SECRET'),
        code: j.authorizationToken, redirect_uri: 'push://', code_verifier: verifier }) }), 'token');
    return { token: t.access_token, expira: Number(t.expires_in) || 3600 };
  },
  async certificado(token: string): Promise<{ alias: string; der: Uint8Array; cadeia: Uint8Array[] }> {
    const j = await vidaasJSON(await fetch(`${VIDAAS()}/v0/oauth/certificate-discovery`, { headers: { Authorization: `Bearer ${token}` } }), 'certificado');
    const c = (j.certificates || [])[0];
    if (!c) throw new Error('Nenhum certificado encontrado na conta VIDaaS.');
    const pem = String(c.certificate || '');
    const ders = pem.includes('BEGIN') ? certsDoPEM(pem) : [decodeBase64(pem.replace(/\s+/g, ''))];
    return { alias: c.alias, der: ders[0], cadeia: ders.slice(1) };
  },
  async assinarHash(token: string, alias: string, hash: Uint8Array, formato: 'RAW' | 'CMS') {
    const j = await vidaasJSON(await fetch(`${VIDAAS()}/v0/oauth/signature`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashes: [{ id: '1', alias: alias || 'documento.pdf', hash: encodeBase64(hash), hash_algorithm: '2.16.840.1.101.3.4.2.1', signature_format: formato }] }) }), 'assinatura');
    const s = (j.signatures || [])[0];
    if (!s || !s.raw_signature) throw new Error('VIDaaS não devolveu a assinatura.');
    return decodeBase64(s.raw_signature);
  }
};

/* ------------------------------------------------------------------ certificado de teste */
const testeConfigurado = () => !!(env('ASSINATURA_TESTE_CHAVE') && env('ASSINATURA_TESTE_CERT'));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return resp(405, { erro: 'Método não permitido.' });
  const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return resp(401, { erro: 'Sessão expirada. Entre novamente.' });
  const adm = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
  let corpo: any; try { corpo = await req.json(); } catch { return resp(400, { erro: 'Pedido inválido.' }); }

  const sessaoAtiva = async () => {
    const { data } = await adm.from('assinatura_sessoes').select('*').eq('owner_id', user.id).eq('estado', 'ativa').gt('expira_em', new Date().toISOString()).order('criado_em', { ascending: false }).limit(1).maybeSingle();
    return data;
  };

  try {
    switch (corpo.acao) {
      case 'status': {
        const s = await sessaoAtiva();
        return resp(200, { provedores: { vidaas: vidaasConfigurado(), teste: testeConfigurado() }, sessao: s ? { provedor: s.provedor, expira_em: s.expira_em } : null });
      }
      case 'autorizar': {
        const provedor = String(corpo.provedor || 'vidaas');
        const cpf = String(corpo.cpf || '').replace(/\D/g, '');
        const duracao = Math.min(Math.max(Number(corpo.duracao) || 43200, 600), 604800);
        await adm.from('assinatura_sessoes').delete().eq('owner_id', user.id);
        if (provedor === 'teste') {
          if (!testeConfigurado()) return resp(503, { erro: 'O certificado de teste não está configurado no servidor.' });
          const { data } = await adm.from('assinatura_sessoes').insert({ owner_id: user.id, provedor, estado: 'ativa', expira_em: new Date(Date.now() + duracao * 1000).toISOString() }).select('id').single();
          return resp(200, { id: data!.id, ativa: true });
        }
        if (!vidaasConfigurado()) return resp(503, { erro: 'A integração com o VIDaaS ainda não foi liberada: faltam as credenciais da Valid (VIDAAS_CLIENT_ID e VIDAAS_CLIENT_SECRET).' });
        if (cpf.length !== 11) return resp(400, { erro: 'Informe o seu CPF (11 dígitos) no Perfil para localizar o certificado.' });
        if (!(await vidaas.temCertificado(cpf))) return resp(404, { erro: 'Não há certificado VIDaaS ativo para este CPF. Emita o certificado gratuito do CFM no CRM Virtual.' });
        const a = await vidaas.autorizar(cpf, duracao);
        const { data } = await adm.from('assinatura_sessoes').insert({ owner_id: user.id, provedor, estado: 'pendente', code: a.code, code_verifier: a.verifier, duracao, expira_em: new Date(Date.now() + 300000).toISOString() }).select('id').single();
        return resp(200, { id: data!.id, pendente: true });
      }
      case 'verificar': {
        const { data: s } = await adm.from('assinatura_sessoes').select('*').eq('id', corpo.id).eq('owner_id', user.id).maybeSingle();
        if (!s) return resp(404, { erro: 'Pedido de autorização não encontrado. Tente de novo.' });
        if (s.estado === 'ativa') return resp(200, { ativa: true });
        if (new Date(s.expira_em) < new Date()) return resp(410, { erro: 'O pedido expirou sem aprovação. Tente de novo.' });
        const t = await vidaas.verificar(s.code, s.code_verifier);
        if (!t) return resp(200, { pendente: true });
        await adm.from('assinatura_sessoes').update({ estado: 'ativa', access_token: t.token, code: null, code_verifier: null, expira_em: new Date(Date.now() + Math.min(t.expira, s.duracao || t.expira) * 1000).toISOString() }).eq('id', s.id);
        return resp(200, { ativa: true });
      }
      case 'encerrar': {
        await adm.from('assinatura_sessoes').delete().eq('owner_id', user.id);
        return resp(200, { ok: true });
      }
      case 'assinar': {
        const tipo = String(corpo.tipo) as keyof typeof OID_DOC;
        if (!OID_DOC[tipo]) return resp(400, { erro: 'Só receitas, atestados e solicitações de exames são assinados digitalmente.' });
        const s = await sessaoAtiva();
        if (!s) return resp(428, { erro: 'Autorize a assinatura no app do certificado.', precisaAutorizar: true });
        const pdf = decodeBase64(String(corpo.pdf || ''));
        if (pdf.length < 100 || pdf.length > 8_000_000) return resp(400, { erro: 'PDF inválido.' });
        const { data: perfil } = await sb.from('perfis').select('tratamento, nome, crm, crm_uf, especialidade, cidade').eq('id', user.id).maybeSingle();
        if (!perfil?.crm) return resp(400, { erro: 'Preencha o CRM no Perfil antes de assinar.' });
        const nomeMed = [perfil.tratamento, perfil.nome].filter(Boolean).join(' ');
        const prep = await prepararPDF(pdf, { tipo, crm: perfil.crm, uf: perfil.crm_uf || 'BA', especialidade: perfil.especialidade, nome: nomeMed, local: perfil.cidade || 'Brasil' });
        let cms: Uint8Array, certDER: Uint8Array;
        if (s.provedor === 'teste') {
          const certs = certsDoPEM(env('ASSINATURA_TESTE_CERT'));
          certDER = certs[0];
          const chave = await crypto.subtle.importKey('pkcs8', pemParaDER(env('ASSINATURA_TESTE_CHAVE')) as BufferSource, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
          const at = await atributosAssinados(prep.hash, certDER);
          cms = montarCMS(at.attrs, at.cert, certs.slice(1), new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, at.der as BufferSource)));
        } else {
          let cert: Awaited<ReturnType<typeof vidaas.certificado>> | null = null;
          try { cert = await vidaas.certificado(s.access_token); } catch (e) { console.warn('certificate-discovery falhou; usando CMS do provedor', e); }
          if (cert) {
            certDER = cert.der;
            const at = await atributosAssinados(prep.hash, certDER);
            cms = montarCMS(at.attrs, at.cert, cert.cadeia, await vidaas.assinarHash(s.access_token, cert.alias, at.hash, 'RAW'));
          } else {
            cms = await vidaas.assinarHash(s.access_token, '', prep.hash, 'CMS');
            certDER = new Uint8Array();
          }
        }
        const assinado = embutir(prep, cms);
        const titular = certDER.length ? nomeDoCert(certDER) : { nome: nomeMed, cpf: '' };
        return resp(200, { pdf: encodeBase64(assinado), assinante: titular, provedor: s.provedor, em: new Date().toISOString() });
      }
      default: return resp(400, { erro: 'Ação desconhecida.' });
    }
  } catch (e) {
    console.error(e);
    return resp(502, { erro: e instanceof Error ? e.message : 'Falha ao assinar.' });
  }
});
