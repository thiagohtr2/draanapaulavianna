/* =====================================================================
   Camada de dados: Supabase (produção) ou navegador (demonstração).
   As duas implementações expõem a mesma interface: window.DB
   ===================================================================== */
(function () {
  'use strict';
  const cfg = window.APP_CONFIG || {};
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
  const agora = () => new Date().toISOString();

  /* ---------------- Supabase ---------------- */
  function supabaseDB() {
    const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
    const ok = ({ data, error }) => { if (error) throw traduzErro(error); return data; };
    let uid = null;

    const auth = {
      async session() { const { data } = await sb.auth.getSession(); uid = data.session?.user?.id || null; return data.session?.user || null; },
      async signIn(email, senha) { ok(await sb.auth.signInWithPassword({ email, password: senha })); return auth.session(); },
      async signUp(email, senha, meta) {
        const r = ok(await sb.auth.signUp({ email, password: senha, options: { data: meta, emailRedirectTo: location.origin + location.pathname } }));
        return { confirmar: !r.session };
      },
      async signOut() { await sb.auth.signOut(); uid = null; },
      async reset(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })); },
      async novaSenha(senha) { ok(await sb.auth.updateUser({ password: senha })); },
      onChange(cb) { sb.auth.onAuthStateChange((ev, s) => { uid = s?.user?.id || null; cb(ev, s?.user || null); }); }
    };

    const perfil = {
      async get() { return ok(await sb.from('perfis').select('*').eq('id', uid).maybeSingle()) || { id: uid }; },
      async save(p) { const { id, criado_em, atualizado_em, ...rest } = p; return ok(await sb.from('perfis').upsert({ id: uid, ...rest }).select().single()); }
    };

    const clinicas = {
      async list() { return ok(await sb.from('clinicas').select('*').order('nome')); },
      async save(c) {
        const { id, owner_id, criado_em, atualizado_em, ...rest } = c;
        if (id) return ok(await sb.from('clinicas').update(rest).eq('id', id).select().single());
        return ok(await sb.from('clinicas').insert(rest).select().single());
      },
      async remove(id) { ok(await sb.from('clinicas').delete().eq('id', id)); }
    };

    const pacientes = {
      async list() {
        const ps = ok(await sb.from('pacientes').select('*, paciente_clinicas(clinica_id)').order('nome'));
        const cs = ok(await sb.from('consultas').select('id, paciente_id, data, tipo, area, status').order('data', { ascending: false }).limit(10000));
        const por = {}; cs.forEach(c => { (por[c.paciente_id] = por[c.paciente_id] || []).push(c); });
        return ps.map(p => ({ ...p, clinicas: (p.paciente_clinicas || []).map(x => x.clinica_id), consultas: por[p.id] || [], ultima: (por[p.id] || [])[0] ? por[p.id][0].data : null }));
      },
      async get(id) {
        const p = ok(await sb.from('pacientes').select('*, paciente_clinicas(clinica_id)').eq('id', id).maybeSingle());
        if (!p) return null;
        return { ...p, clinicas: (p.paciente_clinicas || []).map(x => x.clinica_id) };
      },
      async save(p, clinicaIds) {
        const { id, owner_id, criado_em, atualizado_em, clinicas: _c, paciente_clinicas, ultima, consultas: _cs, hist: _h, areaUltima: _a, ...rest } = p;
        if (rest.data_nascimento === '') rest.data_nascimento = null;
        const salvo = id ? ok(await sb.from('pacientes').update(rest).eq('id', id).select().single())
                         : ok(await sb.from('pacientes').insert(rest).select().single());
        if (clinicaIds) {
          const atuais = ok(await sb.from('paciente_clinicas').select('clinica_id').eq('paciente_id', salvo.id)).map(x => x.clinica_id);
          const add = clinicaIds.filter(c => !atuais.includes(c)), del = atuais.filter(c => !clinicaIds.includes(c));
          if (add.length) ok(await sb.from('paciente_clinicas').insert(add.map(c => ({ paciente_id: salvo.id, clinica_id: c }))));
          if (del.length) ok(await sb.from('paciente_clinicas').delete().eq('paciente_id', salvo.id).in('clinica_id', del));
        }
        return pacientes.get(salvo.id);
      },
      async vincular(pacienteId, clinicaId) {
        const { error } = await sb.from('paciente_clinicas').upsert({ paciente_id: pacienteId, clinica_id: clinicaId }, { onConflict: 'paciente_id,clinica_id', ignoreDuplicates: true });
        if (error) throw traduzErro(error);
      }
    };

    const consultas = {
      async list({ pacienteId, limite, desde } = {}) {
        let q = sb.from('consultas').select('*').order('data', { ascending: false });
        if (pacienteId) q = q.eq('paciente_id', pacienteId);
        if (desde) q = q.gte('data', desde);
        if (limite) q = q.limit(limite);
        return ok(await q);
      },
      async get(id) { return ok(await sb.from('consultas').select('*').eq('id', id).maybeSingle()); },
      async save(c) {
        const { id, owner_id, criado_em, atualizado_em, finalizada_em, ...rest } = c;
        if (id) return ok(await sb.from('consultas').update(rest).eq('id', id).select().single());
        return ok(await sb.from('consultas').insert(rest).select().single());
      },
      async finalizar(id) { return ok(await sb.from('consultas').update({ status: 'finalizada' }).eq('id', id).select().single()); },
      // plano, serviço e valor podem ser corrigidos mesmo depois de finalizada (não fazem parte do prontuário)
      async faturamento(id, { plano, servico, valor }) { return ok(await sb.from('consultas').update({ plano, servico, valor }).eq('id', id).select().single()); },
      async adendo(id, texto) {
        const c = await consultas.get(id);
        const adendos = [...(c.adendos || []), { em: agora(), texto }];
        return ok(await sb.from('consultas').update({ adendos }).eq('id', id).select().single());
      },
      async remove(id) { ok(await sb.from('consultas').delete().eq('id', id)); }
    };

    const favoritos = {
      async list() { return ok(await sb.from('favoritos').select('*').order('nome')); },
      async save(f) { const { id, owner_id, criado_em, ...rest } = f; return id ? ok(await sb.from('favoritos').update(rest).eq('id', id).select().single()) : ok(await sb.from('favoritos').insert(rest).select().single()); },
      async remove(id) { ok(await sb.from('favoritos').delete().eq('id', id)); }
    };

    const valores = {
      async list() { return ok(await sb.from('valores').select('*').order('servico')); },
      async save(v) { const { id, owner_id, criado_em, atualizado_em, ...rest } = v; return id ? ok(await sb.from('valores').update(rest).eq('id', id).select().single()) : ok(await sb.from('valores').insert(rest).select().single()); },
      async remove(id) { ok(await sb.from('valores').delete().eq('id', id)); }
    };

    const documentos = {
      async list({ pacienteId, consultaId } = {}) {
        let q = sb.from('documentos').select('id, paciente_id, consulta_id, clinica_id, tipo, titulo, nome_arquivo, emitido_em, resumo, arquivo_path, paginas, anulado_em, motivo_anulacao, assinatura:dados->assinatura').order('emitido_em', { ascending: false });
        if (pacienteId) q = q.eq('paciente_id', pacienteId);
        if (consultaId) q = q.eq('consulta_id', consultaId);
        return ok(await q);
      },
      async get(id) { return ok(await sb.from('documentos').select('*').eq('id', id).maybeSingle()); },
      async salvar(doc, blob) {
        const id = doc.id || uuid();
        let arquivo_path = null;
        if (blob) {
          const caminho = `${uid}/${doc.paciente_id}/${id}.pdf`;
          const { error } = await sb.storage.from('documentos').upload(caminho, blob, { contentType: 'application/pdf', upsert: false });
          if (!error) arquivo_path = caminho;
          else if (doc.dados && doc.dados.assinatura) throw traduzErro(new Error('Não foi possível guardar o PDF assinado. Verifique a internet e tente de novo.'));
          else console.warn('PDF não enviado ao armazenamento; será regerado a partir dos dados.', error);
        }
        return ok(await sb.from('documentos').insert({ ...doc, id, arquivo_path }).select().single());
      },
      async pdf(doc) {
        if (!doc.arquivo_path) return null;
        const { data, error } = await sb.storage.from('documentos').download(doc.arquivo_path);
        return error ? null : data;
      },
      async anular(id, motivo) { return ok(await sb.from('documentos').update({ anulado_em: agora(), motivo_anulacao: motivo || '' }).eq('id', id).select().single()); },
      async linkTemporario(doc, dias = 7) {
        const path = doc.arquivo_path || (await documentos.get(doc.id) || {}).arquivo_path;
        if (!path) return '';
        const { data, error } = await sb.storage.from('documentos').createSignedUrl(path, dias * 86400, { download: doc.nome_arquivo });
        return error ? '' : data.signedUrl;
      }
    };

    const envios = {
      async email({ documentos: ids, para, assunto, mensagem, pacienteId }) {
        const { data, error } = await sb.functions.invoke('enviar-documentos', { body: { documentos: ids, para, assunto, mensagem, paciente_id: pacienteId } });
        if (error) {
          let msg = error.message;
          try { const j = await error.context.json(); if (j && j.erro) msg = j.erro; } catch (e) { /* sem corpo */ }
          throw traduzErro(new Error(/Failed to send|not found|404/i.test(msg) ? 'O envio por e-mail ainda não foi configurado no servidor.' : msg));
        }
        return data;
      },
      async registrar(e) { ok(await sb.from('envios').insert(e)); }
    };

    /* Assinatura digital (certificado ICP-Brasil em nuvem) — função assinar-documento */
    const b64de = u => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
    const b64para = t => { const s = atob(t); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
    async function chamarAssinatura(body) {
      const { data, error } = await sb.functions.invoke('assinar-documento', { body });
      if (error) {
        let msg = error.message, j = null;
        try { j = await error.context.json(); if (j && j.erro) msg = j.erro; } catch (e) { /* sem corpo */ }
        const er = new Error(/Failed to send|Failed to fetch|not found|404/i.test(msg) && !(j && j.erro) ? 'A assinatura digital ainda não foi ativada no servidor (função assinar-documento).' : msg);
        if (j && j.precisaAutorizar) er.precisaAutorizar = true;
        throw er;
      }
      return data;
    }
    const assinatura = {
      status: () => chamarAssinatura({ acao: 'status' }),
      autorizar: (provedor, cpf, duracao) => chamarAssinatura({ acao: 'autorizar', provedor, cpf, duracao }),
      verificar: id => chamarAssinatura({ acao: 'verificar', id }),
      encerrar: () => chamarAssinatura({ acao: 'encerrar' }),
      async assinar(bytes, tipo) { const r = await chamarAssinatura({ acao: 'assinar', tipo, pdf: b64de(bytes) }); return { ...r, pdf: b64para(r.pdf) }; },
      urlValidacao: id => `${String(cfg.SUPABASE_URL).replace(/\/$/, '')}/functions/v1/receita/${id}`
    };

    const cid = {
      async buscar(termo) {
        const t = normTxt(termo).trim(); if (t.length < 2) return [];
        const codigo = /^[a-z]\d/.test(t);
        let q = sb.from('cid10').select('codigo, descricao').order('codigo').limit(25);
        q = codigo ? q.ilike('busca', t.replace('.', '') + '%') : q.ilike('busca', '%' + t.split(/\s+/).join('%') + '%');
        return ok(await q);
      }
    };

    const modelos = {
      async list() { return ok(await sb.from('modelos').select('*').order('nome')); },
      async save(m) { const { id, owner_id, criado_em, atualizado_em, ...rest } = m; return id ? ok(await sb.from('modelos').update(rest).eq('id', id).select().single()) : ok(await sb.from('modelos').insert(rest).select().single()); },
      async saveMany(lista) { return ok(await sb.from('modelos').insert(lista).select()); },
      async remove(id) { ok(await sb.from('modelos').delete().eq('id', id)); }
    };

    async function exportar() {
      const [p, cl, pa, pc, co, fa, mo, dc, va] = await Promise.all(['perfis', 'clinicas', 'pacientes', 'paciente_clinicas', 'consultas', 'favoritos', 'modelos', 'documentos', 'valores'].map(t => sb.from(t).select('*').then(ok)));
      return { exportado_em: agora(), perfis: p, clinicas: cl, pacientes: pa, paciente_clinicas: pc, consultas: co, favoritos: fa, modelos: mo, documentos: dc, valores: va };
    }

    return { modo: 'supabase', auth, perfil, clinicas, pacientes, consultas, favoritos, valores, modelos, documentos, cid, envios, assinatura, exportar };
  }

  const normTxt = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function traduzErro(e) {
    const m = (e && (e.message || e.error_description)) || String(e);
    const mapa = [
      [/Invalid login credentials/i, 'E-mail ou senha incorretos.'],
      [/Email not confirmed/i, 'Confirme seu e-mail pelo link que enviamos antes de entrar.'],
      [/User already registered/i, 'Este e-mail já tem cadastro. Use "Entrar" ou "Esqueci a senha".'],
      [/Password should be at least/i, 'A senha precisa ter pelo menos 8 caracteres.'],
      [/rate limit/i, 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'],
      [/Failed to fetch|NetworkError|Load failed/i, 'Sem conexão com o servidor. Verifique a internet e tente de novo.'],
      [/violates foreign key.*consultas/i, 'Esta paciente ou clínica tem consultas registradas e não pode ser excluída.'],
      [/violates foreign key/i, 'Há registros ligados a este item; ele não pode ser excluído.']
    ];
    for (const [re, t] of mapa) if (re.test(m)) return new Error(t);
    return new Error(m);
  }

  /* ---------------- Demonstração (navegador) ---------------- */
  function demoDB() {
    const KEY = 'apv-demo-v1';
    let mem = null;
    const load = () => { if (mem) return mem; try { mem = JSON.parse(localStorage.getItem(KEY)); } catch (e) { mem = null; } if (!mem) { mem = seed(); persist(); } if (!mem.modelos) { mem.modelos = seedModelos(); persist(); } if (!mem.documentos) { mem.documentos = []; persist(); } if (!mem.valores) { mem.valores = []; persist(); } return mem; };
    const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* modo privado: fica só na memória */ } };
    const tick = (v) => new Promise(r => setTimeout(() => r(JSON.parse(JSON.stringify(v))), 60));
    let logado = false; try { logado = sessionStorage.getItem('apv-demo-login') === '1'; } catch (e) {}
    const user = { id: 'demo', email: 'demonstracao@exemplo.com' };

    const auth = {
      async session() { return logado ? user : null; },
      async signIn() { logado = true; try { sessionStorage.setItem('apv-demo-login', '1'); } catch (e) {} return user; },
      async signUp(email, senha, meta) { const d = load(); Object.assign(d.perfil, { nome: meta.nome || d.perfil.nome, crm: meta.crm || d.perfil.crm, crm_uf: meta.crm_uf || d.perfil.crm_uf, email }); persist(); await auth.signIn(); return { confirmar: false }; },
      async signOut() { logado = false; try { sessionStorage.removeItem('apv-demo-login'); } catch (e) {} },
      async reset() {}, async novaSenha() {}, onChange() {}
    };
    const perfil = { async get() { return tick(load().perfil); }, async save(p) { const d = load(); d.perfil = { ...d.perfil, ...p }; persist(); return tick(d.perfil); } };
    const coll = (nome, ordem) => ({
      async list() { return tick([...load()[nome]].sort(ordem)); },
      async save(o) { const d = load(); const arr = d[nome]; if (o.id) { const i = arr.findIndex(x => x.id === o.id); arr[i] = { ...arr[i], ...o, atualizado_em: agora() }; persist(); return tick(arr[i]); } const n = { ...o, id: uuid(), criado_em: agora() }; arr.push(n); persist(); return tick(n); },
      async remove(id) { const d = load(); d[nome] = d[nome].filter(x => x.id !== id); persist(); }
    });
    const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');
    const clinicas = coll('clinicas', porNome);
    clinicas.remove = async (id) => { const d = load(); if (d.consultas.some(c => c.clinica_id === id) || d.pc.some(x => x.clinica_id === id)) throw new Error('Há pacientes ou consultas ligadas a esta clínica; ela não pode ser excluída. Você pode marcá-la como inativa.'); d.clinicas = d.clinicas.filter(x => x.id !== id); persist(); };
    const favoritos = coll('favoritos', porNome);
    const modelos = coll('modelos', porNome);
    modelos.saveMany = async (lista) => { const d = load(); const novos = lista.map(m => ({ ...m, id: uuid(), criado_em: agora() })); d.modelos.push(...novos); persist(); return tick(novos); };
    const documentos = {
      async list({ pacienteId, consultaId } = {}) { let a = [...load().documentos].sort((x, y) => y.emitido_em.localeCompare(x.emitido_em)); if (pacienteId) a = a.filter(x => x.paciente_id === pacienteId); if (consultaId) a = a.filter(x => x.consulta_id === consultaId); return tick(a); },
      async get(id) { return tick(load().documentos.find(x => x.id === id) || null); },
      async salvar(doc) { const d = load(); const n = { emitido_em: agora(), ...doc, id: doc.id || uuid(), arquivo_path: null, anulado_em: null, motivo_anulacao: '' }; d.documentos.push(n); persist(); return tick(n); },
      async pdf() { return null; },
      async anular(id, motivo) { const d = load(); const x = d.documentos.find(y => y.id === id); x.anulado_em = agora(); x.motivo_anulacao = motivo || ''; persist(); return tick(x); },
      async linkTemporario() { return ''; }
    };
    const envios = {
      async email() { await tick(null); throw new Error('Na demonstração o e-mail não é enviado. Com o banco conectado, os PDFs vão anexados para a paciente.'); },
      async registrar() { return tick(null); }
    };
    // Demonstração: assinatura simulada (o PDF sai marcado como TESTE, sem validade)
    let sessaoDemo = null;
    const assinatura = {
      async status() { return tick({ provedores: { vidaas: false, teste: true }, sessao: sessaoDemo, demo: true }); },
      async autorizar(provedor) { sessaoDemo = { provedor: 'teste', expira_em: new Date(Date.now() + 8 * 3600e3).toISOString() }; return tick({ id: 'demo', ativa: true }); },
      async verificar() { return tick({ ativa: true }); },
      async encerrar() { sessaoDemo = null; return tick({ ok: true }); },
      async assinar(bytes) { const d = load(); return tick({ pdf: bytes, provedor: 'teste', em: agora(), assinante: { nome: [d.perfil.tratamento, d.perfil.nome].filter(Boolean).join(' '), cpf: '' } }); },
      urlValidacao: id => `https://exemplo.supabase.co/functions/v1/receita/${id}`
    };
    const cid = {
      async buscar(termo) {
        const t = normTxt(termo).trim(); if (t.length < 2) return [];
        const partes = t.split(/\s+/);
        const lista = (window.CID_DEMO || []).filter(c => { const b = normTxt(c.codigo.replace('.', '') + ' ' + c.codigo + ' ' + c.descricao); return /^[a-z]\d/.test(t) ? b.startsWith(t.replace('.', '')) : partes.every(p => b.includes(p)); });
        return tick(lista.slice(0, 25));
      }
    };
    const pacientes = {
      async list() { const d = load(); const por = {}; [...d.consultas].sort((a, b) => b.data.localeCompare(a.data)).forEach(c => { (por[c.paciente_id] = por[c.paciente_id] || []).push({ id: c.id, paciente_id: c.paciente_id, data: c.data, tipo: c.tipo, area: c.area || '', status: c.status }); }); return tick(d.pacientes.map(p => ({ ...p, clinicas: d.pc.filter(x => x.paciente_id === p.id).map(x => x.clinica_id), consultas: por[p.id] || [], ultima: (por[p.id] || [])[0] ? por[p.id][0].data : null })).sort(porNome)); },
      async get(id) { const d = load(); const p = d.pacientes.find(x => x.id === id); return p ? tick({ ...p, clinicas: d.pc.filter(x => x.paciente_id === id).map(x => x.clinica_id) }) : null; },
      async save(p, clinicaIds) {
        const d = load(); const { clinicas: _c, ultima, consultas: _cs, hist: _h, areaUltima: _a, ...rest } = p; let salvo;
        if (rest.id) { const i = d.pacientes.findIndex(x => x.id === rest.id); d.pacientes[i] = { ...d.pacientes[i], ...rest, atualizado_em: agora() }; salvo = d.pacientes[i]; }
        else { salvo = { sexo: 'F', ...rest, id: uuid(), criado_em: agora() }; d.pacientes.push(salvo); }
        if (clinicaIds) { d.pc = d.pc.filter(x => x.paciente_id !== salvo.id).concat(clinicaIds.map(c => ({ paciente_id: salvo.id, clinica_id: c }))); }
        persist(); return pacientes.get(salvo.id);
      },
      async vincular(pid, cid) { const d = load(); if (!d.pc.some(x => x.paciente_id === pid && x.clinica_id === cid)) { d.pc.push({ paciente_id: pid, clinica_id: cid }); persist(); } }
    };
    const consultas = {
      async list({ pacienteId, limite, desde } = {}) { let a = [...load().consultas].sort((x, y) => y.data.localeCompare(x.data)); if (pacienteId) a = a.filter(c => c.paciente_id === pacienteId); if (desde) a = a.filter(c => c.data >= desde); if (limite) a = a.slice(0, limite); return tick(a); },
      async get(id) { return tick(load().consultas.find(c => c.id === id) || null); },
      async save(c) {
        const d = load();
        if (c.id) { const i = d.consultas.findIndex(x => x.id === c.id); if (d.consultas[i].status === 'finalizada') throw new Error('Consulta finalizada: use um adendo para acrescentar informações.'); d.consultas[i] = { ...d.consultas[i], ...c, atualizado_em: agora() }; persist(); return tick(d.consultas[i]); }
        const n = { status: 'rascunho', registro: {}, prescricao: [], exames: [], orientacoes: '', adendos: [], ...c, id: uuid(), criado_em: agora(), data: c.data || agora() }; d.consultas.push(n); persist(); return tick(n);
      },
      async finalizar(id) { const d = load(); const c = d.consultas.find(x => x.id === id); c.status = 'finalizada'; c.finalizada_em = agora(); persist(); return tick(c); },
      async faturamento(id, f) { const d = load(); const c = d.consultas.find(x => x.id === id); Object.assign(c, { plano: f.plano, servico: f.servico, valor: f.valor }); persist(); return tick(c); },
      async adendo(id, texto) { const d = load(); const c = d.consultas.find(x => x.id === id); c.adendos = [...(c.adendos || []), { em: agora(), texto }]; persist(); return tick(c); },
      async remove(id) { const d = load(); const c = d.consultas.find(x => x.id === id); if (c && c.status === 'finalizada') throw new Error('Consulta finalizada não pode ser excluída (prontuário).'); d.consultas = d.consultas.filter(x => x.id !== id); persist(); }
    };
    const valores = {
      async list() { return tick([...(load().valores || [])].sort((a, b) => a.servico.localeCompare(b.servico, 'pt-BR'))); },
      async save(v) {
        const d = load(); d.valores = d.valores || [];
        const dup = d.valores.find(x => x.id !== v.id && x.clinica_id === v.clinica_id && normTxt(x.servico) === normTxt(v.servico) && normTxt(x.plano) === normTxt(v.plano));
        if (dup) throw new Error('Já existe um valor para este serviço e plano nesta clínica.');
        if (v.id) { const i = d.valores.findIndex(x => x.id === v.id); d.valores[i] = { ...d.valores[i], ...v }; persist(); return tick(d.valores[i]); }
        const n = { ...v, id: uuid(), criado_em: agora() }; d.valores.push(n); persist(); return tick(n);
      },
      async remove(id) { const d = load(); d.valores = (d.valores || []).filter(x => x.id !== id); persist(); return tick(null); }
    };
    async function exportar() { return { exportado_em: agora(), ...load() }; }
    return { modo: 'demo', auth, perfil, clinicas, pacientes, consultas, favoritos, valores, modelos, documentos, cid, envios, assinatura, exportar, limpar() { mem = null; try { localStorage.removeItem(KEY); } catch (e) {} } };
  }

  // Na demonstração, os modelos sugeridos já vêm carregados
  function seedModelos() {
    return (window.MODELOS_BASE || []).map(m => ({ ...JSON.parse(JSON.stringify(m)), id: uuid(), criado_em: agora() }));
  }

  function seed() {
    const c1 = uuid(), c2 = uuid(), p1 = uuid(), p2 = uuid(), p3 = uuid(), k1 = uuid(), k2 = uuid(), k3 = uuid(), k4 = uuid();
    const MED = { tratamento: 'Dra.', nome: 'Ana Paula Vianna', especialidade: 'Ginecologia e Reprodução', crm: '00000', crm_uf: 'BA', rqe: '0000', telefone: '', email: '' };
    const CL = { [c1]: { nome: 'Clínica Vida Mulher', endereco: 'Av. Tancredo Neves, 1000, sala 501', bairro: 'Caminho das Árvores', cidade: 'Salvador', uf: 'BA', cep: '41820-020', telefone: '(71) 3000-0000', email: 'contato@vidamulher.exemplo' }, [c2]: { nome: 'Centro Médico Ondina', endereco: 'Rua Exemplo, 45', bairro: 'Ondina', cidade: 'Salvador', uf: 'BA', cep: '40170-000', telefone: '(71) 3111-1111', email: '' } };
    const PAC = { [p1]: { nome: 'Mariana Souza Lima', nome_social: '', data_nascimento: '1991-05-12', sexo: 'F', cpf: '' }, [p2]: { nome: 'Juliana Costa Ferreira', nome_social: '', data_nascimento: '1987-09-30', sexo: 'F', cpf: '' } };
    const docSeed = (consulta, pac, cl, n, extra, titulo, resumo) => {
      const data = dias(n);
      const dados = { medico: MED, clinica: CL[cl], paciente: PAC[pac], data, tamanho: 'A4', marcaDagua: true, ...extra };
      const nome = window.DocumentosPDF ? window.DocumentosPDF.nomeDoArquivo(PAC[pac].nome, extra.tipo === 'exames' ? 'Solicitacao de exames' : titulo, new Date(data)) : titulo + '.pdf';
      return { id: uuid(), paciente_id: pac, consulta_id: consulta, clinica_id: cl, tipo: extra.tipo, titulo, nome_arquivo: nome, emitido_em: data, dados, resumo, arquivo_path: null, paginas: extra.itens && extra.itens.some(i => i.antimicrobiano) ? 2 : 1, anulado_em: null, motivo_anulacao: '' };
    };
    const dias = n => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(9 + (n % 7), 30, 0, 0); return d.toISOString(); };
    // dia do ciclo de exemplo (AAAA-MM-DD): o Dia 01 foi há 3 dias
    const diaCiclo = n => { const d = new Date(); d.setDate(d.getDate() - 3 + n - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const CICLO = {
      protocolo: 'FIV / ICSI', inicio: diaCiclo(1), dias: '', nhc: '', modelo_id: '', obs: 'Traga este livreto e os exames de sangue a todos os controles.',
      meds: [
        { nome: 'Gonal-f', dose: '225 UI', via: 'Subcutânea', horario: '20:00', de: 1, ate: 10 },
        { nome: 'Menopur', dose: '75 UI', via: 'Subcutânea', horario: '20:00', de: 1, ate: 10 },
        { nome: 'Cetrotide', dose: '0,25 mg', via: 'Subcutânea', horario: '08:00', de: 6, ate: 9 }
      ],
      controles: [{ data: diaCiclo(5), hora: '08:30', us: true, sangue: true }, { data: diaCiclo(7), hora: '08:30', us: true, sangue: false }, { data: diaCiclo(9), hora: '08:00', us: true, sangue: true }],
      final: [
        { med: 'Cetrotide 0,25 mg', via: 'Subcutânea', data: diaCiclo(10), hora: '08:00' },
        { med: 'Ovidrel 250 mcg', via: 'Subcutânea', data: diaCiclo(10), hora: '20:00' },
        { med: 'Azitromicina 1 g (1 comprimido) ou 500 mg (2 comprimidos), após o jantar', via: 'Oral', data: diaCiclo(11), hora: '20:00' }
      ],
      procedimento: { data: diaCiclo(12), hora: '08:00' }
    };
    return {
      perfil: { tratamento: 'Dra.', nome: 'Ana Paula Vianna', especialidade: 'Ginecologia e Reprodução', crm: '00000', crm_uf: 'BA', rqe: '0000', telefone: '', email: 'demonstracao@exemplo.com', cidade: 'Salvador', pdf_tamanho: 'A4', pdf_marca_dagua: true, modelos_iniciados: true },
      clinicas: [
        { id: c1, nome: 'Clínica Vida Mulher', endereco: 'Av. Tancredo Neves, 1000, sala 501', bairro: 'Caminho das Árvores', cidade: 'Salvador', uf: 'BA', cep: '41820-020', telefone: '(71) 3000-0000', email: 'contato@vidamulher.exemplo', ativa: true },
        { id: c2, nome: 'Centro Médico Ondina', endereco: 'Rua Exemplo, 45', bairro: 'Ondina', cidade: 'Salvador', uf: 'BA', cep: '40170-000', telefone: '(71) 3111-1111', email: '', ativa: true }
      ],
      pacientes: [
        { id: p1, nome: 'Mariana Souza Lima', data_nascimento: '1991-05-12', sexo: 'F', telefone: '(71) 98888-0001', convenio: 'Particular', alergias: 'Dipirona', antecedentes: 'Hipotireoidismo', medicacoes_uso: 'Levotiroxina 50 mcg', observacoes: '' },
        { id: p2, nome: 'Juliana Costa Ferreira', data_nascimento: '1987-09-30', sexo: 'F', telefone: '(71) 98888-0002', convenio: 'Plano exemplo', alergias: '', antecedentes: '', medicacoes_uso: '', observacoes: '' },
        { id: p3, nome: 'Beatriz Almeida Rocha', data_nascimento: '1996-01-08', sexo: 'F', telefone: '(71) 98888-0003', convenio: 'Particular', alergias: '', antecedentes: 'Síndrome dos ovários policísticos', medicacoes_uso: '', observacoes: '' }
      ],
      pc: [{ paciente_id: p1, clinica_id: c1 }, { paciente_id: p1, clinica_id: c2 }, { paciente_id: p2, clinica_id: c1 }, { paciente_id: p3, clinica_id: c2 }],
      consultas: [
        { id: k1, paciente_id: p1, clinica_id: c1, data: dias(62), tipo: 'Primeira consulta', area: 'Fertilidade', plano: 'Particular', servico: 'Consulta de fertilidade', valor: 700, status: 'finalizada', finalizada_em: dias(62),
          registro: { motivo: 'Desejo de engravidar.', hda: 'Tentando engravidar há 14 meses, ciclos regulares.', ciclo: 'Regular, 28/5 dias', gestacoes: '0', partos: '0', cesareas: '0', abortos: '0', contracepcao: 'Nenhum há 14 meses', tentante: '14 meses', pa: '110x70', peso: '62', altura: '1,64', exame_fisico: 'Bom estado geral.', exame_gineco: 'Especular sem alterações.', hipotese: 'Infertilidade feminina não especificada', cid: 'N97.9', cid_desc: 'Infertilidade feminina não especificada', conduta: 'Solicitada investigação inicial do casal.', retorno: 'Com exames' },
          prescricao: [], exames: [], orientacoes: '', adendos: [] },
        { id: k2, paciente_id: p1, clinica_id: c2, data: dias(3), tipo: 'Retorno', area: 'Fertilidade', plano: 'Particular', servico: '', valor: null, status: 'rascunho',
          registro: { motivo: 'Retorno com exames.', hipotese: '', conduta: '', ciclo_tratamento: CICLO }, prescricao: [], exames: [], orientacoes: '', adendos: [] },
        { id: k3, paciente_id: p2, clinica_id: c1, data: dias(20), tipo: 'Primeira consulta', area: 'Ginecológica', plano: 'Plano exemplo', servico: 'Consulta + preventivo', valor: 150, status: 'finalizada', finalizada_em: dias(20),
          registro: { motivo: 'Corrimento vaginal há 5 dias.', hipotese: 'Vaginose bacteriana', cid: 'N76.0', cid_desc: 'Vaginite aguda', conduta: 'Tratamento oral.' }, prescricao: [], exames: [], orientacoes: '', adendos: [] },
        { id: k4, paciente_id: p1, clinica_id: c1, data: dias(30), tipo: 'Retorno', area: 'Fertilidade', plano: 'Particular', servico: 'Retorno de fertilidade', valor: 400, status: 'finalizada', finalizada_em: dias(30),
          registro: { motivo: 'Retorno com exames da investigação.', hipotese: 'Infertilidade feminina', cid: 'N97.9', cid_desc: 'Infertilidade feminina não especificada', conduta: 'Indução da ovulação com coito programado.' }, prescricao: [], exames: [], orientacoes: '', adendos: [] }
      ],
      documentos: [
        docSeed(k1, p1, c1, 62, { tipo: 'receita', itens: [{ nome: 'Ácido fólico', apresentacao: '5 mg comprimido', via: 'Oral', quantidade: '1 caixa', posologia: 'Tomar 1 comprimido ao dia, de uso contínuo.', antimicrobiano: false, controlado: false }], orientacoes: 'Retorno com os exames.', incluirOrientacoes: true }, 'Receita', 'Ácido fólico 5 mg comprimido'),
        docSeed(k1, p1, c1, 62, { tipo: 'exames', exames: [{ nome: 'Hormônio antimülleriano (AMH)' }, { nome: 'TSH e T4 livre' }, { nome: 'Ultrassonografia transvaginal com contagem de folículos antrais' }], indicacao: 'Investigação de infertilidade conjugal.' }, 'Solicitação de exames', 'Hormônio antimülleriano (AMH) · TSH e T4 livre · Ultrassonografia transvaginal com contagem de folículos antrais'),
        docSeed(k3, p2, c1, 20, { tipo: 'receita', itens: [{ nome: 'Metronidazol', apresentacao: '250 mg comprimido', via: 'Oral', quantidade: '28 comprimidos', posologia: 'Tomar 2 comprimidos de 12 em 12 horas por 7 dias.', antimicrobiano: true, controlado: false }], orientacoes: 'Evitar bebida alcoólica durante o tratamento e até 24 horas após.', incluirOrientacoes: true }, 'Receita', 'Metronidazol 250 mg comprimido')
      ],
      modelos: seedModelos(),
      valores: [
        ['Consulta', 'Particular', 450], ['Consulta', 'Plano exemplo', 110], ['Coleta de preventivo', 'Plano exemplo', 45], ['Consulta + preventivo', 'Plano exemplo', 150],
        ['Consulta de fertilidade', 'Particular', 700], ['Retorno de fertilidade', 'Particular', 400], ['Ultrassonografia de monitorização', 'Particular', 250]
      ].map(([servico, plano, valor]) => ({ id: uuid(), clinica_id: c1, servico, plano, valor })).concat([
        ['Consulta', 'Particular', 400], ['Consulta + preventivo', 'Plano exemplo', 140], ['Retorno de fertilidade', 'Particular', 380]
      ].map(([servico, plano, valor]) => ({ id: uuid(), clinica_id: c2, servico, plano, valor }))),
      favoritos: (() => { const vistos = new Set(); const out = []; (window.MODELOS_BASE || []).filter(m => m.tipo === 'prescricao').forEach(m => (m.conteudo.itens || []).forEach(i => { const k = i.nome + '|' + i.apresentacao; if (!vistos.has(k)) { vistos.add(k); out.push({ id: uuid(), ...i }); } })); return out; })()
    };
  }

  const usarSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_KEY && window.supabase);
  window.DB = usarSupabase ? supabaseDB() : demoDB();
  window.DB.uuid = uuid;
})();
