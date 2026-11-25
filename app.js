/* =====================================================================
   Consultório Dra. Ana Paula Vianna — aplicação
   ===================================================================== */
(function () {
  'use strict';
  const DB = window.DB;
  const PDF = window.DocumentosPDF;
  const A = window.ASSETS.img;

  /* ---------------- utilidades ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const pad = n => String(n).padStart(2, '0');
  const fmtData = iso => { if (!iso) return ''; const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
  const fmtHora = iso => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const fmtCurta = iso => { const d = new Date(iso); return `${d.getDate()} ${MESES[d.getMonth()]}`; };
  const toLocalInput = iso => { const d = iso ? new Date(iso) : new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const idade = dn => PDF.idade(dn, new Date());
  const iniciais = n => String(n || '?').trim().split(/\s+/).filter(Boolean).map(p => p[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase();
  const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
  const TIPOS = ['Primeira consulta', 'Consulta', 'Retorno', 'Fertilidade', 'Pré-natal', 'Procedimento', 'Teleconsulta'];
  const VIAS = ['Oral', 'Vaginal', 'Tópico', 'Sublingual', 'Transdérmico', 'Intramuscular', 'Subcutâneo', 'Endovenoso', 'Nasal', 'Retal', 'Oftálmico', 'Inalatório', 'Outro'];
  // Detecção sugerida (ela pode desmarcar). Antimicrobianos: RDC 471/2021. Controle especial: Portaria 344/98 (lista C1).
  const ANTIMICROBIANOS = ['amoxicilina', 'ampicilina', 'azitromicina', 'cefalexina', 'cefuroxima', 'ceftriaxona', 'cefadroxila', 'ciprofloxacino', 'claritromicina', 'clindamicina', 'doxiciclina', 'eritromicina', 'fosfomicina', 'gentamicina', 'levofloxacino', 'metronidazol', 'nitrofurantoina', 'norfloxacino', 'penicilina', 'benzilpenicilina', 'secnidazol', 'sulfametoxazol', 'tinidazol', 'tetraciclina', 'ofloxacino'];
  const CONTROLADOS = ['fluoxetina', 'sertralina', 'escitalopram', 'citalopram', 'paroxetina', 'venlafaxina', 'desvenlafaxina', 'duloxetina', 'amitriptilina', 'nortriptilina', 'bupropiona', 'topiramato', 'gabapentina', 'pregabalina', 'carbamazepina', 'valproato', 'acido valproico', 'quetiapina', 'trazodona', 'misoprostol', 'mirtazapina'];
  const temTermo = (nome, lista) => { const n = norm(nome); return lista.some(t => n.includes(t)); };

  const ICON = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.8 2.5 3 5.2"/></svg>',
    clinic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-5h6v5M12 8v4M10 10h4"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 20h14"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5h14M5 10h14M5 15h9M5 20h6"/><path d="m16 16 2 2 4-4"/></svg>',
    open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
  };

  const MARCA_NOME = 'Dra. Ana Paula Vianna', MARCA_ESP = 'Ginecologia e Fertilidade';
  const marca = (cls, tag = 'p') => `<div class="marca ${cls}"><img src="${A['logo-symbol']}" alt=""><${tag} class="marca-nome">${MARCA_NOME}</${tag}><p class="marca-esp">${MARCA_ESP}</p></div>`;
  const temAlergia = t => !!(t && t.trim() && !/^\s*(nega|sem\s|nenhum|nenhuma|não\s|nao\s)/i.test(t));

  /* ---------------- estado ---------------- */
  const S = { user: null, perfil: null, clinicas: [], pacientes: null, favoritos: [], modelos: [] };
  async function carregarBase() {
    const [perfil, clinicas, favoritos, modelos] = await Promise.all([DB.perfil.get(), DB.clinicas.list(), DB.favoritos.list(), DB.modelos.list()]);
    S.perfil = perfil || {}; S.clinicas = clinicas; S.favoritos = favoritos; S.modelos = modelos;
  }
  async function pacientes(force) { if (!S.pacientes || force) S.pacientes = await DB.pacientes.list(); return S.pacientes; }
  const clinicaPorId = id => S.clinicas.find(c => c.id === id);
  const nomeMedica = () => [S.perfil.tratamento || 'Dra.', S.perfil.nome || 'Ana Paula Vianna'].filter(Boolean).join(' ');

  /* ---------------- avisos (toast) ---------------- */
  function toast(msg, erro) {
    const box = $('#toasts'); if (!box) return alert(msg);
    const t = document.createElement('div'); t.className = 'toast' + (erro ? ' err' : ''); t.setAttribute('role', erro ? 'alert' : 'status'); t.textContent = msg;
    box.appendChild(t); setTimeout(() => t.remove(), erro ? 7000 : 3600);
  }
  const falha = e => { console.error(e); toast(e && e.message ? e.message : 'Algo deu errado. Tente de novo.', true); };

  /* ---------------- diálogos ---------------- */
  function abrirDialogo({ titulo, corpo, rodape = '', largo = false, aoAbrir, aoFechar }) {
    const origem = document.activeElement;
    const d = document.createElement('dialog');
    if (largo) d.classList.add('wide');
    const tid = 'dlg-' + Math.random().toString(36).slice(2, 8);
    d.setAttribute('aria-labelledby', tid);
    d.innerHTML = `<div class="dlg"><div class="dlg-head"><h2 id="${tid}">${esc(titulo)}</h2><button class="icon-btn" data-close aria-label="Fechar">${ICON.close}</button></div><div class="dlg-body">${corpo}</div>${rodape ? `<div class="dlg-foot">${rodape}</div>` : ''}</div>`;
    document.body.appendChild(d);
    const fechar = () => { if (d.open) d.close(); };
    d.addEventListener('close', () => { aoFechar && aoFechar(); d.remove(); if (origem && origem.isConnected) origem.focus(); });
    d.addEventListener('click', e => { if (e.target === d) fechar(); if (e.target.closest('[data-close]')) fechar(); });
    d.showModal();
    const first = d.querySelector('[autofocus]') || d.querySelector('.dlg-body input, .dlg-body select, .dlg-body textarea');
    if (first) first.focus();
    aoAbrir && aoAbrir(d, fechar);
    return { d, fechar };
  }
  function confirmar(texto, { ok = 'Confirmar', perigo = false, titulo = 'Confirmar' } = {}) {
    return new Promise(res => {
      let r = false;
      abrirDialogo({
        titulo, corpo: `<p>${esc(texto)}</p>`,
        rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn ${perigo ? 'btn-danger' : 'btn-primary'}" data-ok autofocus>${esc(ok)}</button>`,
        aoAbrir: (d, fechar) => d.querySelector('[data-ok]').addEventListener('click', () => { r = true; fechar(); }),
        aoFechar: () => res(r)
      });
    });
  }
  async function ocupado(btn, fn) {
    if (btn.getAttribute('aria-busy') === 'true') return;
    btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
    try { return await fn(); } finally { btn.removeAttribute('aria-busy'); btn.disabled = false; }
  }
  function lerForm(form) {
    const o = {};
    $$('[name]', form).forEach(el => { if (el.type === 'checkbox') { if (!el.dataset.multi) o[el.name] = el.checked; } else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; } else o[el.name] = el.value.trim(); });
    return o;
  }
  function erroCampo(input, msg) {
    const f = input.closest('.field'); if (!f) return;
    let e = f.querySelector('.err');
    if (!msg) { input.removeAttribute('aria-invalid'); if (e) e.remove(); return; }
    if (!e) { e = document.createElement('p'); e.className = 'err'; e.id = input.id + '-err'; f.appendChild(e); }
    e.textContent = msg; input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', e.id);
  }
  const campo = (rot, html, extra = '') => `<label class="field ${extra}"><span>${rot}</span>${html}</label>`;

  /* ---------------- ditado por voz ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let reconhecedor = null;
  function areaTexto(id, name, valor, { rot, linhas = 4, ph = '', padrao = true, campo } = {}) {
    const key = campo || String(name || '').replace(/^registro\./, '');
    const mic = SR ? `<button type="button" class="tool-btn mic" data-mic="${id}" aria-pressed="false" aria-label="Ditar ${esc(rot || '')} por voz">${ICON.mic}</button>` : '';
    const pad = padrao && key ? `<button type="button" class="pad-btn" data-padrao="${esc(key)}" data-alvo="${id}" data-rot="${esc(rot || '')}" aria-label="Textos padrão de ${esc(rot || '')}">${ICON.text}<span>Padrões</span></button>` : '';
    return `<div class="field"><div class="ta-head"><label for="${id}" class="label">${rot}</label>${mic || pad ? `<div class="ta-tools">${mic}${pad}</div>` : ''}</div><textarea id="${id}" name="${name}" rows="${linhas}" placeholder="${esc(ph)}">${esc(valor)}</textarea></div>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-mic]'); if (!b || !SR) return;
    if (reconhecedor) { reconhecedor.stop(); return; }
    const ta = document.getElementById(b.dataset.mic); if (!ta) return;
    const r = new SR(); r.lang = 'pt-BR'; r.continuous = true; r.interimResults = false;
    reconhecedor = r; b.setAttribute('aria-pressed', 'true');
    r.onresult = ev => { let t = ''; for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) t += ev.results[i][0].transcript; if (t) { ta.value = (ta.value ? ta.value.replace(/\s*$/, ' ') : '') + t.trim(); ta.dispatchEvent(new Event('input', { bubbles: true })); } };
    r.onerror = ev => { if (ev.error === 'not-allowed') toast('Permita o uso do microfone para ditar.', true); };
    r.onend = () => { reconhecedor = null; b.setAttribute('aria-pressed', 'false'); };
    r.start(); toast('Ditado ativo — fale normalmente. Toque no microfone para parar.');
  });

  /* ---------------- PDF ---------------- */
  function dadosBasePDF(paciente, clinica, data) {
    return {
      medico: S.perfil, clinica: clinica || {}, paciente, data: data ? new Date(data) : new Date(),
      tamanho: S.perfil.pdf_tamanho || 'A4', marcaDagua: S.perfil.pdf_marca_dagua !== false
    };
  }
  let downloadsCap = null;
  if (window.claude && typeof window.claude.use === 'function') window.claude.use('downloads').then(d => { downloadsCap = d; }).catch(() => {});

  function mostrarPDF(r, titulo) {
    const url = URL.createObjectURL(r.blob);
    const file = typeof File === 'function' ? new File([r.blob], r.nomeArquivo, { type: 'application/pdf' }) : null;
    const podeCompartilhar = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
    const ehToque = matchMedia('(pointer: coarse)').matches;
    const previa = !ehToque && innerWidth >= 900 && !downloadsCap;
    const avisos = (r.avisos || []).map(a => `<div class="alert">${ICON.alert}<p>${esc(a)}</p></div>`).join('');
    abrirDialogo({
      titulo, largo: previa,
      corpo: `<div class="stack">${avisos}
        ${previa ? `<iframe class="pdf-frame" src="${url}" title="Pré-visualização do PDF"></iframe>` : `<div class="summary-card"><b>${esc(r.nomeArquivo)}</b><p class="muted small">${r.paginas} ${r.paginas === 1 ? 'página' : 'páginas'} · pronto para imprimir, enviar ou salvar</p></div>`}
        <p class="small muted">Imprima e assine, ou assine digitalmente com certificado ICP-Brasil antes de enviar.</p></div>`,
      rodape: `${podeCompartilhar ? `<button class="btn btn-ghost" data-share>${ICON.share}Enviar</button>` : ''}
        ${downloadsCap ? `<button class="btn btn-primary" data-save>${ICON.download}Baixar PDF</button>` : `<a class="btn btn-ghost" href="${url}" target="_blank" rel="noopener">${ICON.open}Abrir</a><a class="btn btn-primary" href="${url}" download="${esc(r.nomeArquivo)}">${ICON.download}Baixar PDF</a>`}`,
      aoAbrir: d => {
        const sh = d.querySelector('[data-share]');
        if (sh) sh.addEventListener('click', () => navigator.share({ files: [file], title: r.nomeArquivo }).catch(() => {}));
        const sv = d.querySelector('[data-save]');
        if (sv) sv.addEventListener('click', () => ocupado(sv, async () => {
          try { await downloadsCap.save({ filename: r.nomeArquivo, data: r.blob }); } catch (e) { toast('O download foi cancelado ou bloqueado.', true); }
        }));
      },
      aoFechar: () => setTimeout(() => URL.revokeObjectURL(url), 60000)
    });
  }
  function gerarEmostrar(dados, titulo) {
    try { const r = PDF.gerar(dados); mostrarPDF(r, titulo); }
    catch (e) { falha(e); }
  }

  /* =====================================================================
     Autenticação
     ===================================================================== */
  function telaAuth(modo = 'entrar', aviso = '') {
    const demo = DB.modo === 'demo';
    document.getElementById('root').innerHTML = `
      <main class="auth" id="main">
        <div class="box">
          ${marca('marca-login', 'h1')}
          <div class="card">
            ${modo === 'recuperar' ? `
              <h2 style="font-size:1.8rem">Recuperar senha</h2>
              <p class="muted small" style="margin:.4rem 0 1rem">Enviaremos um link para criar uma nova senha.</p>
              <form id="f-auth" class="stack" novalidate>
                ${campo('E-mail', `<input id="a-email" name="email" type="email" autocomplete="email" inputmode="email" required>`)}
                <button class="btn btn-primary btn-block" type="submit">Enviar link</button>
                <button class="btn btn-quiet btn-block" type="button" data-modo="entrar">Voltar para o login</button>
              </form>` : `
              <div class="tabs" role="tablist" aria-label="Acesso">
                <button role="tab" type="button" aria-selected="${modo === 'entrar'}" data-modo="entrar">Entrar</button>
                <button role="tab" type="button" aria-selected="${modo === 'criar'}" data-modo="criar">Criar conta</button>
              </div>
              ${aviso ? `<div class="alert info" style="margin-bottom:1rem"><p>${esc(aviso)}</p></div>` : ''}
              ${demo ? `<div class="alert" style="margin-bottom:1rem">${ICON.alert}<p><b>Modo demonstração.</b> Qualquer e-mail e senha entram. Os dados ficam só neste navegador — não use dados reais de pacientes.</p></div>` : ''}
              <form id="f-auth" class="stack" novalidate>
                ${modo === 'criar' ? `
                  ${campo('Nome completo', `<input id="a-nome" name="nome" autocomplete="name" required>`)}
                  <div class="grid grid-2">
                    ${campo('CRM', `<input id="a-crm" name="crm" inputmode="numeric" autocomplete="off">`)}
                    ${campo('UF do CRM', `<select id="a-uf" name="crm_uf">${UFS.map(u => `<option ${u === 'BA' ? 'selected' : ''}>${u}</option>`).join('')}</select>`)}
                  </div>` : ''}
                ${campo('E-mail', `<input id="a-email" name="email" type="email" autocomplete="email" inputmode="email" required>`)}
                ${campo('Senha', `<input id="a-senha" name="senha" type="password" autocomplete="${modo === 'criar' ? 'new-password' : 'current-password'}" minlength="8" required>`)}
                <label class="check small"><input type="checkbox" id="a-ver"> Mostrar senha</label>
                <button class="btn btn-primary btn-block" type="submit">${modo === 'criar' ? 'Criar conta' : 'Entrar'}</button>
                ${modo === 'entrar' ? `<button class="btn btn-quiet btn-block" type="button" data-modo="recuperar">Esqueci minha senha</button>` : ''}
              </form>`}
          </div>
          <p class="foot">Ginecologia e Fertilidade · prontuário e receituário</p>
        </div>
      </main><div class="toasts" id="toasts" aria-live="polite"></div>`;
    const root = document.getElementById('root');
    $$('[data-modo]', root).forEach(b => b.addEventListener('click', () => telaAuth(b.dataset.modo)));
    const ver = $('#a-ver'); if (ver) ver.addEventListener('change', () => { $('#a-senha').type = ver.checked ? 'text' : 'password'; });
    $('#f-auth').addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.currentTarget; const v = lerForm(f); const btn = $('button[type=submit]', f);
      let ok = true;
      const em = $('#a-email');
      if (!/^\S+@\S+\.\S+$/.test(v.email)) { erroCampo(em, 'Informe um e-mail válido.'); ok = false; } else erroCampo(em);
      if (modo !== 'recuperar') {
        const s = $('#a-senha');
        if ((v.senha || '').length < 8) { erroCampo(s, 'A senha precisa ter pelo menos 8 caracteres.'); ok = false; } else erroCampo(s);
      }
      if (modo === 'criar') { const n = $('#a-nome'); if (!v.nome) { erroCampo(n, 'Informe seu nome.'); ok = false; } else erroCampo(n); }
      if (!ok) { $('[aria-invalid="true"]', f).focus(); return; }
      await ocupado(btn, async () => {
        try {
          if (modo === 'recuperar') { await DB.auth.reset(v.email); telaAuth('entrar', 'Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.'); return; }
          if (modo === 'criar') {
            const r = await DB.auth.signUp(v.email, v.senha, { nome: v.nome, crm: v.crm, crm_uf: v.crm_uf });
            if (r.confirmar) { telaAuth('entrar', `Conta criada. Confirme pelo link enviado para ${v.email} e depois entre.`); return; }
          } else await DB.auth.signIn(v.email, v.senha);
          await iniciarSessao();
        } catch (err) { falha(err); }
      });
    });
  }

  function dialogoNovaSenha() {
    abrirDialogo({
      titulo: 'Nova senha',
      corpo: `<form id="f-ns" class="stack" novalidate>${campo('Nova senha', `<input id="ns" name="senha" type="password" autocomplete="new-password" minlength="8" required>`)}</form>`,
      rodape: `<button class="btn btn-primary" data-ok>Salvar senha</button>`,
      aoAbrir: (d, fechar) => d.querySelector('[data-ok]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
        const i = d.querySelector('#ns'); if (i.value.length < 8) return erroCampo(i, 'Mínimo de 8 caracteres.');
        try { await DB.auth.novaSenha(i.value); toast('Senha atualizada.'); fechar(); } catch (err) { falha(err); }
      }))
    });
  }

  /* =====================================================================
     Estrutura logada
     ===================================================================== */
  const NAV = [['inicio', 'Início', 'home'], ['pacientes', 'Pacientes', 'users'], ['modelos', 'Modelos', 'layers'], ['clinicas', 'Clínicas', 'clinic'], ['perfil', 'Perfil', 'user']];
  function moldura() {
    const demo = DB.modo === 'demo';
    document.getElementById('root').innerHTML = `
      <a class="sr-only" href="#main" id="skip">Pular para o conteúdo</a>
      <div class="app logado">
        <aside class="sidebar" aria-label="Menu principal">
          ${marca('marca-side')}
          <nav aria-label="Seções">${NAV.map(([r, t, i]) => `<a href="#${r}" data-nav="${r}">${ICON[i]}<span>${t}</span></a>`).join('')}</nav>
          <button class="btn btn-primary cta" data-acao="nova-consulta">${ICON.plus}Nova consulta</button>
          <div class="who"><b>${esc(nomeMedica())}</b><br><span class="wrap-any">${esc(S.user.email || '')}</span></div>
        </aside>
        <div>
          ${demo ? `<div class="demo-banner" role="note"><b>Modo demonstração:</b> dados de exemplo, salvos só neste navegador. Não use dados reais de pacientes.</div>` : ''}
          <header class="topbar logado">
            <a class="brand" href="#inicio" aria-label="Início"><img src="${A['logo-symbol']}" alt=""><span><b>${MARCA_NOME}</b><small>${MARCA_ESP}</small></span></a>
            <span class="spacer"></span>
            <button class="icon-btn" data-acao="nova-consulta" aria-label="Nova consulta">${ICON.plus}</button>
          </header>
          <main id="main" class="main" tabindex="-1"></main>
        </div>
        <nav class="bottomnav" aria-label="Seções">${NAV.map(([r, t, i]) => `<a href="#${r}" data-nav="${r}">${ICON[i]}<span>${t}</span></a>`).join('')}</nav>
      </div>
      <div class="toasts" id="toasts" aria-live="polite"></div>`;
    $$('[data-acao="nova-consulta"]').forEach(b => b.addEventListener('click', () => dialogoNovaConsulta()));
  }
  function marcarNav(sec) { $$('[data-nav]').forEach(a => { if (a.dataset.nav === sec) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); }

  /* ---------------- roteador ---------------- */
  let rotaAtual = '';
  async function rotear() {
    if (!S.user) return;
    await salvarPendente();
    const h = decodeURIComponent(location.hash.replace(/^#/, '')) || 'inicio';
    rotaAtual = h;
    const main = $('#main'); if (!main) return;
    let sec = 'inicio';
    try {
      if (h === 'inicio') await viewInicio(main);
      else if (h === 'pacientes') { sec = 'pacientes'; await viewPacientes(main); }
      else if (h.startsWith('paciente-')) { sec = 'pacientes'; await viewPaciente(main, h.slice(9)); }
      else if (h.startsWith('consulta-')) { sec = 'pacientes'; await viewConsulta(main, h.slice(9)); }
      else if (h === 'clinicas') { sec = 'clinicas'; await viewClinicas(main); }
      else if (h === 'modelos') { sec = 'modelos'; await viewModelos(main); }
      else if (h === 'perfil') { sec = 'perfil'; await viewPerfil(main); }
      else if (h === 'main') return;
      else { location.hash = '#inicio'; return; }
    } catch (e) { falha(e); main.innerHTML = `<div class="empty"><h2>Não foi possível carregar</h2><p>${esc(e.message || e)}</p><button class="btn btn-primary" onclick="location.reload()">Tentar de novo</button></div>`; }
    marcarNav(sec);
    if (!h.startsWith('consulta-') || !main.dataset.keepScroll) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', rotear);

  /* =====================================================================
     Início
     ===================================================================== */
  async function viewInicio(main) {
    main.innerHTML = `<div class="skeleton"></div>`;
    const [ps, cs] = await Promise.all([pacientes(true), DB.consultas.list({ limite: 60 })]);
    const nomeP = id => (ps.find(p => p.id === id) || {}).nome || 'Paciente';
    const hr = new Date().getHours();
    const saud = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
    const rasc = cs.filter(c => c.status === 'rascunho');
    const hojeN = cs.filter(c => new Date(c.data) >= hoje()).length;
    const ult = cs.filter(c => c.status === 'finalizada').slice(0, 6);
    const linha = c => { const cl = clinicaPorId(c.clinica_id); return `<li><a class="row" href="#consulta-${esc(c.id)}"><span class="avatar" aria-hidden="true">${esc(iniciais(nomeP(c.paciente_id)))}</span><span class="grow"><span class="title">${esc(nomeP(c.paciente_id))}</span><span class="meta"><span>${fmtData(c.data)} · ${fmtHora(c.data)}</span><span>${esc(cl ? cl.nome : '')}</span><span>${esc(c.tipo)}</span></span></span>${c.status === 'rascunho' ? '<span class="chip warn">Em andamento</span>' : ''}${ICON.chev.replace('<svg', '<svg class="chev"')}</a></li>`; };
    main.innerHTML = `
      <section class="hello">
        <div>
          <p class="muted small">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>${saud}, ${esc(nomeMedica())}</h1>
          <p class="lead">${rasc.length ? `Você tem ${rasc.length} ${rasc.length === 1 ? 'consulta em andamento' : 'consultas em andamento'}.` : 'Tudo em dia. Pronta para a próxima paciente?'}</p>
          <div class="actions" style="margin-top:1rem">
            <button class="btn btn-primary" data-x="nova-consulta">${ICON.plus}Nova consulta</button>
            <button class="btn btn-ghost" data-x="nova-paciente">Cadastrar paciente</button>
          </div>
        </div>
        <img src="${A['logo-symbol']}" alt="">
      </section>
      <div class="stats" role="list">
        <div class="stat" role="listitem"><b>${ps.length}</b><span>pacientes</span></div>
        <div class="stat" role="listitem"><b>${hojeN}</b><span>consultas hoje</span></div>
        <div class="stat" role="listitem"><b>${S.clinicas.filter(c => c.ativa !== false).length}</b><span>clínicas</span></div>
      </div>
      ${!S.clinicas.length ? `<div class="alert info" style="margin-top:1rem">${ICON.alert}<p>Comece cadastrando as clínicas onde você atende — o nome delas sai no receituário. <a href="#clinicas">Cadastrar clínica</a></p></div>` : ''}
      ${rasc.length ? `<h2 class="rule">Em andamento</h2><ul class="list">${rasc.map(linha).join('')}</ul>` : ''}
      <h2 class="rule">Últimas consultas</h2>
      ${ult.length ? `<ul class="list">${ult.map(linha).join('')}</ul>` : `<div class="empty"><img src="${A['logo-symbol']}" alt=""><h3>Nenhuma consulta finalizada ainda</h3><p>As consultas finalizadas aparecem aqui, com acesso rápido ao prontuário e ao receituário.</p></div>`}`;
    main.querySelector('[data-x="nova-consulta"]').addEventListener('click', () => dialogoNovaConsulta());
    main.querySelector('[data-x="nova-paciente"]').addEventListener('click', () => dialogoPaciente(null, p => { location.hash = '#paciente-' + p.id; }));
  }

  /* =====================================================================
     Pacientes
     ===================================================================== */
  let filtroClinica = '';
  const FP_KEY = 'apv-filtros-pacientes';
  const FP_PADRAO = { busca: '', ordem: 'nome', clinica: '', periodo: '', convenio: '' };
  let FP = (() => { try { return { ...FP_PADRAO, ...JSON.parse(localStorage.getItem(FP_KEY) || '{}'), busca: '' }; } catch (e) { return { ...FP_PADRAO }; } })();
  const salvarFP = () => { try { localStorage.setItem(FP_KEY, JSON.stringify({ ...FP, busca: '' })); } catch (e) { /* sem armazenamento */ } };
  const ORDENS = [['nome', 'Nome (A–Z)'], ['nome_desc', 'Nome (Z–A)'], ['ultima', 'Última consulta (mais recente)'], ['ultima_antiga', 'Última consulta (mais antiga)'], ['clinica', 'Clínica (agrupar)'], ['idade', 'Idade (mais nova)'], ['idade_desc', 'Idade (mais velha)'], ['cadastro', 'Cadastro mais recente']];
  const PERIODOS = [['', 'Qualquer data'], ['30', 'Nos últimos 30 dias'], ['180', 'Nos últimos 6 meses'], ['365+', 'Há mais de 1 ano'], ['nunca', 'Nunca consultou']];

  async function viewPacientes(main) {
    main.innerHTML = `<div class="skeleton"></div>`;
    const ps = await pacientes(true);
    if (filtroClinica) { FP.clinica = filtroClinica; filtroClinica = ''; }
    if (FP.clinica && !S.clinicas.some(c => c.id === FP.clinica)) FP.clinica = '';
    const convenios = [...new Set(ps.map(p => (p.convenio || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (FP.convenio && !convenios.includes(FP.convenio)) FP.convenio = '';
    const sel = (id, rot, opts, val) => campo(rot, `<select id="${id}">${opts.map(([v, t]) => `<option value="${esc(v)}" ${v === val ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`);
    main.innerHTML = `
      <div class="page-head"><div><h1>Pacientes</h1><p class="muted small">${ps.length} ${ps.length === 1 ? 'paciente cadastrada' : 'pacientes cadastradas'}</p></div>
        <button class="btn btn-primary" data-x="nova">${ICON.plus}Nova paciente</button></div>
      <section class="card filtros" aria-label="Busca e filtros">
        <div class="search"><label class="sr-only" for="busca">Buscar paciente</label>${ICON.search}<input id="busca" type="search" placeholder="Buscar por nome, CPF, telefone, e-mail ou convênio" autocomplete="off" value="${esc(FP.busca)}"></div>
        <div class="filtros-grid">
          ${sel('f-ordem', 'Ordenar por', ORDENS, FP.ordem)}
          ${sel('f-clinica', 'Clínica', [['', 'Todas as clínicas'], ...S.clinicas.map(c => [c.id, c.nome]), ['__sem', 'Sem clínica vinculada']], FP.clinica)}
          ${sel('f-periodo', 'Última consulta', PERIODOS, FP.periodo)}
          ${sel('f-convenio', 'Convênio', [['', 'Todos'], ...convenios.map(c => [c, c])], FP.convenio)}
        </div>
        <div class="filtros-foot"><p class="small muted" id="res-count" aria-live="polite"></p><button type="button" class="btn btn-quiet" data-x="limpar">Limpar filtros</button></div>
      </section>
      <div id="lista-p"></div>`;
    const lista = $('#lista-p', main), busca = $('#busca', main);
    const agoraMs = Date.now(), DIA = 864e5;
    const idadeAnos = p => { if (!p.data_nascimento) return null; const d = new Date(p.data_nascimento + 'T12:00:00'); return (agoraMs - d) / (365.25 * DIA); };
    const linha = p => `<li><a class="row" href="#paciente-${esc(p.id)}"><span class="avatar" aria-hidden="true">${esc(iniciais(p.nome))}</span><span class="grow"><span class="title">${esc(p.nome)}</span><span class="meta">${idade(p.data_nascimento) ? `<span>${idade(p.data_nascimento)}</span>` : ''}${p.convenio ? `<span>${esc(p.convenio)}</span>` : ''}${p.ultima ? `<span>Última consulta ${fmtData(p.ultima)}</span>` : '<span>Sem consultas</span>'}</span>${p.clinicas.length ? `<span class="chips">${p.clinicas.map(id => clinicaPorId(id)).filter(Boolean).map(c => `<span class="chip">${esc(c.nome)}</span>`).join('')}</span>` : ''}</span>${ICON.chev.replace('<svg', '<svg class="chev"')}</a></li>`;
    const desenhar = () => {
      FP.busca = busca.value; salvarFP();
      const q = norm(FP.busca).trim(); const qd = q.replace(/\D/g, '');
      let fs = ps.filter(p => {
        if (q && !(norm(p.nome).includes(q) || norm(p.nome_social).includes(q) || norm(p.email).includes(q) || norm(p.convenio).includes(q) || (qd.length >= 3 && ((p.cpf || '').replace(/\D/g, '').includes(qd) || (p.telefone || '').replace(/\D/g, '').includes(qd))))) return false;
        if (FP.clinica === '__sem' ? p.clinicas.length : FP.clinica && !p.clinicas.includes(FP.clinica)) return false;
        if (FP.convenio && (p.convenio || '').trim() !== FP.convenio) return false;
        if (FP.periodo) {
          const dias = p.ultima ? (agoraMs - new Date(p.ultima)) / DIA : null;
          if (FP.periodo === 'nunca') { if (dias !== null) return false; }
          else if (FP.periodo === '365+') { if (dias === null || dias <= 365) return false; }
          else if (dias === null || dias > +FP.periodo) return false;
        }
        return true;
      });
      const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');
      const porData = (k, dir) => (a, b) => { const x = a[k] || '', y = b[k] || ''; if (!x && !y) return porNome(a, b); if (!x) return 1; if (!y) return -1; return dir * x.localeCompare(y) || porNome(a, b); };
      const porIdade = dir => (a, b) => { const x = idadeAnos(a), y = idadeAnos(b); if (x === null && y === null) return porNome(a, b); if (x === null) return 1; if (y === null) return -1; return dir * (x - y) || porNome(a, b); };
      const ord = { nome: porNome, nome_desc: (a, b) => -porNome(a, b), ultima: porData('ultima', -1), ultima_antiga: porData('ultima', 1), idade: porIdade(1), idade_desc: porIdade(-1), cadastro: porData('criado_em', -1), clinica: porNome }[FP.ordem] || porNome;
      fs = fs.sort(ord);
      const ativos = [FP.busca.trim(), FP.clinica, FP.periodo, FP.convenio].filter(Boolean).length;
      $('#res-count', main).textContent = ps.length ? `${fs.length} de ${ps.length} ${ps.length === 1 ? 'paciente' : 'pacientes'}${ativos ? ` · ${ativos} ${ativos === 1 ? 'filtro ativo' : 'filtros ativos'}` : ''}` : '';
      main.querySelector('[data-x="limpar"]').hidden = !ativos;
      if (!ps.length) { lista.innerHTML = `<div class="empty"><img src="${A['logo-symbol']}" alt=""><h3>Nenhuma paciente ainda</h3><p>Cadastre a primeira paciente e vincule às clínicas onde ela é atendida.</p><button class="btn btn-primary" data-x="nova2">${ICON.plus}Cadastrar paciente</button></div>`; lista.querySelector('[data-x="nova2"]').addEventListener('click', nova); return; }
      if (!fs.length) { lista.innerHTML = `<div class="empty"><h3>Nenhuma paciente encontrada</h3><p>Confira a grafia da busca ou limpe os filtros.</p></div>`; return; }
      if (FP.ordem === 'clinica') {
        const grupos = S.clinicas.map(c => [c.nome, fs.filter(p => p.clinicas.includes(c.id))]).filter(g => g[1].length);
        const sem = fs.filter(p => !p.clinicas.length); if (sem.length) grupos.push(['Sem clínica vinculada', sem]);
        lista.innerHTML = grupos.map(([n, l]) => `<h2 class="rule">${esc(n)} <span class="muted">(${l.length})</span></h2><ul class="list">${l.map(linha).join('')}</ul>`).join('') + (grupos.length > 1 ? `<p class="small muted" style="margin-top:12px">Pacientes atendidas em mais de uma clínica aparecem em cada uma delas.</p>` : '');
      } else lista.innerHTML = `<ul class="list">${fs.map(linha).join('')}</ul>`;
    };
    const nova = () => dialogoPaciente(null, p => { location.hash = '#paciente-' + p.id; });
    busca.addEventListener('input', desenhar);
    [['#f-ordem', 'ordem'], ['#f-clinica', 'clinica'], ['#f-periodo', 'periodo'], ['#f-convenio', 'convenio']].forEach(([id, k]) => $(id, main).addEventListener('change', e => { FP[k] = e.target.value; desenhar(); }));
    main.querySelector('[data-x="limpar"]').addEventListener('click', () => { FP = { ...FP_PADRAO, ordem: FP.ordem }; busca.value = ''; ['#f-clinica', '#f-periodo', '#f-convenio'].forEach(id => { $(id, main).value = ''; }); desenhar(); busca.focus(); });
    main.querySelector('[data-x="nova"]').addEventListener('click', nova);
    desenhar();
  }

  function dialogoPaciente(p, depois) {
    const novo = !p; p = p || { sexo: 'F', clinicas: FP.clinica && FP.clinica !== '__sem' ? [FP.clinica] : (S.clinicas.length === 1 ? [S.clinicas[0].id] : []) };
    const cls = S.clinicas;
    const corpo = `<form id="f-pac" class="grid grid-2" novalidate>
      ${campo('Nome completo *', `<input id="p-nome" name="nome" value="${esc(p.nome)}" autocomplete="off" required>`, 'span-all')}
      ${campo('Nome social', `<input id="p-ns" name="nome_social" value="${esc(p.nome_social)}" autocomplete="off">`)}
      ${campo('Data de nascimento', `<input id="p-dn" name="data_nascimento" type="date" value="${esc(p.data_nascimento)}" max="${new Date().toISOString().slice(0, 10)}">`)}
      ${campo('Sexo', `<select id="p-sexo" name="sexo"><option value="F" ${p.sexo !== 'M' && p.sexo !== 'O' ? 'selected' : ''}>Feminino</option><option value="M" ${p.sexo === 'M' ? 'selected' : ''}>Masculino</option><option value="O" ${p.sexo === 'O' ? 'selected' : ''}>Outro</option></select>`)}
      ${campo('CPF', `<input id="p-cpf" name="cpf" value="${esc(p.cpf)}" inputmode="numeric" autocomplete="off" maxlength="14">`)}
      ${campo('Telefone / WhatsApp', `<input id="p-tel" name="telefone" type="tel" value="${esc(p.telefone)}" inputmode="tel" autocomplete="off">`)}
      ${campo('E-mail', `<input id="p-email" name="email" type="email" value="${esc(p.email)}" inputmode="email" autocomplete="off">`)}
      ${campo('Convênio', `<input id="p-conv" name="convenio" value="${esc(p.convenio)}" placeholder="Particular, plano…">`)}
      ${campo('Nº da carteirinha', `<input id="p-cart" name="carteirinha" value="${esc(p.carteirinha)}">`)}
      ${campo('Profissão', `<input id="p-prof" name="profissao" value="${esc(p.profissao)}">`)}
      ${campo('Endereço', `<input id="p-end" name="endereco" value="${esc(p.endereco)}" autocomplete="off">`, 'span-all')}
      ${campo('Cidade', `<input id="p-cid" name="cidade" value="${esc(p.cidade)}">`)}
      ${campo('UF', `<select id="p-uf" name="uf"><option value=""></option>${UFS.map(u => `<option ${u === p.uf ? 'selected' : ''}>${u}</option>`).join('')}</select>`)}
      <fieldset class="span-all" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:6px">Clínicas onde é atendida *</legend>
        ${cls.length ? `<div class="checks">${cls.map(c => `<label class="check"><input type="checkbox" name="clin" data-multi value="${esc(c.id)}" ${p.clinicas.includes(c.id) ? 'checked' : ''}> ${esc(c.nome)}</label>`).join('')}</div><p class="err" id="p-cl-err" hidden>Marque ao menos uma clínica.</p>` : `<div class="alert">${ICON.alert}<p>Nenhuma clínica cadastrada. <a href="#clinicas" data-close>Cadastre uma clínica</a> antes de vincular pacientes.</p></div>`}
      </fieldset>
      <div class="span-all">${areaTexto('p-alerg', 'alergias', p.alergias, { rot: 'Alergias', linhas: 2, ph: 'Ex.: dipirona, látex' })}</div>
      <div class="span-all">${areaTexto('p-ant', 'antecedentes', p.antecedentes, { rot: 'Antecedentes pessoais e familiares', linhas: 3 })}</div>
      <div class="span-all">${areaTexto('p-med', 'medicacoes_uso', p.medicacoes_uso, { rot: 'Medicações em uso', linhas: 2 })}</div>
      <div class="span-all">${areaTexto('p-obs', 'observacoes', p.observacoes, { rot: 'Observações', linhas: 2 })}</div>
    </form>`;
    abrirDialogo({
      titulo: novo ? 'Nova paciente' : 'Editar ficha', corpo,
      rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>${novo ? 'Cadastrar' : 'Salvar'}</button>`,
      aoAbrir: (d, fechar) => {
        d.querySelector('#p-cpf').addEventListener('input', e => { const v = e.target.value.replace(/\D/g, '').slice(0, 11); e.target.value = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); });
        d.querySelector('[data-ok]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
          const f = d.querySelector('#f-pac'); const v = lerForm(f);
          const clin = $$('input[name=clin]:checked', f).map(i => i.value);
          const nome = d.querySelector('#p-nome');
          let ok = true;
          if (!v.nome) { erroCampo(nome, 'Informe o nome da paciente.'); ok = false; } else erroCampo(nome);
          const ce = d.querySelector('#p-cl-err'); if (ce) ce.hidden = !!clin.length;
          if (cls.length && !clin.length) ok = false;
          if (!ok) { (d.querySelector('[aria-invalid="true"]') || d.querySelector('input[name=clin]')).focus(); return; }
          delete v.clin;
          try {
            const salvo = await DB.pacientes.save({ ...(novo ? {} : { id: p.id }), ...v }, clin);
            S.pacientes = null; toast(novo ? 'Paciente cadastrada.' : 'Ficha atualizada.'); fechar(); depois && depois(salvo);
          } catch (err) { falha(err); }
        }));
      }
    });
  }

  async function viewPaciente(main, id) {
    main.innerHTML = `<div class="skeleton"></div>`;
    const [p, cs] = await Promise.all([DB.pacientes.get(id), DB.consultas.list({ pacienteId: id })]);
    if (!p) { main.innerHTML = `<div class="empty"><h2>Paciente não encontrada</h2><p><a href="#pacientes">Voltar para pacientes</a></p></div>`; return; }
    let filtro = '';
    const clinsDasConsultas = [...new Set(cs.map(c => c.clinica_id))].map(clinicaPorId).filter(Boolean);
    const fato = (rot, v) => v ? `<div class="fact"><span class="label">${rot}</span><div class="v">${esc(v)}</div></div>` : '';
    main.innerHTML = `
      <a class="back" href="#pacientes">${ICON.back}Pacientes</a>
      <section class="card">
        <div class="pac-head"><span class="avatar" aria-hidden="true">${esc(iniciais(p.nome))}</span>
          <div><h1 class="wrap-any" style="font-size:clamp(1.7rem,1.3rem + 1.5vw,2.3rem)">${esc(p.nome)}</h1>
            <p class="muted small">${[p.nome_social ? `Nome social: ${p.nome_social}` : '', idade(p.data_nascimento), p.data_nascimento ? `nasc. ${fmtData(p.data_nascimento)}` : '', p.convenio].filter(Boolean).map(esc).join(' · ')}</p></div></div>
        ${p.clinicas.length ? `<div class="chips" style="margin-top:12px">${p.clinicas.map(clinicaPorId).filter(Boolean).map(c => `<span class="chip">${esc(c.nome)}</span>`).join('')}</div>` : ''}
        ${temAlergia(p.alergias) ? `<div class="alert danger" style="margin-top:16px">${ICON.alert}<p><b>Alergias:</b> ${esc(p.alergias)}</p></div>` : ''}
        <div class="pac-facts">${fato('Telefone', p.telefone)}${fato('E-mail', p.email)}${fato('CPF', p.cpf)}${fato('Carteirinha', p.carteirinha)}${fato('Profissão', p.profissao)}${fato('Endereço', [p.endereco, [p.cidade, p.uf].filter(Boolean).join('/')].filter(Boolean).join(' — '))}${fato('Antecedentes', p.antecedentes)}${fato('Medicações em uso', p.medicacoes_uso)}${fato('Observações', p.observacoes)}</div>
        <div class="actions" style="margin-top:20px"><button class="btn btn-primary" data-x="nova">${ICON.plus}Nova consulta</button><button class="btn btn-ghost" data-x="editar">Editar ficha</button></div>
      </section>
      <div class="page-head" style="margin:2rem 0 .5rem"><h2>Consultas</h2><span class="muted small">${cs.length} ${cs.length === 1 ? 'registro' : 'registros'}</span></div>
      ${clinsDasConsultas.length > 1 ? `<div class="filter-chips" role="group" aria-label="Filtrar consultas por clínica"><button type="button" data-f="" aria-pressed="true">Todas</button>${clinsDasConsultas.map(c => `<button type="button" data-f="${esc(c.id)}" aria-pressed="false">${esc(c.nome)}</button>`).join('')}</div>` : ''}
      <div id="tl"></div>`;
    const tl = $('#tl', main);
    const desenhar = () => {
      const lst = cs.filter(c => !filtro || c.clinica_id === filtro);
      if (!lst.length) { tl.innerHTML = `<div class="empty" style="margin-top:12px"><h3>Nenhuma consulta registrada</h3><p>Inicie a primeira consulta desta paciente — o prontuário fica guardado aqui, por data e por clínica.</p></div>`; return; }
      let ano = null, html = '';
      lst.forEach(c => {
        const y = new Date(c.data).getFullYear();
        if (y !== ano) { if (ano !== null) html += '</ol>'; html += `<p class="year">${y}</p><ol class="timeline">`; ano = y; }
        const cl = clinicaPorId(c.clinica_id); const r = c.registro || {};
        const resumo = r.hipotese || r.motivo || '';
        html += `<li class="${c.status}"><a class="row" href="#consulta-${esc(c.id)}"><span class="grow"><span class="title">${fmtCurta(c.data)} · ${esc(c.tipo)}</span><span class="meta"><span>${fmtHora(c.data)}</span><span>${esc(cl ? cl.nome : '')}</span>${(c.prescricao || []).length ? `<span>${c.prescricao.length} ${c.prescricao.length === 1 ? 'medicamento' : 'medicamentos'}</span>` : ''}</span>${resumo ? `<span class="small wrap-any">${esc(resumo.length > 140 ? resumo.slice(0, 140) + '…' : resumo)}</span>` : ''}</span>${c.status === 'rascunho' ? '<span class="chip warn">Em andamento</span>' : '<span class="chip ok">Finalizada</span>'}</a></li>`;
      });
      tl.innerHTML = html + '</ol>';
    };
    $$('[data-f]', main).forEach(b => b.addEventListener('click', () => { filtro = b.dataset.f; $$('[data-f]', main).forEach(x => x.setAttribute('aria-pressed', String(x === b))); desenhar(); }));
    main.querySelector('[data-x="nova"]').addEventListener('click', () => dialogoNovaConsulta(p));
    main.querySelector('[data-x="editar"]').addEventListener('click', () => dialogoPaciente(p, () => viewPaciente(main, id)));
    desenhar();
  }

  /* ---------------- nova consulta ---------------- */
  async function dialogoNovaConsulta(pac) {
    if (!S.clinicas.length) { toast('Cadastre primeiro uma clínica.', true); location.hash = '#clinicas'; return; }
    const ps = pac ? null : await pacientes(true);
    let escolhida = pac || null;
    const opcoesClinica = p => {
      const vinc = p ? S.clinicas.filter(c => p.clinicas.includes(c.id)) : [];
      const outras = S.clinicas.filter(c => !vinc.includes(c) && c.ativa !== false);
      return `${vinc.map(c => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join('')}${outras.length && vinc.length ? '<option disabled>──────────</option>' : ''}${outras.map(c => `<option value="${esc(c.id)}">${esc(c.nome)}${p && vinc.length ? ' (vincular)' : ''}</option>`).join('')}`;
    };
    const corpo = `<div class="stack">
      ${pac ? `<div class="summary-card"><span class="label">Paciente</span><div><b>${esc(pac.nome)}</b></div></div>` : `
        <div class="field"><label class="label" for="nc-busca">Paciente</label><div class="search">${ICON.search}<input id="nc-busca" type="search" placeholder="Digite o nome" autocomplete="off" autofocus></div></div>
        <div id="nc-res" aria-live="polite"></div>`}
      <div id="nc-det" ${pac ? '' : 'hidden'} class="grid grid-2">
        ${campo('Clínica', `<select id="nc-cl">${opcoesClinica(pac)}</select>`)}
        ${campo('Tipo', `<select id="nc-tipo">${TIPOS.map(t => `<option ${t === 'Consulta' ? 'selected' : ''}>${t}</option>`).join('')}</select>`)}
        ${campo('Data e hora', `<input id="nc-data" type="datetime-local" value="${toLocalInput()}">`, 'span-all')}
      </div></div>`;
    abrirDialogo({
      titulo: 'Nova consulta', corpo,
      rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok ${pac ? '' : 'disabled'}>Iniciar consulta</button>`,
      aoAbrir: (d, fechar) => {
        const ok = d.querySelector('[data-ok]');
        const sel = p => { escolhida = p; d.querySelector('#nc-res').innerHTML = `<div class="summary-card"><span class="label">Paciente</span><div class="actions" style="align-items:center;justify-content:space-between"><b>${esc(p.nome)}</b><button class="btn btn-quiet" type="button" data-trocar>Trocar</button></div></div>`; d.querySelector('#nc-busca').closest('.field').hidden = true; d.querySelector('#nc-det').hidden = false; d.querySelector('#nc-cl').innerHTML = opcoesClinica(p); ok.disabled = false; d.querySelector('[data-trocar]').addEventListener('click', () => { escolhida = null; ok.disabled = true; d.querySelector('#nc-busca').closest('.field').hidden = false; d.querySelector('#nc-det').hidden = true; d.querySelector('#nc-res').innerHTML = ''; d.querySelector('#nc-busca').focus(); }); };
        if (!pac) {
          const inp = d.querySelector('#nc-busca'), res = d.querySelector('#nc-res');
          const draw = () => {
            const q = norm(inp.value).trim();
            const m = (q ? ps.filter(p => norm(p.nome).includes(q)) : ps).slice(0, 6);
            res.innerHTML = `<ul class="list">${m.map(p => `<li><button type="button" class="row" data-pid="${esc(p.id)}"><span class="avatar" aria-hidden="true">${esc(iniciais(p.nome))}</span><span class="grow"><span class="title">${esc(p.nome)}</span><span class="meta">${esc(idade(p.data_nascimento))}</span></span></button></li>`).join('')}<li><button type="button" class="row" data-novap><span class="avatar" aria-hidden="true">+</span><span class="grow"><span class="title">Cadastrar nova paciente${q ? `: “${esc(inp.value.trim())}”` : ''}</span></span></button></li></ul>`;
            $$('[data-pid]', res).forEach(b => b.addEventListener('click', () => sel(ps.find(p => p.id === b.dataset.pid))));
            res.querySelector('[data-novap]').addEventListener('click', () => { fechar(); dialogoPaciente({ nome: inp.value.trim(), sexo: 'F', clinicas: S.clinicas.length === 1 ? [S.clinicas[0].id] : [] }, np => { S.pacientes = null; dialogoNovaConsulta(np); }); setTimeout(() => { const t = $('dialog .dlg-head h2'); if (t) t.textContent = 'Nova paciente'; }, 0); });
          };
          inp.addEventListener('input', draw); draw();
        }
        ok.addEventListener('click', e => ocupado(e.currentTarget, async () => {
          try {
            const clinica_id = d.querySelector('#nc-cl').value;
            const dt = d.querySelector('#nc-data').value;
            if (!escolhida.clinicas.includes(clinica_id)) await DB.pacientes.vincular(escolhida.id, clinica_id);
            const auto = textosAutomaticos();
            const orientAuto = auto.orientacoes || ''; delete auto.orientacoes;
            const c = await DB.consultas.save({ paciente_id: escolhida.id, clinica_id, tipo: d.querySelector('#nc-tipo').value, data: dt ? new Date(dt).toISOString() : new Date().toISOString(), status: 'rascunho', registro: { incluir_orientacoes: true, ...auto }, prescricao: [], exames: [], orientacoes: orientAuto, adendos: [] });
            S.pacientes = null; fechar(); location.hash = '#consulta-' + c.id;
          } catch (err) { falha(err); }
        }));
      }
    });
  }

  /* =====================================================================
     Consulta (prontuário)
     ===================================================================== */
  let C = null, CP = null, salvarTimer = null, salvando = null, sujo = false;
  function marcarSalvo(st, txt) { const el = $('#savestate'); if (!el) return; el.className = 'savestate ' + st; el.textContent = txt; }
  function agendarSalvar() { sujo = true; marcarSalvo('saving', 'Salvando…'); clearTimeout(salvarTimer); salvarTimer = setTimeout(salvarAgora, 900); }
  async function salvarAgora() {
    clearTimeout(salvarTimer); if (!C || !sujo || C.status !== 'rascunho') return;
    sujo = false;
    const snap = JSON.parse(JSON.stringify(C));
    salvando = DB.consultas.save({ id: snap.id, paciente_id: snap.paciente_id, clinica_id: snap.clinica_id, data: snap.data, tipo: snap.tipo, registro: snap.registro, prescricao: snap.prescricao, exames: snap.exames, orientacoes: snap.orientacoes })
      .then(() => marcarSalvo('', `Salvo às ${fmtHora(new Date().toISOString())}`))
      .catch(e => { sujo = true; marcarSalvo('error', 'Não salvo — sem conexão? Tentando de novo…'); clearTimeout(salvarTimer); salvarTimer = setTimeout(salvarAgora, 5000); console.error(e); });
    await salvando; salvando = null;
  }
  async function salvarPendente() { if (sujo) await salvarAgora(); else if (salvando) await salvando; }
  window.addEventListener('beforeunload', e => { if (sujo || salvando) { salvarAgora(); e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') salvarAgora(); });

  const SECOES = [
    ['s-queixa', 'Queixa e história', r => r.motivo || r.hda],
    ['s-gineco', 'Ginecológico e obstétrico', r => r.dum || r.ciclo || r.menarca || r.gestacoes || r.contracepcao || r.tentante || r.preventivo || r.gineco_obs],
    ['s-exame', 'Exame físico', r => r.pa || r.peso || r.exame_fisico || r.exame_gineco],
    ['s-result', 'Exames e resultados', r => r.resultados],
    ['s-aval', 'Avaliação e conduta', r => r.hipotese || r.conduta],
    ['s-rx', 'Prescrição', (r, c) => (c.prescricao || []).length || c.orientacoes],
    ['s-exsol', 'Solicitação de exames', (r, c) => (c.exames || []).length],
    ['s-atest', 'Atestado', r => r.atestado]
  ];

  async function viewConsulta(main, id) {
    main.innerHTML = `<div class="skeleton"></div>`;
    C = await DB.consultas.get(id);
    if (!C) { main.innerHTML = `<div class="empty"><h2>Consulta não encontrada</h2><p><a href="#inicio">Voltar ao início</a></p></div>`; return; }
    C.registro = C.registro || {}; C.prescricao = C.prescricao || []; C.exames = C.exames || []; C.adendos = C.adendos || [];
    CP = await DB.pacientes.get(C.paciente_id);
    if (C.status === 'finalizada') return leituraConsulta(main);
    edicaoConsulta(main);
  }

  function cabecalhoConsulta(extra) {
    const cl = clinicaPorId(C.clinica_id);
    return `<a class="back" href="#paciente-${esc(C.paciente_id)}">${ICON.back}Ficha da paciente</a>
      <div class="sticky-ctx"><div class="who"><b>${esc(CP.nome)}</b><span class="muted small">${[idade(CP.data_nascimento), cl ? cl.nome : '', `${fmtData(C.data)} · ${fmtHora(C.data)}`].filter(Boolean).map(esc).join(' · ')}</span></div>${extra}</div>`;
  }
  function resumoFicha() {
    const itens = [['Alergias', CP.alergias], ['Antecedentes', CP.antecedentes], ['Medicações em uso', CP.medicacoes_uso]].filter(x => x[1]);
    return `<div class="summary-card" id="resumo-ficha">${temAlergia(CP.alergias) ? `<p class="chip danger" style="margin-bottom:8px">Alergias: ${esc(CP.alergias)}</p>` : ''}
      ${itens.length ? `<dl>${itens.filter(x => x[0] !== 'Alergias' || !temAlergia(x[1])).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '<p class="muted small">Sem alergias, antecedentes ou medicações registrados na ficha.</p>'}
      <button class="btn btn-quiet" type="button" data-x="ficha" style="margin-top:6px;padding-left:0">Editar ficha da paciente</button></div>`;
  }

  function edicaoConsulta(main) {
    const r = C.registro;
    const v = k => esc(r[k] || '');
    const inp = (rot, k, attrs = '') => campo(rot, `<input id="r-${k}" name="registro.${k}" value="${v(k)}" ${attrs}>`);
    const sec = (i, corpo) => { const [id, tit, fn] = SECOES[i]; return `<details class="sec" id="${id}" ${[0, 4, 5].includes(i) || fn(r, C) ? 'open' : ''}><summary><span class="num" aria-hidden="true">${i + 1}</span><h2>${tit}</h2>${ICON.down.replace('<svg', '<svg class="tog"')}</summary><div class="body">${corpo}</div></details>`; };
    main.innerHTML = `
      ${cabecalhoConsulta(`<span id="savestate" class="savestate" role="status">Rascunho salvo</span>`)}
      <div class="consulta-grid">
        <nav class="secnav" aria-label="Seções da consulta">${SECOES.map(([id, t]) => `<a href="#${id}" data-sec="${id}"><span class="dot" aria-hidden="true"></span>${t}</a>`).join('')}</nav>
        <form id="f-consulta" novalidate autocomplete="off">
          <div class="card" style="margin-bottom:12px">
            <div class="grid grid-3">
              ${campo('Clínica', `<select id="c-cl" name="clinica_id">${S.clinicas.filter(c => c.ativa !== false || c.id === C.clinica_id).map(c => `<option value="${esc(c.id)}" ${c.id === C.clinica_id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>`)}
              ${campo('Tipo', `<select id="c-tipo" name="tipo">${[...new Set([...TIPOS, C.tipo])].map(t => `<option ${t === C.tipo ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`)}
              ${campo('Data e hora', `<input id="c-data" name="data" type="datetime-local" value="${toLocalInput(C.data)}">`)}
            </div>
            <div style="margin-top:12px">${resumoFicha()}</div>
          </div>
          ${sec(0, `<div class="stack">${areaTexto('r-motivo', 'registro.motivo', r.motivo, { rot: 'Queixa principal / motivo da consulta', linhas: 2 })}${areaTexto('r-hda', 'registro.hda', r.hda, { rot: 'História da doença atual', linhas: 5 })}</div>`)}
          ${sec(1, `<div class="grid grid-3">
              ${campo('DUM', `<input id="r-dum" name="registro.dum" type="date" value="${v('dum')}">`)}
              ${inp('Ciclo menstrual', 'ciclo', 'placeholder="Ex.: regular, 28/5 dias"')}
              ${inp('Menarca', 'menarca', 'placeholder="Idade"')}
            </div>
            <p class="label" style="margin:16px 0 6px">Gestações, partos e abortos</p>
            <div class="gpa">${[['G', 'gestacoes', 'Gestações'], ['PN', 'partos', 'Partos normais'], ['C', 'cesareas', 'Cesáreas'], ['A', 'abortos', 'Abortos']].map(([s, k, t]) => campo(`<abbr title="${t}">${s}</abbr> <span class="sr-only">${t}</span>`, `<input id="r-${k}" name="registro.${k}" value="${v(k)}" inputmode="numeric" maxlength="2">`)).join('')}</div>
            <div class="grid grid-2" style="margin-top:12px">
              ${inp('Método contraceptivo', 'contracepcao')}
              ${inp('Tempo tentando engravidar', 'tentante', 'placeholder="Ex.: 14 meses"')}
              ${inp('Último preventivo (citologia)', 'preventivo')}
              ${inp('Última mamografia / USG de mamas', 'mamografia')}
            </div>
            <div style="margin-top:12px">${areaTexto('r-gobs', 'registro.gineco_obs', r.gineco_obs, { rot: 'Outras informações ginecológicas e obstétricas', linhas: 3 })}</div>`)}
          ${sec(2, `<div class="vitals">
              ${inp('PA (mmHg)', 'pa', 'placeholder="120x80" inputmode="numeric"')}
              ${inp('FC (bpm)', 'fc', 'inputmode="numeric"')}
              ${inp('Peso (kg)', 'peso', 'inputmode="decimal"')}
              ${inp('Altura (m)', 'altura', 'inputmode="decimal" placeholder="1,65"')}
              ${campo('IMC', `<input id="r-imc" value="" readonly tabindex="-1" aria-live="polite">`)}
            </div>
            <div class="stack" style="margin-top:12px">${areaTexto('r-ef', 'registro.exame_fisico', r.exame_fisico, { rot: 'Exame físico geral e mamas', linhas: 3 })}${areaTexto('r-eg', 'registro.exame_gineco', r.exame_gineco, { rot: 'Exame ginecológico (especular e toque)', linhas: 3 })}</div>`)}
          ${sec(3, areaTexto('r-res', 'registro.resultados', r.resultados, { rot: 'Resultados de exames trazidos (laboratório, ultrassom, outros)', linhas: 5 }))}
          ${sec(4, `<div class="grid grid-3">
              <div class="span-2">${inp('Hipótese diagnóstica', 'hipotese')}</div>
              ${inp('CID-10', 'cid', 'placeholder="Ex.: N97.9" maxlength="8" style="text-transform:uppercase"')}
            </div>
            <div class="stack" style="margin-top:12px">${areaTexto('r-cond', 'registro.conduta', r.conduta, { rot: 'Conduta e plano', linhas: 4 })}${inp('Retorno', 'retorno', 'placeholder="Ex.: 30 dias, com exames"')}</div>`)}
          ${sec(5, `<datalist id="fav-list">${S.favoritos.map(f => `<option value="${esc(f.nome)}">${esc(f.apresentacao)}</option>`).join('')}</datalist>
            <ol class="rx-list" id="rx-list"></ol>
            <div class="actions" style="margin:12px 0 4px"><button type="button" class="btn btn-ghost" data-x="rx-add">${ICON.plus}Adicionar medicamento</button><button type="button" class="btn btn-ghost" data-x="usar-modelo" data-tipo="prescricao">${ICON.layers}Usar modelo</button>${S.favoritos.length ? `<button type="button" class="btn btn-quiet" data-x="rx-fav">${ICON.star}Usar favorito</button>` : ''}<button type="button" class="btn btn-quiet" data-x="salvar-modelo" data-tipo="prescricao">Salvar como modelo</button></div>
            <div style="margin-top:16px">${areaTexto('c-orient', 'orientacoes', C.orientacoes, { rot: 'Orientações à paciente (saem no receituário)', linhas: 4, ph: 'Uma orientação por linha. Comece com “-” para virar tópico.' })}</div>
            <label class="check"><input type="checkbox" name="registro.incluir_orientacoes" ${r.incluir_orientacoes !== false ? 'checked' : ''}> Incluir as orientações no receituário</label>
            <div class="actions" style="margin-top:12px"><button type="button" class="btn btn-primary" data-x="pdf-rx">${ICON.doc}Gerar receituário</button></div>`)}
          ${sec(6, `<ul class="ex-list" id="ex-list"></ul>
            <div class="actions"><button type="button" class="btn btn-ghost" data-x="ex-add">${ICON.plus}Adicionar exame</button><button type="button" class="btn btn-ghost" data-x="usar-modelo" data-tipo="exames">${ICON.layers}Usar modelo</button><button type="button" class="btn btn-quiet" data-x="salvar-modelo" data-tipo="exames">Salvar como modelo</button></div>
            <div style="margin-top:16px">${areaTexto('r-ind', 'registro.indicacao_exames', r.indicacao_exames, { rot: 'Indicação clínica', linhas: 2 })}</div>
            <div class="actions" style="margin-top:12px"><button type="button" class="btn btn-primary" data-x="pdf-ex">${ICON.doc}Gerar solicitação de exames</button></div>`)}
          ${sec(7, `<div class="actions" style="margin-bottom:12px"><button type="button" class="btn btn-ghost" data-x="usar-modelo" data-tipo="atestado">${ICON.layers}Usar modelo de atestado</button><button type="button" class="btn btn-quiet" data-x="salvar-modelo" data-tipo="atestado">Salvar como modelo</button></div>
            <div class="stack">
              ${campo('Título do documento', `<input id="r-atestado_titulo" name="registro.atestado_titulo" value="${v('atestado_titulo') || 'Atestado médico'}">`)}
              ${areaTexto('r-atest', 'registro.atestado', r.atestado, { rot: 'Texto do atestado', linhas: 5, padrao: false, ph: 'Escolha um modelo ou escreva o texto.' })}
              <div class="grid grid-2">
                ${inp('CID-10 (opcional)', 'atestado_cid', 'maxlength="8" style="text-transform:uppercase"')}
                <label class="check" style="align-self:end"><input type="checkbox" name="registro.atestado_cid_aut" ${r.atestado_cid_aut ? 'checked' : ''}> A paciente autorizou constar o CID</label>
              </div>
              <p class="small muted">O CID só sai no atestado com a autorização expressa da paciente (Resolução CFM 2.381/2024). Sem a marcação acima, ele é omitido.</p>
            </div>
            <div class="actions" style="margin-top:12px"><button type="button" class="btn btn-primary" data-x="pdf-at">${ICON.doc}Gerar atestado</button></div>`)}
          <div class="bottombar">
            <button type="button" class="btn btn-ghost" data-x="pdf-rx">${ICON.doc}Receituário</button>
            <button type="button" class="btn btn-primary" data-x="finalizar">${ICON.check}Finalizar consulta</button>
          </div>
          <p style="margin-top:16px;text-align:center"><button type="button" class="btn btn-quiet small" data-x="excluir">Excluir este rascunho</button></p>
        </form>
      </div>`;
    const f = $('#f-consulta', main);
    desenharRx(); desenharEx(); calcIMC(); marcarSecoes();

    f.addEventListener('input', e => {
      const el = e.target;
      if (el.dataset.rx != null) { const it = C.prescricao[+el.dataset.rx]; if (el.type === 'checkbox') it[el.dataset.k] = el.checked; else it[el.dataset.k] = el.value; }
      else if (el.dataset.ex != null) C.exames[+el.dataset.ex].nome = el.value;
      else if (el.name && el.name.startsWith('registro.')) { const k = el.name.slice(9); C.registro[k] = el.type === 'checkbox' ? el.checked : el.value; if (k === 'peso' || k === 'altura') calcIMC(); }
      else if (el.name === 'orientacoes') C.orientacoes = el.value;
      else if (el.name === 'tipo') C.tipo = el.value;
      else if (el.name === 'data') { if (el.value) C.data = new Date(el.value).toISOString(); }
      else if (el.name === 'clinica_id') { C.clinica_id = el.value; if (!CP.clinicas.includes(el.value)) DB.pacientes.vincular(CP.id, el.value).then(() => CP.clinicas.push(el.value)).catch(falha); }
      else return;
      agendarSalvar(); marcarSecoes();
    });
    f.addEventListener('change', e => {
      const el = e.target;
      if (el.dataset.rx != null && el.dataset.k === 'nome') {
        const it = C.prescricao[+el.dataset.rx];
        const fav = S.favoritos.find(x => norm(x.nome) === norm(it.nome));
        if (fav && !it.posologia && !it.apresentacao) { Object.assign(it, { apresentacao: fav.apresentacao, via: fav.via, quantidade: fav.quantidade, posologia: fav.posologia, antimicrobiano: !!fav.antimicrobiano, controlado: !!fav.controlado }); desenharRx(); agendarSalvar(); }
        if (!it.antimicrobiano && temTermo(it.nome, ANTIMICROBIANOS)) { it.antimicrobiano = true; desenharRx(); agendarSalvar(); toast(`${it.nome}: marcado como antimicrobiano (receita em 2 vias). Desmarque se não for.`); }
        if (!it.controlado && temTermo(it.nome, CONTROLADOS)) { it.controlado = true; desenharRx(); agendarSalvar(); toast(`${it.nome}: sujeito a controle especial — fica fora deste receituário.`); }
      }
    });
    f.addEventListener('click', async e => {
      const b = e.target.closest('[data-x]'); if (!b) return;
      const x = b.dataset.x;
      if (x === 'rx-add') { C.prescricao.push({ nome: '', apresentacao: '', via: 'Oral', quantidade: '', posologia: '', antimicrobiano: false, controlado: false }); desenharRx(true); agendarSalvar(); }
      else if (x === 'rx-del') { C.prescricao.splice(+b.dataset.i, 1); desenharRx(); agendarSalvar(); marcarSecoes(); }
      else if (x === 'rx-up' || x === 'rx-down') { const i = +b.dataset.i, j = x === 'rx-up' ? i - 1 : i + 1; if (j < 0 || j >= C.prescricao.length) return; [C.prescricao[i], C.prescricao[j]] = [C.prescricao[j], C.prescricao[i]]; desenharRx(); agendarSalvar(); $(`[data-x="${x}"][data-i="${j}"]`)?.focus(); }
      else if (x === 'rx-star') salvarFavorito(C.prescricao[+b.dataset.i], b);
      else if (x === 'rx-fav') escolherFavorito();
      else if (x === 'ex-add') { C.exames.push({ nome: '' }); desenharEx(true); agendarSalvar(); }
      else if (x === 'ex-del') { C.exames.splice(+b.dataset.i, 1); desenharEx(); agendarSalvar(); marcarSecoes(); }
      else if (x === 'pdf-rx') { await salvarPendente(); gerarReceita(); }
      else if (x === 'pdf-ex') { await salvarPendente(); gerarExames(); }
      else if (x === 'pdf-at') { await salvarPendente(); gerarAtestado(); }
      else if (x === 'usar-modelo') usarModeloNaConsulta(b.dataset.tipo);
      else if (x === 'salvar-modelo') salvarComoModelo(b.dataset.tipo);
      else if (x === 'ficha') dialogoPaciente(CP, novo => { CP = novo; $('#resumo-ficha').outerHTML = resumoFicha(); });
      else if (x === 'finalizar') finalizar(b);
      else if (x === 'excluir') {
        if (!(await confirmar('Excluir este rascunho de consulta? Esta ação não pode ser desfeita.', { ok: 'Excluir rascunho', perigo: true, titulo: 'Excluir rascunho' }))) return;
        try { clearTimeout(salvarTimer); sujo = false; await DB.consultas.remove(C.id); toast('Rascunho excluído.'); location.hash = '#paciente-' + C.paciente_id; } catch (err) { falha(err); }
      }
    });
    $$('.secnav a', main).forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const d = document.getElementById(a.dataset.sec); d.open = true; d.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); d.querySelector('summary').focus({ preventScroll: true }); }));
  }

  function calcIMC() {
    const out = $('#r-imc'); if (!out) return;
    const p = parseFloat(String(C.registro.peso || '').replace(',', '.'));
    let a = parseFloat(String(C.registro.altura || '').replace(',', '.'));
    if (a > 3) a = a / 100;
    out.value = p > 0 && a > 0 ? (p / (a * a)).toFixed(1).replace('.', ',') + ' kg/m²' : '';
  }
  function marcarSecoes() { $$('.secnav a').forEach(a => { const s = SECOES.find(x => x[0] === a.dataset.sec); a.classList.toggle('filled', !!s[2](C.registro, C)); }); }

  function desenharRx(focarUltimo) {
    const ol = $('#rx-list'); if (!ol) return;
    if (!C.prescricao.length) { ol.innerHTML = `<li class="muted small" style="padding:8px 0">Nenhum medicamento ainda. Adicione abaixo ou use um favorito.</li>`; return; }
    ol.innerHTML = rxItensHTML(C.prescricao, true);
    $$('[data-k="antimicrobiano"], [data-k="controlado"]', ol).forEach(c => c.addEventListener('change', () => setTimeout(desenharRx, 0)));
    if (focarUltimo) $(`#rx-n-${C.prescricao.length - 1}`).focus();
  }
  function rxItensHTML(lista, estrela) {
    return lista.map((it, i) => `<li class="rx">
      <div class="rx-top"><span class="n" aria-hidden="true">${i + 1}.</span><span class="flags">${it.antimicrobiano ? '<span class="chip copper">Antimicrobiano · 2 vias</span>' : ''}${it.controlado ? '<span class="chip danger">Controle especial</span>' : ''}</span>
        <button type="button" class="icon-btn" data-x="rx-up" data-i="${i}" aria-label="Mover medicamento ${i + 1} para cima" ${i === 0 ? 'disabled' : ''}>${ICON.down.replace('<svg', '<svg style="transform:rotate(180deg)"')}</button>
        <button type="button" class="icon-btn" data-x="rx-down" data-i="${i}" aria-label="Mover medicamento ${i + 1} para baixo" ${i === lista.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
        ${estrela ? `<button type="button" class="icon-btn" data-x="rx-star" data-i="${i}" aria-label="Salvar medicamento ${i + 1} nos favoritos">${ICON.star}</button>` : ''}
        <button type="button" class="icon-btn" data-x="rx-del" data-i="${i}" aria-label="Remover medicamento ${i + 1}">${ICON.trash}</button></div>
      <div class="rx-grid">
        ${campo('Medicamento', `<input id="rx-n-${i}" data-rx="${i}" data-k="nome" value="${esc(it.nome)}" list="fav-list" placeholder="Nome (DCB ou comercial)">`)}
        ${campo('Concentração / forma', `<input id="rx-a-${i}" data-rx="${i}" data-k="apresentacao" value="${esc(it.apresentacao)}" placeholder="Ex.: 500 mg comprimido">`)}
        ${campo('Via', `<select id="rx-v-${i}" data-rx="${i}" data-k="via">${[...new Set([...VIAS, it.via || 'Oral'])].map(vv => `<option ${vv === (it.via || 'Oral') ? 'selected' : ''}>${esc(vv)}</option>`).join('')}</select>`)}
        ${campo('Quantidade', `<input id="rx-q-${i}" data-rx="${i}" data-k="quantidade" value="${esc(it.quantidade)}" placeholder="Ex.: 1 caixa">`)}
        <div class="full">${campo('Posologia', `<textarea id="rx-p-${i}" data-rx="${i}" data-k="posologia" rows="2" placeholder="Ex.: Tomar 1 comprimido de 12 em 12 horas por 7 dias.">${esc(it.posologia)}</textarea>`)}</div>
        <div class="full checks"><label class="check small"><input type="checkbox" data-rx="${i}" data-k="antimicrobiano" ${it.antimicrobiano ? 'checked' : ''}> Antimicrobiano (receita em 2 vias)</label><label class="check small"><input type="checkbox" data-rx="${i}" data-k="controlado" ${it.controlado ? 'checked' : ''}> Controle especial (Portaria 344)</label></div>
      </div></li>`).join('');
  }
  function desenharEx(focar) {
    const ul = $('#ex-list'); if (!ul) return;
    ul.innerHTML = C.exames.length ? C.exames.map((e, i) => `<li><label class="sr-only" for="ex-${i}">Exame ${i + 1}</label><input id="ex-${i}" data-ex="${i}" value="${esc(e.nome)}" placeholder="Ex.: Hemograma completo"><button type="button" class="icon-btn" data-x="ex-del" data-i="${i}" aria-label="Remover exame ${i + 1}">${ICON.trash}</button></li>`).join('') : `<li class="muted small">Nenhum exame solicitado.</li>`;
    if (focar) $(`#ex-${C.exames.length - 1}`).focus();
  }

  async function salvarFavorito(it, btn) {
    if (!it || !it.nome.trim()) return toast('Preencha o nome do medicamento antes de favoritar.', true);
    if (S.favoritos.some(f => norm(f.nome) === norm(it.nome) && norm(f.apresentacao) === norm(it.apresentacao))) return toast('Este medicamento já está nos favoritos.');
    await ocupado(btn, async () => {
      try { const f = await DB.favoritos.save({ nome: it.nome.trim(), apresentacao: it.apresentacao || '', via: it.via || 'Oral', quantidade: it.quantidade || '', posologia: it.posologia || '', antimicrobiano: !!it.antimicrobiano, controlado: !!it.controlado }); S.favoritos.push(f); toast(`${it.nome} salvo nos favoritos.`); }
      catch (err) { falha(err); }
    });
  }
  function escolherFavorito() {
    abrirDialogo({
      titulo: 'Medicamentos favoritos',
      corpo: `<div class="search" style="margin-bottom:12px">${ICON.search}<label class="sr-only" for="fv-q">Filtrar favoritos</label><input id="fv-q" type="search" placeholder="Filtrar" autocomplete="off"></div><ul class="list" id="fv-l"></ul>`,
      aoAbrir: (d, fechar) => {
        const q = d.querySelector('#fv-q'), l = d.querySelector('#fv-l');
        const draw = () => { const t = norm(q.value); const m = S.favoritos.filter(f => !t || norm(f.nome).includes(t)); l.innerHTML = m.length ? m.map(f => `<li><button type="button" class="row" data-id="${esc(f.id)}"><span class="grow"><span class="title">${esc(f.nome)} ${esc(f.apresentacao)}</span><span class="meta"><span>${esc(f.via)}</span><span>${esc(f.quantidade)}</span></span>${f.posologia ? `<span class="small muted">${esc(f.posologia)}</span>` : ''}</span>${ICON.plus.replace('<svg', '<svg class="chev"')}</button></li>`).join('') : '<li class="muted">Nenhum favorito encontrado.</li>'; $$('[data-id]', l).forEach(b => b.addEventListener('click', () => { const f = S.favoritos.find(x => x.id === b.dataset.id); C.prescricao.push({ nome: f.nome, apresentacao: f.apresentacao, via: f.via, quantidade: f.quantidade, posologia: f.posologia, antimicrobiano: !!f.antimicrobiano, controlado: !!f.controlado }); desenharRx(); agendarSalvar(); marcarSecoes(); toast(`${f.nome} adicionado.`); fechar(); })); };
        q.addEventListener('input', draw); draw();
      }
    });
  }

  function gerarReceita() {
    const cl = clinicaPorId(C.clinica_id);
    gerarEmostrar({ ...dadosBasePDF(CP, cl, C.data), tipo: 'receita', itens: C.prescricao, orientacoes: C.orientacoes, incluirOrientacoes: C.registro.incluir_orientacoes !== false }, 'Receituário pronto');
  }
  function gerarExames() {
    const cl = clinicaPorId(C.clinica_id);
    gerarEmostrar({ ...dadosBasePDF(CP, cl, C.data), tipo: 'exames', exames: C.exames, indicacao: C.registro.indicacao_exames }, 'Solicitação de exames pronta');
  }
  function gerarAtestado() {
    const r = C.registro;
    if (r.atestado_cid && !r.atestado_cid_aut) toast('CID omitido: marque a autorização da paciente para que ele saia no atestado.');
    gerarEmostrar({ ...dadosBasePDF(CP, clinicaPorId(C.clinica_id), C.data), tipo: 'atestado', titulo: r.atestado_titulo || 'Atestado médico', texto: r.atestado, cid: r.atestado_cid_aut ? r.atestado_cid : '' }, 'Atestado pronto');
  }
  function registroParaPDF() {
    const r = C.registro;
    const gpa = ['gestacoes', 'partos', 'cesareas', 'abortos'].some(k => r[k]) ? `G${r.gestacoes || 0} PN${r.partos || 0} C${r.cesareas || 0} A${r.abortos || 0}` : '';
    return [
      { titulo: 'Atendimento', campos: [{ rotulo: 'Tipo', valor: C.tipo }, { rotulo: 'Clínica', valor: (clinicaPorId(C.clinica_id) || {}).nome }, { rotulo: 'Data', valor: `${fmtData(C.data)} às ${fmtHora(C.data)}` }] },
      { titulo: 'Queixa e história', campos: [{ rotulo: 'Queixa principal', valor: r.motivo }, { rotulo: 'História atual', valor: r.hda }] },
      { titulo: 'Ginecológico e obstétrico', campos: [{ rotulo: 'DUM', valor: r.dum ? fmtData(r.dum) : '' }, { rotulo: 'Ciclo', valor: r.ciclo }, { rotulo: 'Menarca', valor: r.menarca }, { rotulo: 'Paridade', valor: gpa }, { rotulo: 'Contracepção', valor: r.contracepcao }, { rotulo: 'Tentando engravidar', valor: r.tentante }, { rotulo: 'Último preventivo', valor: r.preventivo }, { rotulo: 'Mamografia/USG', valor: r.mamografia }, { rotulo: 'Outras', valor: r.gineco_obs }] },
      { titulo: 'Exame físico', campos: [{ rotulo: 'Sinais vitais', valor: [r.pa && `PA ${r.pa} mmHg`, r.fc && `FC ${r.fc} bpm`, r.peso && `Peso ${r.peso} kg`, r.altura && `Altura ${r.altura} m`].filter(Boolean).join(' · ') }, { rotulo: 'Geral e mamas', valor: r.exame_fisico }, { rotulo: 'Ginecológico', valor: r.exame_gineco }] },
      { titulo: 'Exames e resultados', campos: [{ rotulo: 'Resultados', valor: r.resultados }] },
      { titulo: 'Avaliação e conduta', campos: [{ rotulo: 'Hipótese diagnóstica', valor: [r.hipotese, r.cid ? `(CID ${String(r.cid).toUpperCase()})` : ''].filter(Boolean).join(' ') }, { rotulo: 'Conduta', valor: r.conduta }, { rotulo: 'Retorno', valor: r.retorno }] },
      { titulo: 'Prescrição', texto: C.prescricao.filter(i => i.nome).map((i, n) => `${n + 1}. ${[i.nome, i.apresentacao].filter(Boolean).join(' ')}${i.quantidade ? ` — ${i.quantidade}` : ''}${i.via ? ` (${i.via.toLowerCase()})` : ''}${i.posologia ? `: ${i.posologia}` : ''}`).join('\n') },
      { titulo: 'Orientações', texto: C.orientacoes },
      { titulo: 'Exames solicitados', texto: C.exames.filter(e => e.nome).map((e, n) => `${n + 1}. ${e.nome}`).join('\n') },
      { titulo: 'Atestado emitido', texto: r.atestado ? `${r.atestado_titulo || 'Atestado médico'}: ${r.atestado}${r.atestado_cid && r.atestado_cid_aut ? ` (CID ${String(r.atestado_cid).toUpperCase()}, autorizado pela paciente)` : ''}` : '' },
      { titulo: 'Adendos', texto: C.adendos.map(a => `- ${fmtData(a.em)} ${fmtHora(a.em)}: ${a.texto}`).join('\n') }
    ];
  }

  async function finalizar(btn) {
    const r = C.registro;
    const faltas = [];
    if (!r.motivo && !r.hda) faltas.push('queixa/história');
    if (!r.hipotese && !r.conduta) faltas.push('avaliação/conduta');
    const msg = `Depois de finalizada, a consulta fica guardada no prontuário e não pode mais ser editada — só complementada com adendos datados.${faltas.length ? ` Atenção: ainda sem ${faltas.join(' e ')}.` : ''}`;
    if (!(await confirmar(msg, { ok: 'Finalizar consulta', titulo: 'Finalizar consulta' }))) return;
    await ocupado(btn, async () => {
      try { await salvarPendente(); C = await DB.consultas.finalizar(C.id); toast('Consulta finalizada e guardada no prontuário.'); leituraConsulta($('#main')); window.scrollTo(0, 0); }
      catch (err) { falha(err); }
    });
  }

  function leituraConsulta(main) {
    const blocos = registroParaPDF().slice(1);
    const secoes = blocos.map(b => {
      const campos = (b.campos || []).filter(c => c.valor);
      if (b.titulo === 'Prescrição') {
        if (!C.prescricao.length) return '';
        return `<section class="card read"><h2 style="font-size:1.5rem;margin-bottom:12px">Prescrição</h2><ol class="rx-list">${C.prescricao.map((i, n) => `<li class="rx"><b>${n + 1}. ${esc([i.nome, i.apresentacao].filter(Boolean).join(' '))}</b>${i.quantidade ? ` <span class="muted">— ${esc(i.quantidade)}</span>` : ''} <span class="chip">${esc(i.via || 'Oral')}</span>${i.antimicrobiano ? ' <span class="chip copper">Antimicrobiano</span>' : ''}${i.controlado ? ' <span class="chip danger">Controle especial</span>' : ''}${i.posologia ? `<p class="muted" style="margin-top:4px">${esc(i.posologia)}</p>` : ''}</li>`).join('')}</ol></section>`;
      }
      if (b.titulo === 'Adendos') return '';
      if (!campos.length && !b.texto) return '';
      return `<section class="card read"><h2 style="font-size:1.5rem;margin-bottom:12px">${esc(b.titulo)}</h2>${campos.length ? `<dl>${campos.map(c => `<dt>${esc(c.rotulo)}</dt><dd>${esc(c.valor)}</dd>`).join('')}</dl>` : ''}${b.texto ? `<p style="white-space:pre-wrap" class="wrap-any">${esc(b.texto)}</p>` : ''}</section>`;
    }).join('');
    main.innerHTML = `
      ${cabecalhoConsulta(`<span class="chip ok">${ICON.check.replace('<svg', '<svg width="14" height="14"')}Finalizada${C.finalizada_em ? ` em ${fmtData(C.finalizada_em)} ${fmtHora(C.finalizada_em)}` : ''}</span>`)}
      <div class="actions" style="margin-bottom:16px">
        <button class="btn btn-primary" data-x="pdf-rx">${ICON.doc}Receituário</button>
        ${C.exames.length ? `<button class="btn btn-ghost" data-x="pdf-ex">${ICON.doc}Solicitação de exames</button>` : ''}
        ${C.registro.atestado ? `<button class="btn btn-ghost" data-x="pdf-at">${ICON.doc}${esc(C.registro.atestado_titulo || 'Atestado')}</button>` : ''}
        <button class="btn btn-ghost" data-x="pdf-reg">${ICON.doc}Registro da consulta</button>
      </div>
      ${temAlergia(CP.alergias) ? `<div class="alert danger" style="margin-bottom:12px">${ICON.alert}<p><b>Alergias:</b> ${esc(CP.alergias)}</p></div>` : ''}
      ${secoes || '<div class="empty"><p>Esta consulta foi finalizada sem registros.</p></div>'}
      <section class="card" id="adendos">
        <h2 style="font-size:1.5rem;margin-bottom:12px">Adendos</h2>
        ${C.adendos.length ? C.adendos.map(a => `<div class="adendo"><p class="small muted">${fmtData(a.em)} às ${fmtHora(a.em)}</p><p style="white-space:pre-wrap" class="wrap-any">${esc(a.texto)}</p></div>`).join('') : '<p class="muted small">Para corrigir ou complementar esta consulta, registre um adendo — ele fica datado e não substitui o original.</p>'}
        <form id="f-ad" class="stack" style="margin-top:12px" novalidate>${areaTexto('ad-t', 'texto', '', { rot: 'Novo adendo', linhas: 3, campo: 'adendo' })}<div class="actions"><button class="btn btn-ghost" type="submit">Adicionar adendo</button></div></form>
      </section>`;
    main.querySelector('[data-x="pdf-rx"]').addEventListener('click', gerarReceita);
    const be = main.querySelector('[data-x="pdf-ex"]'); if (be) be.addEventListener('click', gerarExames);
    const ba = main.querySelector('[data-x="pdf-at"]'); if (ba) ba.addEventListener('click', gerarAtestado);
    main.querySelector('[data-x="pdf-reg"]').addEventListener('click', () => gerarEmostrar({ ...dadosBasePDF(CP, clinicaPorId(C.clinica_id), C.data), tipo: 'registro', registro: registroParaPDF().slice(1), subtitulo: C.tipo }, 'Registro da consulta'));
    main.querySelector('#f-ad').addEventListener('submit', async e => {
      e.preventDefault(); const ta = $('#ad-t'); const t = ta.value.trim();
      if (!t) { erroCampo(ta, 'Escreva o adendo.'); ta.focus(); return; }
      await ocupado($('button[type=submit]', e.currentTarget), async () => {
        try { C = await DB.consultas.adendo(C.id, t); C.adendos = C.adendos || []; toast('Adendo registrado.'); leituraConsulta(main); $('#adendos').scrollIntoView(); } catch (err) { falha(err); }
      });
    });
  }

  /* =====================================================================
     Modelos e textos padrão
     ===================================================================== */
  const TIPOS_MODELO = [['prescricao', 'Prescrição'], ['exames', 'Exames'], ['atestado', 'Atestados'], ['texto', 'Textos da consulta']];
  // Campos de texto livre que aceitam "textos padrão"
  const CAMPOS = [
    ['motivo', 'Queixa principal'], ['hda', 'História da doença atual'], ['gineco_obs', 'Outras informações gineco-obstétricas'],
    ['exame_fisico', 'Exame físico geral e mamas'], ['exame_gineco', 'Exame ginecológico'], ['resultados', 'Resultados de exames'],
    ['conduta', 'Conduta e plano'], ['orientacoes', 'Orientações à paciente'], ['indicacao_exames', 'Indicação clínica dos exames'],
    ['adendo', 'Adendo'], ['antecedentes', 'Antecedentes (ficha)'], ['medicacoes_uso', 'Medicações em uso (ficha)'], ['alergias', 'Alergias (ficha)'], ['observacoes', 'Observações (ficha)']
  ];
  const nomeCampo = k => (CAMPOS.find(c => c[0] === k) || [k, k])[1];
  const CAMPOS_CONSULTA = ['motivo', 'hda', 'gineco_obs', 'exame_fisico', 'exame_gineco', 'resultados', 'conduta', 'orientacoes', 'indicacao_exames'];
  const modelosDo = tipo => S.modelos.filter(m => m.tipo === tipo).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const padroesDo = campo => modelosDo('texto').filter(m => (m.conteudo || {}).campo === campo);
  function textosAutomaticos() {
    const out = {};
    modelosDo('texto').forEach(m => { const c = m.conteudo || {}; if (c.auto && CAMPOS_CONSULTA.includes(c.campo) && !out[c.campo]) out[c.campo] = c.texto || ''; });
    return out;
  }
  function resumoModelo(m) {
    const c = m.conteudo || {};
    if (m.tipo === 'prescricao') { const n = (c.itens || []).length; return `${n} ${n === 1 ? 'medicamento' : 'medicamentos'}${c.orientacoes ? ' · com orientações' : ''}`; }
    if (m.tipo === 'exames') { const n = (c.exames || []).length; return `${n} ${n === 1 ? 'exame' : 'exames'}`; }
    if (m.tipo === 'atestado') return c.titulo || 'Atestado médico';
    return (c.texto || '').slice(0, 110) + ((c.texto || '').length > 110 ? '…' : '');
  }

  /* ---------- números por extenso (para {dias}) ---------- */
  const UN = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const DZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const extenso = n => n < 20 ? UN[n] : n < 100 ? DZ[Math.floor(n / 10)] + (n % 10 ? ' e ' + UN[n % 10] : '') : String(n);

  /* ---------- variáveis dos modelos de atestado ---------- */
  function variaveisAuto() {
    const d = new Date(C ? C.data : Date.now());
    const cl = C ? clinicaPorId(C.clinica_id) : null;
    return {
      paciente: CP ? (CP.nome_social || CP.nome) : '', cpf: CP ? CP.cpf : '', idade: CP ? idade(CP.data_nascimento) : '',
      data: PDF.dataExtenso(d), hora: `${pad(d.getHours())}h${pad(d.getMinutes())}`, clinica: cl ? cl.nome : ''
    };
  }
  function preencherVariaveis(texto, extras = {}) {
    const auto = { ...variaveisAuto(), ...extras };
    return String(texto || '').replace(/\{([^{}]+)\}/g, (m, k) => { const key = norm(k).trim(); return auto[key] ? auto[key] : m; });
  }
  function perguntarVariaveis(texto) {
    return new Promise(res => {
      const auto = variaveisAuto();
      const faltam = [...new Set((String(texto).match(/\{([^{}]+)\}/g) || []).map(x => norm(x.slice(1, -1)).trim()))].filter(k => !auto[k]);
      if (!faltam.length) return res(preencherVariaveis(texto));
      let resultado = null;
      const rot = k => ({ dias: 'Dias de afastamento', cpf: 'CPF da paciente (não está na ficha)', acompanhante: 'Nome do(a) acompanhante' }[k] || k.charAt(0).toUpperCase() + k.slice(1));
      abrirDialogo({
        titulo: 'Completar o modelo',
        corpo: `<form class="stack" id="f-var" novalidate><p class="muted small">Preencha o que o modelo precisa. Depois você ainda pode editar o texto.</p>${faltam.map(k => campo(esc(rot(k)), `<input id="var-${esc(k)}" data-var="${esc(k)}" ${k === 'dias' ? 'type="number" min="1" max="365" inputmode="numeric"' : ''} ${k === 'cpf' ? 'inputmode="numeric"' : ''}>`)).join('')}</form>`,
        rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Aplicar</button>`,
        aoAbrir: (d, fechar) => d.querySelector('[data-ok]').addEventListener('click', () => {
          const extras = {};
          $$('[data-var]', d).forEach(i => {
            const k = i.dataset.var; const v = i.value.trim(); if (!v) return;
            if (k === 'dias' && /^\d+$/.test(v)) { const n = +v; extras[k] = `${n} (${extenso(n)}) ${n === 1 ? 'dia' : 'dias'}`; }
            else extras[k] = v;
          });
          resultado = preencherVariaveis(texto, extras); fechar();
        }),
        aoFechar: () => res(resultado)
      });
    });
  }

  /* ---------- escolha "substituir ou adicionar" ---------- */
  function substituirOuAdicionar(titulo) {
    return new Promise(res => {
      let r = null;
      abrirDialogo({
        titulo, corpo: `<p>Já há conteúdo aqui. Quer substituir pelo modelo ou adicionar o modelo ao que já existe?</p>`,
        rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-ghost" data-r="add">Adicionar</button><button class="btn btn-primary" data-r="sub">Substituir</button>`,
        aoAbrir: (d, fechar) => $$('[data-r]', d).forEach(b => b.addEventListener('click', () => { r = b.dataset.r; fechar(); })),
        aoFechar: () => res(r)
      });
    });
  }

  /* ---------- textos padrão por campo (botão "Padrões" de cada área de texto) ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-padrao]'); if (!b) return;
    const ta = document.getElementById(b.dataset.alvo); if (!ta) return;
    dialogoPadroes(b.dataset.padrao, ta, b.dataset.rot);
  });
  function inserirNoCampo(ta, texto, modo) {
    ta.value = modo === 'add' && ta.value.trim() ? ta.value.replace(/\s*$/, '') + '\n' + texto : texto;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  }
  function dialogoPadroes(campoK, ta, rot) {
    abrirDialogo({
      titulo: `Padrões · ${rot || nomeCampo(campoK)}`,
      corpo: `<div class="stack"><ul class="list" id="pd-l"></ul>
        <details class="pd-novo" ${padroesDo(campoK).length ? '' : 'open'}><summary class="btn btn-ghost">${ICON.plus}Salvar novo padrão</summary>
          <form id="pd-f" class="stack" style="margin-top:12px" novalidate>
            ${campo('Nome do padrão', `<input id="pd-nome" placeholder="Ex.: Exame normal">`)}
            ${campo('Texto', `<textarea id="pd-texto" rows="5">${esc(ta.value)}</textarea>`)}
            <label class="check"><input type="checkbox" id="pd-auto"> Já preencher este campo em toda nova consulta</label>
            <div class="actions"><button class="btn btn-primary" type="submit">Salvar padrão</button></div>
          </form></details></div>`,
      rodape: ta.closest('dialog') ? '' : `<a class="btn btn-quiet" href="#modelos" data-close data-ir-textos>Gerenciar textos padrão</a>`,
      aoAbrir: (d, fechar) => {
        const l = d.querySelector('#pd-l');
        const draw = () => {
          const lst = padroesDo(campoK); const cheio = !!ta.value.trim();
          l.innerHTML = lst.length ? lst.map(m => `<li class="pad-item"><div><b>${esc(m.nome)}</b> ${(m.conteudo || {}).sugerido ? '<span class="chip">Sugerido</span>' : ''} ${(m.conteudo || {}).auto ? '<span class="chip copper">Automático</span>' : ''}<p class="small muted wrap-any" style="white-space:pre-wrap">${esc((m.conteudo || {}).texto || '')}</p></div>
              <div class="actions">${cheio ? `<button type="button" class="btn btn-ghost" data-usar="${esc(m.id)}" data-modo="add">Adicionar ao texto</button><button type="button" class="btn btn-primary" data-usar="${esc(m.id)}" data-modo="sub">Substituir</button>` : `<button type="button" class="btn btn-primary" data-usar="${esc(m.id)}" data-modo="sub">Usar este texto</button>`}</div>
              <div class="actions">${cheio && ta.value.trim() !== ((m.conteudo || {}).texto || '').trim() ? `<button type="button" class="btn btn-quiet" data-atualizar="${esc(m.id)}">Salvar o texto do campo neste padrão</button>` : ''}<button type="button" class="btn btn-quiet" data-editar="${esc(m.id)}">Editar padrão</button></div></li>`).join('')
            : `<li class="muted small">Nenhum texto padrão para este campo ainda. Escreva abaixo (ou aproveite o que já está no campo) e salve.</li>`;
          $$('[data-usar]', l).forEach(btn => btn.addEventListener('click', () => { const m = S.modelos.find(x => x.id === btn.dataset.usar); inserirNoCampo(ta, (m.conteudo || {}).texto || '', btn.dataset.modo); fechar(); toast('Texto padrão inserido — edite à vontade.'); }));
          $$('[data-atualizar]', l).forEach(btn => btn.addEventListener('click', () => ocupado(btn, async () => {
            const m = S.modelos.find(x => x.id === btn.dataset.atualizar);
            try { await salvarModelo({ ...m, conteudo: { ...m.conteudo, texto: ta.value.trim(), sugerido: false } }); toast(`Padrão “${m.nome}” atualizado com o texto do campo.`); draw(); } catch (err) { falha(err); }
          })));
          $$('[data-editar]', l).forEach(btn => btn.addEventListener('click', () => dialogoModelo(S.modelos.find(x => x.id === btn.dataset.editar), draw)));
        };
        draw();
        const ir = d.querySelector('[data-ir-textos]'); if (ir) ir.addEventListener('click', () => { filtroModelo = 'texto'; });
        d.querySelector('#pd-f').addEventListener('submit', ev => {
          ev.preventDefault();
          const nome = d.querySelector('#pd-nome'), tx = d.querySelector('#pd-texto');
          let ok = true;
          if (!nome.value.trim()) { erroCampo(nome, 'Dê um nome ao padrão.'); ok = false; } else erroCampo(nome);
          if (!tx.value.trim()) { erroCampo(tx, 'Escreva o texto padrão.'); ok = false; } else erroCampo(tx);
          if (!ok) return;
          ocupado($('button[type=submit]', ev.currentTarget), async () => {
            try { await salvarModelo({ tipo: 'texto', nome: nome.value.trim(), conteudo: { campo: campoK, texto: tx.value.trim(), auto: d.querySelector('#pd-auto').checked } }); toast('Texto padrão salvo.'); nome.value = ''; d.querySelector('.pd-novo').open = false; draw(); }
            catch (err) { falha(err); }
          });
        });
      }
    });
  }
  async function salvarModelo(m) {
    const salvo = await DB.modelos.save(m);
    // só um texto automático por campo
    if (salvo.tipo === 'texto' && (salvo.conteudo || {}).auto) {
      for (const o of S.modelos.filter(x => x.tipo === 'texto' && x.id !== salvo.id && (x.conteudo || {}).campo === salvo.conteudo.campo && (x.conteudo || {}).auto)) {
        await DB.modelos.save({ ...o, conteudo: { ...o.conteudo, auto: false } });
      }
    }
    S.modelos = await DB.modelos.list();
    return salvo;
  }

  /* ---------- usar / salvar modelos dentro da consulta ---------- */
  function escolherModelo(tipo) {
    return new Promise(res => {
      let escolhido = null;
      const lst = modelosDo(tipo);
      const nomeT = (TIPOS_MODELO.find(t => t[0] === tipo) || [])[1];
      abrirDialogo({
        titulo: `Modelos · ${nomeT}`,
        corpo: lst.length ? `<div class="search" style="margin-bottom:12px">${ICON.search}<label class="sr-only" for="em-q">Filtrar modelos</label><input id="em-q" type="search" placeholder="Filtrar" autocomplete="off"></div><ul class="list" id="em-l"></ul>`
          : `<div class="empty"><h3>Nenhum modelo de ${esc(nomeT.toLowerCase())}</h3><p>Crie modelos na área Modelos, ou monte este aqui na consulta e toque em “Salvar como modelo”.</p><a class="btn btn-primary" href="#modelos" data-close>Ir para Modelos</a></div>`,
        aoAbrir: (d, fechar) => {
          const q = d.querySelector('#em-q'), l = d.querySelector('#em-l'); if (!l) return;
          const draw = () => { const t = norm(q.value); const m = lst.filter(x => !t || norm(x.nome).includes(t)); l.innerHTML = m.length ? m.map(x => `<li><button type="button" class="row" data-id="${esc(x.id)}"><span class="grow"><span class="title">${esc(x.nome)}</span><span class="small muted wrap-any">${esc(resumoModelo(x))}</span></span>${ICON.chev.replace('<svg', '<svg class="chev"')}</button></li>`).join('') : '<li class="muted">Nenhum modelo encontrado.</li>'; $$('[data-id]', l).forEach(b => b.addEventListener('click', () => { escolhido = lst.find(x => x.id === b.dataset.id); fechar(); })); };
          q.addEventListener('input', draw); draw();
        },
        aoFechar: () => res(escolhido)
      });
    });
  }
  const copiaItem = i => ({ nome: i.nome || '', apresentacao: i.apresentacao || '', via: i.via || 'Oral', quantidade: i.quantidade || '', posologia: i.posologia || '', antimicrobiano: !!i.antimicrobiano, controlado: !!i.controlado });
  async function usarModeloNaConsulta(tipo) {
    const m = await escolherModelo(tipo); if (!m) return;
    const c = m.conteudo || {};
    if (tipo === 'prescricao') {
      const tem = C.prescricao.some(i => i.nome) || C.orientacoes.trim();
      const modo = tem ? await substituirOuAdicionar('Usar modelo de prescrição') : 'sub'; if (!modo) return;
      const itens = (c.itens || []).map(copiaItem);
      C.prescricao = modo === 'sub' ? itens : C.prescricao.filter(i => i.nome).concat(itens);
      if (c.orientacoes) C.orientacoes = modo === 'sub' || !C.orientacoes.trim() ? c.orientacoes : C.orientacoes.replace(/\s*$/, '') + '\n' + c.orientacoes;
      else if (modo === 'sub') C.orientacoes = '';
      $('#c-orient').value = C.orientacoes; desenharRx();
    } else if (tipo === 'exames') {
      const tem = C.exames.some(e => e.nome);
      const modo = tem ? await substituirOuAdicionar('Usar modelo de exames') : 'sub'; if (!modo) return;
      const ex = (c.exames || []).map(e => ({ nome: e.nome || '' }));
      C.exames = modo === 'sub' ? ex : C.exames.filter(e => e.nome).concat(ex);
      if (c.indicacao && (modo === 'sub' || !C.registro.indicacao_exames)) { C.registro.indicacao_exames = c.indicacao; $('#r-ind').value = c.indicacao; }
      desenharEx();
    } else if (tipo === 'atestado') {
      if (C.registro.atestado && !(await confirmar('Substituir o texto atual do atestado pelo modelo?', { ok: 'Substituir', titulo: 'Usar modelo de atestado' }))) return;
      const texto = await perguntarVariaveis(c.texto || ''); if (texto == null) return;
      C.registro.atestado = texto; C.registro.atestado_titulo = c.titulo || 'Atestado médico';
      $('#r-atest').value = texto; $('#r-atestado_titulo').value = C.registro.atestado_titulo;
      if (!CP.cpf && !/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/.test(texto)) toast('A ficha da paciente está sem CPF — a Resolução CFM 2.381/2024 pede nome e CPF nos documentos.', true);
    }
    agendarSalvar(); marcarSecoes(); toast(`Modelo “${m.nome}” aplicado — edite o que precisar.`);
  }
  function salvarComoModelo(tipo) {
    let conteudo, vazio;
    if (tipo === 'prescricao') { const itens = C.prescricao.filter(i => i.nome).map(copiaItem); conteudo = { itens, orientacoes: C.orientacoes }; vazio = !itens.length && !C.orientacoes.trim(); }
    else if (tipo === 'exames') { const ex = C.exames.filter(e => e.nome).map(e => ({ nome: e.nome })); conteudo = { exames: ex, indicacao: C.registro.indicacao_exames || '' }; vazio = !ex.length; }
    else { conteudo = { titulo: C.registro.atestado_titulo || 'Atestado médico', texto: C.registro.atestado || '' }; vazio = !conteudo.texto.trim(); }
    if (vazio) return toast('Preencha esta parte da consulta antes de salvar como modelo.', true);
    abrirDialogo({
      titulo: 'Salvar como modelo',
      corpo: `<form id="sm-f" class="stack" novalidate>${campo('Nome do modelo', `<input id="sm-nome" autofocus placeholder="${tipo === 'prescricao' ? 'Ex.: Vaginose bacteriana' : tipo === 'exames' ? 'Ex.: Rotina anual' : 'Ex.: Afastamento'}">`)}
        ${tipo === 'atestado' ? `<p class="small muted">Dica: depois, na área Modelos, troque o nome da paciente, a data e os dias por {paciente}, {data} e {dias} para o modelo se preencher sozinho.</p>` : ''}</form>`,
      rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Salvar modelo</button>`,
      aoAbrir: (d, fechar) => d.querySelector('[data-ok]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
        const n = d.querySelector('#sm-nome'); if (!n.value.trim()) { erroCampo(n, 'Dê um nome ao modelo.'); n.focus(); return; }
        try { await salvarModelo({ tipo, nome: n.value.trim(), conteudo }); toast('Modelo salvo.'); fechar(); } catch (err) { falha(err); }
      }))
    });
  }

  /* ---------- página Modelos ---------- */
  let filtroModelo = 'prescricao';
  async function viewModelos(main) {
    S.modelos = await DB.modelos.list();
    const nomeT = (TIPOS_MODELO.find(t => t[0] === filtroModelo) || [])[1];
    const lst = modelosDo(filtroModelo);
    let corpo;
    if (!lst.length) {
      corpo = `<div class="empty"><img src="${A['logo-symbol']}" alt=""><h3>Nenhum modelo de ${esc(nomeT.toLowerCase())}</h3><p>${{ prescricao: 'Monte prescrições prontas (medicamentos, posologia e orientações) para aplicar com um toque na consulta.', exames: 'Monte pacotes de exames (ex.: rotina anual, investigação de infertilidade) com a indicação clínica.', atestado: 'Atestados com campos automáticos: nome, CPF, data e hora entram sozinhos; os dias de afastamento são perguntados.', texto: 'Textos padrão para qualquer campo da consulta — exame físico normal, exame ginecológico, conduta… Marque como automático para já vir preenchido.' }[filtroModelo]}</p>
        <div class="actions" style="justify-content:center"><button class="btn btn-primary" data-x="novo">${ICON.plus}Criar modelo</button><button class="btn btn-ghost" data-x="basicos">Restaurar sugestões</button></div></div>`;
    } else if (filtroModelo === 'texto') {
      const grupos = {}; lst.forEach(m => { const k = (m.conteudo || {}).campo || 'outros'; (grupos[k] = grupos[k] || []).push(m); });
      corpo = CAMPOS.filter(([k]) => grupos[k]).map(([k, t]) => `<h2 class="rule">${esc(t)}</h2><ul class="list">${grupos[k].map(linhaModelo).join('')}</ul>`).join('');
    } else corpo = `<ul class="list">${lst.map(linhaModelo).join('')}</ul>`;
    main.innerHTML = `
      <div class="page-head"><div><h1>Modelos</h1><p class="muted small">Tudo o que você escreve sempre igual, pronto para aplicar e editar na consulta. Os itens “Sugerido” são pontos de partida: abra, ajuste e salve para virar o seu padrão.</p></div><div class="actions"><button class="btn btn-ghost" data-x="basicos">Restaurar sugestões</button><button class="btn btn-primary" data-x="novo">${ICON.plus}Novo modelo</button></div></div>
      <div class="filter-chips" role="group" aria-label="Tipo de modelo" style="margin-bottom:16px">${TIPOS_MODELO.map(([k, t]) => `<button type="button" data-tm="${k}" aria-pressed="${k === filtroModelo}">${t} <span class="muted">(${modelosDo(k).length})</span></button>`).join('')}</div>
      ${corpo}`;
    $$('[data-tm]', main).forEach(b => b.addEventListener('click', () => { filtroModelo = b.dataset.tm; viewModelos(main); }));
    $$('[data-x="novo"]', main).forEach(b => b.addEventListener('click', () => dialogoModelo({ tipo: filtroModelo }, () => viewModelos(main))));
    $$('[data-mid]', main).forEach(b => b.addEventListener('click', () => dialogoModelo(S.modelos.find(m => m.id === b.dataset.mid), () => viewModelos(main))));
    $$('[data-x="basicos"]', main).forEach(bb => bb.addEventListener('click', () => ocupado(bb, async () => { try { const n = await restaurarSugestoes(); toast(n ? `${n} ${n === 1 ? 'sugestão adicionada' : 'sugestões adicionadas'}.` : 'Todas as sugestões já estão na sua lista.'); viewModelos(main); } catch (err) { falha(err); } })));
  }
  function linhaModelo(m) {
    return `<li><button type="button" class="row" data-mid="${esc(m.id)}"><span class="avatar" aria-hidden="true">${(m.tipo === 'texto' ? ICON.text : ICON.layers).replace('<svg', '<svg width="22" height="22"')}</span><span class="grow"><span class="title">${esc(m.nome)} ${(m.conteudo || {}).sugerido ? '<span class="chip">Sugerido</span>' : ''} ${(m.conteudo || {}).auto ? '<span class="chip copper">Automático</span>' : ''}</span><span class="small muted wrap-any">${esc(resumoModelo(m))}</span></span>${ICON.chev.replace('<svg', '<svg class="chev"')}</button></li>`;
  }

  function dialogoModelo(orig, depois) {
    const novo = !orig.id;
    const M = JSON.parse(JSON.stringify({ nome: '', conteudo: {}, ...orig }));
    const c = M.conteudo;
    if (M.tipo === 'prescricao') { c.itens = c.itens || []; c.orientacoes = c.orientacoes || ''; if (!c.itens.length) c.itens.push(copiaItem({})); }
    if (M.tipo === 'exames') { c.exames = c.exames || []; c.indicacao = c.indicacao || ''; if (!c.exames.length) c.exames.push({ nome: '' }); }
    if (M.tipo === 'atestado') { c.titulo = c.titulo || 'Atestado médico'; c.texto = c.texto || ''; }
    if (M.tipo === 'texto') { c.campo = c.campo || 'exame_fisico'; c.texto = c.texto || ''; }
    const nomeT = { prescricao: 'prescrição', exames: 'exames', atestado: 'atestado', texto: 'texto padrão' }[M.tipo];
    const VARS = ['paciente', 'cpf', 'data', 'hora', 'dias', 'idade', 'clinica'];
    let corpo = `<form id="md-f" class="stack" novalidate>${campo('Nome do modelo *', `<input id="md-nome" value="${esc(M.nome)}" placeholder="${{ prescricao: 'Ex.: Candidíase vulvovaginal', exames: 'Ex.: Rotina ginecológica anual', atestado: 'Ex.: Afastamento', texto: 'Ex.: Exame ginecológico normal' }[M.tipo]}">`)}`;
    if (M.tipo === 'prescricao') corpo += `<datalist id="fav-list-md">${S.favoritos.map(f => `<option value="${esc(f.nome)}">${esc(f.apresentacao)}</option>`).join('')}</datalist><p class="label">Medicamentos</p><ol class="rx-list" id="md-rx"></ol><div class="actions"><button type="button" class="btn btn-ghost" data-m="rx-add">${ICON.plus}Adicionar medicamento</button></div>${campo('Orientações', `<textarea id="md-or" rows="4">${esc(c.orientacoes)}</textarea>`)}`;
    if (M.tipo === 'exames') corpo += `<p class="label">Exames</p><ul class="ex-list" id="md-ex"></ul><div class="actions"><button type="button" class="btn btn-ghost" data-m="ex-add">${ICON.plus}Adicionar exame</button></div>${campo('Indicação clínica', `<textarea id="md-ind" rows="2">${esc(c.indicacao)}</textarea>`)}`;
    if (M.tipo === 'atestado') corpo += `${campo('Título do documento', `<input id="md-tit" value="${esc(c.titulo)}">`)}${campo('Texto', `<textarea id="md-tx" rows="7">${esc(c.texto)}</textarea>`)}<div><p class="label" style="margin-bottom:6px">Inserir campo automático</p><div class="chips">${VARS.map(v => `<button type="button" class="chip var-chip" data-var-ins="{${v}}">{${v}}</button>`).join('')}</div><p class="small muted" style="margin-top:8px">Nome, CPF, data, hora, idade e clínica entram sozinhos. {dias} e qualquer outro campo entre chaves (ex.: {acompanhante}) são perguntados na hora de usar.</p></div>`;
    if (M.tipo === 'texto') corpo += `${campo('Campo da consulta', `<select id="md-campo">${CAMPOS.map(([k, t]) => `<option value="${k}" ${k === c.campo ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`)}${campo('Texto padrão', `<textarea id="md-tx" rows="7">${esc(c.texto)}</textarea>`)}<label class="check"><input type="checkbox" id="md-auto" ${c.auto ? 'checked' : ''}> Já preencher este campo em toda nova consulta</label>`;
    corpo += `</form>`;
    abrirDialogo({
      titulo: novo ? `Novo modelo de ${nomeT}` : `Editar modelo de ${nomeT}`, largo: M.tipo === 'prescricao', corpo,
      rodape: `${novo ? '' : `<button class="btn btn-danger" data-m="del">${ICON.trash}Excluir</button>`}${M.tipo !== 'texto' ? `<button class="btn btn-ghost" data-m="prev">${ICON.doc}Ver PDF</button>` : ''}<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-m="ok">Salvar modelo</button>`,
      aoAbrir: (d, fechar) => {
        const drawRx = foco => { const ol = d.querySelector('#md-rx'); if (!ol) return; ol.innerHTML = rxItensHTML(c.itens, false).replaceAll('list="fav-list"', 'list="fav-list-md"').replace(/id="rx-/g, 'id="md-rx-'); if (foco) d.querySelector(`#md-rx-n-${c.itens.length - 1}`).focus(); };
        const drawEx = foco => { const ul = d.querySelector('#md-ex'); if (!ul) return; ul.innerHTML = c.exames.map((e, i) => `<li><label class="sr-only" for="md-ex-${i}">Exame ${i + 1}</label><input id="md-ex-${i}" data-ex="${i}" value="${esc(e.nome)}" placeholder="Ex.: Hemograma completo"><button type="button" class="icon-btn" data-m="ex-del" data-i="${i}" aria-label="Remover exame ${i + 1}">${ICON.trash}</button></li>`).join(''); if (foco) d.querySelector(`#md-ex-${c.exames.length - 1}`).focus(); };
        drawRx(); drawEx();
        const ler = () => {
          M.nome = d.querySelector('#md-nome').value.trim();
          if (M.tipo === 'prescricao') c.orientacoes = d.querySelector('#md-or').value;
          if (M.tipo === 'exames') c.indicacao = d.querySelector('#md-ind').value;
          if (M.tipo === 'atestado') { c.titulo = d.querySelector('#md-tit').value.trim(); c.texto = d.querySelector('#md-tx').value; }
          if (M.tipo === 'texto') { c.campo = d.querySelector('#md-campo').value; c.texto = d.querySelector('#md-tx').value; c.auto = d.querySelector('#md-auto').checked; }
        };
        d.addEventListener('input', e => {
          const el = e.target;
          if (el.dataset.rx != null) { const it = c.itens[+el.dataset.rx]; if (el.type === 'checkbox') { it[el.dataset.k] = el.checked; drawRx(); } else it[el.dataset.k] = el.value; }
          if (el.dataset.ex != null) c.exames[+el.dataset.ex].nome = el.value;
        });
        d.addEventListener('change', e => {
          const el = e.target; if (el.dataset.rx == null || el.dataset.k !== 'nome') return;
          const it = c.itens[+el.dataset.rx];
          const fav = S.favoritos.find(x => norm(x.nome) === norm(it.nome));
          if (fav && !it.posologia && !it.apresentacao) Object.assign(it, copiaItem(fav));
          if (!it.antimicrobiano && temTermo(it.nome, ANTIMICROBIANOS)) it.antimicrobiano = true;
          if (!it.controlado && temTermo(it.nome, CONTROLADOS)) it.controlado = true;
          drawRx();
        });
        d.addEventListener('click', async e => {
          const vi = e.target.closest('[data-var-ins]');
          if (vi) { const ta = d.querySelector('#md-tx'); const st = ta.selectionStart ?? ta.value.length; ta.value = ta.value.slice(0, st) + vi.dataset.varIns + ta.value.slice(ta.selectionEnd ?? st); ta.focus(); ta.selectionStart = ta.selectionEnd = st + vi.dataset.varIns.length; return; }
          const b = e.target.closest('[data-x], [data-m]'); if (!b) return;
          const x = b.dataset.x || b.dataset.m; const i = +b.dataset.i;
          if (x === 'rx-add') { c.itens.push(copiaItem({})); drawRx(true); }
          else if (x === 'rx-del') { c.itens.splice(i, 1); drawRx(); }
          else if (x === 'rx-up' || x === 'rx-down') { const j = x === 'rx-up' ? i - 1 : i + 1; if (j < 0 || j >= c.itens.length) return; [c.itens[i], c.itens[j]] = [c.itens[j], c.itens[i]]; drawRx(); }
          else if (x === 'ex-add') { c.exames.push({ nome: '' }); drawEx(true); }
          else if (x === 'ex-del') { c.exames.splice(i, 1); drawEx(); }
          else if (x === 'prev') {
            ler();
            const pac = { nome: 'Paciente Exemplo da Silva', data_nascimento: '1990-03-15', sexo: 'F', cpf: '000.000.000-00' };
            const base = { medico: S.perfil, clinica: S.clinicas[0] || { nome: 'Nome da clínica', cidade: 'Salvador', uf: 'BA' }, paciente: pac, data: new Date(), tamanho: S.perfil.pdf_tamanho || 'A4', marcaDagua: S.perfil.pdf_marca_dagua !== false };
            const ex = { paciente: pac.nome, cpf: pac.cpf, data: PDF.dataExtenso(new Date()), hora: '10h00', dias: '3 (três) dias', idade: idade(pac.data_nascimento), clinica: base.clinica.nome };
            const tx = String(c.texto || '').replace(/\{([^{}]+)\}/g, (m0, k) => ex[norm(k).trim()] || m0);
            if (M.tipo === 'prescricao') gerarEmostrar({ ...base, tipo: 'receita', itens: c.itens, orientacoes: c.orientacoes, incluirOrientacoes: true }, 'Exemplo do modelo');
            else if (M.tipo === 'exames') gerarEmostrar({ ...base, tipo: 'exames', exames: c.exames, indicacao: c.indicacao }, 'Exemplo do modelo');
            else gerarEmostrar({ ...base, tipo: 'atestado', titulo: c.titulo, texto: tx }, 'Exemplo do modelo');
          } else if (x === 'del') {
            fechar();
            if (!(await confirmar(`Excluir o modelo “${M.nome || orig.nome}”? As consultas que já usaram este modelo não mudam.`, { ok: 'Excluir', perigo: true, titulo: 'Excluir modelo' }))) return;
            try { await DB.modelos.remove(orig.id); S.modelos = await DB.modelos.list(); toast('Modelo excluído.'); depois && depois(); } catch (err) { falha(err); }
          } else if (x === 'ok') {
            ler();
            const n = d.querySelector('#md-nome');
            if (!M.nome) { erroCampo(n, 'Dê um nome ao modelo.'); n.focus(); return; } else erroCampo(n);
            if (M.tipo === 'prescricao') c.itens = c.itens.filter(it => it.nome.trim());
            if (M.tipo === 'exames') c.exames = c.exames.filter(it => it.nome.trim());
            const vazio = M.tipo === 'prescricao' ? !c.itens.length && !c.orientacoes.trim() : M.tipo === 'exames' ? !c.exames.length : !String(c.texto).trim();
            if (vazio) { toast('O modelo está vazio — preencha o conteúdo antes de salvar.', true); if (M.tipo === 'prescricao' && !c.itens.length) { c.itens.push(copiaItem({})); drawRx(); } if (M.tipo === 'exames' && !c.exames.length) { c.exames.push({ nome: '' }); drawEx(); } return; }
            await ocupado(b, async () => {
              try { await salvarModelo({ ...(novo ? {} : { id: orig.id }), tipo: M.tipo, nome: M.nome, conteudo: { ...c, sugerido: false } }); toast(novo ? 'Modelo criado.' : 'Modelo salvo como seu padrão.'); fechar(); depois && depois(); } catch (err) { falha(err); }
            });
          }
        });
      }
    });
  }

  /* =====================================================================
     Clínicas
     ===================================================================== */
  async function viewClinicas(main) {
    S.clinicas = await DB.clinicas.list();
    const ps = await pacientes(true);
    main.innerHTML = `
      <div class="page-head"><div><h1>Clínicas</h1><p class="muted small">O nome, o endereço e o telefone da clínica saem no cabeçalho e no rodapé dos documentos.</p></div><button class="btn btn-primary" data-x="nova">${ICON.plus}Nova clínica</button></div>
      ${S.clinicas.length ? `<ul class="list">${S.clinicas.map(c => { const n = ps.filter(p => p.clinicas.includes(c.id)).length; return `<li><button type="button" class="row" data-id="${esc(c.id)}"><span class="avatar" aria-hidden="true">${ICON.clinic.replace('<svg', '<svg width="22" height="22"')}</span><span class="grow"><span class="title">${esc(c.nome)} ${c.ativa === false ? '<span class="chip">Inativa</span>' : ''}</span><span class="meta"><span>${esc([c.endereco, c.bairro, [c.cidade, c.uf].filter(Boolean).join('/')].filter(Boolean).join(', ') || 'Endereço não informado')}</span>${c.telefone ? `<span>${esc(c.telefone)}</span>` : ''}<span>${n} ${n === 1 ? 'paciente' : 'pacientes'}</span></span></span>${ICON.chev.replace('<svg', '<svg class="chev"')}</button></li>`; }).join('')}</ul>`
        : `<div class="empty"><img src="${A['logo-symbol']}" alt=""><h3>Nenhuma clínica cadastrada</h3><p>Cadastre cada local onde você atende. Uma mesma paciente pode ser vinculada a várias clínicas.</p><button class="btn btn-primary" data-x="nova2">${ICON.plus}Cadastrar clínica</button></div>`}`;
    const abrir = c => dialogoClinica(c, () => viewClinicas(main));
    $$('[data-x^="nova"]', main).forEach(b => b.addEventListener('click', () => abrir(null)));
    $$('[data-id]', main).forEach(b => b.addEventListener('click', () => abrir(S.clinicas.find(c => c.id === b.dataset.id))));
  }
  function dialogoClinica(c, depois) {
    const novo = !c; c = c || { ativa: true, cidade: S.perfil.cidade || 'Salvador', uf: 'BA' };
    abrirDialogo({
      titulo: novo ? 'Nova clínica' : 'Editar clínica',
      corpo: `<form id="f-cl" class="grid grid-2" novalidate>
        ${campo('Nome da clínica *', `<input id="cl-nome" name="nome" value="${esc(c.nome)}" required>`, 'span-all')}
        ${campo('Endereço', `<input id="cl-end" name="endereco" value="${esc(c.endereco)}" placeholder="Rua, número, sala">`, 'span-all')}
        ${campo('Bairro', `<input id="cl-bai" name="bairro" value="${esc(c.bairro)}">`)}
        ${campo('CEP', `<input id="cl-cep" name="cep" value="${esc(c.cep)}" inputmode="numeric" maxlength="9">`)}
        ${campo('Cidade', `<input id="cl-cid" name="cidade" value="${esc(c.cidade)}">`)}
        ${campo('UF', `<select id="cl-uf" name="uf"><option value=""></option>${UFS.map(u => `<option ${u === c.uf ? 'selected' : ''}>${u}</option>`).join('')}</select>`)}
        ${campo('Telefone', `<input id="cl-tel" name="telefone" type="tel" value="${esc(c.telefone)}" inputmode="tel">`)}
        ${campo('E-mail', `<input id="cl-em" name="email" type="email" value="${esc(c.email)}" inputmode="email">`)}
        <label class="check span-all"><input type="checkbox" name="ativa" ${c.ativa !== false ? 'checked' : ''}> Clínica ativa (aparece para novas consultas)</label>
      </form>`,
      rodape: `${novo ? '' : `<button class="btn btn-danger" data-del>${ICON.trash}Excluir</button>`}<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>${novo ? 'Cadastrar' : 'Salvar'}</button>`,
      aoAbrir: (d, fechar) => {
        d.querySelector('[data-ok]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
          const v = lerForm(d.querySelector('#f-cl')); const n = d.querySelector('#cl-nome');
          if (!v.nome) { erroCampo(n, 'Informe o nome da clínica.'); n.focus(); return; }
          try { await DB.clinicas.save({ ...(novo ? {} : { id: c.id }), ...v }); S.clinicas = await DB.clinicas.list(); toast(novo ? 'Clínica cadastrada.' : 'Clínica atualizada.'); fechar(); depois && depois(); } catch (err) { falha(err); }
        }));
        const del = d.querySelector('[data-del]');
        if (del) del.addEventListener('click', async () => {
          fechar();
          if (!(await confirmar(`Excluir a clínica “${c.nome}”? Se houver pacientes ou consultas ligadas a ela, marque-a como inativa.`, { ok: 'Excluir', perigo: true, titulo: 'Excluir clínica' }))) return;
          try { await DB.clinicas.remove(c.id); S.clinicas = await DB.clinicas.list(); toast('Clínica excluída.'); depois && depois(); } catch (err) { falha(err); }
        });
      }
    });
  }

  /* =====================================================================
     Perfil e configurações
     ===================================================================== */
  async function viewPerfil(main) {
    const p = S.perfil;
    main.innerHTML = `
      <div class="page-head"><div><h1>Perfil</h1><p class="muted small">Estes dados saem na assinatura de todos os documentos.</p></div></div>
      <form id="f-perfil" class="card" novalidate>
        <h2 style="font-size:1.5rem;margin-bottom:16px">Dados profissionais</h2>
        <div class="grid grid-3">
          ${campo('Tratamento', `<select id="pf-t" name="tratamento">${['Dra.', 'Dr.', ''].map(t => `<option value="${t}" ${t === (p.tratamento ?? 'Dra.') ? 'selected' : ''}>${t || '(nenhum)'}</option>`).join('')}</select>`)}
          <div class="span-2">${campo('Nome profissional', `<input id="pf-n" name="nome" value="${esc(p.nome)}" autocomplete="name">`)}</div>
          ${campo('Especialidade', `<input id="pf-e" name="especialidade" value="${esc(p.especialidade || 'Ginecologia e Fertilidade')}">`)}
          ${campo('CRM', `<input id="pf-crm" name="crm" value="${esc(p.crm)}" inputmode="numeric">`)}
          ${campo('UF do CRM', `<select id="pf-uf" name="crm_uf">${UFS.map(u => `<option ${u === (p.crm_uf || 'BA') ? 'selected' : ''}>${u}</option>`).join('')}</select>`)}
          ${campo('RQE', `<input id="pf-rqe" name="rqe" value="${esc(p.rqe)}" inputmode="numeric">`)}
          ${campo('Telefone', `<input id="pf-tel" name="telefone" type="tel" value="${esc(p.telefone)}" inputmode="tel">`)}
          ${campo('Cidade', `<input id="pf-cid" name="cidade" value="${esc(p.cidade)}">`)}
        </div>
        <h2 class="rule">Documentos em PDF</h2>
        <fieldset style="border:0;padding:0;margin:0"><legend class="label">Tamanho do papel</legend>
          <div class="checks"><label class="check"><input type="radio" name="pdf_tamanho" value="A4" ${p.pdf_tamanho !== 'A5' ? 'checked' : ''}> A4 (padrão)</label><label class="check"><input type="radio" name="pdf_tamanho" value="A5" ${p.pdf_tamanho === 'A5' ? 'checked' : ''}> A5 (meia folha)</label></div></fieldset>
        <label class="check"><input type="checkbox" name="pdf_marca_dagua" ${p.pdf_marca_dagua !== false ? 'checked' : ''}> Marca d'água suave com o símbolo da logomarca</label>
        <div class="actions" style="margin-top:16px"><button class="btn btn-primary" type="submit">Salvar perfil</button><button class="btn btn-ghost" type="button" data-x="modelo">${ICON.doc}Ver modelo do receituário</button></div>
      </form>
      <section class="card">
        <div class="page-head" style="margin-bottom:8px"><h2 style="font-size:1.5rem">Medicamentos favoritos</h2><button class="btn btn-ghost" data-x="fav-novo">${ICON.plus}Novo favorito</button></div>
        <p class="muted small" style="margin-bottom:12px">Na prescrição, toque na estrela de um medicamento para guardá-lo aqui e reutilizar com um toque.</p>
        <ul class="list" id="fav-l"></ul>
      </section>
      <section class="card">
        <h2 style="font-size:1.5rem;margin-bottom:8px">Dados e segurança</h2>
        <p class="muted small">${DB.modo === 'demo' ? 'Modo demonstração: os dados ficam só neste navegador.' : `Conectado ao banco seguro (Supabase). Conta: ${esc(S.user.email)}.`} O prontuário deve ser guardado por no mínimo 20 anos (Lei 13.787/2018); baixe cópias de segurança periodicamente.</p>
        <div class="actions" style="margin-top:12px"><button class="btn btn-ghost" data-x="backup">${ICON.download}Baixar cópia de segurança</button>${DB.modo === 'demo' ? `<button class="btn btn-quiet" data-x="reset">Restaurar dados de exemplo</button>` : ''}<button class="btn btn-danger" data-x="sair">Sair</button></div>
      </section>`;
    const favL = $('#fav-l', main);
    const drawFav = () => { favL.innerHTML = S.favoritos.length ? S.favoritos.map(f => `<li class="row" style="cursor:default"><span class="grow"><span class="title">${esc(f.nome)} ${esc(f.apresentacao)}</span><span class="meta"><span>${esc(f.via)}</span>${f.quantidade ? `<span>${esc(f.quantidade)}</span>` : ''}${f.antimicrobiano ? '<span>antimicrobiano</span>' : ''}</span>${f.posologia ? `<span class="small muted">${esc(f.posologia)}</span>` : ''}</span><button class="icon-btn" data-delfav="${esc(f.id)}" aria-label="Remover ${esc(f.nome)} dos favoritos">${ICON.trash}</button></li>`).join('') : '<li class="muted small">Nenhum favorito ainda.</li>'; $$('[data-delfav]', favL).forEach(b => b.addEventListener('click', async () => { try { await DB.favoritos.remove(b.dataset.delfav); S.favoritos = S.favoritos.filter(x => x.id !== b.dataset.delfav); drawFav(); toast('Favorito removido.'); } catch (e) { falha(e); } })); };
    drawFav();
    $('#f-perfil', main).addEventListener('submit', async e => {
      e.preventDefault(); const v = lerForm(e.currentTarget);
      await ocupado($('button[type=submit]', e.currentTarget), async () => { try { S.perfil = await DB.perfil.save({ ...S.perfil, ...v }); toast('Perfil salvo.'); $$('.who b').forEach(b => b.textContent = nomeMedica()); } catch (err) { falha(err); } });
    });
    main.addEventListener('click', async e => {
      const b = e.target.closest('[data-x]'); if (!b) return;
      if (b.dataset.x === 'modelo') {
        const v = lerForm($('#f-perfil', main)); const perfilTmp = { ...S.perfil, ...v };
        const cl = S.clinicas[0] || { nome: 'Nome da clínica', endereco: 'Endereço da clínica', cidade: 'Salvador', uf: 'BA', telefone: '(71) 0000-0000' };
        try { const r = PDF.gerar({ medico: perfilTmp, clinica: cl, paciente: { nome: 'Paciente Exemplo da Silva', data_nascimento: '1990-03-15', sexo: 'F' }, data: new Date(), tamanho: perfilTmp.pdf_tamanho, marcaDagua: perfilTmp.pdf_marca_dagua, tipo: 'receita', itens: [{ nome: 'Ácido fólico', apresentacao: '5 mg', via: 'Oral', quantidade: '1 caixa', posologia: 'Tomar 1 comprimido por via oral, uma vez ao dia.' }, { nome: 'Exemplo de creme vaginal', apresentacao: 'bisnaga', via: 'Vaginal', quantidade: '1 bisnaga', posologia: 'Aplicar 1 aplicador à noite, por 7 noites.' }], orientacoes: '- Este é um modelo: os dados da paciente e os medicamentos são fictícios.\n- Retorno em 30 dias.' }); mostrarPDF(r, 'Modelo do receituário'); } catch (err) { falha(err); }
      } else if (b.dataset.x === 'fav-novo') dialogoFavorito(drawFav);
      else if (b.dataset.x === 'backup') ocupado(b, async () => {
        try {
          const dados = await DB.exportar(); const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
          const nome = `backup-consultorio-${new Date().toISOString().slice(0, 10)}.json`;
          if (downloadsCap) await downloadsCap.save({ filename: nome, data: blob });
          else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000); }
          toast('Cópia de segurança gerada.');
        } catch (err) { falha(err); }
      });
      else if (b.dataset.x === 'reset') { if (await confirmar('Apagar tudo o que foi feito na demonstração e restaurar os dados de exemplo?', { ok: 'Restaurar', perigo: true })) { DB.limpar(); await carregarBase(); S.pacientes = null; toast('Dados de exemplo restaurados.'); location.hash = '#inicio'; } }
      else if (b.dataset.x === 'sair') { await salvarPendente(); await DB.auth.signOut(); S.user = null; S.pacientes = null; telaAuth(); }
    });
  }
  function dialogoFavorito(depois) {
    abrirDialogo({
      titulo: 'Novo favorito',
      corpo: `<form id="f-fv" class="grid grid-2" novalidate>
        ${campo('Medicamento *', `<input id="fv-n" name="nome" required>`)}
        ${campo('Concentração / forma', `<input id="fv-a" name="apresentacao">`)}
        ${campo('Via', `<select id="fv-v" name="via">${VIAS.map(v => `<option>${v}</option>`).join('')}</select>`)}
        ${campo('Quantidade', `<input id="fv-q" name="quantidade">`)}
        <div class="span-all">${campo('Posologia', `<textarea id="fv-p" name="posologia" rows="3"></textarea>`)}</div>
        <label class="check span-all"><input type="checkbox" name="antimicrobiano"> Antimicrobiano (receita em 2 vias)</label>
      </form>`,
      rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Salvar favorito</button>`,
      aoAbrir: (d, fechar) => d.querySelector('[data-ok]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
        const v = lerForm(d.querySelector('#f-fv')); const n = d.querySelector('#fv-n');
        if (!v.nome) { erroCampo(n, 'Informe o medicamento.'); n.focus(); return; }
        try { const f = await DB.favoritos.save({ ...v, controlado: temTermo(v.nome, CONTROLADOS) }); S.favoritos.push(f); S.favoritos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')); toast('Favorito salvo.'); fechar(); depois(); } catch (err) { falha(err); }
      }))
    });
  }

  /* =====================================================================
     Inicialização
     ===================================================================== */
  async function iniciarModelos() {
    if (S.perfil.modelos_iniciados) return;
    if (!S.modelos.length) { await DB.modelos.saveMany(window.MODELOS_BASE.map(m => JSON.parse(JSON.stringify(m)))); S.modelos = await DB.modelos.list(); }
    try { S.perfil = await DB.perfil.save({ ...S.perfil, modelos_iniciados: true }); } catch (e) { console.warn(e); }
  }
  async function restaurarSugestoes() {
    const tem = new Set(S.modelos.map(m => m.tipo + '|' + norm(m.nome)));
    const faltam = window.MODELOS_BASE.filter(m => !tem.has(m.tipo + '|' + norm(m.nome))).map(m => JSON.parse(JSON.stringify(m)));
    if (faltam.length) await DB.modelos.saveMany(faltam);
    S.modelos = await DB.modelos.list();
    return faltam.length;
  }
  async function iniciarSessao() {
    S.user = await DB.auth.session();
    if (!S.user) return telaAuth();
    try { await carregarBase(); await iniciarModelos(); } catch (e) { falha(e); }
    moldura();
    await rotear();
  }
  DB.auth.onChange((ev, user) => {
    if (ev === 'PASSWORD_RECOVERY') { setTimeout(dialogoNovaSenha, 300); }
    if (ev === 'SIGNED_OUT' && S.user) { S.user = null; telaAuth(); }
  });
  iniciarSessao();
})();
