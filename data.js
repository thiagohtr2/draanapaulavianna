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
        const cs = ok(await sb.from('consultas').select('paciente_id, data').order('data', { ascending: false }).limit(5000));
        const ult = {}; cs.forEach(c => { if (!ult[c.paciente_id]) ult[c.paciente_id] = c.data; });
        return ps.map(p => ({ ...p, clinicas: (p.paciente_clinicas || []).map(x => x.clinica_id), ultima: ult[p.id] || null }));
      },
      async get(id) {
        const p = ok(await sb.from('pacientes').select('*, paciente_clinicas(clinica_id)').eq('id', id).maybeSingle());
        if (!p) return null;
        return { ...p, clinicas: (p.paciente_clinicas || []).map(x => x.clinica_id) };
      },
      async save(p, clinicaIds) {
        const { id, owner_id, criado_em, atualizado_em, clinicas: _c, paciente_clinicas, ultima, ...rest } = p;
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
      async list({ pacienteId, limite } = {}) {
        let q = sb.from('consultas').select('*').order('data', { ascending: false });
        if (pacienteId) q = q.eq('paciente_id', pacienteId);
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

    const modelos = {
      async list() { return ok(await sb.from('modelos').select('*').order('nome')); },
      async save(m) { const { id, owner_id, criado_em, atualizado_em, ...rest } = m; return id ? ok(await sb.from('modelos').update(rest).eq('id', id).select().single()) : ok(await sb.from('modelos').insert(rest).select().single()); },
      async saveMany(lista) { return ok(await sb.from('modelos').insert(lista).select()); },
      async remove(id) { ok(await sb.from('modelos').delete().eq('id', id)); }
    };

    async function exportar() {
      const [p, cl, pa, pc, co, fa, mo] = await Promise.all(['perfis', 'clinicas', 'pacientes', 'paciente_clinicas', 'consultas', 'favoritos', 'modelos'].map(t => sb.from(t).select('*').then(ok)));
      return { exportado_em: agora(), perfis: p, clinicas: cl, pacientes: pa, paciente_clinicas: pc, consultas: co, favoritos: fa, modelos: mo };
    }

    return { modo: 'supabase', auth, perfil, clinicas, pacientes, consultas, favoritos, modelos, exportar };
  }

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
    const load = () => { if (mem) return mem; try { mem = JSON.parse(localStorage.getItem(KEY)); } catch (e) { mem = null; } if (!mem) { mem = seed(); persist(); } if (!mem.modelos) { mem.modelos = seedModelos(); persist(); } return mem; };
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
    modelos.saveMany = async (lista) => { const out = []; for (const m of lista) out.push(await modelos.save(m)); return out; };
    const pacientes = {
      async list() { const d = load(); const ult = {}; [...d.consultas].sort((a, b) => b.data.localeCompare(a.data)).forEach(c => { if (!ult[c.paciente_id]) ult[c.paciente_id] = c.data; }); return tick(d.pacientes.map(p => ({ ...p, clinicas: d.pc.filter(x => x.paciente_id === p.id).map(x => x.clinica_id), ultima: ult[p.id] || null })).sort(porNome)); },
      async get(id) { const d = load(); const p = d.pacientes.find(x => x.id === id); return p ? tick({ ...p, clinicas: d.pc.filter(x => x.paciente_id === id).map(x => x.clinica_id) }) : null; },
      async save(p, clinicaIds) {
        const d = load(); const { clinicas: _c, ultima, ...rest } = p; let salvo;
        if (rest.id) { const i = d.pacientes.findIndex(x => x.id === rest.id); d.pacientes[i] = { ...d.pacientes[i], ...rest, atualizado_em: agora() }; salvo = d.pacientes[i]; }
        else { salvo = { sexo: 'F', ...rest, id: uuid(), criado_em: agora() }; d.pacientes.push(salvo); }
        if (clinicaIds) { d.pc = d.pc.filter(x => x.paciente_id !== salvo.id).concat(clinicaIds.map(c => ({ paciente_id: salvo.id, clinica_id: c }))); }
        persist(); return pacientes.get(salvo.id);
      },
      async vincular(pid, cid) { const d = load(); if (!d.pc.some(x => x.paciente_id === pid && x.clinica_id === cid)) { d.pc.push({ paciente_id: pid, clinica_id: cid }); persist(); } }
    };
    const consultas = {
      async list({ pacienteId, limite } = {}) { let a = [...load().consultas].sort((x, y) => y.data.localeCompare(x.data)); if (pacienteId) a = a.filter(c => c.paciente_id === pacienteId); if (limite) a = a.slice(0, limite); return tick(a); },
      async get(id) { return tick(load().consultas.find(c => c.id === id) || null); },
      async save(c) {
        const d = load();
        if (c.id) { const i = d.consultas.findIndex(x => x.id === c.id); if (d.consultas[i].status === 'finalizada') throw new Error('Consulta finalizada: use um adendo para acrescentar informações.'); d.consultas[i] = { ...d.consultas[i], ...c, atualizado_em: agora() }; persist(); return tick(d.consultas[i]); }
        const n = { status: 'rascunho', registro: {}, prescricao: [], exames: [], orientacoes: '', adendos: [], ...c, id: uuid(), criado_em: agora(), data: c.data || agora() }; d.consultas.push(n); persist(); return tick(n);
      },
      async finalizar(id) { const d = load(); const c = d.consultas.find(x => x.id === id); c.status = 'finalizada'; c.finalizada_em = agora(); persist(); return tick(c); },
      async adendo(id, texto) { const d = load(); const c = d.consultas.find(x => x.id === id); c.adendos = [...(c.adendos || []), { em: agora(), texto }]; persist(); return tick(c); },
      async remove(id) { const d = load(); const c = d.consultas.find(x => x.id === id); if (c && c.status === 'finalizada') throw new Error('Consulta finalizada não pode ser excluída (prontuário).'); d.consultas = d.consultas.filter(x => x.id !== id); persist(); }
    };
    async function exportar() { return { exportado_em: agora(), ...load() }; }
    return { modo: 'demo', auth, perfil, clinicas, pacientes, consultas, favoritos, modelos, exportar, limpar() { mem = null; try { localStorage.removeItem(KEY); } catch (e) {} } };
  }

  // Modelos de exemplo da demonstração (conteúdo ilustrativo, para a médica revisar e adaptar)
  function seedModelos() {
    const base = (window.MODELOS_BASE || []).map(m => ({ ...m, id: uuid(), criado_em: agora() }));
    return base.concat([
      { id: uuid(), tipo: 'exames', nome: 'Investigação inicial de infertilidade (exemplo)', conteudo: { exames: [{ nome: 'Hormônio antimülleriano (AMH)' }, { nome: 'FSH, LH e estradiol no 3º dia do ciclo' }, { nome: 'TSH e T4 livre' }, { nome: 'Prolactina' }, { nome: 'Ultrassonografia transvaginal com contagem de folículos antrais' }], indicacao: 'Investigação de infertilidade conjugal.' } },
      { id: uuid(), tipo: 'prescricao', nome: 'Pré-concepcional (exemplo)', conteudo: { itens: [{ nome: 'Ácido fólico', apresentacao: '5 mg', via: 'Oral', quantidade: '1 caixa', posologia: 'Tomar 1 comprimido ao dia, de uso contínuo.', antimicrobiano: false, controlado: false }], orientacoes: '- Manter alimentação equilibrada e atividade física regular.\n- Retorno com os exames solicitados.' } },
      { id: uuid(), tipo: 'texto', nome: 'Exame ginecológico sem alterações', conteudo: { campo: 'exame_gineco', auto: true, texto: 'Vulva e vagina sem lesões. Especular: colo epitelizado, conteúdo vaginal fisiológico. Toque: útero de volume normal, móvel, indolor; anexos não palpáveis.' } },
      { id: uuid(), tipo: 'texto', nome: 'Exame físico geral normal', conteudo: { campo: 'exame_fisico', auto: true, texto: 'Bom estado geral, corada, hidratada, eupneica. Mamas simétricas, sem nódulos palpáveis ou descarga papilar; axilas livres.' } }
    ]);
  }

  function seed() {
    const c1 = uuid(), c2 = uuid(), p1 = uuid(), p2 = uuid(), p3 = uuid();
    const dias = n => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(9 + (n % 7), 30, 0, 0); return d.toISOString(); };
    return {
      perfil: { tratamento: 'Dra.', nome: 'Ana Paula Vianna', especialidade: 'Ginecologia e Fertilidade', crm: '00000', crm_uf: 'BA', rqe: '0000', telefone: '', email: 'demonstracao@exemplo.com', cidade: 'Salvador', pdf_tamanho: 'A4', pdf_marca_dagua: true },
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
        { id: uuid(), paciente_id: p1, clinica_id: c1, data: dias(62), tipo: 'Primeira consulta', status: 'finalizada', finalizada_em: dias(62),
          registro: { motivo: 'Desejo de engravidar.', hda: 'Tentando engravidar há 14 meses, ciclos regulares.', dum: '', ciclo: 'Regular, 28/5 dias', gestacoes: '0', partos: '0', cesareas: '0', abortos: '0', contracepcao: 'Nenhum há 14 meses', tentante: '14 meses', pa: '110x70', peso: '62', altura: '1,64', exame_fisico: 'Bom estado geral.', exame_gineco: 'Especular sem alterações.', resultados: '', hipotese: 'Infertilidade conjugal a esclarecer', cid: 'N97.9', conduta: 'Solicitada investigação inicial do casal.', retorno: 'Com exames', indicacao_exames: 'Investigação de infertilidade conjugal.' },
          prescricao: [{ nome: 'Ácido fólico', apresentacao: '5 mg', via: 'Oral', quantidade: '1 caixa', posologia: 'Tomar 1 comprimido ao dia, de uso contínuo.' }],
          exames: [{ nome: 'Hormônio antimülleriano (AMH)' }, { nome: 'TSH e T4 livre' }, { nome: 'Ultrassonografia transvaginal com contagem de folículos antrais' }], orientacoes: 'Retorno com os exames.', adendos: [] },
        { id: uuid(), paciente_id: p1, clinica_id: c2, data: dias(3), tipo: 'Retorno', status: 'rascunho',
          registro: { motivo: 'Retorno com exames.', hipotese: '', conduta: '' }, prescricao: [], exames: [], orientacoes: '', adendos: [] },
        { id: uuid(), paciente_id: p2, clinica_id: c1, data: dias(20), tipo: 'Consulta', status: 'finalizada', finalizada_em: dias(20),
          registro: { motivo: 'Corrimento vaginal há 5 dias.', hipotese: 'Vaginose bacteriana', cid: 'N76.0', conduta: 'Tratamento oral.' },
          prescricao: [{ nome: 'Metronidazol', apresentacao: '500 mg', via: 'Oral', quantidade: '14 comprimidos', posologia: 'Tomar 1 comprimido de 12 em 12 horas por 7 dias.', antimicrobiano: true }], exames: [], orientacoes: 'Evitar bebida alcoólica durante o tratamento e até 48 horas após.', adendos: [] }
      ],
      modelos: seedModelos(),
      favoritos: [
        { id: uuid(), nome: 'Ácido fólico', apresentacao: '5 mg', via: 'Oral', quantidade: '1 caixa', posologia: 'Tomar 1 comprimido ao dia, de uso contínuo.', antimicrobiano: false, controlado: false }
      ]
    };
  }

  const usarSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_KEY && window.supabase);
  window.DB = usarSupabase ? supabaseDB() : demoDB();
  window.DB.uuid = uuid;
})();
