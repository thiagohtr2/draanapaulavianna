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
  // Área da consulta (assunto) e atendimento (primeira consulta / retorno / procedimento) são separados.
  // O número do retorno é contado sozinho dentro de cada área: uma "Primeira consulta" reinicia a contagem.
  const AREAS = ['Ginecológica', 'Obstétrica (pré-natal)', 'Fertilidade', 'Planejamento familiar', 'Climatério e menopausa', 'Outra'];
  const MODALIDADES = ['Primeira consulta', 'Retorno', 'Procedimento'];
  const areaDe = c => c.area || ({ Fertilidade: 'Fertilidade', 'Pré-natal': 'Obstétrica (pré-natal)' }[c.tipo]) || 'Ginecológica';
  const modalidadeDe = c => MODALIDADES.includes(c.tipo) ? c.tipo : 'Retorno';
  function rotulosConsultas(lista) {
    const out = {}, cont = {};
    [...(lista || [])].sort((a, b) => new Date(a.data) - new Date(b.data)).forEach(c => {
      const a = areaDe(c), m = modalidadeDe(c); let r;
      if (m === 'Primeira consulta') { cont[a] = 0; r = 'Primeira consulta'; }
      else if (m === 'Retorno') { cont[a] = (cont[a] || 0) + 1; r = `${cont[a]}º retorno`; }
      else r = 'Procedimento';
      out[c.id] = { area: a, modalidade: m, rotulo: r, texto: `${a} · ${r}` };
    });
    return out;
  }
  const AREA_VISUAL = {
    'Ginecológica': { cls: 'gine', curto: 'Ginecologia', icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="5.2"/><path d="M12 14.2V21M8.8 17.8h6.4"/></svg>' },
    'Obstétrica (pré-natal)': { cls: 'obst', curto: 'Pré-natal', icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="4.6" r="2"/><path d="M9.2 7.6c-1.6.6-2.4 2.3-2.4 4.4v3.2h2.4V21"/><path d="M10.8 7.8c1.3.4 2 1.4 2.1 2.6 2.6.3 4.4 2.1 4.4 4.3 0 2-1.6 3.4-3.7 3.6H12V21"/></svg>' },
    'Fertilidade': { cls: 'fert', curto: 'Fertilidade', icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21v-9"/><path d="M12 12c0-3.6-2.6-6.3-6.6-6.3 0 3.7 2.6 6.3 6.6 6.3z"/><path d="M12 14.5c0-3.4 2.4-6 6.4-6 0 3.5-2.5 6-6.4 6z"/></svg>' },
    'Planejamento familiar': { cls: 'plan', curto: 'Planejamento familiar', icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M12 17.6l-2.3-2.2a1.45 1.45 0 0 1 2.3-1.8 1.45 1.45 0 0 1 2.3 1.8z"/></svg>' },
    'Climatério e menopausa': { cls: 'clim', curto: 'Climatério', icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/><path d="M17 3.5v3M15.5 5h3"/></svg>' },
    'Outra': { cls: 'outra', curto: 'Outra', icone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5v5a4 4 0 0 0 8 0v-5"/><path d="M10 12.5v2.5a4.5 4.5 0 0 0 9 0v-2"/><circle cx="19" cy="11" r="2"/></svg>' }
  };
  const visualArea = a => AREA_VISUAL[a] || AREA_VISUAL['Outra'];
  // selo da área (ícone + nome curto), em destaque ao lado do nome da paciente
  const seloArea = (a, extra = '') => { const v = visualArea(a); return `<span class="area-selo area-${v.cls}" title="Consulta ${esc(a.toLowerCase())}">${v.icone}<span>${esc(v.curto)}${extra ? ` · ${esc(extra)}` : ''}</span></span>`; };
  const chipArea = a => seloArea(a);
  const VIAS = ['Oral', 'Vaginal', 'Tópico', 'Sublingual', 'Transdérmico', 'Intramuscular', 'Subcutâneo', 'Endovenoso', 'Nasal', 'Retal', 'Oftálmico', 'Inalatório', 'Outro'];
  // Detecção sugerida (ela pode desmarcar). Antimicrobianos: RDC 471/2021. Controle especial: Portaria 344/98 (lista C1).
  const ANTIMICROBIANOS = ['amoxicilina', 'ampicilina', 'azitromicina', 'cefalexina', 'cefuroxima', 'ceftriaxona', 'cefadroxila', 'ciprofloxacino', 'claritromicina', 'clindamicina', 'doxiciclina', 'eritromicina', 'fosfomicina', 'gentamicina', 'levofloxacino', 'metronidazol', 'nitrofurantoina', 'norfloxacino', 'penicilina', 'benzilpenicilina', 'secnidazol', 'sulfametoxazol', 'tinidazol', 'tetraciclina', 'ofloxacino'];
  const CONTROLADOS = ['fluoxetina', 'sertralina', 'escitalopram', 'citalopram', 'paroxetina', 'venlafaxina', 'desvenlafaxina', 'duloxetina', 'amitriptilina', 'nortriptilina', 'bupropiona', 'topiramato', 'gabapentina', 'pregabalina', 'carbamazepina', 'valproato', 'acido valproico', 'quetiapina', 'trazodona', 'misoprostol', 'mirtazapina'];
  const temTermo = (nome, lista) => { const n = norm(nome); return lista.some(t => n.includes(t)); };

  const ICON = {
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 20.5H5.5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4"/><path d="M15.5 16.5 20 12l-4.5-4.5M20 12H9"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>',
    seal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12.2 2.3 2.3 4.4-4.6"/></svg>',
    guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/><path d="M7 8h1.5M7 11h1.5M15.5 8H17M15.5 11H17"/></svg>',
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
  const S = { user: null, perfil: null, clinicas: [], pacientes: null, favoritos: [], modelos: [], valores: [] };
  async function carregarBase() {
    const [perfil, clinicas, favoritos, modelos, valores] = await Promise.all([DB.perfil.get(), DB.clinicas.list(), DB.favoritos.list(), DB.modelos.list(), DB.valores.list().catch(() => [])]);
    S.perfil = perfil || {}; S.clinicas = clinicas; S.favoritos = favoritos; S.modelos = modelos; S.valores = valores;
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
  function areaTexto(id, name, valor, { rot, linhas = 4, ph = '', padrao = true, campo, attrs = '' } = {}) {
    const key = campo || String(name || '').replace(/^registro\./, '');
    const mic = SR ? `<button type="button" class="tool-btn mic" data-mic="${id}" aria-pressed="false" aria-label="Ditar ${esc(rot || '')} por voz">${ICON.mic}</button>` : '';
    const pad = padrao && key ? `<button type="button" class="pad-btn" data-padrao="${esc(key)}" data-alvo="${id}" data-rot="${esc(rot || '')}" aria-label="Textos padrão de ${esc(rot || '')}">${ICON.text}<span>Padrões</span></button>` : '';
    return `<div class="field"><div class="ta-head"><label for="${id}" class="label">${rot}</label>${mic || pad ? `<div class="ta-tools">${mic}${pad}</div>` : ''}</div><textarea id="${id}" ${name ? `name="${name}"` : ''} ${attrs} rows="${linhas}" placeholder="${esc(ph)}">${esc(valor)}</textarea></div>`;
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

  function mostrarPDF(r, titulo, naoSalvo, { imprimir = false, aviso = '' } = {}) {
    const url = URL.createObjectURL(r.blob);
    const file = typeof File === 'function' ? new File([r.blob], r.nomeArquivo, { type: 'application/pdf' }) : null;
    const podeCompartilhar = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
    const ehToque = matchMedia('(pointer: coarse)').matches;
    const previa = !ehToque && innerWidth >= 900 && !downloadsCap;
    const avisos = (r.avisos || []).map(a => `<div class="alert">${ICON.alert}<p>${esc(a)}</p></div>`).join('') + (aviso ? `<div class="alert info">${ICON.alert}<p>${aviso}</p></div>` : '');
    abrirDialogo({
      titulo, largo: previa,
      corpo: `<div class="stack">${naoSalvo ? `<div class="alert">${ICON.alert}<p>Pré-visualização: este PDF ainda <b>não foi salvo</b> na ficha da paciente. Feche e use “Salvar” ou “Salvar e gerar” para guardar.</p></div>` : ''}${avisos}
        ${previa ? `<iframe class="pdf-frame" src="${url}" title="Pré-visualização do PDF"></iframe>` : `<div class="summary-card"><b>${esc(r.nomeArquivo)}</b><p class="muted small">${r.paginas} ${r.paginas === 1 ? 'página' : 'páginas'} · pronto para imprimir, enviar ou salvar</p></div>`}
        </div>`,
      rodape: `${podeCompartilhar ? `<button class="btn btn-ghost" data-share>${ICON.share}Enviar</button>` : ''}
        ${downloadsCap ? `<button class="btn ${imprimir ? 'btn-ghost' : 'btn-primary'}" data-save>${ICON.download}Baixar PDF</button>` : `<a class="btn btn-ghost" href="${url}" target="_blank" rel="noopener">${ICON.open}Abrir</a><a class="btn ${imprimir ? 'btn-ghost' : 'btn-primary'}" href="${url}" download="${esc(r.nomeArquivo)}">${ICON.download}Baixar PDF</a>`}
        ${imprimir ? `<button class="btn btn-primary" data-print>${ICON.doc}Imprimir tudo</button>` : ''}`,
      aoAbrir: d => {
        const pr = d.querySelector('[data-print]'); if (pr) pr.addEventListener('click', () => imprimirPDF(url));
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
          <div class="who"><b>${esc(nomeMedica())}</b><br><span class="wrap-any">${esc(S.user.email || '')}</span>
            <button type="button" class="btn btn-quiet sair-btn" data-acao="sair">${ICON.logout}Sair da conta</button></div>
        </aside>
        <div>
          ${demo ? `<div class="demo-banner" role="note"><b>Modo demonstração:</b> dados de exemplo, salvos só neste navegador. Não use dados reais de pacientes.</div>` : ''}
          <header class="topbar logado">
            <a class="brand" href="#inicio" aria-label="Início"><img src="${A['logo-symbol']}" alt=""><span><b>${MARCA_NOME}</b><small>${MARCA_ESP}</small></span></a>
            <span class="spacer"></span>
            <button class="icon-btn" data-acao="nova-consulta" aria-label="Nova consulta">${ICON.plus}</button>
            <button class="icon-btn" data-acao="sair" aria-label="Sair da conta" title="Sair da conta">${ICON.logout}</button>
          </header>
          <main id="main" class="main" tabindex="-1"></main>
        </div>
        <nav class="bottomnav" aria-label="Seções">${NAV.map(([r, t, i]) => `<a href="#${r}" data-nav="${r}">${ICON[i]}<span>${t}</span></a>`).join('')}</nav>
      </div>
      <div class="toasts" id="toasts" aria-live="polite"></div>`;
    $$('[data-acao="nova-consulta"]').forEach(b => b.addEventListener('click', () => dialogoNovaConsulta()));
    $$('[data-acao="sair"]').forEach(b => b.addEventListener('click', sairDaConta));
  }
  async function sairDaConta() {
    if (!(await confirmar(`Sair da conta de ${nomeMedica()}? O que estava aberto já fica salvo.`, { ok: 'Sair', titulo: 'Sair da conta' }))) return;
    try { await salvarPendente(); } catch (e) { /* segue para sair */ }
    await DB.auth.signOut(); S.user = null; S.pacientes = null; location.hash = ''; telaAuth();
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
      else if (h === 'valores') { sec = 'clinicas'; await viewValores(main); }
      else if (h === 'producao') { sec = 'inicio'; await viewProducao(main); }
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
    const iniMes = new Date(); iniMes.setDate(1); iniMes.setHours(0, 0, 0, 0);
    const csMes = await DB.consultas.list({ desde: iniMes.toISOString() }).catch(() => []);
    const prodMes = csMes.filter(c => new Date(c.data) >= iniMes).reduce((a, c) => a + (Number(c.valor) || 0), 0);
    const prodHoje = csMes.filter(c => new Date(c.data) >= hoje()).reduce((a, c) => a + (Number(c.valor) || 0), 0);
    const ult = cs.filter(c => c.status === 'finalizada').slice(0, 6);
    const rotP = {}; ps.forEach(p => Object.assign(rotP, rotulosConsultas(p.consultas)));
    const linha = c => { const cl = clinicaPorId(c.clinica_id); const rt = rotP[c.id] || rotulosConsultas([c])[c.id]; return `<li><a class="row" href="#consulta-${esc(c.id)}"><span class="avatar" aria-hidden="true">${esc(iniciais(nomeP(c.paciente_id)))}</span><span class="grow"><span class="title nome-selo">${esc(nomeP(c.paciente_id))}${seloArea(rt.area, rt.rotulo)}</span><span class="meta"><span>${fmtData(c.data)} · ${fmtHora(c.data)}</span><span>${esc(cl ? cl.nome : '')}</span></span></span>${c.status === 'rascunho' ? '<span class="chip warn">Em andamento</span>' : ''}${ICON.chev.replace('<svg', '<svg class="chev"')}</a></li>`; };
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
        <a class="stat stat-link" role="listitem" href="#producao"><b>${PDF.brl(prodMes)}</b><span>a receber no mês${prodHoje ? ` · hoje ${PDF.brl(prodHoje)}` : ''}</span></a>
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
  const FP_PADRAO = { busca: '', ordem: 'nome', clinica: '', periodo: '', convenio: '', area: '' };
  let FP = (() => { try { return { ...FP_PADRAO, ...JSON.parse(localStorage.getItem(FP_KEY) || '{}'), busca: '' }; } catch (e) { return { ...FP_PADRAO }; } })();
  const salvarFP = () => { try { localStorage.setItem(FP_KEY, JSON.stringify({ ...FP, busca: '' })); } catch (e) { /* sem armazenamento */ } };
  const ORDENS = [['nome', 'Nome (A–Z)'], ['nome_desc', 'Nome (Z–A)'], ['ultima', 'Última consulta (mais recente)'], ['ultima_antiga', 'Última consulta (mais antiga)'], ['clinica', 'Clínica (agrupar)'], ['idade', 'Idade (mais nova)'], ['idade_desc', 'Idade (mais velha)'], ['cadastro', 'Cadastro mais recente']];
  const PERIODOS = [['', 'Qualquer data'], ['30', 'Nos últimos 30 dias'], ['180', 'Nos últimos 6 meses'], ['365+', 'Há mais de 1 ano'], ['nunca', 'Nunca consultou']];

  async function viewPacientes(main) {
    main.innerHTML = `<div class="skeleton"></div>`;
    const ps = await pacientes(true);
    if (filtroClinica) { FP.clinica = filtroClinica; filtroClinica = ''; }
    if (FP.clinica && !S.clinicas.some(c => c.id === FP.clinica)) FP.clinica = '';
    ps.forEach(p => { const rt = rotulosConsultas(p.consultas); p.hist = (p.consultas || []).map(c => ({ ...rt[c.id], data: c.data, status: c.status })); p.areaUltima = p.hist.length ? p.hist[0].area : ''; });
    const convenios = [...new Set(ps.map(p => (p.convenio || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (FP.convenio && !convenios.includes(FP.convenio)) FP.convenio = '';
    const sel = (id, rot, opts, val) => campo(rot, `<select id="${id}">${opts.map(([v, t]) => `<option value="${esc(v)}" ${v === val ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`);
    main.innerHTML = `
      <div class="page-head"><div><h1>Pacientes</h1><p class="muted small">${ps.length} ${ps.length === 1 ? 'paciente cadastrada' : 'pacientes cadastradas'}</p></div>
        <button class="btn btn-primary" data-x="nova">${ICON.plus}Nova paciente</button></div>
      <section class="card filtros" aria-label="Busca e filtros">
        <div class="search"><label class="sr-only" for="busca">Buscar paciente</label>${ICON.search}<input id="busca" type="search" placeholder="Buscar por nome, CPF, telefone, convênio ou área" autocomplete="off" value="${esc(FP.busca)}"></div>
        <div class="filtros-grid">
          ${sel('f-ordem', 'Ordenar por', ORDENS, FP.ordem)}
          ${sel('f-clinica', 'Clínica', [['', 'Todas as clínicas'], ...S.clinicas.map(c => [c.id, c.nome]), ['__sem', 'Sem clínica vinculada']], FP.clinica)}
          ${sel('f-periodo', 'Última consulta', PERIODOS, FP.periodo)}
          ${sel('f-area', 'Área da última consulta', [['', 'Todas as áreas'], ...AREAS.map(a => [a, a])], FP.area)}
          ${sel('f-convenio', 'Convênio', [['', 'Todos'], ...convenios.map(c => [c, c])], FP.convenio)}
        </div>
        <div class="filtros-foot"><p class="small muted" id="res-count" aria-live="polite"></p><button type="button" class="btn btn-quiet" data-x="limpar">Limpar filtros</button></div>
      </section>
      <div id="lista-p"></div>`;
    const lista = $('#lista-p', main), busca = $('#busca', main);
    const agoraMs = Date.now(), DIA = 864e5;
    const idadeAnos = p => { if (!p.data_nascimento) return null; const d = new Date(p.data_nascimento + 'T12:00:00'); return (agoraMs - d) / (365.25 * DIA); };
    const linha = p => `<li><a class="row" href="#paciente-${esc(p.id)}"><span class="avatar" aria-hidden="true">${esc(iniciais(p.nome))}</span><span class="grow"><span class="title nome-selo">${esc(p.nome)}${p.hist.length ? seloArea(p.hist[0].area) : ''}</span><span class="meta">${idade(p.data_nascimento) ? `<span>${idade(p.data_nascimento)}</span>` : ''}${p.convenio ? `<span>${esc(p.convenio)}</span>` : ''}${p.ultima ? '' : '<span>Sem consultas</span>'}</span>${p.hist.length ? `<span class="hist-cons"><span class="hist-ult"><b>${esc(p.hist[0].rotulo)}</b><span class="muted">${p.hist[0].status === 'rascunho' ? 'em andamento · ' : ''}${fmtData(p.hist[0].data)}</span></span>${p.hist.length > 1 ? `<span class="small muted hist-ant">Antes: ${p.hist.slice(1, 4).map(h => `${esc(h.area === p.hist[0].area ? h.rotulo : h.texto)} (${fmtCurta(h.data)})`).join(' · ')}${p.hist.length > 4 ? ` · +${p.hist.length - 4}` : ''}</span>` : ''}</span>` : ''}${p.clinicas.length ? `<span class="chips">${p.clinicas.map(id => clinicaPorId(id)).filter(Boolean).map(c => `<span class="chip">${esc(c.nome)}</span>`).join('')}</span>` : ''}</span>${ICON.chev.replace('<svg', '<svg class="chev"')}</a></li>`;
    const desenhar = () => {
      FP.busca = busca.value; salvarFP();
      const q = norm(FP.busca).trim(); const qd = q.replace(/\D/g, '');
      let fs = ps.filter(p => {
        if (q && !(norm(p.nome).includes(q) || norm(p.nome_social).includes(q) || norm(p.email).includes(q) || norm(p.convenio).includes(q) || norm(p.areaUltima).includes(q) || (qd.length >= 3 && ((p.cpf || '').replace(/\D/g, '').includes(qd) || (p.telefone || '').replace(/\D/g, '').includes(qd))))) return false;
        if (FP.clinica === '__sem' ? p.clinicas.length : FP.clinica && !p.clinicas.includes(FP.clinica)) return false;
        if (FP.convenio && (p.convenio || '').trim() !== FP.convenio) return false;
        if (FP.area && p.areaUltima !== FP.area) return false;
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
      const ativos = [FP.busca.trim(), FP.clinica, FP.periodo, FP.convenio, FP.area].filter(Boolean).length;
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
    [['#f-ordem', 'ordem'], ['#f-clinica', 'clinica'], ['#f-periodo', 'periodo'], ['#f-area', 'area'], ['#f-convenio', 'convenio']].forEach(([id, k]) => $(id, main).addEventListener('change', e => { FP[k] = e.target.value; desenhar(); }));
    main.querySelector('[data-x="limpar"]').addEventListener('click', () => { FP = { ...FP_PADRAO, ordem: FP.ordem }; busca.value = ''; ['#f-clinica', '#f-periodo', '#f-area', '#f-convenio'].forEach(id => { $(id, main).value = ''; }); desenhar(); busca.focus(); });
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

  let abaFicha = 'cons';
  async function viewPaciente(main, id) {
    main.innerHTML = `<div class="skeleton"></div>`;
    let [p, cs, docs] = await Promise.all([DB.pacientes.get(id), DB.consultas.list({ pacienteId: id }), DB.documentos.list({ pacienteId: id })]);
    if (!p) { main.innerHTML = `<div class="empty"><h2>Paciente não encontrada</h2><p><a href="#pacientes">Voltar para pacientes</a></p></div>`; return; }
    let filtro = '';
    const clinsDasConsultas = [...new Set(cs.map(c => c.clinica_id))].map(clinicaPorId).filter(Boolean);
    const fato = (rot, v) => v ? `<div class="fact"><span class="label">${rot}</span><div class="v">${esc(v)}</div></div>` : '';
    main.innerHTML = `
      <a class="back" href="#pacientes">${ICON.back}Pacientes</a>
      <section class="card">
        <div class="pac-head"><span class="avatar" aria-hidden="true">${esc(iniciais(p.nome))}</span>
          <div><h1 class="wrap-any" style="font-size:clamp(1.7rem,1.3rem + 1.5vw,2.3rem)">${esc(p.nome)}</h1>${cs.length ? `<p class="nome-selo">${(r => seloArea(r.area, r.rotulo))(rotulosConsultas(cs)[cs[0].id])}${cs[0].status === 'rascunho' ? '<span class="chip warn">Em andamento</span>' : `<span class="small muted">última em ${fmtData(cs[0].data)}</span>`}</p>` : ''}
            <p class="muted small">${[p.nome_social ? `Nome social: ${p.nome_social}` : '', idade(p.data_nascimento), p.data_nascimento ? `nasc. ${fmtData(p.data_nascimento)}` : '', p.convenio].filter(Boolean).map(esc).join(' · ')}</p></div></div>
        ${p.clinicas.length ? `<div class="chips" style="margin-top:12px">${p.clinicas.map(clinicaPorId).filter(Boolean).map(c => `<span class="chip">${esc(c.nome)}</span>`).join('')}</div>` : ''}
        ${temAlergia(p.alergias) ? `<div class="alert danger" style="margin-top:16px">${ICON.alert}<p><b>Alergias:</b> ${esc(p.alergias)}</p></div>` : ''}
        <div class="pac-facts">${fato('Telefone', p.telefone)}${fato('E-mail', p.email)}${fato('CPF', p.cpf)}${fato('Carteirinha', p.carteirinha)}${fato('Profissão', p.profissao)}${fato('Endereço', [p.endereco, [p.cidade, p.uf].filter(Boolean).join('/')].filter(Boolean).join(' — '))}${fato('Antecedentes', p.antecedentes)}${fato('Medicações em uso', p.medicacoes_uso)}${fato('Observações', p.observacoes)}</div>
        <div class="actions" style="margin-top:20px"><button class="btn btn-primary" data-x="nova">${ICON.plus}Nova consulta</button><button class="btn btn-ghost" data-x="editar">Editar ficha</button></div>
      </section>
      <div class="tabs abas-ficha" role="tablist" aria-label="Histórico da paciente">
        <button type="button" role="tab" id="tab-cons" aria-controls="pn-cons" aria-selected="${abaFicha !== 'docs'}" data-aba="cons">Consultas (${cs.length})</button>
        <button type="button" role="tab" id="tab-docs" aria-controls="pn-docs" aria-selected="${abaFicha === 'docs'}" data-aba="docs">Documentos (<span id="n-docs">${docs.length}</span>)</button>
      </div>
      <div id="pn-cons" role="tabpanel" aria-labelledby="tab-cons" ${abaFicha === 'docs' ? 'hidden' : ''}>
        ${clinsDasConsultas.length > 1 ? `<div class="filter-chips" role="group" aria-label="Filtrar consultas por clínica"><button type="button" data-f="" aria-pressed="true">Todas</button>${clinsDasConsultas.map(c => `<button type="button" data-f="${esc(c.id)}" aria-pressed="false">${esc(c.nome)}</button>`).join('')}</div>` : ''}
        <div id="tl"></div>
      </div>
      <div id="pn-docs" role="tabpanel" aria-labelledby="tab-docs" ${abaFicha === 'docs' ? '' : 'hidden'}>
        <div class="page-head" style="margin:0 0 12px"><p class="muted small">Tudo o que foi emitido para ${esc((p.nome || '').split(' ')[0])}, com data e hora. Abra para imprimir, baixar ou reenviar.</p><div class="actions"><button type="button" class="btn btn-ghost" data-x="juntar-docs">${ICON.doc}Juntar em um PDF</button><button type="button" class="btn btn-ghost" data-x="enviar-docs">${ICON.share}Enviar</button><button type="button" class="btn btn-primary" data-x="novo-doc">${ICON.plus}Novo documento</button></div></div>
        <div class="filter-chips" role="group" aria-label="Filtrar documentos por tipo" style="margin-bottom:12px"><button type="button" data-fd="" aria-pressed="true">Todos</button>${Object.entries(NOME_DOC).map(([k, t]) => `<button type="button" data-fd="${k}" aria-pressed="false">${t}</button>`).join('')}</div>
        <div id="docs-pac"></div>
      </div>`;
    const tl = $('#tl', main);
    const rotCs = rotulosConsultas(cs);
    const desenhar = () => {
      const lst = cs.filter(c => !filtro || c.clinica_id === filtro);
      if (!lst.length) { tl.innerHTML = `<div class="empty" style="margin-top:12px"><h3>Nenhuma consulta registrada</h3><p>Inicie a primeira consulta desta paciente — o prontuário fica guardado aqui, por data e por clínica.</p></div>`; return; }
      let ano = null, html = '';
      lst.forEach(c => {
        const y = new Date(c.data).getFullYear();
        if (y !== ano) { if (ano !== null) html += '</ol>'; html += `<p class="year">${y}</p><ol class="timeline">`; ano = y; }
        const cl = clinicaPorId(c.clinica_id); const r = c.registro || {};
        const resumo = r.hipotese || r.motivo || '';
        const rt = rotCs[c.id];
        html += `<li class="${c.status}"><a class="row" href="#consulta-${esc(c.id)}"><span class="grow"><span class="title nome-selo">${fmtCurta(c.data)} · ${esc(rt.rotulo)}${seloArea(rt.area)}</span><span class="meta"><span>${fmtHora(c.data)}</span><span>${esc(cl ? cl.nome : '')}</span>${(n => n ? `<span>${n} ${n === 1 ? 'documento' : 'documentos'}</span>` : '')(docs.filter(d => d.consulta_id === c.id).length)}</span>${resumo ? `<span class="small wrap-any">${esc(resumo.length > 140 ? resumo.slice(0, 140) + '…' : resumo)}</span>` : ''}</span>${c.status === 'rascunho' ? '<span class="chip warn">Em andamento</span>' : '<span class="chip ok">Finalizada</span>'}</a></li>`;
      });
      tl.innerHTML = html + '</ol>';
    };
    $$('[data-f]', main).forEach(b => b.addEventListener('click', () => { filtro = b.dataset.f; $$('[data-f]', main).forEach(x => x.setAttribute('aria-pressed', String(x === b))); desenhar(); }));
    let filtroDoc = '';
    const desenharDocs = () => {
      const box = $('#docs-pac', main); const lst = docs.filter(d => !filtroDoc || d.tipo === filtroDoc);
      $('#n-docs', main).textContent = docs.length;
      box.innerHTML = !docs.length ? `<div class="empty"><h3>Nenhum documento emitido</h3><p>Receitas, atestados e solicitações emitidos para esta paciente ficam guardados aqui.</p></div>`
        : lst.length ? `<ul class="list">${lst.map(docLinhaHTML).join('')}</ul>` : `<p class="muted small">Nenhum documento deste tipo.</p>`;
      ligarLinhasDoc(box, recarregarDocs);
    };
    const recarregarDocs = async () => { docs = await DB.documentos.list({ pacienteId: id }); desenharDocs(); };
    $$('[data-fd]', main).forEach(b => b.addEventListener('click', () => { filtroDoc = b.dataset.fd; $$('[data-fd]', main).forEach(x => x.setAttribute('aria-pressed', String(x === b))); desenharDocs(); }));
    $$('[data-aba]', main).forEach(b => b.addEventListener('click', () => { abaFicha = b.dataset.aba; $$('[data-aba]', main).forEach(x => x.setAttribute('aria-selected', String(x === b))); $('#pn-cons', main).hidden = abaFicha === 'docs'; $('#pn-docs', main).hidden = abaFicha !== 'docs'; }));
    main.querySelector('[data-x="novo-doc"]').addEventListener('click', () => dialogoNovoDocumento(p, { depois: recarregarDocs }));
    main.querySelector('[data-x="juntar-docs"]').addEventListener('click', () => dialogoJuntar(p, docs));
    main.querySelector('[data-x="enviar-docs"]').addEventListener('click', () => { const v = docs.filter(d => !d.anulado_em); if (!v.length) return toast('Ainda não há documentos para enviar.', true); dialogoEnviar(p, v); });
    desenharDocs();
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
        ${campo('Data e hora', `<input id="nc-data" type="datetime-local" value="${toLocalInput()}">`)}
        ${campo('Área da consulta', `<select id="nc-area">${AREAS.map(a => `<option>${esc(a)}</option>`).join('')}</select>`)}
        ${campo('Atendimento', `<select id="nc-tipo">${MODALIDADES.map(t => `<option>${t}</option>`).join('')}</select>`)}
        <p class="span-all nc-dica" id="nc-dica" aria-live="polite"></p>
      </div></div>`;
    abrirDialogo({
      titulo: 'Nova consulta', corpo,
      rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok ${pac ? '' : 'disabled'}>Iniciar consulta</button>`,
      aoAbrir: (d, fechar) => {
        const ok = d.querySelector('[data-ok]');
        let consP = [], tocouTipo = false;
        const ar = d.querySelector('#nc-area'), tp = d.querySelector('#nc-tipo'), dica = d.querySelector('#nc-dica');
        const atualizarDica = () => {
          const nova = { id: '__nova', data: new Date().toISOString(), area: ar.value, tipo: tp.value };
          const rt = rotulosConsultas([...consP, nova]).__nova;
          const ant = consP.filter(c => areaDe(c) === ar.value);
          dica.innerHTML = `<span>Esta será:</span>${seloArea(rt.area, rt.rotulo)}<span class="muted">${ant.length ? `última em ${esc(visualArea(ar.value).curto.toLowerCase())}: ${fmtData(ant[0].data)}` : 'primeira nesta área'}</span>`;
        };
        const prepararPaciente = async p => {
          consP = p.consultas || await DB.consultas.list({ pacienteId: p.id }).catch(() => []);
          consP = [...consP].sort((a, b) => new Date(b.data) - new Date(a.data));
          if (consP.length) ar.value = areaDe(consP[0]);
          tocouTipo = false; tp.value = consP.some(c => areaDe(c) === ar.value) ? 'Retorno' : 'Primeira consulta';
          atualizarDica();
        };
        ar.addEventListener('change', () => { if (!tocouTipo) tp.value = consP.some(c => areaDe(c) === ar.value) ? 'Retorno' : 'Primeira consulta'; atualizarDica(); });
        tp.addEventListener('change', () => { tocouTipo = true; atualizarDica(); });
        if (pac) prepararPaciente(pac);
        const sel = p => { escolhida = p; prepararPaciente(p); d.querySelector('#nc-res').innerHTML = `<div class="summary-card"><span class="label">Paciente</span><div class="actions" style="align-items:center;justify-content:space-between"><b>${esc(p.nome)}</b><button class="btn btn-quiet" type="button" data-trocar>Trocar</button></div></div>`; d.querySelector('#nc-busca').closest('.field').hidden = true; d.querySelector('#nc-det').hidden = false; d.querySelector('#nc-cl').innerHTML = opcoesClinica(p); ok.disabled = false; d.querySelector('[data-trocar]').addEventListener('click', () => { escolhida = null; ok.disabled = true; d.querySelector('#nc-busca').closest('.field').hidden = false; d.querySelector('#nc-det').hidden = true; d.querySelector('#nc-res').innerHTML = ''; d.querySelector('#nc-busca').focus(); }); };
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
            const quando = dt ? new Date(dt).toISOString() : new Date().toISOString();
            if (ar.value === 'Fertilidade') {
              const ant = await cicloMaisRecente(escolhida.id, { antesDe: quando }).catch(() => null);
              const ci = ant && ant.registro.ciclo_tratamento;
              auto.ciclo_tratamento = ci && cicloAtivo(ci, quando) ? { ...copiaCiclo(ci), copiado_de: { id: ant.id, data: ant.data } } : cicloVazio(ci && ci.protocolo ? ci.protocolo : undefined);
            }
            const c = await DB.consultas.save({ paciente_id: escolhida.id, clinica_id, tipo: tp.value, area: ar.value, plano: (escolhida.convenio || '').trim() || PLANO_PADRAO, data: quando, status: 'rascunho', registro: { incluir_orientacoes: true, ...auto }, prescricao: [], exames: [], orientacoes: orientAuto, adendos: [] });
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
    salvando = DB.consultas.save({ id: snap.id, paciente_id: snap.paciente_id, clinica_id: snap.clinica_id, data: snap.data, tipo: snap.tipo, area: snap.area || areaDe(snap), plano: snap.plano || '', servico: snap.servico || '', valor: snap.valor ?? null, registro: snap.registro, prescricao: snap.prescricao, exames: snap.exames, orientacoes: snap.orientacoes })
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
    ['s-aval', 'Avaliação e conduta', r => r.hipotese || r.conduta || r.cid],
    ['s-ciclo', 'Ciclo e livreto', r => cicloTemConteudo(r.ciclo_tratamento)],
    ['s-docs', 'Documentos', r => DOCS_CONSULTA.length || docTemConteudo(r.doc_rascunho)]
  ];
  let DOCS_CONSULTA = [];

  async function viewConsulta(main, id) {
    main.innerHTML = `<div class="skeleton"></div>`;
    C = await DB.consultas.get(id);
    if (!C) { main.innerHTML = `<div class="empty"><h2>Consulta não encontrada</h2><p><a href="#inicio">Voltar ao início</a></p></div>`; return; }
    C.registro = C.registro || {}; C.adendos = C.adendos || [];
    [CP, DOCS_CONSULTA, CONS_PAC] = await Promise.all([DB.pacientes.get(C.paciente_id), DB.documentos.list({ consultaId: id }), DB.consultas.list({ pacienteId: C.paciente_id }).catch(() => [])]);
    if (C.status === 'finalizada') return leituraConsulta(main);
    edicaoConsulta(main);
  }

  let CONS_PAC = [];
  const rotuloDaConsulta = () => rotulosConsultas([...CONS_PAC.filter(c => c.id !== C.id), C])[C.id];
  function cabecalhoConsulta(extra) {
    const cl = clinicaPorId(C.clinica_id);
    return `<a class="back" href="#paciente-${esc(C.paciente_id)}">${ICON.back}Ficha da paciente</a>
      <div class="sticky-ctx"><div class="who"><span class="nome-selo"><b>${esc(CP.nome)}</b><span id="ctx-selo">${seloArea(rotuloDaConsulta().area, rotuloDaConsulta().rotulo)}</span></span><span class="muted small">${[idade(CP.data_nascimento), cl ? cl.nome : '', `${fmtData(C.data)} · ${fmtHora(C.data)}`].filter(Boolean).map(esc).join(' · ')}</span></div>${extra}</div>`;
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
    const fert = ehFertilidade(C);
    const sec = (i, corpo) => { const [id, tit, fn] = SECOES[i]; const ciclo = id === 's-ciclo'; return `<details class="sec" id="${id}" ${['s-queixa', 's-aval', 's-docs'].includes(id) || (ciclo && fert) || fn(r, C) ? 'open' : ''} ${ciclo && !fert ? 'hidden' : ''}><summary><span class="num" aria-hidden="true">${i + 1}</span><h2>${tit}</h2>${ICON.down.replace('<svg', '<svg class="tog"')}</summary><div class="body">${corpo}</div></details>`; };
    main.innerHTML = `
      ${cabecalhoConsulta(`<span id="savestate" class="savestate" role="status">Rascunho salvo</span>`)}
      <div class="consulta-grid">
        <nav class="secnav" aria-label="Seções da consulta">${SECOES.map(([id, t]) => `<a href="#${id}" data-sec="${id}" ${id === 's-ciclo' && !fert ? 'hidden' : ''}><span class="dot" aria-hidden="true"></span>${t}</a>`).join('')}</nav>
        <form id="f-consulta" novalidate autocomplete="off">
          <div class="card" style="margin-bottom:12px">
            <div class="grid grid-2 grid-4">
              ${campo('Clínica', `<select id="c-cl" name="clinica_id">${S.clinicas.filter(c => c.ativa !== false || c.id === C.clinica_id).map(c => `<option value="${esc(c.id)}" ${c.id === C.clinica_id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>`)}
              ${campo('Data e hora', `<input id="c-data" name="data" type="datetime-local" value="${toLocalInput(C.data)}">`)}
              ${campo('Área da consulta', `<select id="c-area" name="area">${[...new Set([...AREAS, areaDe(C)])].map(a => `<option ${a === areaDe(C) ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>`)}
              ${campo('Atendimento', `<select id="c-tipo" name="tipo">${MODALIDADES.map(t => `<option ${t === modalidadeDe(C) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`)}
            </div>
            ${faturamentoHTML()}
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
              ${cidCampo('r-cid', r.cid, { attrs: 'name="registro.cid"', desc: r.cid_desc })}
            </div>
            <div class="stack" style="margin-top:12px">${areaTexto('r-cond', 'registro.conduta', r.conduta, { rot: 'Conduta e plano', linhas: 4 })}${inp('Retorno', 'retorno', 'placeholder="Ex.: 30 dias, com exames"')}</div>`)}
          ${sec(5, `<p class="muted small">Medicações, controles e a data do procedimento deste ciclo. Ficam no prontuário, passam para a próxima consulta de fertilidade e montam o livreto da paciente: calendário de medicações, reta final, jejum e orientações.</p><div id="ciclo-corpo" style="margin-top:12px"></div>`)}
          ${sec(6, `<p class="muted small">Cada documento é salvo na ficha da paciente, com data e hora, assim que você gera o PDF. Você pode emitir quantos precisar.</p>
            <div id="docs-lista" style="margin-top:12px"></div>
            <p class="label" style="margin:16px 0 8px">Emitir documento</p>
            <div class="actions doc-tipos">${TIPOS_DOC.map(([t, rot]) => `<button type="button" class="btn btn-ghost" data-x="doc-novo" data-tipo="${t}" ${t === 'livreto' && !fert ? 'hidden' : ''}>${ICON.plus}${rot}</button>`).join('')}</div>
            <div id="doc-editor"></div>`)}
          <div class="bottombar">
            <button type="button" class="btn btn-ghost" data-x="ir-docs">${ICON.doc}Documentos</button>
            <button type="button" class="btn btn-primary" data-x="finalizar">${ICON.check}Finalizar consulta</button>
          </div>
          <p style="margin-top:16px;text-align:center"><button type="button" class="btn btn-quiet small" data-x="excluir">Excluir este rascunho</button></p>
        </form>
      </div>`;
    const f = $('#f-consulta', main);
    calcIMC(); mostrarCiclo(); marcarSecoes(); desenharDocsConsulta(); abrirEditorConsulta(); atualizarFaturamento(null);
    $('#s-ciclo', main).addEventListener('ciclo-redesenhar', () => desenharCicloConsulta());
    $('#c-valor').addEventListener('blur', e => { if (e.target.value.trim()) e.target.value = fmtValor(parseValor(e.target.value)); });

    f.addEventListener('input', e => {
      const el = e.target;
      if (el.closest('#doc-editor')) return;
      if (el.name && el.name.startsWith('registro.')) { const k = el.name.slice(9); C.registro[k] = el.type === 'checkbox' ? el.checked : el.value; if (k === 'peso' || k === 'altura') calcIMC(); if (k === 'cid' && !el.value) C.registro.cid_desc = ''; }
      else if (el.name === 'tipo' || el.name === 'area') { C[el.name] = el.value; const rc = $('#ctx-selo'); if (rc) rc.innerHTML = seloArea(rotuloDaConsulta().area, rotuloDaConsulta().rotulo); if (el.name === 'area') mostrarCiclo(); }
      else if (el.name === 'data') { if (el.value) C.data = new Date(el.value).toISOString(); }
      else if (el.name === 'plano' || el.name === 'servico') { C[el.name] = el.value; atualizarFaturamento(el.name); }
      else if (el.name === 'valor') { C.valor = parseValor(el.value); atualizarFaturamento('valor'); }
      else if (el.name === 'clinica_id') { C.clinica_id = el.value; atualizarFaturamento('clinica'); if (!CP.clinicas.includes(el.value)) DB.pacientes.vincular(CP.id, el.value).then(() => CP.clinicas.push(el.value)).catch(falha); }
      else return;
      agendarSalvar(); marcarSecoes();
    });
    f.addEventListener('cid-escolhido', e => {
      if (e.target.id !== 'r-cid') return;
      C.registro.cid = e.detail.codigo; C.registro.cid_desc = e.detail.descricao;
      const h = $('#r-hipotese'); if (h && !h.value.trim()) { h.value = e.detail.descricao; C.registro.hipotese = e.detail.descricao; }
      agendarSalvar(); marcarSecoes();
    });
    f.addEventListener('click', async e => {
      const b = e.target.closest('[data-x]'); if (!b || b.closest('#doc-editor')) return;
      const x = b.dataset.x;
      if (x === 'doc-novo' && b.dataset.tipo === 'livreto') { const s = $('#s-ciclo'); s.open = true; s.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
      if (x === 'livreto-previa' || x === 'livreto-salvar' || x === 'livreto-emitir') {
        const E = { tipo: 'livreto', clinica_id: C.clinica_id, ciclo: C.registro.ciclo_tratamento };
        if (x === 'livreto-previa') { try { const r = PDF.gerar(montarDadosPDF(E, CP)); mostrarPDF(r, 'Pré-visualização do livreto (ainda não salvo)', true); } catch (er) { falha(er); } return; }
        await ocupado(b, async () => { await salvarPendente(); await emitirDocumento(E, { paciente: CP, consultaId: C.id, emitido: async doc => { DOCS_CONSULTA.unshift(doc); desenharDocsConsulta(); marcarSecoes(); } }, { silencioso: x === 'livreto-salvar' }); });
        return;
      }
      if (x === 'ciclo-receita') {
        const itens = receitaDoCiclo(C.registro.ciclo_tratamento || {});
        if (!itens.length) return toast('Adicione as medicações do ciclo antes de montar a receita.', true);
        const atual = C.registro.doc_rascunho;
        if (docTemConteudo(atual) && !(await confirmar(`Há ${NOME_DOC[atual.tipo].toLowerCase()} em edição que ainda não foi emitida. Descartar e montar a receita do ciclo?`, { ok: 'Descartar e montar', perigo: true, titulo: 'Documento em edição' }))) return;
        C.registro.doc_rascunho = { ...estadoNovo('receita', C.clinica_id), itens };
        agendarSalvar(); const sd = $('#s-docs'); sd.open = true; abrirEditorConsulta(true);
        toast(`Receita montada com ${itens.length} ${itens.length === 1 ? 'medicação' : 'medicações'} do ciclo — confira apresentação e quantidade antes de emitir.`);
        return;
      }
      if (x === 'doc-novo') {
        const atual = C.registro.doc_rascunho;
        if (docTemConteudo(atual) && !(await confirmar(`Há ${NOME_DOC[atual.tipo].toLowerCase()} em edição que ainda não foi emitida. Descartar e começar ${NOME_DOC[b.dataset.tipo].toLowerCase()}?`, { ok: 'Descartar e começar', perigo: true, titulo: 'Documento em edição' }))) return;
        C.registro.doc_rascunho = estadoNovo(b.dataset.tipo, C.clinica_id); agendarSalvar(); abrirEditorConsulta(true);
      }
      else if (x === 'ir-docs') { const d = $('#s-docs'); d.open = true; d.scrollIntoView({ block: 'start' }); }
      else if (x === 'ficha') dialogoPaciente(CP, novo => { CP = novo; $('#resumo-ficha').outerHTML = resumoFicha(); });
      else if (x === 'finalizar') finalizar(b);
      else if (x === 'excluir') {
        if (!(await confirmar(`Excluir este rascunho de consulta? Esta ação não pode ser desfeita.${DOCS_CONSULTA.length ? ' Os documentos já emitidos continuam guardados na ficha da paciente.' : ''}`, { ok: 'Excluir rascunho', perigo: true, titulo: 'Excluir rascunho' }))) return;
        try { clearTimeout(salvarTimer); sujo = false; await DB.consultas.remove(C.id); toast('Rascunho excluído.'); location.hash = '#paciente-' + C.paciente_id; } catch (err) { falha(err); }
      }
    });
    $$('.secnav a', main).forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); const d = document.getElementById(a.dataset.sec); d.open = true; d.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); d.querySelector('summary').focus({ preventScroll: true }); }));
  }

  function desenharDocsConsulta() {
    const box = $('#docs-lista'); if (!box) return;
    const validos = DOCS_CONSULTA.filter(d => !d.anulado_em);
    box.innerHTML = DOCS_CONSULTA.length ? `<ul class="list">${DOCS_CONSULTA.map(docLinhaHTML).join('')}</ul>${validos.length ? `<div class="actions" style="margin-top:12px">${validos.length > 1 ? `<button type="button" class="btn btn-primary" data-ver-todos>${ICON.doc}Ver todos em um PDF</button>` : ''}<button type="button" class="btn btn-ghost" data-enviar-todos>${ICON.share}Enviar ${validos.length > 1 ? `os ${validos.length} documentos` : 'o documento'} para a paciente</button></div>${validos.length > 1 ? '<p class="small muted" style="margin-top:6px">“Ver todos” junta os documentos num PDF só, para imprimir de uma vez.</p>' : ''}` : ''}` : `<p class="muted small">Nenhum documento emitido nesta consulta ainda.</p>`;
    const et = box.querySelector('[data-enviar-todos]'); if (et) et.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); dialogoEnviar(CP, DOCS_CONSULTA); });
    const vt = box.querySelector('[data-ver-todos]'); if (vt) vt.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); ocupado(vt, () => verDocumentosJuntos(DOCS_CONSULTA, CP)); });
    ligarLinhasDoc(box, () => DB.documentos.list({ consultaId: C.id }).then(l => { DOCS_CONSULTA = l; desenharDocsConsulta(); }));
  }
  function abrirEditorConsulta(focar) {
    const box = $('#doc-editor'); if (!box) return;
    const E = C.registro.doc_rascunho;
    if (!E) { box.innerHTML = ''; return; }
    if (!E.clinica_id) E.clinica_id = C.clinica_id;
    editorDocumento(box, E, {
      paciente: CP, consultaId: C.id, data: C.data,
      mudou: () => { agendarSalvar(); marcarSecoes(); },
      emitido: async doc => { DOCS_CONSULTA.unshift(doc); delete C.registro.doc_rascunho; agendarSalvar(); await salvarPendente(); desenharDocsConsulta(); box.innerHTML = ''; marcarSecoes(); },
      descartar: () => { delete C.registro.doc_rascunho; agendarSalvar(); box.innerHTML = ''; marcarSecoes(); }
    });
    if (focar) box.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function calcIMC() {
    const out = $('#r-imc'); if (!out) return;
    const p = parseFloat(String(C.registro.peso || '').replace(',', '.'));
    let a = parseFloat(String(C.registro.altura || '').replace(',', '.'));
    if (a > 3) a = a / 100;
    out.value = p > 0 && a > 0 ? (p / (a * a)).toFixed(1).replace('.', ',') + ' kg/m²' : '';
  }
  function marcarSecoes() { $$('.secnav a').forEach(a => { const s = SECOES.find(x => x[0] === a.dataset.sec); a.classList.toggle('filled', !!s[2](C.registro, C)); }); }
  // seção do ciclo: só em consulta de fertilidade (os dados ficam guardados se a área mudar)
  function mostrarCiclo() {
    const fert = ehFertilidade(C); const s = $('#s-ciclo'); if (!s) return;
    s.hidden = !fert; $$('[data-sec="s-ciclo"], [data-x="doc-novo"][data-tipo="livreto"]').forEach(a => { a.hidden = !fert; });
    if (fert && !$('#ciclo-corpo .ciclo')) { if (!C.registro.ciclo_tratamento) C.registro.ciclo_tratamento = cicloVazio(); s.open = true; desenharCicloConsulta(); }
    let n = 0; SECOES.forEach(([id]) => { const d = document.getElementById(id); if (d && !d.hidden) d.querySelector('.num').textContent = ++n; });
  }
  function desenharCicloConsulta() {
    const box = $('#ciclo-corpo'); if (!box) return;
    const ci = C.registro.ciclo_tratamento || (C.registro.ciclo_tratamento = cicloVazio());
    box.innerHTML = cicloCamposHTML('cic', ci, { acoes: `<div class="actions ciclo-livreto">
        <button type="button" class="btn btn-ghost" data-x="livreto-previa">${ICON.open}Pré-visualizar livreto</button>
        <button type="button" class="btn btn-ghost" data-x="livreto-salvar">${ICON.check}Salvar livreto</button>
        <button type="button" class="btn btn-primary" data-x="livreto-emitir">${ICON.guide}Salvar e gerar livreto</button></div>
      <div class="actions"><button type="button" class="btn btn-quiet" data-x="ciclo-receita">${ICON.doc}Montar receita com estas medicações</button></div>` });
    ligarCiclo(box, ci, () => { agendarSalvar(); marcarSecoes(); });
  }

  /* =====================================================================
     Documentos: editor, emissão, arquivo da paciente
     ===================================================================== */
  const TIPOS_DOC = [['receita', 'Receita'], ['exames', 'Solicitação de exames'], ['atestado', 'Atestado'], ['orientacoes', 'Orientações / folheto'], ['orcamento', 'Orçamento'], ['livreto', 'Livreto do ciclo']];
  const NOME_DOC = { receita: 'Receita', exames: 'Solicitação de exames', atestado: 'Atestado', orientacoes: 'Orientações', orcamento: 'Orçamento', registro: 'Registro da consulta', livreto: 'Livreto do ciclo' };
  const ASSINAVEIS = ['receita', 'exames', 'atestado'];
  function estadoNovo(tipo, clinicaId) {
    const base = { tipo, clinica_id: clinicaId || '' };
    if (tipo === 'receita') return { ...base, itens: [], orientacoes: '', incluir_orientacoes: true, assinar: false };
    if (tipo === 'exames') return { ...base, exames: [{ nome: '' }], indicacao: '', assinar: false };
    if (tipo === 'atestado') return { ...base, titulo: 'Atestado médico', texto: '', cid: '', cid_desc: '', cid_aut: false, assinar: false };
    if (tipo === 'orcamento') return { ...base, ...orcamentoVazio() };
    if (tipo === 'livreto') return { ...base, ciclo: cicloVazio() };
    return { ...base, titulo: 'Orientações', referencia: '', data_ref: '', texto: '' };
  }
  const docTemConteudo = E => !!(E && (E.tipo === 'livreto' ? cicloTemConteudo(E.ciclo) : ((E.itens || []).some(i => (i.nome || i.descricao || '').trim()) || (E.exames || []).some(x => (x.nome || '').trim()) || (E.texto || '').trim() || (E.orientacoes || '').trim())));
  const copiaItem = i => ({ nome: i.nome || '', apresentacao: i.apresentacao || '', via: i.via || 'Oral', quantidade: i.quantidade || '', posologia: i.posologia || '', antimicrobiano: !!i.antimicrobiano, controlado: !!i.controlado });

  // Painel "Meus medicamentos": toque para adicionar
  const medsPainelHTML = pref => `<div class="meds">
      <div class="meds-head"><p class="label">Meus medicamentos — toque para adicionar</p><button type="button" class="btn btn-quiet" data-med-novo>${ICON.plus}Cadastrar medicamento</button></div>
      <div class="search"><label class="sr-only" for="${pref}-mq">Buscar nos meus medicamentos</label>${ICON.search}<input id="${pref}-mq" data-medq type="search" placeholder="Buscar nos meus medicamentos" autocomplete="off"></div>
      <div class="med-chips" data-lista="meds"></div></div>`;
  function desenharMeds(painel) {
    const lista = painel.querySelector('[data-lista="meds"]'); const q = norm(painel.querySelector('[data-medq]').value).trim();
    const m = S.favoritos.filter(f => !q || norm(f.nome + ' ' + f.apresentacao).includes(q)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    lista.innerHTML = !S.favoritos.length ? `<p class="muted small">Você ainda não cadastrou medicamentos. Toque em “Cadastrar medicamento” — ou, numa receita, na estrela de um item para guardá-lo.</p>`
      : m.length ? m.slice(0, 40).map(f => `<button type="button" class="med-chip" data-med="${esc(f.id)}"><span class="med-n">${esc(f.nome)}</span><span class="med-a">${esc([f.apresentacao, f.via].filter(Boolean).join(' · '))}</span>${ICON.plus}</button>`).join('') + (m.length > 40 ? `<p class="muted small">Mostrando 40 de ${m.length}. Refine a busca.</p>` : '')
      : `<p class="muted small">Nenhum medicamento encontrado.</p>`;
  }

  // Editor de um documento. E = estado (editado no lugar); ctx = { paciente, consultaId, data, mudou(), emitido(doc), descartar(), escolherClinica }
  function editorDocumento(box, E, ctx) {
    const pref = 'ed' + Math.random().toString(36).slice(2, 7);
    const titulos = { receita: 'Nova receita', exames: 'Nova solicitação de exames', atestado: 'Novo atestado', orientacoes: 'Novas orientações', orcamento: 'Novo orçamento', livreto: 'Livreto do ciclo' };
    const selClin = ctx.escolherClinica ? campo('Clínica (sai no cabeçalho)', `<select id="${pref}-cl" data-e="clinica_id">${S.clinicas.filter(c => c.ativa !== false || c.id === E.clinica_id).map(c => `<option value="${esc(c.id)}" ${c.id === E.clinica_id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>`) : '';
    let corpo = '';
    if (E.tipo === 'receita') corpo = `
      <div class="actions"><button type="button" class="btn btn-ghost" data-ed="usar-modelo">${ICON.layers}Usar receita padrão</button><button type="button" class="btn btn-quiet" data-ed="salvar-modelo">Salvar como receita padrão</button></div>
      ${medsPainelHTML(pref)}
      <p class="label">Medicamentos desta receita</p>
      <ol class="rx-list" data-lista="rx"></ol>
      <div class="actions"><button type="button" class="btn btn-quiet" data-ed="rx-add">${ICON.plus}Adicionar medicamento em branco</button></div>
      ${areaTexto(pref + '-or', '', E.orientacoes, { rot: 'Orientações (saem na receita)', linhas: 3, campo: 'orientacoes', attrs: 'data-e="orientacoes"', ph: 'Uma orientação por linha. Comece com “-” para virar tópico.' })}
      <label class="check"><input type="checkbox" data-e="incluir_orientacoes" ${E.incluir_orientacoes !== false ? 'checked' : ''}> Incluir as orientações na receita</label>`;
    else if (E.tipo === 'exames') corpo = `
      <div class="actions"><button type="button" class="btn btn-ghost" data-ed="usar-modelo">${ICON.layers}Usar pacote de exames</button><button type="button" class="btn btn-quiet" data-ed="salvar-modelo">Salvar como pacote</button></div>
      <p class="label">Exames</p>
      <ul class="ex-list" data-lista="ex"></ul>
      <div class="actions"><button type="button" class="btn btn-quiet" data-ed="ex-add">${ICON.plus}Adicionar exame</button></div>
      ${areaTexto(pref + '-ind', '', E.indicacao, { rot: 'Indicação clínica', linhas: 2, campo: 'indicacao_exames', attrs: 'data-e="indicacao"' })}`;
    else if (E.tipo === 'atestado') corpo = `
      <div class="actions"><button type="button" class="btn btn-ghost" data-ed="usar-modelo">${ICON.layers}Usar modelo de atestado</button><button type="button" class="btn btn-quiet" data-ed="salvar-modelo">Salvar como modelo</button></div>
      ${campo('Título do documento', `<input id="${pref}-tit" data-e="titulo" value="${esc(E.titulo)}">`)}
      ${areaTexto(pref + '-tx', '', E.texto, { rot: 'Texto do atestado', linhas: 6, padrao: false, attrs: 'data-e="texto"', ph: 'Escolha um modelo ou escreva o texto.' })}
      ${cidCampo(pref + '-cid', E.cid, { rot: 'CID-10 (opcional)', attrs: 'data-e="cid"', desc: E.cid_desc })}
      <label class="check"><input type="checkbox" data-e="cid_aut" ${E.cid_aut ? 'checked' : ''}> A paciente autorizou constar o CID no atestado</label>
      <p class="small muted">O CID só sai no atestado com a autorização expressa da paciente (Resolução CFM 2.381/2024).</p>`;
    else if (E.tipo === 'orcamento') corpo = `
      <div class="actions"><button type="button" class="btn btn-ghost" data-ed="usar-modelo">${ICON.layers}Usar orçamento padrão</button><button type="button" class="btn btn-quiet" data-ed="salvar-modelo">Salvar como orçamento padrão</button></div>
      ${orcamentoCamposHTML(pref, E)}`;
    else if (E.tipo === 'livreto') corpo = `<p class="small muted">${E.ciclo && E.ciclo.copiado_de ? '' : 'Ciclo em branco: preencha as medicações e as datas, ou gere o livreto assim para a paciente preencher à mão.'} As mudanças feitas aqui valem só para este livreto; o ciclo do prontuário fica na consulta de fertilidade.</p>${cicloCamposHTML(pref, E.ciclo)}`;
    else corpo = `
      <div class="actions"><button type="button" class="btn btn-ghost" data-ed="usar-modelo">${ICON.guide}Usar folheto padrão</button><button type="button" class="btn btn-quiet" data-ed="salvar-modelo">Salvar como folheto padrão</button></div>
      ${folhetoCamposHTML(pref, E, { editor: true })}`;
    if (ASSINAVEIS.includes(E.tipo)) corpo += `
      <div class="assin-box"><label class="check"><input type="checkbox" data-e="assinar" ${E.assinar ? 'checked' : ''}><span><b>Assinar digitalmente</b> com certificado ICP-Brasil — para enviar pelo WhatsApp ou e-mail, sem imprimir</span></label>
        <p class="small muted">Sai no modelo eletrônico: data e hora de emissão, QR Code e código de acesso para a farmácia validar em validar.iti.gov.br. Sem marcar, sai o seu receituário para imprimir e assinar à mão.</p></div>`;
    box.innerHTML = `<section class="doc-editor" aria-label="${esc(titulos[E.tipo])}">
        <div class="doc-editor-head"><h3>${esc(titulos[E.tipo])}</h3><button type="button" class="btn btn-quiet" data-ed="descartar">Descartar</button></div>
        <div class="stack">${selClin}${corpo}</div>
        <div class="actions doc-acoes"><button type="button" class="btn btn-ghost" data-ed="previa">${ICON.open}Pré-visualizar</button><button type="button" class="btn btn-ghost" data-ed="salvar">${ICON.check}Salvar</button><button type="button" class="btn btn-primary" data-ed="emitir">${E.assinar ? ICON.seal + 'Assinar e gerar PDF' : ICON.check + 'Salvar e gerar PDF'}</button></div>
      </section>`;
    const sec = box.querySelector('.doc-editor');
    const drawRx = foco => { const ol = sec.querySelector('[data-lista="rx"]'); if (!ol) return; ol.innerHTML = E.itens.length ? rxItensHTML(E.itens, true, pref) : `<li class="muted small">Toque num medicamento acima para adicioná-lo, ou use uma receita padrão.</li>`; if (foco) sec.querySelector(`#${pref}-n-${E.itens.length - 1}`)?.focus(); };
    const drawEx = foco => { const ul = sec.querySelector('[data-lista="ex"]'); if (!ul) return; ul.innerHTML = E.exames.length ? E.exames.map((x, i) => `<li><label class="sr-only" for="${pref}-ex-${i}">Exame ${i + 1}</label><input id="${pref}-ex-${i}" data-ex="${i}" value="${esc(x.nome)}" placeholder="Ex.: Hemograma completo"><button type="button" class="icon-btn" data-x="ex-del" data-i="${i}" aria-label="Remover exame ${i + 1}">${ICON.trash}</button></li>`).join('') : `<li class="muted small">Nenhum exame ainda.</li>`; if (foco) sec.querySelector(`#${pref}-ex-${E.exames.length - 1}`)?.focus(); };
    const meds = sec.querySelector('.meds');
    drawRx(); drawEx(); if (meds) desenharMeds(meds);
    const mudou = () => ctx.mudou && ctx.mudou();
    if (E.tipo === 'orcamento') ligarOrcamento(sec, E, mudou);
    if (E.tipo === 'orientacoes') ligarFolheto(sec, E, mudou);
    if (E.tipo === 'livreto') { ligarCiclo(sec, E.ciclo, mudou); sec.addEventListener('ciclo-redesenhar', () => editorDocumento(box, E, ctx)); }

    sec.addEventListener('input', e => {
      const el = e.target;
      if (el.matches('[data-medq]')) return desenharMeds(meds);
      if (el.dataset.rx != null) { const it = E.itens[+el.dataset.rx]; if (el.type === 'checkbox') { it[el.dataset.k] = el.checked; drawRx(); } else it[el.dataset.k] = el.value; }
      else if (el.dataset.ex != null) E.exames[+el.dataset.ex].nome = el.value;
      else if (el.dataset.e) {
        E[el.dataset.e] = el.type === 'checkbox' ? el.checked : el.value; if (el.dataset.e === 'cid' && !el.value) E.cid_desc = '';
        if (el.dataset.e === 'assinar') sec.querySelector('[data-ed="emitir"]').innerHTML = E.assinar ? ICON.seal + 'Assinar e gerar PDF' : ICON.check + 'Salvar e gerar PDF';
      }
      else return;
      mudou();
    });
    sec.addEventListener('cid-escolhido', e => { E.cid = e.detail.codigo; E.cid_desc = e.detail.descricao; mudou(); });
    sec.addEventListener('change', e => {
      const el = e.target; if (el.dataset.rx == null || el.dataset.k !== 'nome') return;
      const it = E.itens[+el.dataset.rx];
      const fav = S.favoritos.find(x => norm(x.nome) === norm(it.nome));
      let msg = '';
      if (fav && !it.posologia && !it.apresentacao) Object.assign(it, copiaItem(fav));
      if (!it.antimicrobiano && temTermo(it.nome, ANTIMICROBIANOS)) { it.antimicrobiano = true; msg = `${it.nome}: marcado como antimicrobiano (receita em 2 vias). Desmarque se não for.`; }
      if (!it.controlado && temTermo(it.nome, CONTROLADOS)) { it.controlado = true; msg = `${it.nome}: sujeito a controle especial — fica fora desta receita.`; }
      drawRx(); mudou(); if (msg) toast(msg);
    });
    sec.addEventListener('click', async e => {
      const med = e.target.closest('[data-med]');
      if (med) { const f = S.favoritos.find(x => x.id === med.dataset.med); if (f) { E.itens.push(copiaItem(f)); drawRx(); mudou(); toast(`${f.nome} adicionado à receita.`); } return; }
      if (e.target.closest('[data-med-novo]')) { dialogoMedicamento(null, () => desenharMeds(meds)); return; }
      const b = e.target.closest('[data-ed], [data-x]'); if (!b) return;
      const x = b.dataset.ed || b.dataset.x; const i = +b.dataset.i;
      if (x === 'rx-add') { E.itens.push(copiaItem({})); drawRx(true); mudou(); }
      else if (x === 'rx-del') { E.itens.splice(i, 1); drawRx(); mudou(); }
      else if (x === 'rx-up' || x === 'rx-down') { const j = x === 'rx-up' ? i - 1 : i + 1; if (j < 0 || j >= E.itens.length) return; [E.itens[i], E.itens[j]] = [E.itens[j], E.itens[i]]; drawRx(); mudou(); }
      else if (x === 'rx-star') salvarComoMedicamento(E.itens[i], b, () => meds && desenharMeds(meds));
      else if (x === 'ex-add') { E.exames.push({ nome: '' }); drawEx(true); mudou(); }
      else if (x === 'ex-del') { E.exames.splice(i, 1); drawEx(); mudou(); }
      else if (x === 'usar-modelo' && (E.tipo === 'orcamento' || E.tipo === 'orientacoes')) { if (await usarModeloNoEditor(E, ctx)) { editorDocumento(box, E, ctx); mudou(); const dr = box.querySelector('[data-f="data_ref"]'); if (dr && PDF.temDatas(E.texto) && !E.data_ref) dr.focus(); } }
      else if (x === 'usar-modelo') { if (await usarModeloNoEditor(E, ctx)) { const ta = sec.querySelector('[data-e="orientacoes"]'); if (ta) ta.value = E.orientacoes; const ti = sec.querySelector('[data-e="indicacao"]'); if (ti) ti.value = E.indicacao; const tx = sec.querySelector('[data-e="texto"]'); if (tx) tx.value = E.texto; const tt = sec.querySelector('[data-e="titulo"]'); if (tt) tt.value = E.titulo; drawRx(); drawEx(); mudou(); } }
      else if (x === 'salvar-modelo') salvarEditorComoModelo(E);
      else if (x === 'previa') { const err = validarDoc(E); if (err) return toast(err, true); try { const dados = montarDadosPDF(E, ctx.paciente); if (E.assinar && ASSINAVEIS.includes(E.tipo)) dados.digital = { codigo: '——', url: DB.assinatura.urlValidacao('pre-visualizacao'), previa: true }; const r = PDF.gerar(dados); mostrarPDF(r, 'Pré-visualização (ainda não salvo)', true); } catch (er) { falha(er); } }
      else if (x === 'emitir') await ocupado(b, () => emitirDocumento(E, ctx));
      else if (x === 'salvar') await ocupado(b, () => emitirDocumento(E, ctx, { silencioso: true }));
      else if (x === 'descartar') { if (docTemConteudo(E) && !(await confirmar('Descartar este documento? O que foi preenchido será perdido.', { ok: 'Descartar', perigo: true, titulo: 'Descartar documento' }))) return; ctx.descartar && ctx.descartar(); }
    });
  }

  /* =====================================================================
     Folhetos de orientação (texto com marcação simples + datas calculadas)
     ===================================================================== */
  const MARCAS_FOLHETO = [['# ', 'Título'], ['+ ', 'Pode'], ['x ', 'Evite'], ['1. ', 'Passo'], ['> ', 'Destaque'], ['@ {D+0} | ', 'Data na linha do tempo']];
  const DATAS_FOLHETO = ['{data_ref}', '{hora_ref}', '{D+1}', '{D-1}', '{H+0}', '{H-36}'];
  function folhetoCamposHTML(pref, c, { editor = false, modelo = false } = {}) {
    const usaDatas = PDF.temDatas(c.texto);
    return `<div class="stack folheto-campos">
      <div class="grid grid-2">
        ${campo('Título (sai no folheto)', `<input id="${pref}-ft" data-f="titulo" value="${esc(c.titulo || '')}" placeholder="Ex.: Inseminação intrauterina">`)}
        ${modelo ? campo('Data de referência — o que perguntar', `<input id="${pref}-fr" data-f="referencia" value="${esc(c.referencia || '')}" placeholder="Ex.: Data e hora da inseminação">`) : ''}
        ${editor ? campo(esc(c.referencia || 'Data e hora de referência'), `<input id="${pref}-fd" data-f="data_ref" type="datetime-local" value="${esc(c.data_ref || '')}">`, usaDatas ? 'destaque' : '') : ''}
      </div>
      ${editor ? `<p class="small muted" data-f-dica>${usaDatas ? 'As datas do folheto ({D+1}, {H-36}…) são calculadas a partir da data acima.' : 'Se o texto usar datas como {D+1} ou {H-36}, elas são calculadas a partir da data acima.'}</p>` : ''}
      <div><p class="label" id="${pref}-fl">Inserir</p>
        <div class="chips md-tools" role="group" aria-labelledby="${pref}-fl">${MARCAS_FOLHETO.map(([m, r]) => `<button type="button" class="chip var-chip" data-ins-linha="${esc(m)}"><b aria-hidden="true">${esc(m.trim().split(' ')[0])}</b> ${esc(r)}</button>`).join('')}${DATAS_FOLHETO.map(t => `<button type="button" class="chip var-chip" data-ins="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>
      ${campo('Texto do folheto', `<textarea id="${pref}-fx" data-f="texto" rows="14" spellcheck="true">${esc(c.texto || '')}</textarea>`)}
      <details class="ajuda"><summary>Como formatar o folheto</summary>
        <ul class="small">
          <li><b># Título</b> — abre uma seção (ex.: “# Depois do procedimento”).</li>
          <li><b>+ texto</b> — o que pode/deve fazer (ícone verde) · <b>x texto</b> — o que evitar (ícone vinho).</li>
          <li><b>1. texto</b> — passos numerados · <b>- texto</b> — tópico simples · <b>&gt; texto</b> — caixa de destaque.</li>
          <li><b>@ quando | o quê</b> — linha do tempo (ex.: “@ {H-36} | Aplicar o gatilho”).</li>
          <li><b>{D+3}</b> / <b>{D-2}</b> — dia relativo à data de referência; <b>{H-36}</b> — com hora; <b>{data_ref}</b>, <b>{hora_ref}</b> — a própria data e hora. <b>{paciente}</b> entra o nome.</li>
        </ul></details>
    </div>`;
  }
  function ligarFolheto(root, c, mudou) {
    const ta = root.querySelector('[data-f="texto"]');
    const dica = () => { const p = root.querySelector('[data-f-dica]'); const f = root.querySelector('[data-f="data_ref"]'); const u = PDF.temDatas(c.texto); if (f) f.closest('.field').classList.toggle('destaque', u); if (p) p.textContent = u ? 'As datas do folheto ({D+1}, {H-36}…) são calculadas a partir da data acima.' : 'Se o texto usar datas como {D+1} ou {H-36}, elas são calculadas a partir da data acima.'; };
    root.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.f; if (!k) return; c[k] = e.target.value; if (k === 'texto') dica(); mudou && mudou(); });
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-ins], [data-ins-linha]'); if (!b || !ta) return;
      const v = ta.value, st = ta.selectionStart ?? v.length, en = ta.selectionEnd ?? st;
      let ins = b.dataset.ins || b.dataset.insLinha;
      if (b.dataset.insLinha != null && st > 0 && v[st - 1] !== '\n') ins = '\n' + ins;
      ta.value = v.slice(0, st) + ins + v.slice(en); ta.focus(); ta.selectionStart = ta.selectionEnd = st + ins.length;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  /* =====================================================================
     Orçamento (honorários, procedimentos, medicações)
     ===================================================================== */
  const GRUPOS_ORC = ['Honorários médicos', 'Procedimentos', 'Laboratório', 'Medicações (estimativa)', 'Outros'];
  const orcamentoVazio = () => ({ titulo: '', itens: [], desconto: '', pagamento: 'PIX ou transferência, à vista.', inclui: '', nao_inclui: '', observacoes: '', validade_dias: 15, ciencia: true });
  const pickOrc = c => ({ titulo: c.titulo || '', itens: (c.itens || []).map(i => ({ grupo: i.grupo || 'Honorários médicos', descricao: i.descricao || '', detalhe: i.detalhe || '', valor: i.valor ?? null, incluso: !!i.incluso })), desconto: c.desconto ?? '', pagamento: c.pagamento || '', inclui: c.inclui || '', nao_inclui: c.nao_inclui || '', observacoes: c.observacoes || '', validade_dias: c.validade_dias ?? 15, ciencia: c.ciencia !== false });
  function parseValor(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    const t = String(v == null ? '' : v).replace(/[^\d,.]/g, ''); if (!t) return null;
    const n = Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : (/\.\d{3}$/.test(t) ? t.replace(/\./g, '') : t));
    return isFinite(n) ? n : null;
  }
  const fmtValor = v => v == null || v === '' ? '' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const orcTotal = c => Math.max(0, (c.itens || []).reduce((a, i) => a + (i.incluso ? 0 : Number(i.valor) || 0), 0) - (parseValor(c.desconto) || 0));
  function orcamentoCamposHTML(pref, c) {
    return `<div class="stack orc-campos" data-pref="${pref}">
      ${campo('Título (ex.: o tratamento)', `<input id="${pref}-ot" data-o="titulo" value="${esc(c.titulo || '')}" placeholder="Ex.: Inseminação intrauterina">`)}
      <datalist id="${pref}-grupos">${GRUPOS_ORC.map(g => `<option value="${esc(g)}">`).join('')}</datalist>
      <p class="label">Itens</p>
      <ol class="orc-list" data-lista="orc"></ol>
      <div class="actions"><button type="button" class="btn btn-ghost" data-o="add">${ICON.plus}Adicionar item</button></div>
      <div class="grid grid-2">
        ${campo('Desconto (R$)', `<input id="${pref}-od" data-o="desconto" inputmode="decimal" value="${esc(fmtValor(parseValor(c.desconto)))}" placeholder="0,00">`)}
        ${campo('Validade do orçamento (dias)', `<input id="${pref}-ov" data-o="validade_dias" type="number" min="0" max="365" inputmode="numeric" value="${esc(c.validade_dias ?? 15)}">`)}
      </div>
      <div class="orc-total" aria-live="polite"><span>Total</span><b data-total>${PDF.brl(orcTotal(c))}</b></div>
      ${campo('Formas de pagamento', `<textarea id="${pref}-op" data-o="pagamento" rows="2">${esc(c.pagamento || '')}</textarea>`)}
      <div class="grid grid-2">
        ${campo('O orçamento inclui (um por linha)', `<textarea id="${pref}-oi" data-o="inclui" rows="3">${esc(c.inclui || '')}</textarea>`)}
        ${campo('Não está incluído (um por linha)', `<textarea id="${pref}-on" data-o="nao_inclui" rows="3">${esc(c.nao_inclui || '')}</textarea>`)}
      </div>
      ${campo('Observações', `<textarea id="${pref}-oo" data-o="observacoes" rows="2">${esc(c.observacoes || '')}</textarea>`)}
      <label class="check"><input type="checkbox" data-o="ciencia" ${c.ciencia !== false ? 'checked' : ''}> Incluir campo de ciência e assinatura da paciente</label>
    </div>`;
  }
  function ligarOrcamento(root, c, mudou) {
    const box = root.querySelector('.orc-campos'); if (!box) return;
    const pref = box.dataset.pref; const ol = box.querySelector('[data-lista="orc"]'); const tot = box.querySelector('[data-total]');
    c.itens = c.itens || [];
    const total = () => { tot.textContent = PDF.brl(orcTotal(c)); };
    const draw = foco => {
      ol.innerHTML = c.itens.length ? c.itens.map((it, i) => `<li class="orc-item">
        <div class="orc-grid">
          ${campo('Grupo', `<input id="${pref}-g-${i}" data-oi="${i}" data-k="grupo" list="${pref}-grupos" value="${esc(it.grupo || '')}">`)}
          ${campo('Descrição', `<input id="${pref}-d-${i}" data-oi="${i}" data-k="descricao" value="${esc(it.descricao || '')}" placeholder="Ex.: Inseminação intrauterina">`, 'orc-desc')}
          ${campo('Valor (R$)', `<input id="${pref}-v-${i}" data-oi="${i}" data-k="valor" inputmode="decimal" value="${esc(fmtValor(it.valor))}" placeholder="0,00" ${it.incluso ? 'disabled' : ''}>`)}
          ${campo('Detalhe (opcional)', `<input id="${pref}-t-${i}" data-oi="${i}" data-k="detalhe" value="${esc(it.detalhe || '')}" placeholder="Ex.: em média 3 exames">`, 'orc-det')}
        </div>
        <div class="orc-acoes"><label class="check small"><input type="checkbox" data-oi="${i}" data-k="incluso" ${it.incluso ? 'checked' : ''}> Incluso (sem custo à parte)</label>
          <span class="orc-btns"><button type="button" class="icon-btn" data-o="up" data-i="${i}" aria-label="Mover item ${i + 1} para cima" ${i === 0 ? 'disabled' : ''}>${ICON.down.replace('<svg', '<svg style="transform:rotate(180deg)"')}</button>
          <button type="button" class="icon-btn" data-o="down" data-i="${i}" aria-label="Mover item ${i + 1} para baixo" ${i === c.itens.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
          <button type="button" class="icon-btn" data-o="del" data-i="${i}" aria-label="Remover item ${i + 1}">${ICON.trash}</button></span></div></li>`).join('')
        : `<li class="muted small">Nenhum item ainda. Use um orçamento padrão ou adicione os itens.</li>`;
      total();
      if (foco) box.querySelector(`#${pref}-d-${c.itens.length - 1}`)?.focus();
    };
    box.addEventListener('input', e => {
      const el = e.target;
      if (el.dataset.oi != null) {
        const it = c.itens[+el.dataset.oi]; const k = el.dataset.k;
        if (k === 'valor') it.valor = parseValor(el.value);
        else if (k === 'incluso') { it.incluso = el.checked; const v = box.querySelector(`#${pref}-v-${el.dataset.oi}`); if (v) v.disabled = el.checked; }
        else it[k] = el.value;
        total(); mudou && mudou(); return;
      }
      const k = el.dataset.o; if (!k || el.tagName === 'BUTTON') return;
      c[k] = el.type === 'checkbox' ? el.checked : k === 'validade_dias' ? (parseInt(el.value, 10) || 0) : el.value;
      if (k === 'desconto') total();
      mudou && mudou();
    });
    box.addEventListener('focusout', e => { const el = e.target; if (el.dataset && (el.dataset.k === 'valor' || el.dataset.o === 'desconto') && el.value.trim()) el.value = fmtValor(parseValor(el.value)); });
    box.addEventListener('click', e => {
      const b = e.target.closest('button[data-o]'); if (!b) return; const i = +b.dataset.i;
      if (b.dataset.o === 'add') { const ult = c.itens[c.itens.length - 1]; c.itens.push({ grupo: ult ? ult.grupo : 'Honorários médicos', descricao: '', detalhe: '', valor: null, incluso: false }); draw(true); }
      else if (b.dataset.o === 'del') { c.itens.splice(i, 1); draw(); }
      else if (b.dataset.o === 'up' || b.dataset.o === 'down') { const j = b.dataset.o === 'up' ? i - 1 : i + 1; if (j < 0 || j >= c.itens.length) return; [c.itens[i], c.itens[j]] = [c.itens[j], c.itens[i]]; draw(); }
      else return;
      mudou && mudou();
    });
    draw();
  }

  /* =====================================================================
     Ciclo de tratamento (fertilidade) e livreto da paciente.
     O ciclo fica no prontuário (registro.ciclo_tratamento) e passa para a
     consulta seguinte de fertilidade; o livreto em PDF sai dele + do modelo.
     ===================================================================== */
  const PROTOCOLOS = ['FIV / ICSI', 'Congelamento de óvulos', 'Inseminação intrauterina', 'Coito programado', 'Transferência de embrião congelado', 'Outro'];
  const VIAS_CICLO = ['Subcutânea', 'Oral', 'Vaginal', 'Intramuscular', 'Transdérmica', 'Nasal'];
  // medicações frequentes do ciclo: [nome, dose, via, horário] — sugestões editáveis.
  // As primeiras viram atalhos (um toque adiciona); todas aparecem na lista ao digitar.
  const MEDS_CICLO = [
    ['Gonal-f', '150 UI', 'Subcutânea', '20:00'], ['Menopur', '75 UI', 'Subcutânea', '20:00'], ['Rekovelle', '', 'Subcutânea', '20:00'], ['Puregon', '150 UI', 'Subcutânea', '20:00'],
    ['Cetrotide', '0,25 mg', 'Subcutânea', '08:00'], ['Orgalutran', '0,25 mg', 'Subcutânea', '08:00'], ['Letrozol', '2,5 mg', 'Oral', ''], ['Estradiol', '2 mg', 'Oral', ''], ['Progesterona', '200 mg', 'Vaginal', ''],
    ['Pergoveris', '', 'Subcutânea', '20:00'], ['Elonva', '1 aplicação', 'Subcutânea', ''], ['Citrato de clomifeno', '50 mg', 'Oral', ''], ['Ácido fólico', '1 comprimido', 'Oral', '']
  ];
  const ATALHOS_CICLO = 9;
  const FINAIS_CICLO = ['Cetrotide 0,25 mg', 'Orgalutran 0,25 mg', 'Ovidrel 250 mcg', 'Gonapeptyl 0,1 mg', 'Azitromicina 1 g (1 comprimido) ou 500 mg (2 comprimidos), após o jantar', 'Progesterona'];
  const RE_GATILHO = /ovidrel|gonapeptyl|gatilho|hcg|choriomon|triptorrelina|decapeptyl|leuprorrelina/i;
  const RE_BLOQUEIO = /cetrotide|orgalutran|cetrorrelix|ganirrelix/i;
  const RE_ANTIBIOTICO = /azitromicina|doxiciclina|antibi/i;
  const ICONES_NOMES = { consulta: 'Estetoscópio', exames: 'Exame de sangue', ultrassom: 'Ultrassom', injecao: 'Seringa', puncao: 'Óvulo', laboratorio: 'Laboratório', transferencia: 'Embrião', coracao: 'Coração', atividade: 'Atividade física', rotina: 'Relógio', alarme: 'Despertador', alcool: 'Taça', gelo: 'Gelo', estetica: 'Brilho', geladeira: 'Geladeira', aviso: 'Atenção', medicacao: 'Comprimido', telefone: 'Celular', mensagem: 'Mensagem', email: 'E-mail', acompanhante: 'Acompanhante', jejum: 'Jejum', calendario: 'Calendário', documento: 'Documento' };
  const ehFertilidade = c => !!c && areaDe(c) === 'Fertilidade';
  const rotuloProc = p => ({ 'FIV / ICSI': 'Punção', 'Congelamento de óvulos': 'Punção', 'Inseminação intrauterina': 'Inseminação', 'Coito programado': 'Relação programada', 'Transferência de embrião congelado': 'Transferência' }[p] || 'Procedimento');
  const finalPadrao = p => /FIV|Congela/i.test(p) ? [{ med: 'Cetrotide 0,25 mg', via: 'Subcutânea', data: '', hora: '' }, { med: 'Ovidrel 250 mcg', via: 'Subcutânea', data: '', hora: '' }, { med: FINAIS_CICLO[4], via: 'Oral', data: '', hora: '' }]
    : /Insemina|Coito/i.test(p) ? [{ med: 'Ovidrel 250 mcg', via: 'Subcutânea', data: '', hora: '' }] : [];
  const cicloVazio = (protocolo = 'FIV / ICSI') => ({ protocolo, inicio: '', dias: '', nhc: '', modelo_id: '', meds: [], controles: [], final: finalPadrao(protocolo), procedimento: { data: '', hora: '' }, obs: '' });
  const cicloTemConteudo = ci => !!(ci && (ci.inicio || (ci.meds || []).some(m => (m.nome || '').trim()) || (ci.controles || []).some(c => c.data) || (ci.procedimento || {}).data || (ci.final || []).some(f => f.data)));
  // datas do ciclo (AAAA-MM-DD, sem fuso)
  const SEMANA = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
  const dLocal = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null; };
  const isoDe = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const diaDoCiclo = (ci, n) => { const d = dLocal(ci.inicio); if (!d) return null; d.setDate(d.getDate() + n - 1); return d; };
  const diaCurtoUI = d => d ? `${SEMANA[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}` : '';
  const numDia = (ci, iso) => { const a = dLocal(ci.inicio), b = dLocal(iso); return a && b ? Math.round((b - a) / 864e5) + 1 : null; };
  const horaUI = h => h ? String(h).slice(0, 5).replace(':', 'h') : '';
  function diasDoCiclo(ci) {
    const n = parseInt(ci.dias, 10); if (n > 0) return Math.min(35, n);
    const pr = ci.procedimento || {}; const p = parseInt(pr.dia, 10) || numDia(ci, pr.data); return p && p > 0 ? Math.min(35, p) : 14;
  }
  const faixaMed = (ci, m) => {
    const de = parseInt(m.de, 10) || 1, ate = parseInt(m.ate, 10) || diasDoCiclo(ci); const n = Math.abs(ate - de) + 1;
    return ci.inicio ? `${diaCurtoUI(diaDoCiclo(ci, Math.min(de, ate)))} a ${diaCurtoUI(diaDoCiclo(ci, Math.max(de, ate)))} · ${n} ${n === 1 ? 'dia' : 'dias'}` : `dias ${Math.min(de, ate)} a ${Math.max(de, ate)} do ciclo · ${n} ${n === 1 ? 'dia' : 'dias'}`;
  };
  // o ciclo anterior ainda vale? (início há até 45 dias, ou procedimento ainda por vir)
  function cicloAtivo(ci, ref) {
    if (!cicloTemConteudo(ci)) return false;
    const r = ref ? new Date(ref) : new Date();
    const ini = dLocal(ci.inicio), pr = dLocal((ci.procedimento || {}).data);
    if (pr && pr >= new Date(r.getTime() - 3 * 864e5)) return true;
    if (ini) return (r - ini) / 864e5 <= 45;
    return !pr;
  }
  async function cicloMaisRecente(pacienteId, { consultaId, antesDe } = {}) {
    if (consultaId) { const c = await DB.consultas.get(consultaId); if (c && cicloTemConteudo((c.registro || {}).ciclo_tratamento)) return c; }
    const lst = (await DB.consultas.list({ pacienteId }).catch(() => [])).filter(c => ehFertilidade(c) && (!antesDe || new Date(c.data) <= new Date(antesDe))).sort((a, b) => new Date(b.data) - new Date(a.data));
    for (const c0 of lst.slice(0, 4)) {
      const c = c0.registro ? c0 : await DB.consultas.get(c0.id);
      if (c && cicloTemConteudo((c.registro || {}).ciclo_tratamento)) return c;
    }
    return null;
  }
  const copiaCiclo = ci => { const o = JSON.parse(JSON.stringify(ci || {})); delete o.copiado_de; return { ...cicloVazio(o.protocolo || 'FIV / ICSI'), ...o }; };

  // modelo do livreto: o escolhido; senão o do tratamento; senão um geral; senão o sugerido
  const baseLivretos = () => (window.MODELOS_BASE || []).filter(m => m.tipo === 'livreto');
  function modeloLivretoPara(ci) {
    const lst = modelosDo('livreto');
    const escolhido = ci.modelo_id && lst.find(m => m.id === ci.modelo_id); if (escolhido) return escolhido;
    const casa = l => l.find(m => ((m.conteudo || {}).protocolos || []).includes(ci.protocolo));
    return casa(lst) || lst.find(m => !((m.conteudo || {}).protocolos || []).length) || casa(baseLivretos()) || lst[0] || baseLivretos()[0];
  }
  function dadosLivreto(ci, paciente, clinicaId) {
    const cl = clinicaPorId(clinicaId) || {};
    const mod = modeloLivretoPara(ci) || { nome: 'Livreto', conteudo: {} };
    const ciclo = JSON.parse(JSON.stringify(ci || {})); delete ciclo.copiado_de;
    return {
      medico: pick(S.perfil, ['tratamento', 'nome', 'especialidade', 'crm', 'crm_uf', 'rqe', 'telefone', 'email']),
      clinica: pick(cl, ['nome', 'endereco', 'bairro', 'cidade', 'uf', 'cep', 'telefone', 'email']),
      paciente: pick(paciente, ['nome', 'nome_social', 'data_nascimento', 'sexo', 'cpf']),
      data: new Date().toISOString(), tipo: 'livreto', livreto: JSON.parse(JSON.stringify(mod.conteudo || {})), modelo: mod.nome, ciclo, rotuloArquivo: 'Livreto do ciclo'
    };
  }

  function cicloCamposHTML(pref, ci, { acoes = '', relativo = false } = {}) {
    const lst = modelosDo('livreto');
    const pr = ci.procedimento || {};
    return `<div class="ciclo stack" data-pref="${pref}" data-rel="${relativo ? 1 : 0}">
      ${relativo ? '' : `<div class="actions ciclo-padroes"><button type="button" class="btn btn-ghost" data-cx="padrao-usar">${ICON.layers}Usar protocolo padrão</button><button type="button" class="btn btn-quiet" data-cx="padrao-salvar">Salvar como protocolo padrão</button></div>`}
      ${ci.copiado_de && !relativo ? `<div class="alert info" data-ciclo-copia>${ICON.layers}<p>Ciclo trazido da consulta de ${esc(fmtData(ci.copiado_de.data))} — confira as doses e as datas. <button type="button" class="btn btn-quiet small" data-cx="novo-ciclo">Começar um ciclo novo</button></p></div>` : ''}
      <div class="grid grid-2 ${relativo ? '' : 'grid-4'}">
        ${campo('Tratamento', `<select id="${pref}-pt" data-ci="protocolo">${[...new Set([...PROTOCOLOS, ci.protocolo].filter(Boolean))].map(p => `<option ${p === ci.protocolo ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>`)}
        ${relativo ? '' : campo('Início — Dia 01', `<input id="${pref}-in" data-ci="inicio" type="date" value="${esc(ci.inicio || '')}">`)}
        ${campo('Dias no calendário', `<input id="${pref}-dd" data-ci="dias" type="number" min="1" max="35" inputmode="numeric" value="${esc(ci.dias || '')}" placeholder="Automático">`)}
        ${relativo ? '' : campo('Nº do prontuário na clínica', `<input id="${pref}-nh" data-ci="nhc" value="${esc(ci.nhc || '')}" placeholder="Opcional">`)}
      </div>
      <p class="small muted" data-ciclo-resumo aria-live="polite"></p>
      <h3 class="ciclo-tit">Medicações da estimulação</h3>
      <p class="small muted">Cada linha vira uma faixa no calendário do livreto, do dia indicado ao último. Para mudar a dose no meio do ciclo, adicione outra linha.</p>
      <div class="chips ciclo-chips" role="group" aria-label="Adicionar medicação frequente">${MEDS_CICLO.slice(0, ATALHOS_CICLO).map(([n]) => `<button type="button" class="chip var-chip" data-cadd="${esc(n)}">${ICON.plus.replace('<svg', '<svg width="14" height="14"')}${esc(n)}</button>`).join('')}</div>
      <datalist id="${pref}-dl-meds">${unicos([...MEDS_CICLO.map(m => m[0]), ...S.favoritos.map(f => f.nome)]).map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      <datalist id="${pref}-dl-fin">${FINAIS_CICLO.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      <ol class="ciclo-lista" data-lista="cmeds"></ol>
      <div class="actions"><button type="button" class="btn btn-ghost" data-cx="med-add">${ICON.plus}Adicionar medicação</button></div>
      <h3 class="ciclo-tit">Ultrassons e exames de controle</h3>
      <ol class="ciclo-lista" data-lista="cctl"></ol>
      <div class="actions"><button type="button" class="btn btn-ghost" data-cx="ctl-add">${ICON.plus}Adicionar controle</button></div>
      <h3 class="ciclo-tit" data-proc-tit>${esc(rotuloProc(ci.protocolo))}</h3>
      <div class="grid grid-2">
        ${relativo ? campo('Dia do ciclo', `<input id="${pref}-pd" data-cp="dia" type="number" min="1" max="35" inputmode="numeric" value="${esc(pr.dia || '')}">`) : campo('Data', `<input id="${pref}-pd" data-cp="data" type="date" value="${esc(pr.data || '')}">`)}
        ${campo('Horário', `<input id="${pref}-ph" data-cp="hora" type="time" value="${esc(pr.hora || '')}">`)}
      </div>
      <p class="label">Medicações da reta final</p>
      <p class="small muted">Bloqueio, gatilho, antibiótico… com dia e horário: saem em destaque no livreto e no calendário.</p>
      <ol class="ciclo-lista" data-lista="cfin"></ol>
      <div class="actions"><button type="button" class="btn btn-ghost" data-cx="fin-add">${ICON.plus}Adicionar medicação</button><button type="button" class="btn btn-quiet" data-cx="gatilho">${ICON.alert}Gatilho 36 h antes</button></div>
      ${campo('Recado para a paciente (sai no livreto)', `<textarea id="${pref}-ob" data-ci="obs" rows="2" placeholder="Ex.: traga os exames de sangue no primeiro controle.">${esc(ci.obs || '')}</textarea>`)}
      ${campo('Modelo do livreto', `<select id="${pref}-ml" data-ci="modelo_id"><option value="">Automático — conforme o tratamento</option>${lst.map(m => `<option value="${esc(m.id)}" ${m.id === ci.modelo_id ? 'selected' : ''}>${esc(m.nome)}</option>`).join('')}</select>`)}
      <p class="small muted" data-ciclo-modelo></p>
      ${acoes}
    </div>`;
  }
  function ligarCiclo(root, ci, mudou) {
    const box = root.querySelector('.ciclo'); if (!box) return;
    const pref = box.dataset.pref; const rel = box.dataset.rel === '1'; // rel: protocolo padrão, tudo em dias do ciclo
    ci.meds = ci.meds || []; ci.controles = ci.controles || []; ci.final = ci.final || []; ci.procedimento = ci.procedimento || (rel ? { dia: '', hora: '' } : { data: '', hora: '' });
    const quando = (pre, i, attrs, v) => rel ? campo('Dia do ciclo', `<input id="${pref}-${pre}-${i}" ${attrs} data-k="dia" type="number" min="1" max="35" inputmode="numeric" value="${esc(v.dia || '')}">`)
      : campo(pre === 'cd' ? 'Data' : 'Dia', `<input id="${pref}-${pre}-${i}" ${attrs} data-k="data" type="date" value="${esc(v.data || '')}">`);
    const lm = box.querySelector('[data-lista="cmeds"]'), lc = box.querySelector('[data-lista="cctl"]'), lf = box.querySelector('[data-lista="cfin"]');
    const viaSel = (id, v, attrs) => `<select id="${id}" ${attrs}>${[...new Set([...VIAS_CICLO, v].filter(Boolean))].map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    const del = (x, i, rot) => `<button type="button" class="icon-btn" data-cx="${x}" data-i="${i}" aria-label="${esc(rot)}">${ICON.trash}</button>`;
    const drawM = foco => {
      lm.innerHTML = ci.meds.length ? ci.meds.map((m, i) => `<li class="ciclo-item"><div class="ciclo-med">
          ${campo('Medicação', `<input id="${pref}-mn-${i}" data-cm="${i}" data-k="nome" list="${pref}-dl-meds" value="${esc(m.nome || '')}" placeholder="Ex.: Gonal-f">`, 'cm-nome')}
          ${campo('Dose', `<input id="${pref}-md-${i}" data-cm="${i}" data-k="dose" value="${esc(m.dose || '')}" placeholder="Ex.: 150 UI">`)}
          ${campo('Via', viaSel(`${pref}-mv-${i}`, m.via || 'Subcutânea', `data-cm="${i}" data-k="via"`))}
          ${campo('Horário', `<input id="${pref}-mh-${i}" data-cm="${i}" data-k="horario" type="time" value="${esc(m.horario || '')}">`)}
          ${campo('Do dia', `<input id="${pref}-m1-${i}" data-cm="${i}" data-k="de" type="number" min="1" max="35" inputmode="numeric" value="${esc(m.de || 1)}">`)}
          ${campo('Ao dia', `<input id="${pref}-m2-${i}" data-cm="${i}" data-k="ate" type="number" min="1" max="35" inputmode="numeric" value="${esc(m.ate || '')}" placeholder="${diasDoCiclo(ci)}">`)}
        </div><div class="ciclo-acoes"><span class="small muted" data-faixa="${i}"></span><span class="orc-btns">
          <button type="button" class="icon-btn" data-cx="med-up" data-i="${i}" aria-label="Subir ${esc(m.nome || 'medicação')}" ${i === 0 ? 'disabled' : ''}>${ICON.down.replace('<svg', '<svg style="transform:rotate(180deg)"')}</button>
          ${del('med-del', i, `Remover ${m.nome || 'medicação'}`)}</span></div></li>`).join('')
        : `<li class="muted small">Toque numa medicação acima ou em “Adicionar medicação”.</li>`;
      resumo(); if (foco) box.querySelector(`#${pref}-mn-${ci.meds.length - 1}`)?.focus();
    };
    const drawC = foco => {
      lc.innerHTML = ci.controles.length ? ci.controles.map((c, i) => `<li class="ciclo-item"><div class="ciclo-ctl">
          ${quando('cd', i, `data-cc="${i}"`, c)}
          ${campo('Horário', `<input id="${pref}-ch-${i}" data-cc="${i}" data-k="hora" type="time" value="${esc(c.hora || '')}">`)}
          <div class="ciclo-checks"><label class="check"><input type="checkbox" data-cc="${i}" data-k="us" ${c.us !== false ? 'checked' : ''}> Ultrassom</label><label class="check"><input type="checkbox" data-cc="${i}" data-k="sangue" ${c.sangue ? 'checked' : ''}> Exame de sangue</label></div>
          <span class="orc-btns">${del('ctl-del', i, `Remover controle ${i + 1}`)}</span></div></li>`).join('')
        : `<li class="muted small">Nenhum controle marcado ainda.</li>`;
      if (foco) box.querySelector(`#${pref}-cd-${ci.controles.length - 1}`)?.focus();
    };
    const drawF = foco => {
      lf.innerHTML = ci.final.length ? ci.final.map((f, i) => `<li class="ciclo-item"><div class="ciclo-fin">
          ${campo('Medicação', `<input id="${pref}-fn-${i}" data-cf="${i}" data-k="med" list="${pref}-dl-fin" value="${esc(f.med || '')}">`, 'cf-nome')}
          ${campo('Via', viaSel(`${pref}-fv-${i}`, f.via || 'Subcutânea', `data-cf="${i}" data-k="via"`))}
          ${quando('fd', i, `data-cf="${i}"`, f)}
          ${campo('Horário', `<input id="${pref}-fh-${i}" data-cf="${i}" data-k="hora" type="time" value="${esc(f.hora || '')}">`)}
          <span class="orc-btns">${del('fin-del', i, `Remover ${f.med || 'medicação'}`)}</span></div></li>`).join('')
        : `<li class="muted small">Nenhuma medicação da reta final.</li>`;
      if (foco) box.querySelector(`#${pref}-fn-${ci.final.length - 1}`)?.focus();
    };
    function resumo() {
      const r = box.querySelector('[data-ciclo-resumo]'); const n = diasDoCiclo(ci); const pr = ci.procedimento || {};
      const np = rel ? parseInt(pr.dia, 10) : numDia(ci, pr.data);
      r.textContent = rel ? `Tudo contado a partir do Dia 01 · calendário de ${n} dias${np ? ` · ${rotuloProc(ci.protocolo).toLowerCase()} no dia ${pad(np)}` : ''}. Na paciente, basta informar a data do Dia 01.`
        : ci.inicio ? `Dia 01 = ${diaCurtoUI(dLocal(ci.inicio))} · calendário de ${n} dias, até ${diaCurtoUI(diaDoCiclo(ci, n))}${np ? ` · ${rotuloProc(ci.protocolo).toLowerCase()} no dia ${pad(np)}` : ''}.`
        : 'Informe o início (Dia 01) para as datas saírem no calendário. Sem ele, o livreto sai com as datas em branco, para preencher à mão.';
      $$('[data-faixa]', box).forEach(s => { const m = ci.meds[+s.dataset.faixa]; s.textContent = m && (m.nome || '').trim() ? faixaMed(ci, m) : ''; });
      $$('[data-k="ate"]', box).forEach(i => { i.placeholder = String(n); });
      const t = box.querySelector('[data-proc-tit]'); if (t) t.textContent = rotuloProc(ci.protocolo);
      const mo = box.querySelector('[data-ciclo-modelo]'); const md = modeloLivretoPara(ci); if (mo) mo.textContent = md ? `O livreto vai usar: ${md.nome}${md.id ? '' : ' (sugerido)'}.` : '';
    }
    drawM(); drawC(); drawF();
    const ok = () => { resumo(); mudou && mudou(); };
    const num = (k, v) => (k === 'de' || k === 'ate' || k === 'dia') ? (parseInt(v, 10) || '') : v;
    // mudou o Dia 01: controles, reta final e procedimento andam junto (é só trocar a data)
    let refInicio = ci.inicio || '';
    const deslocar = (de, para) => {
      const n = Math.round((dLocal(para) - dLocal(de)) / 864e5); if (!n) return;
      const mov = iso => { if (!iso) return iso; const d = dLocal(iso); d.setDate(d.getDate() + n); return isoDe(d); };
      let algum = false;
      ci.controles.forEach(c => { if (c.data) { c.data = mov(c.data); algum = true; } });
      ci.final.forEach(f => { if (f.data) { f.data = mov(f.data); algum = true; } });
      if (ci.procedimento.data) { ci.procedimento.data = mov(ci.procedimento.data); algum = true; const pd = box.querySelector(`#${pref}-pd`); if (pd) pd.value = ci.procedimento.data; }
      if (algum) { drawC(); drawF(); toast(`Controles, reta final e ${rotuloProc(ci.protocolo).toLowerCase()} acompanharam o novo Dia 01 (${n > 0 ? '+' : ''}${n} ${Math.abs(n) === 1 ? 'dia' : 'dias'}).`); }
    };
    box.addEventListener('input', e => {
      const el = e.target; const k = el.dataset.k; const val = el.type === 'checkbox' ? el.checked : el.value;
      if (el.dataset.ci) {
        ci[el.dataset.ci] = el.dataset.ci === 'dias' ? num('dia', val) : val;
        if (el.dataset.ci === 'protocolo' && !ci.final.some(f => f.data || f.dia)) { ci.final = finalPadrao(val).map(f => rel ? { med: f.med, via: f.via, dia: '', hora: '' } : f); drawF(); }
        if (el.dataset.ci === 'inicio') { if (refInicio && val && val !== refInicio) deslocar(refInicio, val); if (val) refInicio = val; }
      }
      else if (el.dataset.cp) ci.procedimento[el.dataset.cp] = num(el.dataset.cp, val);
      else if (el.dataset.cm != null) ci.meds[+el.dataset.cm][k] = num(k, val);
      else if (el.dataset.cc != null) ci.controles[+el.dataset.cc][k] = num(k, val);
      else if (el.dataset.cf != null) ci.final[+el.dataset.cf][k] = num(k, val);
      else return;
      ok();
    });
    // nome de uma medicação conhecida: completa dose, via e horário
    box.addEventListener('change', e => {
      const el = e.target; if (el.dataset.cm == null || el.dataset.k !== 'nome') return;
      const m = ci.meds[+el.dataset.cm]; const s = MEDS_CICLO.find(x => norm(x[0]) === norm(m.nome).trim()); if (!s) return;
      if (!m.dose) m.dose = s[1]; if (!m.horario) m.horario = s[3]; m.via = m.via || s[2]; drawM(); ok();
    });
    box.addEventListener('click', async e => {
      const ch = e.target.closest('[data-cadd]');
      if (ch) { const s = MEDS_CICLO.find(x => x[0] === ch.dataset.cadd); const antag = RE_BLOQUEIO.test(s[0]); ci.meds.push({ nome: s[0], dose: s[1], via: s[2], horario: s[3], de: antag ? 6 : 1, ate: '' }); drawM(); ok(); toast(`${s[0]} adicionado${antag ? ' a partir do dia 6 — ajuste se precisar' : ''}.`); return; }
      const b = e.target.closest('[data-cx]'); if (!b) return; const i = +b.dataset.i;
      const x = b.dataset.cx;
      if (x === 'med-add') { ci.meds.push({ nome: '', dose: '', via: 'Subcutânea', horario: '', de: 1, ate: '' }); drawM(true); }
      else if (x === 'med-del') { ci.meds.splice(i, 1); drawM(); }
      else if (x === 'med-up' && i > 0) { [ci.meds[i - 1], ci.meds[i]] = [ci.meds[i], ci.meds[i - 1]]; drawM(); }
      else if (x === 'ctl-add') {
        const ult = ci.controles[ci.controles.length - 1];
        if (rel) ci.controles.push({ dia: ult && ult.dia ? Math.min(35, +ult.dia + 2) : 5, hora: ult ? ult.hora || '' : '', us: true, sangue: false });
        else { let d = ''; if (ult && ult.data) { const n = dLocal(ult.data); n.setDate(n.getDate() + 2); d = isoDe(n); } ci.controles.push({ data: d, hora: ult ? ult.hora || '' : '', us: true, sangue: false }); }
        drawC(true);
      }
      else if (x === 'ctl-del') { ci.controles.splice(i, 1); drawC(); }
      else if (x === 'fin-add') { ci.final.push(rel ? { med: '', via: 'Subcutânea', dia: '', hora: '' } : { med: '', via: 'Subcutânea', data: '', hora: '' }); drawF(true); }
      else if (x === 'padrao-usar') { await usarPadraoCiclo(ci, root, mudou); return; }
      else if (x === 'padrao-salvar') { salvarPadraoCiclo(ci); return; }
      else if (x === 'fin-del') { ci.final.splice(i, 1); drawF(); }
      else if (x === 'gatilho' && rel) {
        // no protocolo padrão: tudo em dias do ciclo (o Dia 01 começa à 0h)
        const pr = ci.procedimento; if (!pr.dia || !pr.hora) { toast(`Informe primeiro o dia e o horário do procedimento (${rotuloProc(ci.protocolo).toLowerCase()}).`, true); box.querySelector(`#${pref}-pd`).focus(); return; }
        const [hh, mi] = pr.hora.split(':').map(Number); const min = ((+pr.dia - 1) * 24 + hh) * 60 + mi - 36 * 60;
        let g = ci.final.find(f => RE_GATILHO.test(f.med || '')); if (!g) { g = { med: 'Ovidrel 250 mcg', via: 'Subcutânea' }; ci.final.push(g); }
        g.dia = Math.floor(min / 1440) + 1; g.hora = `${pad(Math.floor((min % 1440) / 60))}:${pad(min % 60)}`;
        ci.final.filter(f => RE_BLOQUEIO.test(f.med || '') && !f.dia).forEach(f => { f.dia = g.dia; });
        ci.final.filter(f => RE_ANTIBIOTICO.test(f.med || '') && !f.dia).forEach(f => { f.dia = +pr.dia - 1; });
        drawF(); toast(`Gatilho no dia ${pad(g.dia)} às ${horaUI(g.hora)} (36 h antes). Confira os horários.`);
      }
      else if (x === 'gatilho') {
        const pr = ci.procedimento; if (!pr.data || !pr.hora) { toast(`Informe primeiro a data e o horário do procedimento (${rotuloProc(ci.protocolo).toLowerCase()}).`, true); box.querySelector(`#${pref}-pd`).focus(); return; }
        const [hh, mi] = pr.hora.split(':').map(Number); const t = dLocal(pr.data); t.setHours(hh, mi, 0, 0); t.setTime(t.getTime() - 36 * 3600e3);
        let g = ci.final.find(f => RE_GATILHO.test(f.med || '')); if (!g) { g = { med: 'Ovidrel 250 mcg', via: 'Subcutânea' }; ci.final.push(g); }
        g.data = isoDe(t); g.hora = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
        const extra = [];
        ci.final.filter(f => RE_BLOQUEIO.test(f.med || '') && !f.data).forEach(f => { f.data = g.data; extra.push(`${f.med.split(' ')[0]} no mesmo dia`); });
        const vesp = dLocal(pr.data); vesp.setDate(vesp.getDate() - 1);
        ci.final.filter(f => RE_ANTIBIOTICO.test(f.med || '') && !f.data).forEach(f => { f.data = isoDe(vesp); extra.push(`${f.med.split(' ')[0]} na véspera`); });
        drawF(); toast(`Gatilho em ${diaCurtoUI(t)} às ${horaUI(g.hora)} (36 h antes)${extra.length ? '; ' + extra.join(', ') : ''}. Confira os horários.`);
      }
      else if (x === 'novo-ciclo') {
        if (!(await confirmar('Começar um ciclo novo? As medicações e as datas trazidas do ciclo anterior saem daqui (o ciclo anterior continua guardado no prontuário).', { ok: 'Começar ciclo novo', titulo: 'Novo ciclo' }))) return;
        Object.keys(ci).forEach(k => delete ci[k]); Object.assign(ci, cicloVazio()); mudou && mudou(); root.dispatchEvent(new CustomEvent('ciclo-redesenhar', { bubbles: true })); return;
      }
      else return;
      ok();
    });
  }
  /* ---------- protocolos padrão do ciclo: tudo contado em dias a partir do Dia 01 ---------- */
  const padraoVazio = () => ({ protocolo: 'FIV / ICSI', dias: '', modelo_id: '', obs: '', meds: [], controles: [], final: finalPadrao('FIV / ICSI').map(f => ({ med: f.med, via: f.via, dia: '', hora: '' })), procedimento: { dia: '', hora: '' } });
  function cicloParaPadrao(ci) {
    const dia = iso => (iso && numDia(ci, iso)) || '';
    return {
      protocolo: ci.protocolo || 'FIV / ICSI', dias: ci.dias || '', modelo_id: ci.modelo_id || '', obs: ci.obs || '',
      meds: (ci.meds || []).filter(m => (m.nome || '').trim()).map(m => ({ nome: m.nome.trim(), dose: m.dose || '', via: m.via || '', horario: m.horario || '', de: m.de || 1, ate: m.ate || '' })),
      controles: (ci.controles || []).filter(c => c.data).map(c => ({ dia: dia(c.data), hora: c.hora || '', us: c.us !== false, sangue: !!c.sangue })),
      final: (ci.final || []).filter(f => (f.med || '').trim()).map(f => ({ med: f.med.trim(), via: f.via || '', dia: dia(f.data), hora: f.hora || '' })),
      procedimento: { dia: dia((ci.procedimento || {}).data), hora: (ci.procedimento || {}).hora || '' }
    };
  }
  function padraoParaCiclo(p, inicio) {
    const data = d => (d && inicio) ? isoDe(diaDoCiclo({ inicio }, +d)) : '';
    const pr = p.procedimento || {};
    return { ...cicloVazio(p.protocolo || 'FIV / ICSI'), protocolo: p.protocolo || 'FIV / ICSI', inicio: inicio || '', dias: p.dias || '', modelo_id: p.modelo_id || '', obs: p.obs || '',
      meds: (p.meds || []).map(m => ({ nome: m.nome || '', dose: m.dose || '', via: m.via || '', horario: m.horario || '', de: m.de || 1, ate: m.ate || '' })),
      controles: (p.controles || []).map(c => ({ data: data(c.dia), hora: c.hora || '', us: c.us !== false, sangue: !!c.sangue })),
      final: (p.final || []).map(f => ({ med: f.med || '', via: f.via || '', data: data(f.dia), hora: f.hora || '' })),
      procedimento: { data: data(pr.dia), hora: pr.hora || '' } };
  }
  function perguntarDia01(valor) {
    return new Promise(res => {
      let r = null;
      abrirDialogo({
        titulo: 'Início do ciclo',
        corpo: `<form class="stack" id="f-d01" novalidate><p class="small muted">As datas dos controles, da reta final e do procedimento são calculadas a partir do Dia 01.</p>${campo('Início — Dia 01', `<input id="d01" type="date" value="${esc(valor || isoDe(new Date()))}" required>`)}</form>`,
        rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Aplicar protocolo</button>`,
        aoAbrir: (d, fechar) => {
          const ap = () => { const i = d.querySelector('#d01'); if (!i.value) { erroCampo(i, 'Informe a data do Dia 01.'); i.focus(); return; } r = i.value; fechar(); };
          d.querySelector('[data-ok]').addEventListener('click', ap); d.querySelector('#f-d01').addEventListener('submit', ev => { ev.preventDefault(); ap(); });
        },
        aoFechar: () => res(r)
      });
    });
  }
  async function usarPadraoCiclo(ci, root, mudou) {
    const m = await escolherModelo('ciclo'); if (!m) return;
    if ((ci.meds || []).some(x => (x.nome || '').trim()) && !(await confirmar(`Substituir as medicações e as datas deste ciclo pelo protocolo “${m.nome}”?`, { ok: 'Substituir', titulo: 'Usar protocolo padrão' }))) return;
    const inicio = await perguntarDia01(ci.inicio); if (!inicio) return;
    const nhc = ci.nhc || '';
    const novo = padraoParaCiclo(m.conteudo || {}, inicio);
    Object.keys(ci).forEach(k => delete ci[k]); Object.assign(ci, novo, { nhc });
    mudou && mudou(); root.dispatchEvent(new CustomEvent('ciclo-redesenhar', { bubbles: true }));
    toast(`Protocolo “${m.nome}” aplicado a partir de ${fmtData(inicio)}. Confira as doses — para mudar tudo de data, troque só o Dia 01.`);
  }
  function salvarPadraoCiclo(ci) {
    if (!(ci.meds || []).some(m => (m.nome || '').trim())) return toast('Adicione as medicações antes de salvar o protocolo padrão.', true);
    const temDatas = (ci.controles || []).some(c => c.data) || (ci.final || []).some(f => f.data) || (ci.procedimento || {}).data;
    if (temDatas && !ci.inicio) return toast('Informe o início (Dia 01): as datas viram dias do ciclo no protocolo padrão.', true);
    const conteudo = cicloParaPadrao(ci);
    abrirDialogo({
      titulo: 'Salvar como protocolo padrão',
      corpo: `<form id="sp-f" class="stack" novalidate>${campo('Nome do protocolo', `<input id="sp-nome" autofocus value="${esc(ci.protocolo || '')}" placeholder="Ex.: FIV antagonista — 225 UI">`)}
        <p class="small muted">${conteudo.meds.length} ${conteudo.meds.length === 1 ? 'medicação' : 'medicações'}, ${conteudo.controles.length} ${conteudo.controles.length === 1 ? 'controle' : 'controles'}${conteudo.procedimento.dia ? ` e o procedimento no dia ${conteudo.procedimento.dia}` : ''}, tudo contado a partir do Dia 01. Na próxima paciente, use “Usar protocolo padrão” e informe só a data.</p></form>`,
      rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Salvar protocolo</button>`,
      aoAbrir: (d, fechar) => d.querySelector('[data-ok]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
        const n = d.querySelector('#sp-nome'); if (!n.value.trim()) { erroCampo(n, 'Dê um nome ao protocolo.'); n.focus(); return; }
        try { await salvarModelo({ tipo: 'ciclo', nome: n.value.trim(), conteudo }); toast(`Protocolo “${n.value.trim()}” salvo. Ele fica em Modelos → Protocolos do ciclo.`); fechar(); } catch (err) { falha(err); }
      }))
    });
  }

  // receita com as medicações do ciclo (a médica revisa antes de emitir)
  function receitaDoCiclo(ci) {
    const viaRx = v => ({ 'Subcutânea': 'Subcutâneo', 'Transdérmica': 'Transdérmico' }[v] || v || 'Subcutâneo');
    const verbo = v => /oral|sublingual/i.test(v) ? 'Tomar' : /vaginal/i.test(v) ? 'Usar' : 'Aplicar';
    const itens = [];
    (ci.meds || []).filter(m => (m.nome || '').trim()).forEach(m => {
      const de = parseInt(m.de, 10) || 1, ate = parseInt(m.ate, 10) || diasDoCiclo(ci), n = Math.abs(ate - de) + 1;
      const quando = ci.inicio ? `de ${fmtData(isoDe(diaDoCiclo(ci, Math.min(de, ate))))} a ${fmtData(isoDe(diaDoCiclo(ci, Math.max(de, ate))))} (${n} ${n === 1 ? 'dia' : 'dias'})` : `por ${n} ${n === 1 ? 'dia' : 'dias'}, a partir do ${de}º dia do ciclo`;
      itens.push({ nome: m.nome.trim(), apresentacao: '', via: viaRx(m.via), quantidade: '', posologia: `${verbo(m.via)} ${m.dose || '1 dose'}${m.via ? ` por via ${m.via.toLowerCase()}` : ''}${m.horario ? `, às ${horaUI(m.horario)}` : ''}, ${quando}.` });
    });
    (ci.final || []).filter(f => (f.med || '').trim()).forEach(f => {
      itens.push({ nome: f.med.trim(), apresentacao: '', via: viaRx(f.via), quantidade: '', posologia: `${verbo(f.via)} dose única${f.via ? ` por via ${f.via.toLowerCase()}` : ''}${f.data ? ` em ${fmtData(f.data)}` : ''}${f.hora ? `, às ${horaUI(f.hora)}` : ''}, conforme o livreto do ciclo.` });
    });
    return itens.map(i => ({ ...copiaItem(i), antimicrobiano: temTermo(i.nome, ANTIMICROBIANOS), controlado: temTermo(i.nome, CONTROLADOS) }));
  }
  // resumo do ciclo para o prontuário (tela e PDF do registro)
  function cicloParaRegistro(ci) {
    if (!cicloTemConteudo(ci)) return null;
    const pr = ci.procedimento || {};
    return { titulo: 'Ciclo de tratamento', campos: [
      { rotulo: 'Tratamento', valor: ci.protocolo },
      { rotulo: 'Início (Dia 01)', valor: ci.inicio ? `${fmtData(ci.inicio)} · calendário de ${diasDoCiclo(ci)} dias` : '' },
      { rotulo: 'Medicações', valor: (ci.meds || []).filter(m => (m.nome || '').trim()).map(m => `${[m.nome, m.dose].filter(Boolean).join(' ')}${m.via ? ` · ${m.via.toLowerCase()}` : ''}${m.horario ? ` · ${horaUI(m.horario)}` : ''} · ${faixaMed(ci, m)}`).join('\n') },
      { rotulo: 'Controles', valor: (ci.controles || []).filter(c => c.data).map(c => `${fmtData(c.data)}${c.hora ? ` ${horaUI(c.hora)}` : ''} · ${[c.us !== false ? 'ultrassom' : '', c.sangue ? 'exame de sangue' : ''].filter(Boolean).join(' e ') || 'controle'}`).join('\n') },
      { rotulo: rotuloProc(ci.protocolo), valor: pr.data ? `${fmtData(pr.data)}${pr.hora ? ` às ${horaUI(pr.hora)}` : ''}` : '' },
      { rotulo: 'Reta final', valor: (ci.final || []).filter(f => (f.med || '').trim() && f.data).map(f => `${fmtData(f.data)}${f.hora ? ` ${horaUI(f.hora)}` : ''} · ${f.med}`).join('\n') },
      { rotulo: 'Recado', valor: ci.obs }
    ] };
  }

  /* ---------- modelo do livreto (textos fixos, contatos, procedimento) ---------- */
  const livretoVazio = () => ({ protocolos: [], titulo: 'Jornada do tratamento', subtitulo: '', boas_vindas_titulo: '', boas_vindas: '', etapas: '', cuidados: [], suspensao: '', lembretes: '', contatos: {}, procedimento: {}, encerramento: '' });
  function livretoCamposHTML(pref, c) {
    const v = path => esc(path.split('.').reduce((o, k) => (o || {})[k], c) ?? '');
    const id = path => `${pref}-${path.replace(/[._]/g, '-')}`;
    const inp = (rot, path, attrs = '') => campo(rot, `<input id="${id(path)}" data-lv="${path}" value="${v(path)}" ${attrs}>`);
    const ta = (rot, path, rows = 3, ph = '') => campo(rot, `<textarea id="${id(path)}" data-lv="${path}" rows="${rows}" placeholder="${esc(ph)}">${v(path)}</textarea>`);
    return `<div class="stack livreto-campos" data-pref="${pref}">
      <fieldset class="lv-protocolos"><legend class="label">Usar automaticamente nos tratamentos</legend><div class="checks">${PROTOCOLOS.map(p => `<label class="check"><input type="checkbox" data-lvp="${esc(p)}" ${(c.protocolos || []).includes(p) ? 'checked' : ''}> ${esc(p)}</label>`).join('')}</div></fieldset>
      <h3 class="ciclo-tit">Capa</h3>
      <div class="grid grid-2">${inp('Título', 'titulo')}${inp('Subtítulo', 'subtitulo')}</div>
      <h3 class="ciclo-tit">Boas-vindas e etapas</h3>
      ${inp('Título da página', 'boas_vindas_titulo')}
      ${ta('Texto de boas-vindas — {paciente} vira o primeiro nome', 'boas_vindas', 4)}
      ${ta('Etapas do ciclo (uma por linha; o ícone é escolhido pelo texto)', 'etapas', 6)}
      <h3 class="ciclo-tit">Cuidados durante o tratamento</h3>
      <ol class="ciclo-lista" data-lista="lvc"></ol>
      <div class="actions"><button type="button" class="btn btn-ghost" data-lvx="add">${ICON.plus}Adicionar cuidado</button></div>
      <h3 class="ciclo-tit">Medicações a suspender antes da sedação</h3>
      ${ta('Tabela (em branco se o tratamento não tem sedação)', 'suspensao', 8)}
      <p class="small muted">“## Grupo · indicação · motivo” abre um grupo · “Medicação | prazo” vira uma linha · “* texto” é nota.</p>
      <h3 class="ciclo-tit">Contatos</h3>
      ${ta('Lembretes (saem junto dos contatos)', 'lembretes', 2)}
      <div class="grid grid-2">
        ${inp('Telefone da clínica', 'contatos.clinica_tel', 'type="tel" inputmode="tel" placeholder="Em branco: usa o da clínica"')}
        ${inp('Horário da clínica', 'contatos.clinica_horario')}
        ${inp('WhatsApp da equipe', 'contatos.whatsapp', 'type="tel" inputmode="tel"')}
        ${inp('Horário do WhatsApp', 'contatos.whatsapp_horario')}
        ${inp('Telefone fora do horário', 'contatos.emergencia_tel', 'type="tel" inputmode="tel"')}
        ${inp('Quando usar esse telefone', 'contatos.emergencia_horario')}
        ${inp('E-mail para envio de exames', 'contatos.email_exames', 'type="email" inputmode="email" placeholder="Em branco: usa o da clínica"')}
      </div>
      ${ta('Observação (ex.: pacientes de fora de Salvador)', 'contatos.obs', 2)}
      <h3 class="ciclo-tit">Procedimento</h3>
      <div class="grid grid-3">${inp('Título da página', 'procedimento.titulo', 'placeholder="Ex.: Punção ovariana"')}${inp('Nome curto (calendário)', 'procedimento.rotulo', 'placeholder="Ex.: Punção"')}${inp('Chegar quantos minutos antes', 'procedimento.antecedencia', 'type="number" min="0" max="240" inputmode="numeric"')}</div>
      ${ta('Preparo', 'procedimento.preparo', 3)}
      ${ta('Atenção (caixa em destaque)', 'procedimento.alerta', 2)}
      ${ta('Jejum — {H-8} vira o dia e a hora 8 h antes (em branco se não há jejum)', 'procedimento.jejum', 2)}
      ${inp('Título das orientações do dia', 'procedimento.dia_titulo')}
      ${ta('Orientações para o dia — “+” pode, “x” evite, “>” destaque', 'procedimento.dia', 8)}
      ${ta('Mensagem de encerramento', 'encerramento', 2)}
    </div>`;
  }
  function ligarLivreto(root, c) {
    const box = root.querySelector('.livreto-campos'); if (!box) return;
    const pref = box.dataset.pref; c.cuidados = c.cuidados || []; c.contatos = c.contatos || {}; c.procedimento = c.procedimento || {};
    const set = (path, val) => { const ks = path.split('.'); let o = c; ks.slice(0, -1).forEach(k => { o = o[k] = o[k] || {}; }); o[ks[ks.length - 1]] = val; };
    const lista = box.querySelector('[data-lista="lvc"]');
    const draw = foco => {
      lista.innerHTML = c.cuidados.length ? c.cuidados.map((k, i) => `<li class="ciclo-item"><div class="lv-card">
          ${campo('Ícone', `<select id="${pref}-ci-${i}" data-lc="${i}" data-k="icone">${PDF.ICONES_LIVRETO.map(n => `<option value="${n}" ${n === (k.icone || PDF.iconeDe(k.titulo)) ? 'selected' : ''}>${esc(ICONES_NOMES[n] || n)}</option>`).join('')}</select>`)}
          ${campo('Título', `<input id="${pref}-ct-${i}" data-lc="${i}" data-k="titulo" value="${esc(k.titulo || '')}">`)}
          ${campo('Texto', `<textarea id="${pref}-cx-${i}" data-lc="${i}" data-k="texto" rows="3">${esc(k.texto || '')}</textarea>`, 'lv-texto')}
        </div><div class="ciclo-acoes"><span></span><span class="orc-btns">
          <button type="button" class="icon-btn" data-lvx="up" data-i="${i}" aria-label="Subir cuidado ${i + 1}" ${i === 0 ? 'disabled' : ''}>${ICON.down.replace('<svg', '<svg style="transform:rotate(180deg)"')}</button>
          <button type="button" class="icon-btn" data-lvx="del" data-i="${i}" aria-label="Remover cuidado ${i + 1}">${ICON.trash}</button></span></div></li>`).join('')
        : `<li class="muted small">Nenhum cuidado ainda.</li>`;
      if (foco) box.querySelector(`#${pref}-ct-${c.cuidados.length - 1}`)?.focus();
    };
    box.addEventListener('input', e => {
      const el = e.target;
      if (el.dataset.lv) set(el.dataset.lv, el.type === 'number' ? (parseInt(el.value, 10) || 0) : el.value);
      else if (el.dataset.lc != null) c.cuidados[+el.dataset.lc][el.dataset.k] = el.value;
      else if (el.dataset.lvp) { const p = el.dataset.lvp; c.protocolos = (c.protocolos || []).filter(x => x !== p); if (el.checked) c.protocolos.push(p); }
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-lvx]'); if (!b) return; const i = +b.dataset.i;
      if (b.dataset.lvx === 'add') { c.cuidados.push({ icone: 'coracao', titulo: '', texto: '' }); draw(true); }
      else if (b.dataset.lvx === 'del') { c.cuidados.splice(i, 1); draw(); }
      else if (b.dataset.lvx === 'up' && i > 0) { [c.cuidados[i - 1], c.cuidados[i]] = [c.cuidados[i], c.cuidados[i - 1]]; draw(); }
    });
    draw();
  }
  // ciclo de exemplo (para "Ver PDF" do modelo)
  function cicloExemplo(protocolo) {
    const h = new Date(); h.setHours(12, 0, 0, 0); h.setDate(h.getDate() + 2);
    const d = n => { const x = new Date(h); x.setDate(x.getDate() + n - 1); return isoDe(x); };
    const fiv = /FIV|Congela/i.test(protocolo || 'FIV');
    const ci = { ...cicloVazio(protocolo || 'FIV / ICSI'), inicio: d(1), nhc: '00000', obs: 'Exemplo de recado para a paciente.' };
    ci.meds = fiv ? [{ nome: 'Gonal-f', dose: '225 UI', via: 'Subcutânea', horario: '20:00', de: 1, ate: 10 }, { nome: 'Menopur', dose: '75 UI', via: 'Subcutânea', horario: '20:00', de: 1, ate: 10 }, { nome: 'Cetrotide', dose: '0,25 mg', via: 'Subcutânea', horario: '08:00', de: 6, ate: 10 }]
      : [{ nome: 'Letrozol', dose: '2,5 mg', via: 'Oral', horario: '', de: 3, ate: 7 }, { nome: 'Gonal-f', dose: '75 UI', via: 'Subcutânea', horario: '20:00', de: 6, ate: 10 }];
    ci.controles = [{ data: d(5), hora: '08:30', us: true, sangue: true }, { data: d(8), hora: '08:30', us: true }, { data: d(10), hora: '08:00', us: true, sangue: true }];
    ci.procedimento = { data: d(12), hora: '08:00' };
    ci.final = ci.final.map((f, i) => ({ ...f, data: RE_ANTIBIOTICO.test(f.med) ? d(11) : d(10), hora: RE_GATILHO.test(f.med) ? '20:00' : RE_BLOQUEIO.test(f.med) ? '08:00' : '20:00' }));
    return ci;
  }

  /* =====================================================================
     Assinatura digital (certificado ICP-Brasil em nuvem)
     ===================================================================== */
  const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => { const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15; return (ch === 'x' ? r : (r & 3 | 8)).toString(16); }));
  function codigoAcesso() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from(crypto.getRandomValues(new Uint8Array(6)), b => A[b % A.length]).join(''); }
  const PROVEDORES = { vidaas: 'VIDaaS (certificado gratuito do CFM)', teste: 'Certificado de teste (sem validade)' };
  async function garantirAssinatura() {
    const st = await DB.assinatura.status();
    if (st.sessao) return st.sessao;
    const prov = S.perfil.assinatura_provedor || (st.provedores.vidaas ? 'vidaas' : st.provedores.teste ? 'teste' : '');
    if (!prov) {
      abrirDialogo({ titulo: 'Assinatura digital', corpo: `<div class="stack"><p>Para assinar digitalmente, escolha o seu certificado em nuvem no <b>Perfil</b> (o VIDaaS do CFM é gratuito para médicos).</p></div>`,
        rodape: `<button class="btn btn-ghost" data-close>Agora não</button><a class="btn btn-primary" href="#perfil" data-close>Ir para o Perfil</a>` });
      return null;
    }
    return dialogoAutorizar(prov, S.perfil.assinatura_cpf, S.perfil.assinatura_duracao);
  }
  function dialogoAutorizar(prov, cpf, duracao) {
    return new Promise(res => {
      let sessao = null, timer = null, vivo = true;
      abrirDialogo({
        titulo: 'Autorizar a assinatura digital',
        corpo: `<div class="stack" aria-live="polite"><div class="assin-wait"><span class="spinner" aria-hidden="true"></span><p id="au-msg">Pedindo a autorização ao ${esc(PROVEDORES[prov] || prov)}…</p></div><div id="au-erro"></div></div>`,
        rodape: `<button class="btn btn-ghost" data-close>Cancelar</button>`,
        aoAbrir: async (d, fechar) => {
          const msg = d.querySelector('#au-msg'), erro = d.querySelector('#au-erro');
          const falhou = er => { erro.innerHTML = `<div class="alert danger">${ICON.alert}<p>${esc(er.message || String(er))}</p></div>`; msg.textContent = 'Não foi possível autorizar.'; d.querySelector('.spinner')?.remove(); };
          try {
            const a = await DB.assinatura.autorizar(prov, String(cpf || '').replace(/\D/g, ''), Number(duracao) || 43200);
            if (a.ativa) { sessao = { provedor: prov }; fechar(); return; }
            msg.innerHTML = `<b>Abra o app ${prov === 'vidaas' ? 'VIDaaS' : 'do certificado'} no seu celular e aprove o pedido.</b> Esta tela continua sozinha assim que você aprovar.`;
            const inicio = Date.now();
            const checar = async () => {
              if (!vivo) return;
              try {
                const v = await DB.assinatura.verificar(a.id);
                if (v.ativa) { sessao = { provedor: prov }; fechar(); return; }
              } catch (er) { falhou(er); return; }
              if (Date.now() - inicio > 300000) { falhou(new Error('O pedido expirou sem aprovação. Tente de novo.')); return; }
              timer = setTimeout(checar, 3000);
            };
            timer = setTimeout(checar, 3000);
          } catch (er) { falhou(er); }
        },
        aoFechar: () => { vivo = false; clearTimeout(timer); res(sessao); }
      });
    });
  }
  async function assinarComAutorizacao(bytes, tipo) {
    try { return await DB.assinatura.assinar(bytes, tipo); }
    catch (er) {
      if (!er.precisaAutorizar) throw er;
      const s = await dialogoAutorizar(S.perfil.assinatura_provedor || 'vidaas', S.perfil.assinatura_cpf, S.perfil.assinatura_duracao);
      return s ? DB.assinatura.assinar(bytes, tipo) : null;
    }
  }

  function validarDoc(E) {
    if (!E.clinica_id) return 'Escolha a clínica do documento.';
    if (E.tipo === 'receita' && !E.itens.some(i => (i.nome || '').trim()) && !(E.orientacoes || '').trim()) return 'Adicione ao menos um medicamento ou orientação.';
    if (E.tipo === 'receita' && E.itens.some(i => (i.nome || '').trim()) && E.itens.filter(i => (i.nome || '').trim()).every(i => i.controlado) && !(E.orientacoes || '').trim()) return 'Medicamentos de controle especial não saem nesta receita (modelo oficial da Anvisa).';
    if (E.tipo === 'exames' && !E.exames.some(x => (x.nome || '').trim())) return 'Adicione ao menos um exame.';
    if ((E.tipo === 'atestado' || E.tipo === 'orientacoes') && !(E.texto || '').trim()) return 'Escreva o texto do documento.';
    if (E.tipo === 'orientacoes' && PDF.temDatas(E.texto) && !E.data_ref) return 'Informe a data e hora de referência: as datas do folheto são calculadas a partir dela.';
    if (E.tipo === 'orcamento') {
      const itens = (E.itens || []).filter(i => (i.descricao || '').trim());
      if (!itens.length) return 'Adicione ao menos um item ao orçamento.';
      const sem = itens.find(i => !i.incluso && !(Number(i.valor) > 0));
      if (sem) return `Preencha o valor de “${sem.descricao.trim()}” (ou marque como incluso).`;
    }
    const pend = String(E.texto || '').match(/\{[^{}]+\}/g);
    if (E.tipo === 'atestado' && pend) return `Complete os campos do texto: ${[...new Set(pend)].join(', ')}.`;
    return '';
  }
  const pick = (o, ks) => Object.fromEntries(ks.map(k => [k, (o || {})[k] ?? '']));
  function montarDadosPDF(E, paciente) {
    const cl = clinicaPorId(E.clinica_id) || {};
    const base = {
      medico: pick(S.perfil, ['tratamento', 'nome', 'especialidade', 'crm', 'crm_uf', 'rqe', 'telefone', 'email']),
      clinica: pick(cl, ['nome', 'endereco', 'bairro', 'cidade', 'uf', 'cep', 'telefone', 'email']),
      paciente: pick(paciente, ['nome', 'nome_social', 'data_nascimento', 'sexo', 'cpf']),
      data: new Date().toISOString(), tamanho: S.perfil.pdf_tamanho || 'A4', marcaDagua: S.perfil.pdf_marca_dagua !== false
    };
    if (E.tipo === 'receita') return { ...base, tipo: 'receita', itens: E.itens.filter(i => (i.nome || '').trim()).map(copiaItem), orientacoes: E.orientacoes || '', incluirOrientacoes: E.incluir_orientacoes !== false };
    if (E.tipo === 'exames') return { ...base, tipo: 'exames', exames: E.exames.filter(x => (x.nome || '').trim()).map(x => ({ nome: x.nome.trim() })), indicacao: E.indicacao || '' };
    if (E.tipo === 'atestado') return { ...base, tipo: 'atestado', titulo: E.titulo || 'Atestado médico', texto: E.texto, cid: E.cid_aut ? (E.cid || '') : '', rotuloArquivo: E.titulo || 'Atestado' };
    if (E.tipo === 'livreto') return { ...base, ...dadosLivreto(E.ciclo || {}, paciente, E.clinica_id) };
    if (E.tipo === 'orcamento') return { ...base, tipo: 'orcamento', titulo: (E.titulo || '').trim(), itens: (E.itens || []).filter(i => (i.descricao || '').trim()).map(i => ({ grupo: i.grupo || 'Outros', descricao: i.descricao.trim(), detalhe: (i.detalhe || '').trim(), valor: i.incluso ? 0 : (Number(i.valor) || 0), incluso: !!i.incluso })), desconto: parseValor(E.desconto) || 0, pagamento: E.pagamento || '', inclui: E.inclui || '', nao_inclui: E.nao_inclui || '', observacoes: E.observacoes || '', validade_dias: parseInt(E.validade_dias, 10) || 0, ciencia: E.ciencia !== false, rotuloArquivo: ['Orcamento', E.titulo].filter(Boolean).join(' ') };
    const tit = (E.titulo || '').trim();
    return { ...base, tipo: 'orientacoes', titulo: tit, orientacoes: PDF.resolverDatas(preencherVariaveis(E.texto || ''), E.data_ref), data_ref: E.data_ref || '', rotuloArquivo: ['Orientacoes', tit && !/^orienta/i.test(tit) ? tit : ''].filter(Boolean).join(' ') };
  }
  function resumoDoc(dados) {
    if (dados.tipo === 'receita') { const n = (dados.itens || []).filter(i => !i.controlado).map(i => [i.nome, i.apresentacao].filter(Boolean).join(' ')); return n.length ? n.join(' · ') : 'Orientações'; }
    if (dados.tipo === 'exames') return (dados.exames || []).map(x => x.nome).join(' · ');
    if (dados.tipo === 'registro') return dados.subtitulo || '';
    if (dados.tipo === 'livreto') { const ci = dados.ciclo || {}; const pr = ci.procedimento || {}; const n = (ci.meds || []).filter(m => (m.nome || '').trim()).length; return [ci.protocolo, ci.inicio ? `início ${fmtData(ci.inicio)}` : 'datas em branco', pr.data ? `${rotuloProc(ci.protocolo).toLowerCase()} ${fmtData(pr.data)}` : '', n ? `${n} ${n === 1 ? 'medicação' : 'medicações'}` : ''].filter(Boolean).join(' · '); }
    if (dados.tipo === 'orcamento') { const tot = (dados.itens || []).reduce((a, i) => a + (i.incluso ? 0 : Number(i.valor) || 0), 0) - (Number(dados.desconto) || 0); return `${dados.titulo ? dados.titulo + ' · ' : ''}Total ${PDF.brl(Math.max(0, tot))} · ${(dados.itens || []).length} itens`; }
    let t = String(dados.texto || dados.orientacoes || '');
    if (dados.tipo === 'orientacoes') t = t.split('\n').map(l => l.trim().replace(/^(#|\+|[xX×]\s|>|-|•|\d+[.)])\s*/, '').replace(/^@\s*([^|]+)\|\s*/, '$1: ')).filter(Boolean).join(' · ');
    return t.length > 160 ? t.slice(0, 160) + '…' : t;
  }
  function tituloDoc(dados) {
    if (dados.tipo === 'atestado') return dados.titulo || 'Atestado médico';
    if (dados.tipo === 'livreto') return `Livreto do ciclo${(dados.ciclo || {}).protocolo ? ' · ' + dados.ciclo.protocolo : ''}`;
    if ((dados.tipo === 'orientacoes' || dados.tipo === 'orcamento') && dados.titulo && !/^orienta[çc][õo]es$/i.test(dados.titulo)) return `${NOME_DOC[dados.tipo]} · ${dados.titulo}`;
    return NOME_DOC[dados.tipo];
  }

  async function emitirDocumento(E, ctx, opts = {}) {
    const err = validarDoc(E); if (err) { toast(err, true); return; }
    if (E.tipo === 'atestado' && E.cid && !E.cid_aut) toast('CID omitido: marque a autorização da paciente para que ele saia no atestado.');
    const assinar = !!E.assinar && ASSINAVEIS.includes(E.tipo);
    if (assinar) {
      if (String(ctx.paciente.cpf || '').replace(/\D/g, '').length !== 11) { toast('Para assinar digitalmente, cadastre o CPF da paciente na ficha (Resolução CFM 2.299/2021).', true); return; }
      if (!S.perfil.crm) { toast('Preencha o seu CRM no Perfil antes de assinar.', true); return; }
    }
    const dados = montarDadosPDF(E, ctx.paciente);
    return emitirDados(dados, { pacienteId: ctx.paciente.id, consultaId: ctx.consultaId, clinicaId: E.clinica_id, paciente: ctx.paciente, aoEmitir: ctx.emitido, assinar, silencioso: opts.silencioso });
  }
  async function emitirDados(dados, { pacienteId, consultaId, clinicaId, paciente, aoEmitir, assinar, silencioso }) {
    let r, blob, id;
    try {
      if (assinar) {
        const sess = await garantirAssinatura(); if (!sess) return;
        id = novoId(); const codigo = codigoAcesso();
        dados.data = new Date().toISOString();
        dados.digital = { codigo, url: DB.assinatura.urlValidacao(id), teste: sess.provedor === 'teste' };
        r = PDF.gerar(dados);
        const res = await assinarComAutorizacao(new Uint8Array(await r.blob.arrayBuffer()), dados.tipo); if (!res) return;
        dados.assinatura = { codigo, provedor: res.provedor, por: res.assinante || null, em: res.em, teste: res.provedor === 'teste' };
        blob = new Blob([res.pdf], { type: 'application/pdf' });
      } else { r = PDF.gerar(dados); blob = r.blob; }
    } catch (er) { falha(er); return; }
    try {
      const doc = await DB.documentos.salvar({ ...(id ? { id } : {}), paciente_id: pacienteId, consulta_id: consultaId || null, clinica_id: clinicaId || null, tipo: dados.tipo, titulo: tituloDoc(dados), nome_arquivo: r.nomeArquivo, emitido_em: dados.data, dados, resumo: resumoDoc(dados), paginas: r.paginas }, blob);
      aoEmitir && await aoEmitir(doc);
      if (silencioso) { toast(`Salvo na ficha${dados.assinatura ? ' (assinado)' : ''}: ${doc.titulo}.${r.avisos.length ? ' ' + r.avisos.join(' ') : ''} No fim, use “Ver todos em um PDF” ou “Enviar”.`); return doc; }
      mostrarDocumento(doc, blob, { novo: true, avisos: r.avisos, paciente });
      return doc;
    } catch (er) { falha(er); }
  }

  async function abrirDocumento(row, depois) {
    try {
      const doc = row.dados ? row : await DB.documentos.get(row.id);
      let blob = await DB.documentos.pdf(doc);
      if (!blob) blob = PDF.gerar(doc.dados).blob;
      mostrarDocumento(doc, blob, { depois });
    } catch (er) { falha(er); }
  }

  function imprimirPDF(url) {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const safari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
    if (downloadsCap) { toast('Na demonstração, baixe o PDF para imprimir.'); return; }
    if (ios || safari) { const w = window.open(url, '_blank'); toast(w ? 'PDF aberto — use o botão de imprimir ou compartilhar do visualizador.' : 'Permita pop-ups para abrir o PDF.'); return; }
    const fr = document.createElement('iframe');
    fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1;
    fr.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';
    fr.src = url; document.body.appendChild(fr);
    fr.onload = () => setTimeout(() => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { window.open(url, '_blank'); } }, 300);
    setTimeout(() => fr.remove(), 120000);
  }

  function mostrarDocumento(doc, blob, { novo, avisos = [], depois, paciente } = {}) {
    const url = URL.createObjectURL(blob);
    const file = typeof File === 'function' ? new File([blob], doc.nome_arquivo, { type: 'application/pdf' }) : null;
    const podeCompartilhar = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
    const previa = !matchMedia('(pointer: coarse)').matches && innerWidth >= 900 && !downloadsCap;
    const quando = `${fmtData(doc.emitido_em)} às ${fmtHora(doc.emitido_em)}`;
    const nomePac = paciente ? paciente.nome : ((doc.dados || {}).paciente || {}).nome || '';
    const ass = (doc.dados || {}).assinatura || null;
    abrirDialogo({
      titulo: novo ? 'Documento salvo' : doc.titulo, largo: previa,
      corpo: `<div class="stack">
        ${novo ? `<div class="alert info">${ICON.check}<p><b>${esc(doc.titulo)}</b> salvo nos documentos de ${esc(nomePac)} em ${quando}. Você pode abrir, imprimir ou reenviar quando quiser pela ficha da paciente.</p></div>` : ''}
        ${doc.anulado_em ? `<div class="alert danger">${ICON.alert}<p><b>Documento anulado</b> em ${fmtData(doc.anulado_em)} ${fmtHora(doc.anulado_em)}${doc.motivo_anulacao ? ` — ${esc(doc.motivo_anulacao)}` : ''}.</p></div>` : ''}
        ${ass ? `<div class="alert ${ass.teste ? '' : 'ok'}">${ICON.seal}<p>${ass.teste ? '<b>Assinatura de TESTE — sem validade jurídica.</b> Assinado' : '<b>Assinado digitalmente</b> (ICP-Brasil)'}${ass.por && ass.por.nome ? ` por ${esc(ass.por.nome)}` : ''}${ass.em ? ` em ${fmtData(ass.em)} às ${fmtHora(ass.em)}` : ''}. Código de acesso para a farmácia: <b>${esc(ass.codigo || '')}</b>. Envie o PDF pelo WhatsApp ou e-mail — não precisa imprimir.</p></div>` : ''}
        ${avisos.map(a => `<div class="alert">${ICON.alert}<p>${esc(a)}</p></div>`).join('')}
        ${previa ? `<iframe class="pdf-frame" src="${url}" title="Visualização do PDF"></iframe>` : `<div class="summary-card"><b class="wrap-any">${esc(doc.nome_arquivo)}</b><p class="muted small">${doc.paginas || ''} ${doc.paginas === 1 ? 'página' : 'páginas'} · emitido em ${quando}</p></div>`}
        ${ass ? '' : `<p class="small muted">${ASSINAVEIS.includes(doc.tipo) ? 'Imprima e assine à mão. Para enviar sem imprimir, emita de novo marcando “Assinar digitalmente”.' : 'Pronto para imprimir ou enviar à paciente.'}</p>`}
        ${!novo && !doc.anulado_em ? `<p><button type="button" class="btn btn-quiet small" data-anular style="padding-left:0;color:var(--danger)">Anular este documento</button></p>` : ''}</div>`,
      rodape: `${podeCompartilhar ? `<button class="btn btn-ghost" data-share>${ICON.share}Compartilhar</button>` : ''}
        ${downloadsCap ? `<button class="btn btn-ghost" data-save>${ICON.download}Baixar</button>` : `<a class="btn btn-ghost" href="${url}" download="${esc(doc.nome_arquivo)}">${ICON.download}Baixar</a><a class="btn btn-ghost" href="${url}" target="_blank" rel="noopener">${ICON.open}Visualizar</a>`}
        ${!doc.anulado_em ? `<button class="btn btn-ghost" data-enviar>${ICON.share}Enviar à paciente</button>` : ''}
        <button class="btn btn-primary" data-print>${ICON.doc}Imprimir</button>`,
      aoAbrir: (d, fechar) => {
        d.querySelector('[data-print]').addEventListener('click', () => imprimirPDF(url));
        const sh = d.querySelector('[data-share]'); if (sh) sh.addEventListener('click', () => navigator.share({ files: [file], title: doc.nome_arquivo }).catch(() => {}));
        const sv = d.querySelector('[data-save]'); if (sv) sv.addEventListener('click', () => ocupado(sv, async () => { try { await downloadsCap.save({ filename: doc.nome_arquivo, data: blob }); } catch (e) { toast('O download foi cancelado ou bloqueado.', true); } }));
        const an = d.querySelector('[data-anular]');
        if (an) an.addEventListener('click', () => { fechar(); dialogoAnular(doc, depois); });
        const en = d.querySelector('[data-enviar]');
        if (en) en.addEventListener('click', async () => { const pac = paciente || await DB.pacientes.get(doc.paciente_id); fechar(); dialogoEnviar(pac, [doc]); });
      },
      aoFechar: () => setTimeout(() => URL.revokeObjectURL(url), 120000)
    });
  }
  /* ---------- vários documentos em um só PDF (para ver e imprimir de uma vez) ---------- */
  let pdfLibP = null;
  const carregarPdfLib = () => pdfLibP || (pdfLibP = new Promise((res, rej) => {
    if (window.PDFLib) return res(window.PDFLib);
    const sc = document.createElement('script'); sc.src = 'vendor/pdf-lib.min.js';
    sc.onload = () => res(window.PDFLib); sc.onerror = () => { pdfLibP = null; rej(new Error('Não foi possível carregar a ferramenta que junta os PDFs. Verifique a internet.')); };
    document.head.appendChild(sc);
  }));
  async function verDocumentosJuntos(docs, paciente) {
    docs = docs.filter(d => !d.anulado_em).sort((a, b) => new Date(a.emitido_em) - new Date(b.emitido_em));
    if (!docs.length) return toast('Não há documentos válidos para juntar.', true);
    try {
      const { PDFDocument } = await carregarPdfLib();
      const out = await PDFDocument.create(); let assinados = 0;
      for (const d of docs) {
        const full = d.dados ? d : await DB.documentos.get(d.id);
        let blob = await DB.documentos.pdf(full); if (!blob) blob = PDF.gerar(full.dados).blob;
        if ((full.dados || {}).assinatura) assinados++;
        const src = await PDFDocument.load(await blob.arrayBuffer(), { ignoreEncryption: true });
        (await out.copyPages(src, src.getPageIndices())).forEach(pg => out.addPage(pg));
      }
      const nome = paciente ? paciente.nome : '';
      out.setTitle(`Documentos — ${nome}`); out.setAuthor(nomeMedica()); out.setCreator('Consultório Dra. Ana Paula Vianna');
      const blob = new Blob([await out.save()], { type: 'application/pdf' });
      const r = { blob, nomeArquivo: PDF.nomeDoArquivo(nome, 'Documentos', new Date()), paginas: out.getPageCount(), avisos: [] };
      mostrarPDF(r, `${docs.length} documentos em um PDF`, false, { imprimir: true,
        aviso: `Juntei ${docs.length} ${docs.length === 1 ? 'documento' : 'documentos'} (${r.paginas} ${r.paginas === 1 ? 'página' : 'páginas'}) na ordem em que foram emitidos: ${docs.map(d => esc(d.titulo)).join(' · ')}.${assinados ? ' Este PDF único é para ver e imprimir; para mandar os assinados digitalmente, use “Enviar” — cada um vai separado, com a assinatura válida.' : ''}` });
    } catch (er) { falha(er); }
  }
  function dialogoJuntar(paciente, docs) {
    const validos = docs.filter(d => !d.anulado_em).sort((a, b) => new Date(b.emitido_em) - new Date(a.emitido_em));
    if (!validos.length) return toast('Ainda não há documentos.', true);
    const dia = iso => new Date(iso).toDateString();
    const ultimoDia = dia(validos[0].emitido_em);
    let html = '', atual = null;
    validos.forEach(d => {
      if (dia(d.emitido_em) !== atual) { if (atual !== null) html += '</ul>'; atual = dia(d.emitido_em); html += `<p class="label" style="margin-top:12px">${fmtData(d.emitido_em)}</p><ul class="lista-check">`; }
      html += `<li><label class="check"><input type="checkbox" data-jd="${esc(d.id)}" ${dia(d.emitido_em) === ultimoDia ? 'checked' : ''}><span><b>${esc(d.titulo)}</b> <span class="small muted">${fmtHora(d.emitido_em)}</span></span></label></li>`;
    });
    abrirDialogo({
      titulo: 'Juntar documentos em um PDF',
      corpo: `<div class="stack"><p class="small muted">Marque os documentos para ver e imprimir de uma vez. Já vêm marcados os do último atendimento.</p><div>${html}</ul></div></div>`,
      rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-ghost" data-enviar-sel>${ICON.share}Enviar marcados</button><button class="btn btn-primary" data-ok>${ICON.doc}Ver em um PDF</button>`,
      aoAbrir: (d, fechar) => {
        const marcados = () => validos.filter(x => d.querySelector(`[data-jd="${x.id}"]`).checked);
        d.querySelector('[data-ok]').addEventListener('click', e => { const m = marcados(); if (!m.length) return toast('Marque ao menos um documento.', true); ocupado(e.currentTarget, async () => { await verDocumentosJuntos(m, paciente); }); });
        d.querySelector('[data-enviar-sel]').addEventListener('click', () => { const m = marcados(); if (!m.length) return toast('Marque ao menos um documento.', true); fechar(); dialogoEnviar(paciente, m); });
      }
    });
  }

  function dialogoAnular(doc, depois) {
    abrirDialogo({
      titulo: 'Anular documento',
      corpo: `<div class="stack"><p>O documento <b>${esc(doc.titulo)}</b> de ${fmtData(doc.emitido_em)} continuará no histórico, marcado como anulado. Esta ação não pode ser desfeita.</p>${campo('Motivo', `<input id="an-mot" placeholder="Ex.: emitido com erro de dose" autofocus>`)}</div>`,
      rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-danger" data-ok>Anular documento</button>`,
      aoAbrir: (d, fechar) => d.querySelector('[data-ok]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
        const m = d.querySelector('#an-mot'); if (!m.value.trim()) { erroCampo(m, 'Informe o motivo.'); m.focus(); return; }
        try { await DB.documentos.anular(doc.id, m.value.trim()); toast('Documento anulado.'); fechar(); depois && depois(); } catch (err) { falha(err); }
      }))
    });
  }

  const ICONE_DOC = { receita: 'doc', exames: 'search', atestado: 'check', orientacoes: 'guide', orcamento: 'cash', registro: 'layers', livreto: 'guide' };
  function docLinhaHTML(d) {
    const cl = clinicaPorId(d.clinica_id);
    return `<li><button type="button" class="row doc-row${d.anulado_em ? ' anulado' : ''}" data-doc="${esc(d.id)}"><span class="avatar" aria-hidden="true">${ICON[ICONE_DOC[d.tipo] || 'doc'].replace('<svg', '<svg width="22" height="22"')}</span><span class="grow"><span class="title">${esc(d.titulo)}${d.anulado_em ? ' <span class="chip danger">Anulado</span>' : ''}${(d.assinatura || (d.dados && d.dados.assinatura)) ? ` <span class="chip ${(d.assinatura || d.dados.assinatura).teste ? '' : 'ok'}">${(d.assinatura || d.dados.assinatura).teste ? 'Assinatura de teste' : 'Assinado digitalmente'}</span>` : ''}</span><span class="meta"><span>${fmtData(d.emitido_em)} às ${fmtHora(d.emitido_em)}</span>${cl ? `<span>${esc(cl.nome)}</span>` : ''}</span>${d.resumo ? `<span class="small muted wrap-any">${esc(d.resumo.length > 140 ? d.resumo.slice(0, 140) + '…' : d.resumo)}</span>` : ''}<span class="small muted wrap-any">${esc(d.nome_arquivo)}</span></span>${ICON.chev.replace('<svg', '<svg class="chev"')}</button></li>`;
  }
  function ligarLinhasDoc(box, recarregar) {
    $$('[data-doc]', box).forEach(b => b.addEventListener('click', async () => {
      const lista = await DB.documentos.list({ pacienteId: undefined });
      const row = lista.find(x => x.id === b.dataset.doc) || { id: b.dataset.doc };
      ocupado(b, () => abrirDocumento(row, recarregar));
    }));
  }

  // Novo documento fora da consulta (ex.: pela ficha da paciente)
  function dialogoNovoDocumento(paciente, { consultaId = null, tipo = null, depois } = {}) {
    const clinicaPadrao = (paciente.clinicas || []).find(id => clinicaPorId(id)) || (S.clinicas.find(c => c.ativa !== false) || {}).id || '';
    abrirDialogo({
      titulo: `Novo documento · ${paciente.nome}`, largo: true,
      corpo: `<div id="nd-tipos" class="actions doc-tipos" ${tipo ? 'hidden' : ''}>${TIPOS_DOC.map(([t, rot]) => `<button type="button" class="btn btn-ghost" data-nd="${t}">${ICON.plus}${rot}</button>`).join('')}</div><div id="nd-editor"></div>`,
      aoAbrir: (d, fechar) => {
        const abrir = async t => {
          d.querySelector('#nd-tipos').hidden = true;
          const E = estadoNovo(t, clinicaPadrao);
          if (t === 'livreto') {
            const c = await cicloMaisRecente(paciente.id, { consultaId }).catch(() => null);
            if (c) { E.ciclo = { ...copiaCiclo(c.registro.ciclo_tratamento), copiado_de: { id: c.id, data: c.data } }; if (c.clinica_id && clinicaPorId(c.clinica_id)) E.clinica_id = c.clinica_id; }
          }
          editorDocumento(d.querySelector('#nd-editor'), E, { paciente, consultaId, escolherClinica: true, emitido: async doc => { fechar(); depois && depois(doc); }, descartar: () => fechar() });
        };
        $$('[data-nd]', d).forEach(b => b.addEventListener('click', () => abrir(b.dataset.nd)));
        if (tipo) abrir(tipo);
      }
    });
  }

  /* ---------- campo de CID-10 com busca ---------- */
  function cidCampo(id, valor, { rot = 'CID-10', attrs = '', desc = '' } = {}) {
    return `<div class="field cid-campo"><label for="${id}" class="label">${rot}</label><div class="combo"><input id="${id}" ${attrs} data-cid value="${esc(valor || '')}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-lb" autocomplete="off" placeholder="Código ou nome (ex.: N76 ou vaginite)"><ul class="combo-lb" id="${id}-lb" role="listbox" aria-label="Resultados da CID-10" hidden></ul></div><p class="small muted cid-desc" id="${id}-desc" aria-live="polite">${esc(desc || '')}</p></div>`;
  }
  (function ligarCid() {
    let timer = null, seq = 0;
    const fechar = inp => { const lb = document.getElementById(inp.getAttribute('aria-controls')); if (lb) { lb.hidden = true; lb.innerHTML = ''; } inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant'); };
    const escolher = (inp, codigo, descricao) => {
      inp.value = codigo; fechar(inp);
      const d = document.getElementById(inp.id + '-desc'); if (d) d.textContent = descricao;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new CustomEvent('cid-escolhido', { bubbles: true, detail: { codigo, descricao } }));
    };
    document.addEventListener('input', e => {
      const inp = e.target; if (!inp.matches || !inp.matches('[data-cid]') || !e.isTrusted) return;
      const d = document.getElementById(inp.id + '-desc'); if (d) d.textContent = '';
      clearTimeout(timer);
      const termo = inp.value; if (termo.trim().length < 2) return fechar(inp);
      timer = setTimeout(async () => {
        const meu = ++seq; let res = [];
        try { res = await DB.cid.buscar(termo); } catch (er) { return; }
        if (meu !== seq) return;
        const lb = document.getElementById(inp.getAttribute('aria-controls')); if (!lb) return;
        lb.innerHTML = res.length ? res.map((c, i) => `<li role="option" id="${inp.id}-op${i}" data-codigo="${esc(c.codigo)}" data-desc="${esc(c.descricao)}" aria-selected="false"><b>${esc(c.codigo)}</b> <span>${esc(c.descricao)}</span></li>`).join('') : `<li class="vazio" aria-disabled="true">Nenhum código encontrado.</li>`;
        lb.hidden = false; inp.setAttribute('aria-expanded', 'true');
      }, 220);
    });
    document.addEventListener('keydown', e => {
      const inp = e.target; if (!inp.matches || !inp.matches('[data-cid]')) return;
      const lb = document.getElementById(inp.getAttribute('aria-controls')); if (!lb || lb.hidden) return;
      const ops = $$('[role=option]', lb); if (!ops.length) return;
      let i = ops.findIndex(o => o.getAttribute('aria-selected') === 'true');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); i = e.key === 'ArrowDown' ? Math.min(ops.length - 1, i + 1) : Math.max(0, i - 1); ops.forEach((o, k) => o.setAttribute('aria-selected', String(k === i))); inp.setAttribute('aria-activedescendant', ops[i].id); ops[i].scrollIntoView({ block: 'nearest' }); }
      else if (e.key === 'Enter' && i >= 0) { e.preventDefault(); escolher(inp, ops[i].dataset.codigo, ops[i].dataset.desc); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fechar(inp); }
    }, true);
    document.addEventListener('mousedown', e => { const op = e.target.closest('.combo-lb [role=option]'); if (op) { e.preventDefault(); const inp = document.querySelector(`[aria-controls="${op.parentElement.id}"]`); escolher(inp, op.dataset.codigo, op.dataset.desc); } });
    document.addEventListener('click', e => { if (!e.target.closest('.combo')) $$('[data-cid][aria-expanded="true"]').forEach(fechar); });
  })();

  /* ---------- registro da consulta (prontuário) ---------- */
  function registroParaPDF() {
    const r = C.registro;
    const gpa = ['gestacoes', 'partos', 'cesareas', 'abortos'].some(k => r[k]) ? `G${r.gestacoes || 0} PN${r.partos || 0} C${r.cesareas || 0} A${r.abortos || 0}` : '';
    const legado = (C.prescricao || []).filter(i => i.nome);
    return [
      { titulo: 'Atendimento', campos: [{ rotulo: 'Área', valor: rotuloDaConsulta().area }, { rotulo: 'Atendimento', valor: rotuloDaConsulta().rotulo }, { rotulo: 'Clínica', valor: (clinicaPorId(C.clinica_id) || {}).nome }, { rotulo: 'Data', valor: `${fmtData(C.data)} às ${fmtHora(C.data)}` }] },
      { titulo: 'Queixa e história', campos: [{ rotulo: 'Queixa principal', valor: r.motivo }, { rotulo: 'História atual', valor: r.hda }] },
      { titulo: 'Ginecológico e obstétrico', campos: [{ rotulo: 'DUM', valor: r.dum ? fmtData(r.dum) : '' }, { rotulo: 'Ciclo', valor: r.ciclo }, { rotulo: 'Menarca', valor: r.menarca }, { rotulo: 'Paridade', valor: gpa }, { rotulo: 'Contracepção', valor: r.contracepcao }, { rotulo: 'Tentando engravidar', valor: r.tentante }, { rotulo: 'Último preventivo', valor: r.preventivo }, { rotulo: 'Mamografia/USG', valor: r.mamografia }, { rotulo: 'Outras', valor: r.gineco_obs }] },
      { titulo: 'Exame físico', campos: [{ rotulo: 'Sinais vitais', valor: [r.pa && `PA ${r.pa} mmHg`, r.fc && `FC ${r.fc} bpm`, r.peso && `Peso ${r.peso} kg`, r.altura && `Altura ${r.altura} m`].filter(Boolean).join(' · ') }, { rotulo: 'Geral e mamas', valor: r.exame_fisico }, { rotulo: 'Ginecológico', valor: r.exame_gineco }] },
      { titulo: 'Exames e resultados', campos: [{ rotulo: 'Resultados', valor: r.resultados }] },
      { titulo: 'Avaliação e conduta', campos: [{ rotulo: 'Hipótese diagnóstica', valor: r.hipotese }, { rotulo: 'CID-10', valor: r.cid ? [String(r.cid).toUpperCase(), r.cid_desc].filter(Boolean).join(' — ') : '' }, { rotulo: 'Conduta', valor: r.conduta }, { rotulo: 'Retorno', valor: r.retorno }] },
      cicloParaRegistro(r.ciclo_tratamento) || { titulo: 'Ciclo de tratamento', campos: [] },
      { titulo: 'Prescrição (registro anterior)', texto: legado.map((i, n) => `${n + 1}. ${[i.nome, i.apresentacao].filter(Boolean).join(' ')}${i.quantidade ? ` — ${i.quantidade}` : ''}${i.posologia ? `: ${i.posologia}` : ''}`).join('\n') },
      { titulo: 'Documentos emitidos', texto: DOCS_CONSULTA.filter(d => d.tipo !== 'registro').map(d => `- ${fmtData(d.emitido_em)} ${fmtHora(d.emitido_em)} · ${d.titulo}${d.anulado_em ? ' (anulado)' : ''}${d.resumo ? `: ${d.resumo}` : ''}`).join('\n') },
      { titulo: 'Adendos', texto: C.adendos.map(a => `- ${fmtData(a.em)} ${fmtHora(a.em)}: ${a.texto}`).join('\n') }
    ];
  }

  async function finalizar(btn) {
    const r = C.registro;
    const faltas = [];
    if (!r.motivo && !r.hda) faltas.push('queixa/história');
    if (!r.hipotese && !r.conduta) faltas.push('avaliação/conduta');
    const pend = docTemConteudo(r.doc_rascunho) ? ` Há ${NOME_DOC[r.doc_rascunho.tipo].toLowerCase()} em edição que ainda não foi emitida — ela será descartada.` : '';
    const msg = `Depois de finalizada, a consulta fica guardada no prontuário e não pode mais ser editada — só complementada com adendos datados. Você ainda poderá emitir documentos pela ficha da paciente.${faltas.length ? ` Atenção: ainda sem ${faltas.join(' e ')}.` : ''}${pend}`;
    if (!(await confirmar(msg, { ok: 'Finalizar consulta', titulo: 'Finalizar consulta' }))) return;
    await ocupado(btn, async () => {
      try { if (r.doc_rascunho) { delete r.doc_rascunho; sujo = true; } await salvarPendente(); C = await DB.consultas.finalizar(C.id); C.registro = C.registro || {}; C.adendos = C.adendos || []; toast('Consulta finalizada e guardada no prontuário.'); leituraConsulta($('#main')); window.scrollTo(0, 0); }
      catch (err) { falha(err); }
    });
  }

  function leituraConsulta(main) {
    const blocos = registroParaPDF().slice(1).filter(b => b.titulo !== 'Adendos' && b.titulo !== 'Documentos emitidos');
    const secoes = blocos.map(b => {
      const campos = (b.campos || []).filter(c => c.valor);
      if (!campos.length && !b.texto) return '';
      return `<section class="card read"><h2 style="font-size:1.5rem;margin-bottom:12px">${esc(b.titulo)}</h2>${campos.length ? `<dl>${campos.map(c => `<dt>${esc(c.rotulo)}</dt><dd>${esc(c.valor)}</dd>`).join('')}</dl>` : ''}${b.texto ? `<p style="white-space:pre-wrap" class="wrap-any">${esc(b.texto)}</p>` : ''}</section>`;
    }).join('');
    main.innerHTML = `
      ${cabecalhoConsulta(`<span class="chip ok">${ICON.check.replace('<svg', '<svg width="14" height="14"')}Finalizada${C.finalizada_em ? ` em ${fmtData(C.finalizada_em)} ${fmtHora(C.finalizada_em)}` : ''}</span>`)}
      <div class="actions" style="margin-bottom:16px">
        <button class="btn btn-primary" data-x="novo-doc">${ICON.plus}Emitir documento</button>
        <button class="btn btn-ghost" data-x="pdf-reg">${ICON.doc}Registro da consulta (PDF)</button>
        ${cicloTemConteudo(C.registro.ciclo_tratamento) ? `<button class="btn btn-ghost" data-x="pdf-livreto">${ICON.guide}Livreto do ciclo (PDF)</button>` : ''}
      </div>
      ${temAlergia(CP.alergias) ? `<div class="alert danger" style="margin-bottom:12px">${ICON.alert}<p><b>Alergias:</b> ${esc(CP.alergias)}</p></div>` : ''}
      <section class="card fat-read"><div class="fat-read-l">${ICON.cash}<div><p class="label">Atendimento na clínica</p><p><b>${esc(C.servico || 'Serviço não informado')}</b> · ${esc(C.plano || PLANO_PADRAO)}</p></div></div><div class="fat-read-r"><b class="valor-grande">${C.valor != null ? PDF.brl(C.valor) : '—'}</b><button class="btn btn-quiet" type="button" data-x="fat-editar">Editar</button></div></section>
      ${secoes || '<div class="empty"><p>Esta consulta foi finalizada sem registros.</p></div>'}
      <section class="card" id="docs-fin"><h2 style="font-size:1.5rem;margin-bottom:12px">Documentos emitidos</h2><div id="docs-lista"></div></section>
      <section class="card" id="adendos">
        <h2 style="font-size:1.5rem;margin-bottom:12px">Adendos</h2>
        ${C.adendos.length ? C.adendos.map(a => `<div class="adendo"><p class="small muted">${fmtData(a.em)} às ${fmtHora(a.em)}</p><p style="white-space:pre-wrap" class="wrap-any">${esc(a.texto)}</p></div>`).join('') : '<p class="muted small">Para corrigir ou complementar esta consulta, registre um adendo — ele fica datado e não substitui o original.</p>'}
        <form id="f-ad" class="stack" style="margin-top:12px" novalidate>${areaTexto('ad-t', 'texto', '', { rot: 'Novo adendo', linhas: 3, campo: 'adendo' })}<div class="actions"><button class="btn btn-ghost" type="submit">Adicionar adendo</button></div></form>
      </section>`;
    desenharDocsConsulta();
    const recarregar = () => DB.documentos.list({ consultaId: C.id }).then(l => { DOCS_CONSULTA = l; desenharDocsConsulta(); });
    main.querySelector('[data-x="novo-doc"]').addEventListener('click', () => dialogoNovoDocumento(CP, { consultaId: C.id, depois: recarregar }));
    main.querySelector('[data-x="fat-editar"]').addEventListener('click', () => dialogoFaturamento(() => leituraConsulta(main)));
    const bl = main.querySelector('[data-x="pdf-livreto"]');
    if (bl) bl.addEventListener('click', e => ocupado(e.currentTarget, () => emitirDocumento({ tipo: 'livreto', clinica_id: C.clinica_id, ciclo: C.registro.ciclo_tratamento }, { paciente: CP, consultaId: C.id, emitido: async () => { await recarregar(); } })));
    main.querySelector('[data-x="pdf-reg"]').addEventListener('click', e => ocupado(e.currentTarget, () => {
      const cl = clinicaPorId(C.clinica_id) || {};
      const dados = { medico: pick(S.perfil, ['tratamento', 'nome', 'especialidade', 'crm', 'crm_uf', 'rqe', 'telefone', 'email']), clinica: pick(cl, ['nome', 'endereco', 'bairro', 'cidade', 'uf', 'cep', 'telefone', 'email']), paciente: pick(CP, ['nome', 'nome_social', 'data_nascimento', 'sexo', 'cpf']), data: new Date().toISOString(), tamanho: S.perfil.pdf_tamanho || 'A4', marcaDagua: S.perfil.pdf_marca_dagua !== false, tipo: 'registro', registro: registroParaPDF().slice(1), subtitulo: `${rotuloDaConsulta().texto} — ${fmtData(C.data)}` };
      return emitirDados(dados, { pacienteId: CP.id, consultaId: C.id, clinicaId: C.clinica_id, paciente: CP, aoEmitir: async () => { await recarregar(); } });
    }));
    main.querySelector('#f-ad').addEventListener('submit', async e => {
      e.preventDefault(); const ta = $('#ad-t'); const t = ta.value.trim();
      if (!t) { erroCampo(ta, 'Escreva o adendo.'); ta.focus(); return; }
      await ocupado($('button[type=submit]', e.currentTarget), async () => {
        try { C = await DB.consultas.adendo(C.id, t); C.adendos = C.adendos || []; C.registro = C.registro || {}; toast('Adendo registrado.'); leituraConsulta(main); $('#adendos').scrollIntoView(); } catch (err) { falha(err); }
      });
    });
  }

  /* =====================================================================
     Modelos e textos padrão
     ===================================================================== */
  const TIPOS_MODELO = [['medicamentos', 'Medicamentos'], ['prescricao', 'Receitas padrão'], ['exames', 'Pacotes de exames'], ['atestado', 'Atestados'], ['orientacao', 'Folhetos de orientação'], ['ciclo', 'Protocolos do ciclo'], ['livreto', 'Livreto do ciclo'], ['orcamento', 'Orçamentos'], ['texto', 'Textos da consulta']];
  const contaTipo = k => k === 'medicamentos' ? S.favoritos.length : modelosDo(k).length;
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
    if (m.tipo === 'orientacao') return [c.titulo, c.referencia ? `datas a partir de: ${c.referencia.toLowerCase()}` : ''].filter(Boolean).join(' · ');
    if (m.tipo === 'orcamento') { const n = (c.itens || []).length; const t = orcTotal(c); return `${n} ${n === 1 ? 'item' : 'itens'}${t ? ' · total ' + PDF.brl(t) : ' · valores a preencher'}`; }
    if (m.tipo === 'ciclo') { const nm = (c.meds || []).length, nc = (c.controles || []).length, pd = (c.procedimento || {}).dia; return [c.protocolo, `${nm} ${nm === 1 ? 'medicação' : 'medicações'}`, `${nc} ${nc === 1 ? 'controle' : 'controles'}`, pd ? `${rotuloProc(c.protocolo).toLowerCase()} no dia ${pd}` : ''].filter(Boolean).join(' · '); }
    if (m.tipo === 'livreto') { const ne = String(c.etapas || '').split('\n').filter(x => x.trim()).length; const nc = (c.cuidados || []).length; const k = c.contatos || {}; return [(c.protocolos || []).join(', ') || 'Todos os tratamentos', `${ne} etapas · ${nc} cuidados`, (c.procedimento || {}).titulo || '', k.whatsapp || k.clinica_tel ? '' : 'contatos a preencher'].filter(Boolean).join(' · '); }
    return (c.texto || '').slice(0, 110) + ((c.texto || '').length > 110 ? '…' : '');
  }

  /* ---------- números por extenso (para {dias}) ---------- */
  const UN = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const DZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const extenso = n => n < 20 ? UN[n] : n < 100 ? DZ[Math.floor(n / 10)] + (n % 10 ? ' e ' + UN[n % 10] : '') : String(n);

  /* ---------- variáveis dos modelos de atestado ---------- */
  function variaveisAuto() {
    const vc = VARS_CTX || { paciente: CP, clinicaId: C && C.clinica_id, data: C ? C.data : new Date().toISOString() };
    const d = new Date(vc.data || Date.now()); const P = vc.paciente;
    const cl = clinicaPorId(vc.clinicaId);
    return {
      paciente: P ? (P.nome_social || P.nome) : '', cpf: P ? P.cpf : '', idade: P ? idade(P.data_nascimento) : '',
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
  function rxItensHTML(lista, estrela, pref = 'rx') {
    return lista.map((it, i) => `<li class="rx">
      <div class="rx-top"><span class="n" aria-hidden="true">${i + 1}.</span><span class="flags">${it.antimicrobiano ? '<span class="chip copper">Antimicrobiano · 2 vias</span>' : ''}${it.controlado ? '<span class="chip danger">Controle especial</span>' : ''}</span>
        <button type="button" class="icon-btn" data-x="rx-up" data-i="${i}" aria-label="Mover medicamento ${i + 1} para cima" ${i === 0 ? 'disabled' : ''}>${ICON.down.replace('<svg', '<svg style="transform:rotate(180deg)"')}</button>
        <button type="button" class="icon-btn" data-x="rx-down" data-i="${i}" aria-label="Mover medicamento ${i + 1} para baixo" ${i === lista.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
        ${estrela ? `<button type="button" class="icon-btn" data-x="rx-star" data-i="${i}" aria-label="Guardar medicamento ${i + 1} no meu banco de medicamentos" title="Guardar no meu banco de medicamentos">${ICON.star}</button>` : ''}
        <button type="button" class="icon-btn" data-x="rx-del" data-i="${i}" aria-label="Remover medicamento ${i + 1}">${ICON.trash}</button></div>
      <div class="rx-grid">
        ${campo('Medicamento', `<input id="${pref}-n-${i}" data-rx="${i}" data-k="nome" value="${esc(it.nome)}" list="fav-list" placeholder="Nome (DCB ou comercial)">`)}
        ${campo('Concentração / forma', `<input id="${pref}-a-${i}" data-rx="${i}" data-k="apresentacao" value="${esc(it.apresentacao)}" placeholder="Ex.: 500 mg comprimido">`)}
        ${campo('Via', `<select id="${pref}-v-${i}" data-rx="${i}" data-k="via">${[...new Set([...VIAS, it.via || 'Oral'])].map(vv => `<option ${vv === (it.via || 'Oral') ? 'selected' : ''}>${esc(vv)}</option>`).join('')}</select>`)}
        ${campo('Quantidade', `<input id="${pref}-q-${i}" data-rx="${i}" data-k="quantidade" value="${esc(it.quantidade)}" placeholder="Ex.: 1 caixa">`)}
        <div class="full">${campo('Posologia', `<textarea id="${pref}-p-${i}" data-rx="${i}" data-k="posologia" rows="2" placeholder="Ex.: Tomar 1 comprimido de 12 em 12 horas por 7 dias.">${esc(it.posologia)}</textarea>`)}</div>
        <div class="full checks"><label class="check small"><input type="checkbox" data-rx="${i}" data-k="antimicrobiano" ${it.antimicrobiano ? 'checked' : ''}> Antimicrobiano (receita em 2 vias)</label><label class="check small"><input type="checkbox" data-rx="${i}" data-k="controlado" ${it.controlado ? 'checked' : ''}> Controle especial (Portaria 344)</label></div>
      </div></li>`).join('');
  }
  function atualizarListaMedicamentos() {
    let dl = document.getElementById('fav-list');
    if (!dl) { dl = document.createElement('datalist'); dl.id = 'fav-list'; document.body.appendChild(dl); }
    dl.innerHTML = S.favoritos.map(f => `<option value="${esc(f.nome)}">${esc(f.apresentacao)}</option>`).join('');
  }

  /* ---------- banco de medicamentos ---------- */
  async function salvarComoMedicamento(it, btn, depois) {
    if (!it || !(it.nome || '').trim()) return toast('Preencha o nome do medicamento antes de guardar.', true);
    if (S.favoritos.some(f => norm(f.nome) === norm(it.nome) && norm(f.apresentacao) === norm(it.apresentacao))) return toast('Este medicamento já está no seu banco.');
    await ocupado(btn, async () => {
      try { const f = await DB.favoritos.save({ ...copiaItem(it), nome: it.nome.trim() }); S.favoritos.push(f); atualizarListaMedicamentos(); toast(`${it.nome} guardado no seu banco de medicamentos.`); depois && depois(); }
      catch (err) { falha(err); }
    });
  }
  function dialogoMedicamento(orig, depois) {
    const novo = !orig; const m = orig ? { ...orig } : copiaItem({});
    abrirDialogo({
      titulo: novo ? 'Novo medicamento' : 'Editar medicamento',
      corpo: `<form id="f-med" class="grid grid-2" novalidate>
        ${campo('Medicamento *', `<input id="md-n" name="nome" value="${esc(m.nome)}" placeholder="Nome (DCB ou comercial)">`)}
        ${campo('Concentração / forma', `<input id="md-a" name="apresentacao" value="${esc(m.apresentacao)}" placeholder="Ex.: 500 mg comprimido">`)}
        ${campo('Via', `<select id="md-v" name="via">${[...new Set([...VIAS, m.via || 'Oral'])].map(v => `<option ${v === (m.via || 'Oral') ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`)}
        ${campo('Quantidade', `<input id="md-q" name="quantidade" value="${esc(m.quantidade)}" placeholder="Ex.: 1 caixa">`)}
        <div class="span-all">${campo('Posologia padrão', `<textarea id="md-p" name="posologia" rows="3" placeholder="Ex.: Tomar 1 comprimido de 12 em 12 horas por 7 dias.">${esc(m.posologia)}</textarea>`)}</div>
        <label class="check span-all"><input type="checkbox" name="antimicrobiano" ${m.antimicrobiano ? 'checked' : ''}> Antimicrobiano (receita em 2 vias)</label>
        <label class="check span-all"><input type="checkbox" name="controlado" ${m.controlado ? 'checked' : ''}> Controle especial (não sai nesta receita)</label>
      </form>`,
      rodape: `${novo ? '' : `<button class="btn btn-danger" data-del>${ICON.trash}Excluir</button>`}<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Salvar</button>`,
      aoAbrir: (d, fechar) => {
        d.querySelector('#md-n').addEventListener('change', e => { const f = d.querySelector('#f-med'); const v = e.target.value; if (temTermo(v, ANTIMICROBIANOS)) f.antimicrobiano.checked = true; if (temTermo(v, CONTROLADOS)) f.controlado.checked = true; });
        d.querySelector('[data-ok]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
          const v = lerForm(d.querySelector('#f-med')); const n = d.querySelector('#md-n');
          if (!v.nome) { erroCampo(n, 'Informe o medicamento.'); n.focus(); return; }
          try { await DB.favoritos.save({ ...(novo ? {} : { id: orig.id }), ...v }); S.favoritos = await DB.favoritos.list(); atualizarListaMedicamentos(); toast(novo ? 'Medicamento cadastrado.' : 'Medicamento atualizado.'); fechar(); depois && depois(); } catch (err) { falha(err); }
        }));
        const del = d.querySelector('[data-del]');
        if (del) del.addEventListener('click', async () => {
          fechar();
          if (!(await confirmar(`Excluir “${orig.nome}” do seu banco de medicamentos? Receitas já emitidas não mudam.`, { ok: 'Excluir', perigo: true, titulo: 'Excluir medicamento' }))) return;
          try { await DB.favoritos.remove(orig.id); S.favoritos = S.favoritos.filter(x => x.id !== orig.id); atualizarListaMedicamentos(); toast('Medicamento excluído.'); depois && depois(); } catch (err) { falha(err); }
        });
      }
    });
  }

  /* ---------- usar / salvar modelos no editor de documento ---------- */
  let VARS_CTX = null;
  async function usarModeloNoEditor(E, ctx) {
    const tipo = { receita: 'prescricao', orientacoes: 'orientacao' }[E.tipo] || E.tipo;
    if (!['prescricao', 'exames', 'atestado', 'orientacao', 'orcamento'].includes(tipo)) return false;
    const m = await escolherModelo(tipo); if (!m) return false;
    const c = m.conteudo || {};
    if (tipo === 'prescricao') {
      const tem = E.itens.some(i => i.nome) || (E.orientacoes || '').trim();
      const modo = tem ? await substituirOuAdicionar('Usar receita padrão') : 'sub'; if (!modo) return false;
      const itens = (c.itens || []).map(copiaItem);
      E.itens = modo === 'sub' ? itens : E.itens.filter(i => i.nome).concat(itens);
      if (c.orientacoes) E.orientacoes = modo === 'sub' || !(E.orientacoes || '').trim() ? c.orientacoes : E.orientacoes.replace(/\s*$/, '') + '\n' + c.orientacoes;
      else if (modo === 'sub') E.orientacoes = '';
    } else if (tipo === 'exames') {
      const tem = E.exames.some(x => x.nome);
      const modo = tem ? await substituirOuAdicionar('Usar pacote de exames') : 'sub'; if (!modo) return false;
      const ex = (c.exames || []).map(x => ({ nome: x.nome || '' }));
      E.exames = modo === 'sub' ? ex : E.exames.filter(x => x.nome).concat(ex);
      if (c.indicacao && (modo === 'sub' || !E.indicacao)) E.indicacao = c.indicacao;
    } else if (tipo === 'orientacao') {
      if ((E.texto || '').trim() && !(await confirmar('Substituir o texto atual pelo folheto?', { ok: 'Substituir', titulo: 'Usar folheto padrão' }))) return false;
      VARS_CTX = { paciente: ctx.paciente, clinicaId: E.clinica_id, data: ctx.data || new Date().toISOString() };
      E.texto = preencherVariaveis(c.texto || ''); VARS_CTX = null;
      E.titulo = c.titulo || m.nome; E.referencia = c.referencia || '';
      if (PDF.temDatas(E.texto) && !E.data_ref) toast(`Informe ${(c.referencia || 'a data de referência').toLowerCase()} para calcular as datas do folheto.`);
    } else if (tipo === 'orcamento') {
      if ((E.itens || []).some(i => (i.descricao || '').trim()) && !(await confirmar('Substituir o orçamento atual pelo modelo?', { ok: 'Substituir', titulo: 'Usar orçamento padrão' }))) return false;
      Object.assign(E, orcamentoVazio(), JSON.parse(JSON.stringify(pickOrc(c))));
    } else {
      if ((E.texto || '').trim() && !(await confirmar('Substituir o texto atual do atestado pelo modelo?', { ok: 'Substituir', titulo: 'Usar modelo de atestado' }))) return false;
      VARS_CTX = { paciente: ctx.paciente, clinicaId: E.clinica_id, data: ctx.data || new Date().toISOString() };
      const texto = await perguntarVariaveis(c.texto || ''); VARS_CTX = null; if (texto == null) return false;
      E.texto = texto; E.titulo = c.titulo || 'Atestado médico';
      if (!ctx.paciente.cpf && !/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/.test(texto)) toast('A ficha da paciente está sem CPF — a Resolução CFM 2.381/2024 pede nome e CPF nos documentos.', true);
    }
    toast(`“${m.nome}” aplicado — edite o que precisar.`);
    return true;
  }
  function salvarEditorComoModelo(E) {
    const tipo = { receita: 'prescricao', orientacoes: 'orientacao' }[E.tipo] || E.tipo;
    let conteudo, vazio;
    if (tipo === 'prescricao') { const itens = E.itens.filter(i => i.nome).map(copiaItem); conteudo = { itens, orientacoes: E.orientacoes || '' }; vazio = !itens.length; }
    else if (tipo === 'exames') { const ex = E.exames.filter(x => x.nome).map(x => ({ nome: x.nome })); conteudo = { exames: ex, indicacao: E.indicacao || '' }; vazio = !ex.length; }
    else if (tipo === 'atestado') { conteudo = { titulo: E.titulo || 'Atestado médico', texto: E.texto || '' }; vazio = !conteudo.texto.trim(); }
    else if (tipo === 'orientacao') { conteudo = { titulo: E.titulo || '', referencia: E.referencia || '', texto: E.texto || '' }; vazio = !conteudo.texto.trim(); }
    else if (tipo === 'orcamento') { conteudo = JSON.parse(JSON.stringify(pickOrc(E))); conteudo.itens = conteudo.itens.filter(i => (i.descricao || '').trim()); vazio = !conteudo.itens.length; }
    else return;
    if (vazio) return toast(tipo === 'prescricao' ? 'Adicione medicamentos antes de salvar a receita padrão.' : 'Preencha o documento antes de salvar como modelo.', true);
    const rot = { prescricao: 'receita padrão', exames: 'pacote de exames', atestado: 'modelo de atestado', orientacao: 'folheto padrão', orcamento: 'orçamento padrão' }[tipo];
    abrirDialogo({
      titulo: `Salvar como ${rot}`,
      corpo: `<form id="sm-f" class="stack" novalidate>${campo('Nome', `<input id="sm-nome" autofocus placeholder="${{ prescricao: 'Ex.: Vaginose bacteriana', exames: 'Ex.: Rotina anual', orientacao: 'Ex.: Inseminação intrauterina', orcamento: 'Ex.: FIV/ICSI' }[tipo] || 'Ex.: Afastamento'}">`)}
        ${tipo === 'prescricao' ? `<p class="small muted">${conteudo.itens.length} ${conteudo.itens.length === 1 ? 'medicamento' : 'medicamentos'}${conteudo.orientacoes ? ' e as orientações' : ''} ficarão salvos com este nome para usar em outras pacientes.</p>` : ''}
        ${tipo === 'atestado' ? `<p class="small muted">Dica: na área Modelos, troque o nome da paciente, a data e os dias por {paciente}, {data} e {dias} para o modelo se preencher sozinho.</p>` : ''}</form>`,
      rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Salvar</button>`,
      aoAbrir: (d, fechar) => d.querySelector('[data-ok]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
        const n = d.querySelector('#sm-nome'); if (!n.value.trim()) { erroCampo(n, 'Dê um nome.'); n.focus(); return; }
        try { await salvarModelo({ tipo, nome: n.value.trim(), conteudo }); toast(`${rot.charAt(0).toUpperCase() + rot.slice(1)} “${n.value.trim()}” salvo.`); fechar(); } catch (err) { falha(err); }
      }))
    });
  }

  /* ---------- enviar documentos à paciente (e-mail / WhatsApp) ---------- */
  function telefoneWhats(t) {
    let d = String(t || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length === 10 || d.length === 11) d = '55' + d;
    return d.length >= 12 ? d : '';
  }
  async function dialogoEnviar(paciente, docs) {
    docs = docs.filter(d => !d.anulado_em);
    if (!docs.length) return toast('Não há documentos válidos para enviar.', true);
    const primeiro = (paciente.nome_social || paciente.nome || '').split(/\s+/)[0] || '';
    const assunto = `Seus documentos — ${MARCA_NOME}`;
    const msgPadrao = `Olá, ${primeiro}! Seguem os documentos do seu atendimento com a ${MARCA_NOME}. Qualquer dúvida, estou à disposição.`;
    const nativo = !!(navigator.canShare && typeof File === 'function' && navigator.canShare({ files: [new File([new Blob(['x'], { type: 'application/pdf' })], 'teste.pdf', { type: 'application/pdf' })] }));
    abrirDialogo({
      titulo: 'Enviar para a paciente', largo: true,
      corpo: `<div class="stack">
        <fieldset class="envio-docs"><legend class="label">Documentos</legend>${docs.map(d => `<label class="check"><input type="checkbox" data-envdoc="${esc(d.id)}" checked> <span><b>${esc(d.titulo)}</b> <span class="muted small">· ${fmtData(d.emitido_em)} ${fmtHora(d.emitido_em)}</span><br><span class="small muted wrap-any">${esc(d.nome_arquivo)}</span></span></label>`).join('')}</fieldset>
        ${campo('Mensagem', `<textarea id="env-msg" rows="3">${esc(msgPadrao)}</textarea>`)}
        <section class="envio-canal"><h3>${ICON.share}E-mail</h3>
          <div class="grid grid-2">${campo('E-mail da paciente', `<input id="env-email" type="email" inputmode="email" value="${esc(paciente.email || '')}" placeholder="nome@exemplo.com">`)}${campo('Assunto', `<input id="env-assunto" value="${esc(assunto)}">`)}</div>
          <p class="small muted">Os PDFs vão anexados. ${DB.modo === 'demo' ? 'Na demonstração o e-mail não é enviado de verdade.' : 'Respostas da paciente chegam no e-mail do seu perfil.'}</p>
          <div class="actions"><button type="button" class="btn btn-primary" data-env="email">Enviar por e-mail</button></div></section>
        <section class="envio-canal"><h3>${ICON.share}WhatsApp</h3>
          ${campo('WhatsApp da paciente', `<input id="env-tel" type="tel" inputmode="tel" value="${esc(paciente.telefone || '')}" placeholder="(71) 90000-0000">`)}
          <p class="small muted">${nativo ? '“Compartilhar PDFs” anexa os arquivos — escolha o WhatsApp e a conversa da paciente. ' : ''}“Abrir no WhatsApp” abre a conversa com a mensagem pronta e links seguros para os PDFs, válidos por 7 dias.</p>
          <div class="actions">${nativo ? `<button type="button" class="btn btn-primary" data-env="share">${ICON.share}Compartilhar PDFs</button>` : ''}<button type="button" class="btn ${nativo ? 'btn-ghost' : 'btn-primary'}" data-env="whats">Abrir no WhatsApp</button></div></section>
      </div>`,
      aoAbrir: (d, fechar) => {
        const escolhidos = () => docs.filter(x => d.querySelector(`[data-envdoc="${x.id}"]`).checked);
        const blobs = async lista => Promise.all(lista.map(async x => { const full = x.dados ? x : await DB.documentos.get(x.id); const b = (await DB.documentos.pdf(full)) || PDF.gerar(full.dados).blob; return new File([b], x.nome_arquivo, { type: 'application/pdf' }); }));
        d.addEventListener('click', e => {
          const b = e.target.closest('[data-env]'); if (!b) return;
          const lista = escolhidos(); if (!lista.length) return toast('Marque ao menos um documento.', true);
          const msg = d.querySelector('#env-msg').value.trim();
          if (b.dataset.env === 'email') ocupado(b, async () => {
            const em = d.querySelector('#env-email');
            if (!/^\S+@\S+\.\S+$/.test(em.value.trim())) { erroCampo(em, 'Informe um e-mail válido.'); em.focus(); return; } else erroCampo(em);
            try { await DB.envios.email({ documentos: lista.map(x => x.id), para: em.value.trim(), assunto: d.querySelector('#env-assunto').value.trim() || assunto, mensagem: msg, pacienteId: paciente.id }); toast(`E-mail enviado para ${em.value.trim()}.`); fechar(); }
            catch (err) { falha(err); }
          });
          else if (b.dataset.env === 'share') ocupado(b, async () => {
            try { const files = await blobs(lista); await navigator.share({ files, text: msg, title: assunto }); DB.envios.registrar({ paciente_id: paciente.id, canal: 'whatsapp', destino: 'compartilhado', documentos: lista.map(x => x.id) }).catch(() => {}); } catch (err) { if (err && err.name !== 'AbortError') falha(err); }
          });
          else if (b.dataset.env === 'whats') ocupado(b, async () => {
            const tel = d.querySelector('#env-tel'); const num = telefoneWhats(tel.value);
            if (!num) { erroCampo(tel, 'Informe o WhatsApp com DDD.'); tel.focus(); return; } else erroCampo(tel);
            try {
              const links = await Promise.all(lista.map(async x => ({ x, url: await DB.documentos.linkTemporario(x, 7) })));
              const corpo = `${msg}\n\n${links.map(({ x, url }) => `• ${x.titulo}${url ? `: ${url}` : ''}`).join('\n')}${links.some(l => l.url) ? '\n\nOs links ficam disponíveis por 7 dias.' : ''}`;
              const href = `https://wa.me/${num}?text=${encodeURIComponent(corpo)}`;
              const w = window.open(href, '_blank', 'noopener');
              if (!w) { const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }
              if (!links.some(l => l.url)) toast('Na demonstração não há links para os PDFs; envie os arquivos baixados.');
              DB.envios.registrar({ paciente_id: paciente.id, canal: 'whatsapp', destino: num, documentos: lista.map(x => x.id) }).catch(() => {});
            } catch (err) { falha(err); }
          });
        });
      }
    });
  }

  /* ---------- página Modelos ---------- */
  let filtroModelo = 'medicamentos';
  async function viewModelos(main) {
    [S.modelos, S.favoritos] = await Promise.all([DB.modelos.list(), DB.favoritos.list()]); atualizarListaMedicamentos();
    if (filtroModelo === 'medicamentos') return viewMedicamentos(main);
    const nomeT = (TIPOS_MODELO.find(t => t[0] === filtroModelo) || [])[1];
    const lst = modelosDo(filtroModelo);
    let corpo;
    if (!lst.length) {
      corpo = `<div class="empty"><img src="${A['logo-symbol']}" alt=""><h3>Nada em “${esc(nomeT)}” ainda</h3><p>${{ prescricao: 'Selecione medicamentos do seu banco, ajuste a posologia e salve com um nome. Depois, na receita de qualquer paciente, é só tocar em “Usar receita padrão”.', exames: 'Monte pacotes de exames (ex.: rotina anual, investigação de infertilidade) com a indicação clínica.', atestado: 'Atestados com campos automáticos: nome, CPF, data e hora entram sozinhos; os dias de afastamento são perguntados.', texto: 'Textos padrão para qualquer campo da consulta — exame físico normal, exame ginecológico, conduta… Marque como automático para já vir preenchido.', orientacao: 'Folhetos de orientação por protocolo (inseminação, punção, transferência…), com datas calculadas sozinhas a partir do dia do procedimento.', orcamento: 'Orçamentos prontos com honorários, procedimentos e medicações: escolha, ajuste os valores e gere o PDF para a paciente.', ciclo: 'Os ciclos que você usa na maioria das pacientes: medicações, doses, ultrassons, exames, reta final e procedimento, tudo contado a partir do Dia 01. Na consulta de fertilidade, toque em “Usar protocolo padrão” e informe só a data do Dia 01.', livreto: 'O livreto do ciclo para a paciente: capa, etapas, cuidados, calendário de medicações com as datas do ciclo, reta final, jejum e orientações para o dia. Os textos ficam aqui; as medicações e datas vêm da consulta de fertilidade.' }[filtroModelo]}</p>
        <div class="actions" style="justify-content:center"><button class="btn btn-primary" data-x="novo">${ICON.plus}Criar modelo</button><button class="btn btn-ghost" data-x="basicos">Restaurar sugestões</button></div></div>`;
    } else if (filtroModelo === 'texto') {
      const grupos = {}; lst.forEach(m => { const k = (m.conteudo || {}).campo || 'outros'; (grupos[k] = grupos[k] || []).push(m); });
      corpo = CAMPOS.filter(([k]) => grupos[k]).map(([k, t]) => `<h2 class="rule">${esc(t)}</h2><ul class="list">${grupos[k].map(linhaModelo).join('')}</ul>`).join('');
    } else corpo = `<ul class="list">${lst.map(linhaModelo).join('')}</ul>`;
    main.innerHTML = `
      <div class="page-head"><div><h1>Modelos</h1><p class="muted small">Tudo o que você escreve sempre igual, pronto para aplicar e editar na consulta. Os itens “Sugerido” são pontos de partida: abra, ajuste e salve para virar o seu padrão.</p></div><div class="actions"><button class="btn btn-ghost" data-x="basicos">Restaurar sugestões</button><button class="btn btn-primary" data-x="novo">${ICON.plus}Novo modelo</button></div></div>
      ${abasModelos()}
      ${corpo}`;
    $$('[data-tm]', main).forEach(b => b.addEventListener('click', () => { filtroModelo = b.dataset.tm; viewModelos(main); }));
    $$('[data-x="novo"]', main).forEach(b => b.addEventListener('click', () => dialogoModelo({ tipo: filtroModelo }, () => viewModelos(main))));
    $$('[data-mid]', main).forEach(b => b.addEventListener('click', () => dialogoModelo(S.modelos.find(m => m.id === b.dataset.mid), () => viewModelos(main))));
    $$('[data-x="basicos"]', main).forEach(bb => bb.addEventListener('click', () => ocupado(bb, async () => { try { const n = await restaurarSugestoes(); toast(n ? `${n} ${n === 1 ? 'sugestão adicionada' : 'sugestões adicionadas'}.` : 'Todas as sugestões já estão na sua lista.'); viewModelos(main); } catch (err) { falha(err); } })));
  }
  const abasModelos = () => `<div class="filter-chips" role="group" aria-label="Tipo de modelo" style="margin-bottom:16px">${TIPOS_MODELO.map(([k, t]) => `<button type="button" data-tm="${k}" aria-pressed="${k === filtroModelo}">${t} <span class="muted">(${contaTipo(k)})</span></button>`).join('')}</div>`;
  function viewMedicamentos(main) {
    main.innerHTML = `
      <div class="page-head"><div><h1>Modelos</h1><p class="muted small">Seu banco de medicamentos: cadastre os que você usa. Na receita, um toque adiciona o medicamento já com apresentação, quantidade e posologia — e você edita ali mesmo.</p></div><div class="actions"><button class="btn btn-ghost" data-x="basicos-med">Restaurar sugestões</button><button class="btn btn-primary" data-x="novo-med">${ICON.plus}Novo medicamento</button></div></div>
      ${abasModelos()}
      <div class="search" style="margin-bottom:12px"><label class="sr-only" for="med-busca">Buscar medicamento</label>${ICON.search}<input id="med-busca" type="search" placeholder="Buscar medicamento" autocomplete="off"></div>
      <div id="med-lista"></div>`;
    const lista = $('#med-lista', main), busca = $('#med-busca', main);
    const draw = () => {
      const q = norm(busca.value).trim(); const m = S.favoritos.filter(f => !q || norm(f.nome + ' ' + f.apresentacao).includes(q)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      lista.innerHTML = !S.favoritos.length ? `<div class="empty"><img src="${A['logo-symbol']}" alt=""><h3>Nenhum medicamento cadastrado</h3><p>Cadastre os medicamentos que você prescreve com frequência, com a posologia que costuma usar.</p><button class="btn btn-primary" data-x="novo-med">${ICON.plus}Cadastrar medicamento</button></div>`
        : m.length ? `<ul class="list">${m.map(f => `<li><button type="button" class="row" data-medid="${esc(f.id)}"><span class="avatar" aria-hidden="true">${ICON.doc.replace('<svg', '<svg width="22" height="22"')}</span><span class="grow"><span class="title">${esc(f.nome)} <span class="muted">${esc(f.apresentacao)}</span></span><span class="meta"><span>${esc(f.via)}</span>${f.quantidade ? `<span>${esc(f.quantidade)}</span>` : ''}${f.antimicrobiano ? '<span class="chip copper">Antimicrobiano</span>' : ''}${f.controlado ? '<span class="chip danger">Controle especial</span>' : ''}</span>${f.posologia ? `<span class="small muted wrap-any">${esc(f.posologia)}</span>` : ''}</span>${ICON.chev.replace('<svg', '<svg class="chev"')}</button></li>`).join('')}</ul>` : `<p class="muted small">Nenhum medicamento encontrado.</p>`;
      $$('[data-medid]', lista).forEach(b => b.addEventListener('click', () => dialogoMedicamento(S.favoritos.find(f => f.id === b.dataset.medid), () => viewModelos(main))));
      $$('[data-x="novo-med"]', lista).forEach(b => b.addEventListener('click', () => dialogoMedicamento(null, () => viewModelos(main))));
    };
    busca.addEventListener('input', draw); draw();
    $$('[data-tm]', main).forEach(b => b.addEventListener('click', () => { filtroModelo = b.dataset.tm; viewModelos(main); }));
    main.querySelector('.page-head [data-x="novo-med"]').addEventListener('click', () => dialogoMedicamento(null, () => viewModelos(main)));
    main.querySelector('[data-x="basicos-med"]').addEventListener('click', e => ocupado(e.currentTarget, async () => { try { const n = await restaurarMedicamentos(); toast(n ? `${n} ${n === 1 ? 'medicamento sugerido adicionado' : 'medicamentos sugeridos adicionados'}.` : 'Todos os medicamentos sugeridos já estão no seu banco.'); viewModelos(main); } catch (err) { falha(err); } }));
  }
  function linhaModelo(m) {
    return `<li><button type="button" class="row" data-mid="${esc(m.id)}"><span class="avatar" aria-hidden="true">${(m.tipo === 'texto' ? ICON.text : ICON.layers).replace('<svg', '<svg width="22" height="22"')}</span><span class="grow"><span class="title">${esc(m.nome)} ${(m.conteudo || {}).sugerido ? '<span class="chip">Sugerido</span>' : ''} ${(m.conteudo || {}).auto ? '<span class="chip copper">Automático</span>' : ''}</span><span class="small muted wrap-any">${esc(resumoModelo(m))}</span></span>${ICON.chev.replace('<svg', '<svg class="chev"')}</button></li>`;
  }

  function dialogoModelo(orig, depois) {
    const novo = !orig.id;
    const M = JSON.parse(JSON.stringify({ nome: '', conteudo: {}, ...orig }));
    const c = M.conteudo;
    if (M.tipo === 'prescricao') { c.itens = c.itens || []; c.orientacoes = c.orientacoes || ''; }
    if (M.tipo === 'exames') { c.exames = c.exames || []; c.indicacao = c.indicacao || ''; if (!c.exames.length) c.exames.push({ nome: '' }); }
    if (M.tipo === 'atestado') { c.titulo = c.titulo || 'Atestado médico'; c.texto = c.texto || ''; }
    if (M.tipo === 'texto') { c.campo = c.campo || 'exame_fisico'; c.texto = c.texto || ''; }
    if (M.tipo === 'orientacao') { c.titulo = c.titulo ?? ''; c.referencia = c.referencia || ''; c.texto = c.texto || ''; }
    if (M.tipo === 'orcamento') Object.assign(c, { ...orcamentoVazio(), ...pickOrc(c) });
    if (M.tipo === 'ciclo') { const k = { ...padraoVazio(), ...c }; k.procedimento = { dia: '', hora: '', ...(c.procedimento || {}) }; Object.assign(c, k); }
    if (M.tipo === 'livreto') { const base = novo ? JSON.parse(JSON.stringify((baseLivretos()[0] || {}).conteudo || {})) : {}; delete base.sugerido; base.protocolos = []; const k = { ...livretoVazio(), ...base, ...c }; k.contatos = { ...(base.contatos || {}), ...(c.contatos || {}) }; k.procedimento = { ...(base.procedimento || {}), ...(c.procedimento || {}) }; Object.assign(c, k); }
    const nomeT = { prescricao: 'receita padrão', exames: 'pacote de exames', atestado: 'atestado', texto: 'texto padrão', orientacao: 'folheto de orientação', orcamento: 'orçamento', livreto: 'livreto do ciclo', ciclo: 'protocolo do ciclo' }[M.tipo];
    const VARS = ['paciente', 'cpf', 'data', 'hora', 'dias', 'idade', 'clinica'];
    let corpo = `<form id="md-f" class="stack" novalidate>${campo('Nome do modelo *', `<input id="md-nome" value="${esc(M.nome)}" placeholder="${{ prescricao: 'Ex.: Candidíase vulvovaginal', exames: 'Ex.: Rotina ginecológica anual', atestado: 'Ex.: Afastamento', texto: 'Ex.: Exame ginecológico normal', orientacao: 'Ex.: Inseminação intrauterina', orcamento: 'Ex.: Inseminação intrauterina', livreto: 'Ex.: Livreto — FIV na Clínica Vida', ciclo: 'Ex.: FIV antagonista — 225 UI' }[M.tipo]}">`)}`;
    if (M.tipo === 'prescricao') corpo += `${medsPainelHTML('mdp')}<p class="label">Medicamentos desta receita padrão</p><ol class="rx-list" id="md-rx"></ol><div class="actions"><button type="button" class="btn btn-ghost" data-m="rx-add">${ICON.plus}Adicionar medicamento</button></div>${campo('Orientações', `<textarea id="md-or" rows="4">${esc(c.orientacoes)}</textarea>`)}`;
    if (M.tipo === 'exames') corpo += `<p class="label">Exames</p><ul class="ex-list" id="md-ex"></ul><div class="actions"><button type="button" class="btn btn-ghost" data-m="ex-add">${ICON.plus}Adicionar exame</button></div>${campo('Indicação clínica', `<textarea id="md-ind" rows="2">${esc(c.indicacao)}</textarea>`)}`;
    if (M.tipo === 'atestado') corpo += `${campo('Título do documento', `<input id="md-tit" value="${esc(c.titulo)}">`)}${campo('Texto', `<textarea id="md-tx" rows="7">${esc(c.texto)}</textarea>`)}<div><p class="label" style="margin-bottom:6px">Inserir campo automático</p><div class="chips">${VARS.map(v => `<button type="button" class="chip var-chip" data-var-ins="{${v}}">{${v}}</button>`).join('')}</div><p class="small muted" style="margin-top:8px">Nome, CPF, data, hora, idade e clínica entram sozinhos. {dias} e qualquer outro campo entre chaves (ex.: {acompanhante}) são perguntados na hora de usar.</p></div>`;
    if (M.tipo === 'texto') corpo += `${campo('Campo da consulta', `<select id="md-campo">${CAMPOS.map(([k, t]) => `<option value="${k}" ${k === c.campo ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`)}${campo('Texto padrão', `<textarea id="md-tx" rows="7">${esc(c.texto)}</textarea>`)}<label class="check"><input type="checkbox" id="md-auto" ${c.auto ? 'checked' : ''}> Já preencher este campo em toda nova consulta</label>`;
    if (M.tipo === 'orientacao') corpo += folhetoCamposHTML('mdf', c, { modelo: true });
    if (M.tipo === 'orcamento') corpo += orcamentoCamposHTML('mdo', c);
    if (M.tipo === 'ciclo') corpo += `<p class="small muted">Tudo é contado em dias a partir do Dia 01 (o primeiro dia da estimulação). Na paciente, você escolhe este protocolo e informa só a data do Dia 01: as datas dos ultrassons, dos exames, da reta final e do procedimento saem calculadas.</p>${cicloCamposHTML('mdc', c, { relativo: true })}`;
    if (M.tipo === 'livreto') corpo += `<p class="small muted">Os textos abaixo saem no livreto de todas as pacientes que usarem este modelo. Tenha um modelo por tratamento (e, se os contatos mudarem, por clínica).</p>${livretoCamposHTML('mdl', c)}`;
    corpo += `</form>`;
    abrirDialogo({
      titulo: novo ? `Novo modelo de ${nomeT}` : `Editar modelo de ${nomeT}`, largo: ['prescricao', 'orientacao', 'orcamento', 'livreto', 'ciclo'].includes(M.tipo), corpo,
      rodape: `${novo ? '' : `<button class="btn btn-danger" data-m="del">${ICON.trash}Excluir</button>`}${M.tipo !== 'texto' ? `<button class="btn btn-ghost" data-m="prev">${ICON.doc}Ver PDF</button>` : ''}<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-m="ok">Salvar modelo</button>`,
      aoAbrir: (d, fechar) => {
        const drawRx = foco => { const ol = d.querySelector('#md-rx'); if (!ol) return; ol.innerHTML = c.itens.length ? rxItensHTML(c.itens, false, 'md-rx') : '<li class="muted small">Toque nos medicamentos acima para montar a receita padrão.</li>'; if (foco) d.querySelector(`#md-rx-n-${c.itens.length - 1}`).focus(); };
        const medsMd = d.querySelector('.meds'); if (medsMd) desenharMeds(medsMd);
        const drawEx = foco => { const ul = d.querySelector('#md-ex'); if (!ul) return; ul.innerHTML = c.exames.map((e, i) => `<li><label class="sr-only" for="md-ex-${i}">Exame ${i + 1}</label><input id="md-ex-${i}" data-ex="${i}" value="${esc(e.nome)}" placeholder="Ex.: Hemograma completo"><button type="button" class="icon-btn" data-m="ex-del" data-i="${i}" aria-label="Remover exame ${i + 1}">${ICON.trash}</button></li>`).join(''); if (foco) d.querySelector(`#md-ex-${c.exames.length - 1}`).focus(); };
        drawRx(); drawEx();
        if (M.tipo === 'orientacao') ligarFolheto(d, c);
        if (M.tipo === 'orcamento') ligarOrcamento(d, c);
        if (M.tipo === 'livreto') ligarLivreto(d, c);
        if (M.tipo === 'ciclo') ligarCiclo(d, c, null);
        const ler = () => {
          M.nome = d.querySelector('#md-nome').value.trim();
          if (M.tipo === 'prescricao') c.orientacoes = d.querySelector('#md-or').value;
          if (M.tipo === 'exames') c.indicacao = d.querySelector('#md-ind').value;
          if (M.tipo === 'atestado') { c.titulo = d.querySelector('#md-tit').value.trim(); c.texto = d.querySelector('#md-tx').value; }
          if (M.tipo === 'texto') { c.campo = d.querySelector('#md-campo').value; c.texto = d.querySelector('#md-tx').value; c.auto = d.querySelector('#md-auto').checked; }
        };
        d.addEventListener('input', e => {
          const el = e.target;
          if (el.matches('[data-medq]')) return desenharMeds(medsMd);
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
          const med = e.target.closest('[data-med]');
          if (med) { const f = S.favoritos.find(x => x.id === med.dataset.med); if (f) { c.itens = c.itens.filter(it => (it.nome || '').trim()); c.itens.push(copiaItem(f)); drawRx(); toast(`${f.nome} adicionado.`); } return; }
          if (e.target.closest('[data-med-novo]')) { dialogoMedicamento(null, () => desenharMeds(medsMd)); return; }
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
            else if (M.tipo === 'orientacao') { const ref = new Date(); ref.setDate(ref.getDate() + 3); ref.setHours(9, 0, 0, 0); gerarEmostrar({ ...base, tipo: 'orientacoes', titulo: c.titulo, orientacoes: PDF.resolverDatas(tx, ref) }, `Exemplo (datas a partir de ${PDF.dataExtenso(ref)}, 9h00)`); }
            else if (M.tipo === 'orcamento') gerarEmostrar({ ...base, tipo: 'orcamento', ...pickOrc(c), desconto: parseValor(c.desconto) || 0, itens: c.itens.filter(i => (i.descricao || '').trim()).map(i => ({ ...i, valor: Number(i.valor) || 0 })) }, 'Exemplo do modelo');
            else if (M.tipo === 'ciclo') { const h = new Date(); h.setDate(h.getDate() + 2); const ci = padraoParaCiclo(c, isoDe(h)); gerarEmostrar({ ...base, tipo: 'livreto', livreto: JSON.parse(JSON.stringify((modeloLivretoPara(ci) || {}).conteudo || {})), ciclo: ci, rotuloArquivo: 'Livreto do ciclo' }, `Exemplo do livreto (Dia 01 em ${fmtData(isoDe(h))})`); }
            else if (M.tipo === 'livreto') gerarEmostrar({ ...base, tipo: 'livreto', livreto: JSON.parse(JSON.stringify(c)), ciclo: cicloExemplo((c.protocolos || [])[0]), rotuloArquivo: 'Livreto do ciclo' }, 'Exemplo do livreto (ciclo fictício)');
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
            if (M.tipo === 'orcamento') c.itens = c.itens.filter(it => (it.descricao || '').trim());
            if (M.tipo === 'livreto') c.cuidados = (c.cuidados || []).filter(k => (k.titulo || '').trim() || (k.texto || '').trim());
            if (M.tipo === 'ciclo') { c.meds = (c.meds || []).filter(m => (m.nome || '').trim()); c.controles = (c.controles || []).filter(k => k.dia); c.final = (c.final || []).filter(f => (f.med || '').trim()); }
            const vazio = M.tipo === 'prescricao' ? !c.itens.length && !c.orientacoes.trim() : M.tipo === 'exames' ? !c.exames.length : M.tipo === 'orcamento' ? !c.itens.length : M.tipo === 'livreto' ? !String(c.titulo || '').trim() && !String(c.etapas || '').trim() : M.tipo === 'ciclo' ? !(c.meds || []).some(m => (m.nome || '').trim()) : !String(c.texto).trim();
            if (vazio) { toast('O modelo está vazio — preencha o conteúdo antes de salvar.', true); if (M.tipo === 'orcamento') { const ad = d.querySelector('[data-o="add"]'); if (ad) ad.click(); } if (M.tipo === 'prescricao' && !c.itens.length) { c.itens.push(copiaItem({})); drawRx(); } if (M.tipo === 'exames' && !c.exames.length) { c.exames.push({ nome: '' }); drawEx(); } return; }
            await ocupado(b, async () => {
              try { await salvarModelo({ ...(novo ? {} : { id: orig.id }), tipo: M.tipo, nome: M.nome, conteudo: { ...c, sugerido: false } }); toast(novo ? 'Modelo criado.' : 'Modelo salvo como seu padrão.'); fechar(); depois && depois(); } catch (err) { falha(err); }
            });
          }
        });
      }
    });
  }

  /* =====================================================================
     Valores recebidos por clínica, serviço e plano
     ===================================================================== */
  const PLANO_PADRAO = 'Particular';
  const SERVICOS_SUGERIDOS = ['Consulta', 'Retorno', 'Coleta de preventivo', 'Consulta + preventivo', 'Consulta + ultrassonografia', 'Consulta de pré-natal', 'Consulta de fertilidade', 'Retorno de fertilidade', 'Ultrassonografia de monitorização', 'Inserção de DIU', 'Retirada de DIU'];
  const valoresDa = clinicaId => (S.valores || []).filter(v => v.clinica_id === clinicaId);
  const valorTabela = (clinicaId, servico, plano) => { const v = valoresDa(clinicaId).find(x => norm(x.servico).trim() === norm(servico).trim() && norm(x.plano).trim() === norm(plano).trim()); return v ? Number(v.valor) : null; };
  const unicos = l => { const vis = new Set(); return l.filter(x => { const k = norm(x).trim(); if (!x || vis.has(k)) return false; vis.add(k); return true; }); };
  function faturamentoHTML() {
    if (!C.plano) C.plano = (CP.convenio || '').trim() || PLANO_PADRAO;
    return `<div class="fat-box"><p class="label fat-tit">${ICON.cash}Atendimento na clínica — o que você recebe</p>
      <div class="grid grid-3">
        ${campo('Plano / convênio', `<input id="c-plano" name="plano" list="dl-planos" value="${esc(C.plano)}" autocomplete="off">`)}
        ${campo('Serviço realizado', `<input id="c-serv" name="servico" list="dl-serv" value="${esc(C.servico || '')}" placeholder="Ex.: Consulta + preventivo" autocomplete="off">`)}
        ${campo('Valor (R$)', `<input id="c-valor" name="valor" inputmode="decimal" value="${esc(fmtValor(C.valor))}" placeholder="0,00" autocomplete="off">`)}
      </div>
      <p class="small muted fat-dica" id="c-fat-dica" aria-live="polite"></p>
      <datalist id="dl-planos"></datalist><datalist id="dl-serv"></datalist></div>`;
  }
  function atualizarFaturamento(origem) {
    const dp = $('#dl-planos'), ds = $('#dl-serv'), vi = $('#c-valor'), dica = $('#c-fat-dica'); if (!dp) return;
    const vals = valoresDa(C.clinica_id);
    dp.innerHTML = unicos([PLANO_PADRAO, CP.convenio, ...vals.map(v => v.plano)]).map(x => `<option value="${esc(x)}">`).join('');
    const doPlano = vals.filter(v => norm(v.plano).trim() === norm(C.plano).trim());
    ds.innerHTML = doPlano.map(v => `<option value="${esc(v.servico)}">${esc(PDF.brl(v.valor))}</option>`).join('') + unicos([...vals.map(v => v.servico), ...SERVICOS_SUGERIDOS]).filter(x => !doPlano.some(v => norm(v.servico) === norm(x))).map(x => `<option value="${esc(x)}">`).join('');
    const tab = valorTabela(C.clinica_id, C.servico || '', C.plano || '');
    if (origem && origem !== 'valor' && tab != null) { C.valor = tab; vi.value = fmtValor(tab); agendarSalvar(); }
    const cl = (clinicaPorId(C.clinica_id) || {}).nome || 'esta clínica';
    dica.innerHTML = !C.servico ? `Escolha o serviço: o valor da tabela de ${esc(cl)} entra sozinho.`
      : tab != null ? (Number(C.valor) === tab ? `${ICON.check}Valor da tabela de ${esc(cl)}.` : `Tabela de ${esc(cl)}: ${PDF.brl(tab)} — o valor desta consulta foi alterado.`)
      : `Sem valor na tabela para “${esc(C.servico)}” pelo plano ${esc(C.plano || PLANO_PADRAO)} em ${esc(cl)}. <a href="#valores">Cadastrar na tabela de valores</a>`;
  }
  function dialogoFaturamento(depois) {
    const F = { plano: C.plano || PLANO_PADRAO, servico: C.servico || '', valor: C.valor };
    abrirDialogo({
      titulo: 'Atendimento na clínica',
      corpo: `<form id="f-fat" class="stack" novalidate>
        ${campo('Plano / convênio', `<input id="ff-plano" list="ff-dlp" value="${esc(F.plano)}">`)}
        ${campo('Serviço realizado', `<input id="ff-serv" list="ff-dls" value="${esc(F.servico)}">`)}
        ${campo('Valor (R$)', `<input id="ff-valor" inputmode="decimal" value="${esc(fmtValor(F.valor))}">`)}
        <p class="small muted" id="ff-dica"></p>
        <datalist id="ff-dlp">${unicos([PLANO_PADRAO, CP.convenio, ...valoresDa(C.clinica_id).map(v => v.plano)]).map(x => `<option value="${esc(x)}">`).join('')}</datalist>
        <datalist id="ff-dls">${unicos([...valoresDa(C.clinica_id).map(v => v.servico), ...SERVICOS_SUGERIDOS]).map(x => `<option value="${esc(x)}">`).join('')}</datalist>
        <p class="small muted">Só os dados de faturamento mudam: o prontuário finalizado continua protegido.</p></form>`,
      rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Salvar</button>`,
      aoAbrir: (d, fechar) => {
        const pl = d.querySelector('#ff-plano'), sv = d.querySelector('#ff-serv'), vl = d.querySelector('#ff-valor'), dica = d.querySelector('#ff-dica');
        const puxar = () => { const t = valorTabela(C.clinica_id, sv.value, pl.value); if (t != null) { vl.value = fmtValor(t); dica.textContent = 'Valor da tabela desta clínica.'; } else dica.textContent = sv.value ? 'Sem valor na tabela para este serviço e plano.' : ''; };
        pl.addEventListener('change', puxar); sv.addEventListener('change', puxar);
        d.querySelector('[data-ok]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
          try {
            const dados = { plano: pl.value.trim() || PLANO_PADRAO, servico: sv.value.trim(), valor: parseValor(vl.value) };
            await DB.consultas.faturamento(C.id, dados); Object.assign(C, dados); toast('Atendimento atualizado.'); fechar(); depois && depois();
          } catch (err) { falha(err); }
        }));
      }
    });
  }

  let clinicaValores = '';
  async function viewValores(main) {
    main.innerHTML = `<div class="skeleton"></div>`;
    [S.clinicas, S.valores] = await Promise.all([DB.clinicas.list(), DB.valores.list()]);
    if (!S.clinicas.length) { main.innerHTML = `<div class="empty"><h2>Cadastre uma clínica primeiro</h2><p>A tabela de valores é por clínica.</p><a class="btn btn-primary" href="#clinicas">Ir para Clínicas</a></div>`; return; }
    if (!S.clinicas.some(c => c.id === clinicaValores)) clinicaValores = (S.clinicas.find(c => c.ativa !== false) || S.clinicas[0]).id;
    const cl = clinicaPorId(clinicaValores);
    const lst = valoresDa(clinicaValores).sort((a, b) => a.servico.localeCompare(b.servico, 'pt-BR') || a.plano.localeCompare(b.plano, 'pt-BR'));
    const grupos = []; lst.forEach(v => { let g = grupos.find(x => norm(x[0]) === norm(v.servico)); if (!g) grupos.push(g = [v.servico, []]); g[1].push(v); });
    const outras = S.clinicas.filter(c => c.id !== clinicaValores && valoresDa(c.id).length);
    main.innerHTML = `
      <a class="back" href="#clinicas">${ICON.back}Clínicas</a>
      <div class="page-head"><div><h1>Tabela de valores</h1><p class="muted small">Quanto você recebe em cada clínica, por serviço e por plano. Na consulta, ao escolher o plano e o serviço, o valor entra sozinho — e dá para ajustar caso a caso.</p></div>
        <div class="actions"><a class="btn btn-ghost" href="#producao">${ICON.cash}Produção</a><button class="btn btn-primary" data-x="novo">${ICON.plus}Novo valor</button></div></div>
      <div class="filter-chips" role="group" aria-label="Clínica" style="margin-bottom:16px">${S.clinicas.map(c => `<button type="button" data-cv="${esc(c.id)}" aria-pressed="${c.id === clinicaValores}">${esc(c.nome)} <span class="muted">(${valoresDa(c.id).length})</span></button>`).join('')}</div>
      ${grupos.length ? grupos.map(([sv, itens]) => `<h2 class="rule">${esc(sv)}</h2><ul class="list">${itens.map(v => `<li><button type="button" class="row" data-vid="${esc(v.id)}"><span class="avatar" aria-hidden="true">${ICON.cash.replace('<svg', '<svg width="22" height="22"')}</span><span class="grow"><span class="title">${esc(v.plano)}</span><span class="small muted">${esc(sv)} · ${esc(cl.nome)}</span></span><b class="valor">${PDF.brl(v.valor)}</b>${ICON.chev.replace('<svg', '<svg class="chev"')}</button></li>`).join('')}</ul>`).join('')
        : `<div class="empty"><img src="${A['logo-symbol']}" alt=""><h3>Nenhum valor em ${esc(cl.nome)}</h3><p>Cadastre o que você recebe por serviço e plano — por exemplo: “Coleta de preventivo” pelo plano X, “Consulta + preventivo”, “Consulta + acompanhamento”…</p>
          <div class="actions" style="justify-content:center"><button class="btn btn-primary" data-x="novo">${ICON.plus}Cadastrar valor</button>${outras.length ? `<button class="btn btn-ghost" data-x="copiar">Copiar de outra clínica</button>` : ''}</div></div>`}
      ${grupos.length && outras.length ? `<p style="margin-top:16px"><button class="btn btn-quiet" data-x="copiar" style="padding-left:0">Copiar valores de outra clínica</button></p>` : ''}`;
    const recarregar = () => viewValores(main);
    $$('[data-cv]', main).forEach(b => b.addEventListener('click', () => { clinicaValores = b.dataset.cv; recarregar(); }));
    $$('[data-x="novo"]', main).forEach(b => b.addEventListener('click', () => dialogoValor({ clinica_id: clinicaValores }, recarregar)));
    $$('[data-vid]', main).forEach(b => b.addEventListener('click', () => dialogoValor(S.valores.find(v => v.id === b.dataset.vid), recarregar)));
    $$('[data-x="copiar"]', main).forEach(b => b.addEventListener('click', () => dialogoCopiarValores(outras, recarregar)));
  }
  async function dialogoValor(orig, depois) {
    const novo = !orig.id; const V = { plano: PLANO_PADRAO, servico: '', valor: null, ...orig };
    const ps = await pacientes().catch(() => []);
    const planos = unicos([PLANO_PADRAO, ...(S.valores || []).map(v => v.plano), ...ps.map(p => (p.convenio || '').trim())]);
    const servs = unicos([...(S.valores || []).map(v => v.servico), ...SERVICOS_SUGERIDOS]);
    abrirDialogo({
      titulo: novo ? 'Novo valor' : 'Editar valor',
      corpo: `<form id="f-val" class="stack" novalidate>
        ${campo('Clínica', `<select id="vl-cl">${S.clinicas.map(c => `<option value="${esc(c.id)}" ${c.id === V.clinica_id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>`)}
        ${campo('Serviço', `<input id="vl-sv" list="vl-dls" value="${esc(V.servico)}" placeholder="Ex.: Consulta + preventivo" autocomplete="off">`)}
        ${campo('Plano / convênio', `<input id="vl-pl" list="vl-dlp" value="${esc(V.plano)}" placeholder="Ex.: Particular, Unimed, Bradesco…" autocomplete="off">`)}
        ${campo('Valor que você recebe (R$)', `<input id="vl-v" inputmode="decimal" value="${esc(fmtValor(V.valor))}" placeholder="0,00" autocomplete="off">`)}
        <datalist id="vl-dls">${servs.map(x => `<option value="${esc(x)}">`).join('')}</datalist><datalist id="vl-dlp">${planos.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
        <p class="small muted">Use um nome por combinação de serviços (ex.: “Consulta + preventivo”), como a clínica paga.</p></form>`,
      rodape: `${novo ? '' : `<button class="btn btn-danger" data-del>${ICON.trash}Excluir</button>`}<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Salvar</button>`,
      aoAbrir: (d, fechar) => {
        d.querySelector('#vl-v').addEventListener('blur', e => { if (e.target.value.trim()) e.target.value = fmtValor(parseValor(e.target.value)); });
        d.querySelector('[data-ok]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
          const sv = d.querySelector('#vl-sv'), pl = d.querySelector('#vl-pl'), vv = d.querySelector('#vl-v');
          const valor = parseValor(vv.value); let ok = true;
          if (!sv.value.trim()) { erroCampo(sv, 'Informe o serviço.'); ok = false; } else erroCampo(sv);
          if (!pl.value.trim()) { erroCampo(pl, 'Informe o plano (ou “Particular”).'); ok = false; } else erroCampo(pl);
          if (valor == null) { erroCampo(vv, 'Informe o valor.'); ok = false; } else erroCampo(vv);
          if (!ok) return;
          const clinica_id = d.querySelector('#vl-cl').value;
          const dup = (S.valores || []).find(x => x.id !== orig.id && x.clinica_id === clinica_id && norm(x.servico).trim() === norm(sv.value).trim() && norm(x.plano).trim() === norm(pl.value).trim());
          if (dup) { erroCampo(sv, 'Já existe valor para este serviço e plano nesta clínica — edite o existente.'); return; }
          try { await DB.valores.save({ ...(novo ? {} : { id: orig.id }), clinica_id, servico: sv.value.trim(), plano: pl.value.trim(), valor }); S.valores = await DB.valores.list(); clinicaValores = clinica_id; toast(novo ? 'Valor cadastrado.' : 'Valor atualizado.'); fechar(); depois && depois(); } catch (err) { falha(err); }
        }));
        const del = d.querySelector('[data-del]');
        if (del) del.addEventListener('click', async () => {
          fechar();
          if (!(await confirmar(`Excluir o valor de “${orig.servico}” · ${orig.plano}? As consultas já registradas mantêm o valor que tinham.`, { ok: 'Excluir', perigo: true, titulo: 'Excluir valor' }))) return;
          try { await DB.valores.remove(orig.id); S.valores = await DB.valores.list(); toast('Valor excluído.'); depois && depois(); } catch (err) { falha(err); }
        });
      }
    });
  }
  function dialogoCopiarValores(outras, depois) {
    abrirDialogo({
      titulo: 'Copiar valores de outra clínica',
      corpo: `<div class="stack"><p>Os serviços e planos da clínica escolhida são copiados para <b>${esc((clinicaPorId(clinicaValores) || {}).nome || '')}</b>, com os mesmos valores. Os que já existem aqui não mudam.</p>${campo('Copiar de', `<select id="cp-de">${outras.map(c => `<option value="${esc(c.id)}">${esc(c.nome)} (${valoresDa(c.id).length})</option>`).join('')}</select>`)}</div>`,
      rodape: `<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Copiar</button>`,
      aoAbrir: (d, fechar) => d.querySelector('[data-ok]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
        const de = d.querySelector('#cp-de').value; let n = 0;
        try {
          for (const v of valoresDa(de)) if (valorTabela(clinicaValores, v.servico, v.plano) == null) { await DB.valores.save({ clinica_id: clinicaValores, servico: v.servico, plano: v.plano, valor: v.valor }); n++; }
          S.valores = await DB.valores.list(); toast(n ? `${n} ${n === 1 ? 'valor copiado' : 'valores copiados'} — ajuste o que for diferente.` : 'Nada novo para copiar.'); fechar(); depois && depois();
        } catch (err) { falha(err); }
      }))
    });
  }

  /* =====================================================================
     Produção: quanto foi atendido e recebido, por período
     ===================================================================== */
  let PROD = { periodo: 'mes', clinica: '', de: '', ate: '' };
  const PERIODOS_PROD = [['hoje', 'Hoje'], ['semana', 'Esta semana'], ['mes', 'Este mês'], ['mes_ant', 'Mês passado'], ['ano', 'Este ano'], ['pers', 'Personalizado']];
  function intervaloProd() {
    const h = new Date(); h.setHours(0, 0, 0, 0); let a, b;
    if (PROD.periodo === 'hoje') { a = h; b = new Date(h); b.setDate(b.getDate() + 1); }
    else if (PROD.periodo === 'semana') { a = new Date(h); a.setDate(a.getDate() - ((a.getDay() + 6) % 7)); b = new Date(a); b.setDate(b.getDate() + 7); }
    else if (PROD.periodo === 'mes_ant') { a = new Date(h.getFullYear(), h.getMonth() - 1, 1); b = new Date(h.getFullYear(), h.getMonth(), 1); }
    else if (PROD.periodo === 'ano') { a = new Date(h.getFullYear(), 0, 1); b = new Date(h.getFullYear() + 1, 0, 1); }
    else if (PROD.periodo === 'pers' && PROD.de && PROD.ate) { a = new Date(PROD.de + 'T00:00:00'); b = new Date(PROD.ate + 'T00:00:00'); b.setDate(b.getDate() + 1); }
    else { a = new Date(h.getFullYear(), h.getMonth(), 1); b = new Date(h.getFullYear(), h.getMonth() + 1, 1); }
    return [a, b];
  }
  async function viewProducao(main) {
    main.innerHTML = `<div class="skeleton"></div>`;
    const [ps, cs] = await Promise.all([pacientes(true), DB.consultas.list()]);
    const nomeP = id => (ps.find(p => p.id === id) || {}).nome || 'Paciente';
    const rot = {}; ps.forEach(p => Object.assign(rot, rotulosConsultas(p.consultas)));
    const hojeISO = new Date().toISOString().slice(0, 10);
    if (!PROD.de) PROD.de = hojeISO.slice(0, 8) + '01'; if (!PROD.ate) PROD.ate = hojeISO;
    main.innerHTML = `
      <div class="page-head"><div><h1>Produção</h1><p class="muted small">Atendimentos e valores a receber, pelo plano e serviço registrados em cada consulta.</p></div>
        <div class="actions"><a class="btn btn-ghost" href="#valores">${ICON.cash}Tabela de valores</a><button class="btn btn-ghost" data-x="csv">${ICON.download}Baixar planilha</button></div></div>
      <section class="card filtros" aria-label="Período e clínica">
        <div class="filter-chips" role="group" aria-label="Período">${PERIODOS_PROD.map(([k, t]) => `<button type="button" data-pp="${k}" aria-pressed="${k === PROD.periodo}">${t}</button>`).join('')}</div>
        <div class="filtros-grid" style="margin-top:12px">
          ${campo('Clínica', `<select id="pr-cl"><option value="">Todas as clínicas</option>${S.clinicas.map(c => `<option value="${esc(c.id)}" ${c.id === PROD.clinica ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>`)}
          <span class="pers" ${PROD.periodo === 'pers' ? '' : 'hidden'}>${campo('De', `<input id="pr-de" type="date" value="${esc(PROD.de)}">`)}</span>
          <span class="pers" ${PROD.periodo === 'pers' ? '' : 'hidden'}>${campo('Até', `<input id="pr-ate" type="date" value="${esc(PROD.ate)}">`)}</span>
        </div>
      </section>
      <div id="pr-corpo"></div>`;
    let linhas = [];
    const desenhar = () => {
      const [a, b] = intervaloProd();
      linhas = cs.filter(c => { const d = new Date(c.data); return d >= a && d < b && (!PROD.clinica || c.clinica_id === PROD.clinica); }).sort((x, y) => new Date(y.data) - new Date(x.data));
      const total = linhas.reduce((s, c) => s + (Number(c.valor) || 0), 0);
      const semValor = linhas.filter(c => c.valor == null);
      const agrupar = f => { const m = {}; linhas.forEach(c => { const k = f(c) || '—'; (m[k] = m[k] || { n: 0, v: 0 }); m[k].n++; m[k].v += Number(c.valor) || 0; }); return Object.entries(m).sort((x, y) => y[1].v - x[1].v || y[1].n - x[1].n); };
      const tabela = (tit, lst) => `<section class="card resumo-prod"><h2>${tit}</h2>${lst.length ? `<ul>${lst.map(([k, x]) => `<li><span class="wrap-any">${esc(k)}</span><span class="muted">${x.n}</span><b>${PDF.brl(x.v)}</b></li>`).join('')}</ul>` : '<p class="muted small">Nada no período.</p>'}</section>`;
      const per = PERIODOS_PROD.find(x => x[0] === PROD.periodo)[1];
      $('#pr-corpo', main).innerHTML = `
        <p class="small muted" style="margin:4px 0 12px">${esc(per)}: ${fmtData(a.toISOString())} a ${fmtData(new Date(b - 1).toISOString())}${PROD.clinica ? ` · ${esc((clinicaPorId(PROD.clinica) || {}).nome || '')}` : ''}</p>
        <div class="stats prod-stats" role="list">
          <div class="stat destaque" role="listitem"><b>${PDF.brl(total)}</b><span>a receber no período</span></div>
          <div class="stat" role="listitem"><b>${linhas.length}</b><span>${linhas.length === 1 ? 'atendimento' : 'atendimentos'}</span></div>
          <div class="stat" role="listitem"><b>${linhas.length - semValor.length ? PDF.brl(total / (linhas.length - semValor.length)) : '—'}</b><span>média por atendimento</span></div>
        </div>
        ${semValor.length ? `<div class="alert" style="margin:12px 0">${ICON.alert}<p><b>${semValor.length} ${semValor.length === 1 ? 'atendimento sem valor' : 'atendimentos sem valor'}.</b> Abra a consulta e escolha o serviço e o plano (ou cadastre o valor na tabela).</p></div>` : ''}
        <div class="prod-grid">${tabela('Por clínica', agrupar(c => (clinicaPorId(c.clinica_id) || {}).nome))}${tabela('Por plano', agrupar(c => c.plano || PLANO_PADRAO))}${tabela('Por serviço', agrupar(c => c.servico || 'Serviço não informado'))}</div>
        <h2 class="rule">Atendimentos</h2>
        ${linhas.length ? `<ul class="list">${linhas.map(c => { const r = rot[c.id] || rotulosConsultas([c])[c.id]; const cl = clinicaPorId(c.clinica_id); return `<li><a class="row" href="#consulta-${esc(c.id)}"><span class="grow"><span class="title nome-selo">${esc(nomeP(c.paciente_id))}${seloArea(r.area, r.rotulo)}</span><span class="meta"><span>${fmtData(c.data)} · ${fmtHora(c.data)}</span><span>${esc(cl ? cl.nome : '')}</span><span>${esc(c.plano || PLANO_PADRAO)}</span><span>${esc(c.servico || 'serviço não informado')}</span></span></span>${c.valor != null ? `<b class="valor">${PDF.brl(c.valor)}</b>` : '<span class="chip warn">Sem valor</span>'}${ICON.chev.replace('<svg', '<svg class="chev"')}</a></li>`; }).join('')}</ul>` : `<div class="empty"><h3>Nenhum atendimento no período</h3></div>`}`;
    };
    $$('[data-pp]', main).forEach(b => b.addEventListener('click', () => { PROD.periodo = b.dataset.pp; $$('[data-pp]', main).forEach(x => x.setAttribute('aria-pressed', String(x === b))); $$('.pers', main).forEach(x => { x.hidden = PROD.periodo !== 'pers'; }); desenhar(); }));
    $('#pr-cl', main).addEventListener('change', e => { PROD.clinica = e.target.value; desenhar(); });
    $('#pr-de', main).addEventListener('change', e => { PROD.de = e.target.value; desenhar(); });
    $('#pr-ate', main).addEventListener('change', e => { PROD.ate = e.target.value; desenhar(); });
    main.querySelector('[data-x="csv"]').addEventListener('click', e => ocupado(e.currentTarget, async () => {
      const q = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
      const cab = ['Data', 'Hora', 'Paciente', 'Clínica', 'Área', 'Atendimento', 'Plano', 'Serviço', 'Valor (R$)'];
      const rows = linhas.map(c => { const r = rot[c.id] || rotulosConsultas([c])[c.id]; return [fmtData(c.data), fmtHora(c.data), nomeP(c.paciente_id), (clinicaPorId(c.clinica_id) || {}).nome || '', r.area, r.rotulo, c.plano || PLANO_PADRAO, c.servico || '', c.valor != null ? fmtValor(c.valor) : '']; });
      const csv = '﻿' + [cab, ...rows].map(l => l.map(q).join(';')).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const nome = `producao-${new Date().toISOString().slice(0, 10)}.csv`;
      try {
        if (downloadsCap) await downloadsCap.save({ filename: nome, data: blob });
        else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000); }
        toast('Planilha gerada (abre no Excel ou Google Planilhas).');
      } catch (err) { toast('O download foi cancelado ou bloqueado.', true); }
    }));
    desenhar();
  }

  /* =====================================================================
     Clínicas
     ===================================================================== */
  async function viewClinicas(main) {
    S.clinicas = await DB.clinicas.list();
    const ps = await pacientes(true);
    main.innerHTML = `
      <div class="page-head"><div><h1>Clínicas</h1><p class="muted small">O nome, o endereço e o telefone da clínica saem no cabeçalho e no rodapé dos documentos.</p></div><div class="actions"><a class="btn btn-ghost" href="#valores">${ICON.cash}Tabela de valores</a><a class="btn btn-ghost" href="#producao">Produção</a><button class="btn btn-primary" data-x="nova">${ICON.plus}Nova clínica</button></div></div>
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
        <h2 class="rule">Assinatura digital</h2>
        <p class="muted small">Para enviar receitas, atestados e pedidos de exame pelo WhatsApp ou e-mail, sem imprimir. A assinatura usa o seu certificado ICP-Brasil em nuvem — o do CFM (VIDaaS, da Valid) é gratuito para médicos e é emitido pelo CRM Virtual. A aprovação é feita no app do certificado, no seu celular.</p>
        <div class="grid grid-3">
          ${campo('Certificado em nuvem', `<select id="pf-ap" name="assinatura_provedor"><option value="">Não usar</option>${Object.entries(PROVEDORES).map(([k, t]) => `<option value="${k}" ${p.assinatura_provedor === k ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`)}
          ${campo('CPF do titular do certificado', `<input id="pf-acpf" name="assinatura_cpf" value="${esc(p.assinatura_cpf)}" inputmode="numeric" maxlength="14" placeholder="000.000.000-00">`)}
          ${campo('Manter a autorização por', `<select id="pf-adur" name="assinatura_duracao">${[[3600, '1 hora'], [28800, '8 horas'], [43200, '12 horas'], [86400, '24 horas'], [604800, '7 dias']].map(([v, t]) => `<option value="${v}" ${(+p.assinatura_duracao || 43200) === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`)}
        </div>
        <div class="assin-status" id="pf-assin" aria-live="polite"><span class="muted small">Verificando a assinatura digital…</span></div>
        <div class="actions"><button class="btn btn-ghost" type="button" data-x="assin-autorizar">${ICON.seal}Autorizar agora</button><button class="btn btn-quiet" type="button" data-x="assin-encerrar">Encerrar autorização</button></div>
        <div class="actions" style="margin-top:16px"><button class="btn btn-primary" type="submit">Salvar perfil</button><button class="btn btn-ghost" type="button" data-x="modelo">${ICON.doc}Ver modelo do receituário</button></div>
      </form>
      <section class="card"><h2 style="font-size:1.5rem;margin-bottom:8px">Medicamentos e modelos</h2><p class="muted small">Seu banco de medicamentos, receitas padrão, pacotes de exames, atestados e textos padrão ficam em <a href="#modelos">Modelos</a>.</p></section>
      <section class="card">
        <h2 style="font-size:1.5rem;margin-bottom:8px">Dados e segurança</h2>
        <p class="muted small">${DB.modo === 'demo' ? 'Modo demonstração: os dados ficam só neste navegador.' : `Conectado ao banco seguro (Supabase). Conta: ${esc(S.user.email)}.`} O prontuário deve ser guardado por no mínimo 20 anos (Lei 13.787/2018); baixe cópias de segurança periodicamente.</p>
        <div class="actions" style="margin-top:12px"><button class="btn btn-ghost" data-x="backup">${ICON.download}Baixar cópia de segurança</button>${DB.modo === 'demo' ? `<button class="btn btn-quiet" data-x="reset">Restaurar dados de exemplo</button>` : ''}<button class="btn btn-danger" data-x="sair">${ICON.logout}Sair da conta</button></div>
      </section>`;
    const statusAssinatura = async () => {
      const el = $('#pf-assin', main); if (!el) return;
      try {
        const st = await DB.assinatura.status();
        const prov = Object.entries(st.provedores || {}).filter(([, ok]) => ok).map(([k]) => PROVEDORES[k]);
        el.innerHTML = `${st.sessao ? `<p class="assin-ok">${ICON.seal}<span><b>Autorizada</b> (${esc(PROVEDORES[st.sessao.provedor] || st.sessao.provedor)}) até ${fmtData(st.sessao.expira_em)} às ${fmtHora(st.sessao.expira_em)}.</span></p>` : '<p class="small">Nenhuma autorização ativa: ela será pedida na primeira assinatura.</p>'}
          ${st.provedores && !st.provedores.vidaas && !st.demo ? '<p class="small muted">A conexão com o VIDaaS aguarda as credenciais de integração da Valid (veja o LEIA-ME do projeto).</p>' : ''}
          ${st.demo ? '<p class="small muted">Na demonstração a assinatura é simulada: o PDF sai marcado como TESTE.</p>' : prov.length ? `<p class="small muted">Disponível no servidor: ${esc(prov.join(' · '))}.</p>` : ''}`;
      } catch (er) { el.innerHTML = `<p class="small muted">${esc(er.message || 'A assinatura digital ainda não foi ativada no servidor.')}</p>`; }
    };
    statusAssinatura();
    $('#f-perfil', main).addEventListener('submit', async e => {
      e.preventDefault(); const v = lerForm(e.currentTarget);
      v.assinatura_duracao = parseInt(v.assinatura_duracao, 10) || 43200; v.assinatura_cpf = String(v.assinatura_cpf || '').trim();
      await ocupado($('button[type=submit]', e.currentTarget), async () => { try { S.perfil = await DB.perfil.save({ ...S.perfil, ...v }); toast('Perfil salvo.'); $$('.who b').forEach(b => b.textContent = nomeMedica()); } catch (err) { falha(err); } });
    });
    main.addEventListener('click', async e => {
      const b = e.target.closest('[data-x]'); if (!b) return;
      if (b.dataset.x === 'modelo') {
        const v = lerForm($('#f-perfil', main)); const perfilTmp = { ...S.perfil, ...v };
        const cl = S.clinicas[0] || { nome: 'Nome da clínica', endereco: 'Endereço da clínica', cidade: 'Salvador', uf: 'BA', telefone: '(71) 0000-0000' };
        try { const r = PDF.gerar({ medico: perfilTmp, clinica: cl, paciente: { nome: 'Paciente Exemplo da Silva', data_nascimento: '1990-03-15', sexo: 'F' }, data: new Date(), tamanho: perfilTmp.pdf_tamanho, marcaDagua: perfilTmp.pdf_marca_dagua, tipo: 'receita', itens: [{ nome: 'Ácido fólico', apresentacao: '5 mg', via: 'Oral', quantidade: '1 caixa', posologia: 'Tomar 1 comprimido por via oral, uma vez ao dia.' }, { nome: 'Exemplo de creme vaginal', apresentacao: 'bisnaga', via: 'Vaginal', quantidade: '1 bisnaga', posologia: 'Aplicar 1 aplicador à noite, por 7 noites.' }], orientacoes: '- Este é um modelo: os dados da paciente e os medicamentos são fictícios.\n- Retorno em 30 dias.' }); mostrarPDF(r, 'Modelo do receituário'); } catch (err) { falha(err); }
      }
      else if (b.dataset.x === 'assin-autorizar') {
        const f = $('#f-perfil', main); const prov = f.assinatura_provedor.value;
        if (!prov) { toast('Escolha o certificado em nuvem.', true); f.assinatura_provedor.focus(); return; }
        if (prov === 'vidaas' && f.assinatura_cpf.value.replace(/\D/g, '').length !== 11) { erroCampo(f.assinatura_cpf, 'Informe o CPF (11 dígitos).'); f.assinatura_cpf.focus(); return; }
        const s2 = await dialogoAutorizar(prov, f.assinatura_cpf.value, f.assinatura_duracao.value);
        if (s2) toast('Assinatura digital autorizada.');
        statusAssinatura();
      }
      else if (b.dataset.x === 'assin-encerrar') ocupado(b, async () => { try { await DB.assinatura.encerrar(); toast('Autorização encerrada.'); } catch (err) { falha(err); } statusAssinatura(); });
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
      else if (b.dataset.x === 'sair') sairDaConta();
    });
  }
  /* =====================================================================
     Inicialização
     ===================================================================== */
  const MEDICAMENTOS_BASE = () => { const vistos = new Set(); const out = []; window.MODELOS_BASE.filter(m => m.tipo === 'prescricao').forEach(m => (m.conteudo.itens || []).forEach(i => { const k = norm(i.nome + '|' + i.apresentacao); if (!vistos.has(k)) { vistos.add(k); out.push(copiaItem(i)); } })); return out; };
  async function restaurarMedicamentos() {
    const tem = new Set(S.favoritos.map(f => norm(f.nome + '|' + f.apresentacao)));
    const faltam = MEDICAMENTOS_BASE().filter(m => !tem.has(norm(m.nome + '|' + m.apresentacao)));
    for (const m of faltam) await DB.favoritos.save(m);
    S.favoritos = await DB.favoritos.list(); atualizarListaMedicamentos();
    return faltam.length;
  }
  const SUGESTOES_VERSAO = 4; // 2 = folhetos e orçamentos; 3 = livretos do ciclo; 4 = protocolos do ciclo
  const NOVOS_POR_VERSAO = { 2: ['orientacao', 'orcamento'], 3: ['livreto'], 4: ['ciclo'] };
  async function iniciarModelos() {
    if (S.perfil.modelos_iniciados && (S.perfil.sugestoes_versao || 1) < SUGESTOES_VERSAO) {
      try {
        const v0 = S.perfil.sugestoes_versao || 1;
        const tipos = Object.entries(NOVOS_POR_VERSAO).filter(([v]) => +v > v0).flatMap(([, t]) => t);
        const tem = new Set(S.modelos.map(m => m.tipo + '|' + norm(m.nome)));
        const novos = window.MODELOS_BASE.filter(m => tipos.includes(m.tipo) && !tem.has(m.tipo + '|' + norm(m.nome))).map(m => JSON.parse(JSON.stringify(m)));
        if (novos.length) { await DB.modelos.saveMany(novos); S.modelos = await DB.modelos.list(); }
        S.perfil = await DB.perfil.save({ ...S.perfil, sugestoes_versao: SUGESTOES_VERSAO });
      } catch (e) { console.warn(e); }
    }
    if (S.perfil.modelos_iniciados) return;
    if (!S.modelos.length) { await DB.modelos.saveMany(window.MODELOS_BASE.map(m => JSON.parse(JSON.stringify(m)))); S.modelos = await DB.modelos.list(); }
    if (!S.favoritos.length) await restaurarMedicamentos();
    try { S.perfil = await DB.perfil.save({ ...S.perfil, modelos_iniciados: true, sugestoes_versao: SUGESTOES_VERSAO }); } catch (e) { console.warn(e); }
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
    try { await carregarBase(); await iniciarModelos(); atualizarListaMedicamentos(); } catch (e) { falha(e); }
    moldura();
    await rotear();
  }
  DB.auth.onChange((ev, user) => {
    if (ev === 'PASSWORD_RECOVERY') { setTimeout(dialogoNovaSenha, 300); }
    if (ev === 'SIGNED_OUT' && S.user) { S.user = null; telaAuth(); }
  });
  iniciarSessao();
})();
