/* =====================================================================
   Documentos em PDF — Dra. Ana Paula Vianna
   Receituário simples, receita de antimicrobiano (2 vias), orientações,
   solicitação de exames e registro da consulta.
   Depende de: window.jspdf (jsPDF 4) e window.ASSETS (fontes + logo).
   ===================================================================== */
(function () {
  'use strict';

  const C = {
    wine: [94, 21, 48], wine2: [122, 31, 61], mauve: [156, 84, 104],
    rose: [217, 160, 172], blush: [251, 244, 245], blush2: [244, 230, 233],
    gold: [196, 135, 74], goldDark: [160, 98, 44], ink: [42, 27, 33],
    gray: [104, 86, 93], hair: [230, 211, 216], white: [255, 255, 255],
    sage: [62, 116, 94], sageBg: [229, 241, 235], roseBg: [250, 233, 237]
  };
  const pad2 = n => String(n).padStart(2, '0');
  const horaCurta = d => `${pad2(d.getHours())}h${pad2(d.getMinutes())}`;
  // valores em reais (sem espaço não separável, para não depender do glifo)
  function brl(v) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/ /g, ' '); }

  const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const VIA_ORDEM = ['Oral','Sublingual','Vaginal','Tópico','Transdérmico','Intramuscular','Subcutâneo','Endovenoso','Nasal','Retal','Oftálmico','Inalatório','Outro'];

  function dataExtenso(d) { return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; }
  function idade(nasc, ref) {
    if (!nasc) return '';
    const n = new Date(nasc + 'T12:00:00'); if (isNaN(n)) return '';
    let a = ref.getFullYear() - n.getFullYear();
    const m = ref.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < n.getDate())) a--;
    return a >= 0 ? `${a} ${a === 1 ? 'ano' : 'anos'}` : '';
  }
  const SEXO = { F: 'Feminino', M: 'Masculino', O: 'Outro' };
  const clean = s => String(s == null ? '' : s).replace(/\r/g, '').trim();

  /* ---------- tipografia ---------- */
  function registrarFontes(doc) {
    const f = window.ASSETS.fonts;
    const add = (file, fam) => { doc.addFileToVFS(file + '.ttf', f[file]); doc.addFont(file + '.ttf', fam, 'normal'); };
    add('jost-regular', 'Jost'); add('jost-medium', 'JostM'); add('jost-light', 'JostL');
    add('cg-medium', 'Corm'); add('cg-semibold', 'CormSB'); add('cg-italic', 'CormI'); add('italiana', 'Ital');
  }

  /* ---------- geometria por tamanho de papel ---------- */
  function geometria(tamanho) {
    if (tamanho === 'A5') return { W: 148, H: 210, M: 12, k: 0.84, logoW: 40, sigY: 34, footH: 15 };
    return { W: 210, H: 297, M: 18, k: 1, logoW: 54, sigY: 44, footH: 19 };
  }

  /* =================================================================
     Motor de layout: blocos medidos e paginados
     ================================================================= */
  function criarDocumento(cfg) {
    const { jsPDF } = window.jspdf;
    const g = geometria(cfg.tamanho);
    const doc = new jsPDF({ unit: 'mm', format: cfg.tamanho === 'A5' ? 'a5' : 'a4', compress: true });
    registrarFontes(doc);
    doc.setProperties({ title: cfg.tituloArquivo || 'Documento', author: cfg.medico.nomeCompleto, creator: 'Consultório Dra. Ana Paula Vianna' });
    return { doc, g };
  }

  function fs(g, pt) { return pt * g.k; }
  function setF(doc, fam, size, color) { doc.setFont(fam, 'normal'); doc.setFontSize(size); doc.setTextColor(...color); doc.setCharSpace(0); }
  function tracked(doc, text, x, y, space, opts = {}) {
    doc.setCharSpace(0);
    let w = doc.getTextWidth(text) + space * (text.length - 1);
    doc.setCharSpace(space);
    if (opts.align === 'center') x = x - w / 2;
    else if (opts.align === 'right') x = x - w;
    doc.text(text, x, y);
    doc.setCharSpace(0);
    return w;
  }

  /* ---------- cabeçalho com a logomarca e a clínica ---------- */
  function desenharCabecalho(ctx, secao) {
    const { doc, g } = ctx; const { W, M } = g;
    const A = window.ASSETS.img;
    // símbolo da logomarca + nome da médica (texto) + especialidade
    const top = g.k < 1 ? 7 : 9;
    const sh = (g.k < 1 ? 14 : 18), sw = sh * 400 / 451;
    doc.addImage(A['logo-symbol'], 'PNG', (W - sw) / 2, top, sw, sh, 'logoSym', 'SLOW');
    let y = top + sh + (g.k < 1 ? 5.6 : 7.2);
    setF(doc, 'Ital', fs(g, 21), C.wine);
    doc.text(ctx.medico.nomeCompleto, W / 2, y, { align: 'center' });
    y += g.k < 1 ? 4.2 : 5.2;
    setF(doc, 'Jost', fs(g, 6.9), C.mauve);
    tracked(doc, (ctx.medico.especialidade || '').toUpperCase(), W / 2, y, 1.25 * g.k, { align: 'center' });
    y += g.k < 1 ? 6 : 7.5;

    // régua com o nome da clínica no centro (eco da régua da logomarca)
    const clin = (ctx.clinica.nome || '').toUpperCase();
    setF(doc, 'JostM', fs(g, 8.6), C.wine2);
    const sp = 0.9 * g.k;
    const tw = doc.getTextWidth(clin) + sp * Math.max(clin.length - 1, 0);
    const gap = 4;
    doc.setDrawColor(...C.rose); doc.setLineWidth(0.25);
    if (clin) {
      const x1 = (W - tw) / 2 - gap, x2 = (W + tw) / 2 + gap;
      doc.line(M, y - 1.1, Math.max(M + 4, x1), y - 1.1);
      doc.line(Math.min(W - M - 4, x2), y - 1.1, W - M, y - 1.1);
      tracked(doc, clin, W / 2, y, sp, { align: 'center' });
    } else {
      doc.line(M, y - 1.1, W - M, y - 1.1);
    }
    y += g.k < 1 ? 9 : 12;

    // título do documento + data/local
    setF(doc, 'CormI', fs(g, 24), C.wine);
    doc.text(secao.titulo, M, y);
    let ty = y;
    if (secao.subtitulo) {
      setF(doc, 'JostM', fs(g, 7), C.goldDark);
      tracked(doc, secao.subtitulo.toUpperCase(), M, y + 4.6 * g.k, 0.7 * g.k);
      ty = y + 4.6 * g.k;
    }
    // via (selo à direita)
    let rx = W - M, ry = y - 6.2 * g.k;
    if (secao.via) {
      setF(doc, 'JostM', fs(g, 7.2), C.wine);
      const t = secao.via.toUpperCase(); const sp2 = 0.6 * g.k;
      const w = doc.getTextWidth(t) + sp2 * (t.length - 1) + 6;
      doc.setFillColor(...C.blush2); doc.setDrawColor(...C.rose); doc.setLineWidth(0.2);
      doc.roundedRect(rx - w, ry - 4, w, 6.2, 3.1, 3.1, 'FD');
      tracked(doc, t, rx - 3, ry + 0.35, sp2, { align: 'right' });
      ry += 7;
    }
    setF(doc, 'Jost', fs(g, 8.8), C.gray);
    const local = clean(ctx.clinica.cidade) ? `${clean(ctx.clinica.cidade)}, ` : '';
    // documento eletrônico: data e hora de emissão (Resolução CFM 2.299/2021)
    doc.text(local + dataExtenso(ctx.data) + (ctx.digital ? `, ${horaCurta(ctx.data)}` : ''), rx, secao.via ? ry + 1.4 : y, { align: 'right' });

    y = Math.max(ty, y) + (g.k < 1 ? 5 : 6.5);

    // cartão da paciente
    y = desenharPaciente(ctx, y, secao);
    return y;
  }

  function desenharPaciente(ctx, y, secao) {
    const { doc, g } = ctx; const { W, M } = g;
    const p = ctx.paciente;
    const nome = clean(p.nome_social) ? `${clean(p.nome_social)} (${clean(p.nome)})` : clean(p.nome);
    const cols = [];
    const id = idade(p.data_nascimento, ctx.data);
    if (id) cols.push(['Idade', id]);
    if (secao.exigeSexo) cols.push(['Sexo', SEXO[p.sexo] || 'Feminino']);
    if (secao.mostrarNascimento && p.data_nascimento) {
      const [a, m, d] = p.data_nascimento.split('-'); cols.push(['Nascimento', `${d}/${m}/${a}`]);
    }
    if (clean(p.cpf)) cols.push(['CPF', clean(p.cpf)]);
    // largura de cada coluna conforme o conteúdo
    const larg = cols.map(([lab, val]) => {
      setF(doc, 'JostM', fs(g, 6.6), C.mauve); const lw = doc.getTextWidth(lab.toUpperCase()) + 0.8 * g.k * lab.length;
      setF(doc, 'Jost', fs(g, 10), C.ink); return Math.max(lw, doc.getTextWidth(val)) + 6;
    });
    const colsW = larg.reduce((a, b) => a + b, 0);
    const nomeMaxW = W - 2 * M - 10 - colsW;
    setF(doc, 'CormSB', fs(g, 14.5), C.ink);
    const linhas = doc.splitTextToSize(nome || '—', nomeMaxW);
    const h = 9.5 * g.k + linhas.length * 5.6 * g.k;
    doc.setFillColor(...C.blush); doc.setDrawColor(...C.blush2); doc.setLineWidth(0.3);
    doc.roundedRect(M, y, W - 2 * M, h, 2.6, 2.6, 'FD');
    doc.setFillColor(...C.gold); doc.roundedRect(M, y, 1.3, h, 0.65, 0.65, 'F');
    setF(doc, 'JostM', fs(g, 6.6), C.mauve);
    tracked(doc, 'PACIENTE', M + 5, y + 5.2 * g.k, 0.8 * g.k);
    setF(doc, 'CormSB', fs(g, 14.5), C.ink);
    doc.text(linhas, M + 5, y + 10.6 * g.k, { lineHeightFactor: 1.08 });
    let cx = W - M - 2 - colsW;
    cols.forEach(([lab, val], i) => {
      setF(doc, 'JostM', fs(g, 6.6), C.mauve); tracked(doc, lab.toUpperCase(), cx + 3, y + 5.2 * g.k, 0.8 * g.k);
      setF(doc, 'Jost', fs(g, 10), C.ink); doc.text(val, cx + 3, y + 10.4 * g.k);
      doc.setDrawColor(...C.hair); doc.setLineWidth(0.2); doc.line(cx, y + 3, cx, y + h - 3);
      cx += larg[i];
    });
    return y + h + (g.k < 1 ? 6 : 8);
  }

  /* ---------- rodapé: assinatura + clínica ---------- */
  function desenharRodape(ctx, secao, pagina, total) {
    const { doc, g } = ctx; const { W, H, M } = g; const m = ctx.medico;
    const A = window.ASSETS.img;
    const cred = [m.especialidade, m.crm ? `CRM-${m.crm_uf || ''} ${m.crm}` : '', m.rqe ? `RQE ${m.rqe}` : ''].filter(Boolean).join('  ·  ');
    if (ctx.digital) desenharSeloDigital(ctx, cred);
    else {
      // assinatura
      const sy = H - g.sigY;
      doc.setDrawColor(...C.wine); doc.setLineWidth(0.3);
      const sw = 72 * g.k;
      doc.line(W / 2 - sw / 2, sy, W / 2 + sw / 2, sy);
      setF(doc, 'CormSB', fs(g, 13), C.wine);
      doc.text(m.nomeCompleto, W / 2, sy + 5.2 * g.k, { align: 'center' });
      setF(doc, 'Jost', fs(g, 8), C.gray);
      doc.text(cred, W / 2, sy + 9.4 * g.k, { align: 'center' });
    }

    // rodapé da clínica
    const fy = H - g.footH;
    doc.setDrawColor(...C.hair); doc.setLineWidth(0.25);
    const lotW = 7 * g.k, lotH = lotW * 76 / 114;
    doc.line(M, fy, W / 2 - lotW / 2 - 3, fy); doc.line(W / 2 + lotW / 2 + 3, fy, W - M, fy);
    doc.addImage(A['logo-lotus'], 'PNG', W / 2 - lotW / 2, fy - lotH / 2 - 0.4, lotW, lotH, 'lotus', 'SLOW');
    const c = ctx.clinica;
    const end = [clean(c.endereco), clean(c.bairro)].filter(Boolean).join(', ');
    const cid = [clean(c.cidade), clean(c.uf)].filter(Boolean).join('/');
    const l1 = [clean(c.nome), [end, cid].filter(Boolean).join(' — '), clean(c.cep) ? `CEP ${clean(c.cep)}` : ''].filter(Boolean).join('  ·  ');
    const l2 = [clean(c.telefone) ? `Tel. ${clean(c.telefone)}` : '', clean(c.email)].filter(Boolean).join('  ·  ');
    setF(doc, 'Jost', fs(g, 7.4), C.gray);
    const linhas = doc.splitTextToSize(l1, W - 2 * M - 10);
    let y = fy + 5 * g.k;
    linhas.slice(0, 2).forEach(t => { doc.text(t, W / 2, y, { align: 'center' }); y += 3.4 * g.k; });
    if (l2) { setF(doc, 'JostM', fs(g, 7.4), C.mauve); doc.text(l2, W / 2, y, { align: 'center' }); }
    if (total > 1) {
      setF(doc, 'Jost', fs(g, 7), C.rose);
      doc.text(`${pagina}/${total}`, W - M, H - 6, { align: 'right' });
    }
  }

  function marcaDagua(ctx) {
    if (!ctx.marcaDagua) return;
    const { doc, g } = ctx; const { W, H } = g;
    const w = 112 * g.k, h = w * 451 / 400;
    try {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.055 }));
      doc.addImage(window.ASSETS.img['logo-symbol'], 'PNG', (W - w) / 2, (H - h) / 2 + 14 * g.k, w, h, 'symbolWm', 'SLOW');
      doc.restoreGraphicsState();
    } catch (e) { /* sem suporte a transparência: segue sem marca d'água */ }
  }

  /* ---------- documento eletrônico: QR Code, selo da assinatura, marca de teste ---------- */
  function desenharQR(doc, texto, x, y, tam) {
    if (!window.qrcode) return;
    const qr = window.qrcode(0, 'M'); qr.addData(texto); qr.make();
    const n = qr.getModuleCount(); const cel = tam / (n + 2);
    doc.setFillColor(...C.white); doc.rect(x, y, tam, tam, 'F');
    doc.setFillColor(...C.ink);
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) { // agrupa módulos escuros vizinhos numa só faixa (menos objetos, sem frestas)
        if (!qr.isDark(r, c)) { c++; continue; }
        let f = c; while (f + 1 < n && qr.isDark(r, f + 1)) f++;
        doc.rect(x + (c + 1) * cel, y + (r + 1) * cel, (f - c + 1) * cel + 0.02, cel + 0.02, 'F');
        c = f + 1;
      }
    }
  }
  function desenharSeloDigital(ctx, cred) {
    const { doc, g } = ctx; const { W, H, M } = g; const k = g.k; const dg = ctx.digital;
    const top = H - g.sigY - 7 * k, bot = H - g.footH - 3, h = bot - top, w = W - 2 * M;
    doc.setFillColor(...C.blush); doc.setDrawColor(...C.rose); doc.setLineWidth(0.25);
    doc.roundedRect(M, top, w, h, 2.2, 2.2, 'FD');
    doc.setFillColor(...C.wine); doc.roundedRect(M, top, 1.3, h, 0.65, 0.65, 'F');
    const q = h - 5; const qx = W - M - q - 2.5, qy = top + 2.5;
    if (dg.url) desenharQR(doc, dg.url, qx, qy, q);
    const x = M + 6; const maxW = (dg.url ? qx - 4 : W - M - 4) - x;
    setF(doc, 'JostM', fs(g, 6.8), dg.teste || dg.previa ? [155, 28, 49] : C.goldDark);
    tracked(doc, dg.teste ? 'ASSINATURA DE TESTE — SEM VALIDADE JURÍDICA' : dg.previa ? 'PRÉ-VISUALIZAÇÃO — AINDA NÃO ASSINADO' : 'ASSINADO DIGITALMENTE · CERTIFICADO ICP-BRASIL', x, top + 5.8 * k, 0.6 * k);
    setF(doc, 'CormSB', fs(g, 13), C.wine); doc.text(ctx.medico.nomeCompleto, x, top + 11.6 * k);
    setF(doc, 'Jost', fs(g, 7.8), C.gray); doc.text(doc.splitTextToSize(cred, maxW)[0] || '', x, top + 15.6 * k);
    const d = ctx.data;
    const quando = `Emitido em ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} às ${horaCurta(d)}`;
    const ly = top + 20 * k; let cx = x;
    setF(doc, 'Jost', fs(g, 7.8), C.ink); doc.text(quando, cx, ly); cx += doc.getTextWidth(quando);
    if (dg.codigo) {
      const sep = '  ·  Código de acesso: ';
      doc.text(sep, cx, ly); cx += doc.getTextWidth(sep);
      setF(doc, 'JostM', fs(g, 8.4), C.wine); tracked(doc, dg.codigo, cx, ly, 0.5 * k);
    }
    setF(doc, 'Jost', fs(g, 7.2), C.gray);
    doc.text(doc.splitTextToSize(dg.url ? 'Farmácia: valide em validar.iti.gov.br — leia o QR Code ou envie este PDF.' : 'Valide a assinatura em validar.iti.gov.br enviando este PDF.', maxW)[0], x, top + 24.2 * k);
  }
  function marcaTeste(ctx) {
    if (!ctx.digital || !ctx.digital.teste) return;
    const { doc, g } = ctx; const { W, H } = g;
    try {
      doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.16 }));
      setF(doc, 'JostM', fs(g, 40), [155, 28, 49]);
      doc.text('TESTE — SEM VALIDADE', W / 2, H / 2 + 20 * g.k, { align: 'center', angle: 32 });
      doc.restoreGraphicsState();
    } catch (e) { /* segue sem a marca */ }
  }

  /* ---------- blocos de conteúdo ---------- */
  // Cada bloco: { medir(ctx, largura) -> altura, desenhar(ctx, x, y, largura), quebravel? }
  function blocoGrupo(label) {
    return {
      keepNext: true,
      medir: (ctx) => 9 * ctx.g.k,
      desenhar(ctx, x, y, w) {
        const { doc, g } = ctx;
        setF(doc, 'JostM', fs(g, 7.6), C.goldDark);
        const t = label.toUpperCase();
        const tw = tracked(doc, t, x, y + 4.4 * g.k, 1.1 * g.k);
        doc.setDrawColor(...C.blush2); doc.setLineWidth(0.3);
        doc.line(x + tw + 3, y + 3.3 * g.k, x + w, y + 3.3 * g.k);
      }
    };
  }

  function blocoItem(item, n) {
    let cache = null;
    function layout(ctx, w) {
      const { doc, g } = ctx;
      const indent = 8 * g.k;
      setF(doc, 'JostM', fs(g, 10.8), C.ink);
      const qtd = clean(item.quantidade);
      const qW = qtd ? (setF(doc, 'Jost', fs(g, 10), C.ink), doc.getTextWidth(qtd)) : 0;
      setF(doc, 'JostM', fs(g, 10.8), C.ink);
      const titulo = [clean(item.nome), clean(item.apresentacao)].filter(Boolean).join(' ');
      const tl = doc.splitTextToSize(titulo || '—', w - indent - (qtd ? qW + 12 : 0));
      setF(doc, 'Jost', fs(g, 9.9), C.gray);
      const pl = clean(item.posologia) ? doc.splitTextToSize(clean(item.posologia), w - indent) : [];
      const lhT = 4.7 * g.k, lhP = 4.4 * g.k;
      const h = tl.length * lhT + (pl.length ? 1.3 + pl.length * lhP : 0) + 5.6 * g.k;
      return { indent, qtd, qW, tl, pl, lhT, lhP, h };
    }
    return {
      medir(ctx, w) { cache = layout(ctx, w); return cache.h; },
      desenhar(ctx, x, y, w) {
        const { doc, g } = ctx; const L = cache || layout(ctx, w);
        const base = y + 4 * g.k;
        setF(doc, 'CormSB', fs(g, 13.5), C.wine2);
        doc.text(`${n}.`, x, base + 0.3);
        setF(doc, 'JostM', fs(g, 10.8), C.ink);
        // primeira parte em médio (nome), apresentação em regular
        L.tl.forEach((t, i) => doc.text(t, x + L.indent, base + i * L.lhT));
        if (L.qtd) {
          const lastW = (setF(doc, 'JostM', fs(g, 10.8), C.ink), doc.getTextWidth(L.tl[0]));
          setF(doc, 'Jost', fs(g, 10), C.ink);
          doc.text(L.qtd, x + w, base, { align: 'right' });
          // pontilhado guia
          const x1 = x + L.indent + lastW + 2.5, x2 = x + w - L.qW - 2.5;
          if (x2 - x1 > 4) {
            doc.setDrawColor(...C.rose); doc.setLineWidth(0.28);
            doc.setLineDashPattern([0.35, 1.25], 0);
            doc.line(x1, base - 0.6, x2, base - 0.6);
            doc.setLineDashPattern([], 0);
          }
        }
        if (L.pl.length) {
          setF(doc, 'Jost', fs(g, 9.9), C.gray);
          const py = base + (L.tl.length - 1) * L.lhT + 1.3 + L.lhP;
          L.pl.forEach((t, i) => doc.text(t, x + L.indent, py + i * L.lhP));
        }
      }
    };
  }

  function blocoTitulo(label) { return blocoGrupo(label); }
  function blocoEspaco(mm) { return { espaco: true, medir: (ctx) => mm * ctx.g.k, desenhar() {} }; }

  // texto corrido, quebrável por linha; linhas iniciadas por "-" ou "•" viram tópicos
  function blocoTexto(texto, opts = {}) {
    const paragrafos = clean(texto).split('\n');
    let linhas = null;
    function preparar(ctx, w) {
      const { doc, g } = ctx;
      setF(doc, opts.fonte || 'Jost', fs(g, opts.tam || 9.9), C.ink);
      const out = [];
      paragrafos.forEach(par => {
        const m = par.match(/^\s*([-•*]|\d+[.)])\s+(.*)$/);
        if (!par.trim()) { out.push({ t: '', gap: true }); return; }
        if (m) {
          const marker = /\d/.test(m[1]) ? m[1] : '•';
          const ls = doc.splitTextToSize(m[2], w - 5);
          ls.forEach((t, i) => out.push({ t, ind: 5.5, mk: i === 0 ? marker : '' }));
        } else doc.splitTextToSize(par, w).forEach(t => out.push({ t, ind: 0 }));
      });
      return out;
    }
    return {
      quebravel: true,
      linhas(ctx, w) { linhas = linhas || preparar(ctx, w); return linhas; },
      alturaLinha: (ctx) => (opts.lh || 4.6) * ctx.g.k,
      desenharLinhas(ctx, x, y, w, de, ate) {
        const { doc, g } = ctx; const lh = (opts.lh || 4.6) * g.k;
        const ls = this.linhas(ctx, w);
        let yy = y + 3.6 * g.k;
        for (let i = de; i < ate; i++) {
          const l = ls[i];
          if (l.gap) { yy += lh * 0.55; continue; }
          if (l.mk === '•') { doc.setFillColor(...C.gold); doc.circle(x + 1.3, yy - 1.15 * g.k, 0.62 * g.k, 'F'); }
          else if (l.mk) { setF(doc, 'JostM', fs(g, opts.tam || 9.9), C.goldDark); doc.text(l.mk, x, yy); }
          setF(doc, opts.fonte || 'Jost', fs(g, opts.tam || 9.9), opts.cor || C.ink);
          doc.text(l.t, x + l.ind, yy);
          yy += lh;
        }
      },
      alturaDe(ctx, w, de, ate) {
        const ls = this.linhas(ctx, w); const lh = this.alturaLinha(ctx); let h = 0;
        for (let i = de; i < ate; i++) h += ls[i].gap ? lh * 0.55 : lh;
        return h + 2.5 * ctx.g.k;
      }
    };
  }

  function blocoCampo(rotulo, valor) {
    let L = null;
    return {
      medir(ctx, w) {
        const { doc, g } = ctx; setF(doc, 'Jost', fs(g, 9.6), C.ink);
        const lw = 38 * g.k;
        L = { lw, ls: doc.splitTextToSize(clean(valor) || '—', w - lw) };
        return L.ls.length * 4.4 * g.k + 2.6 * g.k;
      },
      desenhar(ctx, x, y, w) {
        const { doc, g } = ctx;
        setF(doc, 'JostM', fs(g, 7.4), C.mauve); doc.text(rotulo, x, y + 3.6 * g.k);
        setF(doc, 'Jost', fs(g, 9.6), C.ink);
        L.ls.forEach((t, i) => doc.text(t, x + L.lw, y + 3.6 * g.k + i * 4.4 * g.k));
      }
    };
  }

  function blocoAviso(texto) {
    let ls = null;
    return {
      medir(ctx, w) { const { doc, g } = ctx; setF(doc, 'JostL', fs(g, 7.8), C.gray); ls = doc.splitTextToSize(texto, w - 8); return ls.length * 3.5 * g.k + 6 * g.k; },
      desenhar(ctx, x, y, w) {
        const { doc, g } = ctx;
        const h = ls.length * 3.5 * g.k + 3.4 * g.k;
        doc.setFillColor(...C.blush); doc.roundedRect(x, y + 1, w, h, 1.6, 1.6, 'F');
        setF(doc, 'JostL', fs(g, 7.8), C.gray);
        ls.forEach((t, i) => doc.text(t, x + 4, y + 4.4 * g.k + i * 3.5 * g.k));
      }
    };
  }

  function blocoDispensacao() {
    return {
      medir: (ctx) => 17 * ctx.g.k,
      desenhar(ctx, x, y, w) {
        const { doc, g } = ctx;
        const h = 13 * g.k;
        doc.setDrawColor(...C.rose); doc.setLineWidth(0.25); doc.setLineDashPattern([1, 0.8], 0);
        doc.roundedRect(x, y + 2, w, h, 1.6, 1.6, 'S'); doc.setLineDashPattern([], 0);
        setF(doc, 'JostM', fs(g, 6.6), C.mauve);
        tracked(doc, 'REGISTRO DE DISPENSAÇÃO — USO DA FARMÁCIA', x + 4, y + 6 * g.k, 0.6 * g.k);
        setF(doc, 'Jost', fs(g, 8), C.gray);
        const cols = ['Data', 'Quantidade aviada', 'Lote', 'Farmacêutico(a)'];
        const cw = (w - 8) / cols.length;
        cols.forEach((c, i) => {
          const cx = x + 4 + i * cw;
          doc.text(c + ':', cx, y + 12 * g.k);
          doc.setDrawColor(...C.hair); doc.line(cx + doc.getTextWidth(c + ':') + 1.5, y + 12.3 * g.k, cx + cw - 3, y + 12.3 * g.k);
        });
      }
    };
  }

  /* ---------- folhetos de orientação: blocos visuais ---------- */
  // Ícone redondo: "pode" (visto, verde-sálvia) ou "evite" (x, vinho)
  function icone(doc, tipo, cx, cy, r) {
    const pode = tipo === 'pode';
    doc.setFillColor(...(pode ? C.sageBg : C.roseBg)); doc.circle(cx, cy, r, 'F');
    doc.setDrawColor(...(pode ? C.sage : C.wine2)); doc.setLineWidth(r * 0.24); doc.setLineCap && doc.setLineCap('round');
    if (pode) { doc.line(cx - r * 0.45, cy + r * 0.02, cx - r * 0.1, cy + r * 0.36); doc.line(cx - r * 0.1, cy + r * 0.36, cx + r * 0.5, cy - r * 0.36); }
    else { const a = r * 0.36; doc.line(cx - a, cy - a, cx + a, cy + a); doc.line(cx - a, cy + a, cx + a, cy - a); }
    doc.setLineCap && doc.setLineCap('butt');
  }
  function blocoMarcador(tipo, texto) {
    let L = null;
    const lay = (ctx, w) => { const { doc, g } = ctx; setF(doc, 'Jost', fs(g, 10), C.ink); const ls = doc.splitTextToSize(texto, w - 9 * g.k); return { ls, h: ls.length * 4.7 * g.k + 2.6 * g.k }; };
    return {
      medir(ctx, w) { L = lay(ctx, w); return L.h; },
      desenhar(ctx, x, y, w) {
        const { doc, g } = ctx; L = L || lay(ctx, w);
        icone(doc, tipo, x + 2.4 * g.k, y + 2.7 * g.k, 2.2 * g.k);
        setF(doc, 'Jost', fs(g, 10), C.ink);
        L.ls.forEach((t, i) => doc.text(t, x + 7.6 * g.k, y + 3.9 * g.k + i * 4.7 * g.k));
      }
    };
  }
  function blocoPasso(n, texto) {
    let L = null;
    const lay = (ctx, w) => { const { doc, g } = ctx; setF(doc, 'Jost', fs(g, 10), C.ink); const ls = doc.splitTextToSize(texto, w - 10 * g.k); return { ls, h: Math.max(ls.length * 4.7 * g.k, 5.4 * g.k) + 2.8 * g.k }; };
    return {
      medir(ctx, w) { L = lay(ctx, w); return L.h; },
      desenhar(ctx, x, y, w) {
        const { doc, g } = ctx; L = L || lay(ctx, w);
        doc.setFillColor(...C.wine); doc.circle(x + 2.7 * g.k, y + 2.7 * g.k, 2.7 * g.k, 'F');
        setF(doc, 'JostM', fs(g, 8.2), C.white); doc.text(String(n), x + 2.7 * g.k, y + 3.75 * g.k, { align: 'center' });
        setF(doc, 'Jost', fs(g, 10), C.ink);
        L.ls.forEach((t, i) => doc.text(t, x + 8.6 * g.k, y + 3.9 * g.k + i * 4.7 * g.k));
      }
    };
  }
  function blocoDestaque(texto) {
    let L = null;
    const lay = (ctx, w) => { const { doc, g } = ctx; setF(doc, 'JostM', fs(g, 9.8), C.wine); const ls = doc.splitTextToSize(texto, w - 12 * g.k); return { ls, h: ls.length * 4.6 * g.k + 7.4 * g.k }; };
    return {
      medir(ctx, w) { L = lay(ctx, w); return L.h + 2 * ctx.g.k; },
      desenhar(ctx, x, y, w) {
        const { doc, g } = ctx; L = L || lay(ctx, w);
        doc.setFillColor(...C.blush2); doc.roundedRect(x, y + 0.6, w, L.h, 2, 2, 'F');
        doc.setFillColor(...C.gold); doc.roundedRect(x, y + 0.6, 1.3, L.h, 0.65, 0.65, 'F');
        setF(doc, 'JostM', fs(g, 9.8), C.wine);
        L.ls.forEach((t, i) => doc.text(t, x + 6 * g.k, y + 0.6 + 5 * g.k + i * 4.6 * g.k));
      }
    };
  }
  // Linha do tempo: "@ quando | o que fazer"
  function blocoTempo(quando, texto, primeiro, ultimo) {
    let L = null;
    const col = ctx => 37 * ctx.g.k;
    const lay = (ctx, w) => {
      const { doc, g } = ctx;
      setF(doc, 'JostM', fs(g, 9), C.wine2); const lq = doc.splitTextToSize(quando, col(ctx) - 4);
      setF(doc, 'Jost', fs(g, 10), C.ink); const lt = doc.splitTextToSize(texto, w - col(ctx) - 7 * g.k);
      return { lq, lt, h: Math.max(lq.length * 4.2, lt.length * 4.7) * g.k + 4.4 * g.k };
    };
    return {
      medir(ctx, w) { L = lay(ctx, w); return L.h; },
      desenhar(ctx, x, y, w) {
        const { doc, g } = ctx; L = L || lay(ctx, w);
        const lx = x + col(ctx) + 1.6 * g.k, dy = y + 2.7 * g.k;
        doc.setDrawColor(...C.rose); doc.setLineWidth(0.35);
        doc.line(lx, primeiro ? dy : y, lx, ultimo ? dy : y + L.h);
        doc.setFillColor(...C.white); doc.setDrawColor(...C.gold); doc.setLineWidth(0.6); doc.circle(lx, dy, 1.35 * g.k, 'FD');
        setF(doc, 'JostM', fs(g, 9), C.wine2); L.lq.forEach((t, i) => doc.text(t, x, y + 3.8 * g.k + i * 4.2 * g.k));
        setF(doc, 'Jost', fs(g, 10), C.ink); L.lt.forEach((t, i) => doc.text(t, lx + 5 * g.k, y + 3.9 * g.k + i * 4.7 * g.k));
      }
    };
  }
  /**
   * Marcação dos folhetos (uma instrução por linha):
   *   # Título de seção     + pode / faça       x evite / não faça
   *   1. passo numerado     - tópico            > destaque (caixa)
   *   @ quando | o que fazer  (linha do tempo)  linha em branco = espaço
   */
  function blocosFolheto(texto) {
    const linhas = clean(texto).split('\n');
    const blocos = []; let par = []; let passo = 0; let tempo = [];
    const fecharPar = () => { if (par.length) { blocos.push(blocoTexto(par.join('\n'))); par = []; } };
    const fecharTempo = () => { tempo.forEach((t, i) => blocos.push(blocoTempo(t[0], t[1], i === 0, i === tempo.length - 1))); tempo = []; };
    linhas.forEach(raw => {
      const l = raw.trim(); let m;
      if (!/^@/.test(l)) fecharTempo();
      if (!/^\d+[.)]\s/.test(l)) passo = 0;
      if (!l) { fecharPar(); blocos.push(blocoEspaco(2.4)); return; }
      if ((m = l.match(/^#\s*(.+)$/))) { fecharPar(); blocos.push(blocoEspaco(1.5)); blocos.push(blocoGrupo(m[1])); return; }
      if ((m = l.match(/^\+\s*(.+)$/))) { fecharPar(); blocos.push(blocoMarcador('pode', m[1])); return; }
      if ((m = l.match(/^[xX×]\s+(.+)$/))) { fecharPar(); blocos.push(blocoMarcador('evite', m[1])); return; }
      if ((m = l.match(/^>\s*(.+)$/))) { fecharPar(); blocos.push(blocoDestaque(m[1])); return; }
      if ((m = l.match(/^@\s*([^|]+)\|\s*(.+)$/))) { fecharPar(); tempo.push([m[1].trim(), m[2].trim()]); return; }
      if ((m = l.match(/^\d+[.)]\s+(.+)$/))) { fecharPar(); blocos.push(blocoPasso(++passo, m[1])); return; }
      par.push(raw);
    });
    fecharPar(); fecharTempo();
    while (blocos.length && blocos[blocos.length - 1].espaco) blocos.pop();
    while (blocos.length && blocos[0].espaco) blocos.shift();
    // títulos não ficam sozinhos no fim da página
    blocos.forEach((b, i) => { if (b.keepNext && blocos[i + 1] && blocos[i + 1].quebravel) b.keepNext = false; });
    return blocos;
  }

  /* ---------- orçamento ---------- */
  function blocoLinhaValor(it) {
    let L = null;
    const lay = (ctx, w) => {
      const { doc, g } = ctx;
      setF(doc, 'Jost', fs(g, 10.2), C.ink); const vt = it.incluso ? 'Incluso' : brl(it.valor); const vw = doc.getTextWidth(vt);
      setF(doc, 'JostM', fs(g, 10.2), C.ink); const ld = doc.splitTextToSize(clean(it.descricao) || '—', w - vw - 14);
      setF(doc, 'Jost', fs(g, 8.8), C.gray); const ldt = clean(it.detalhe) ? doc.splitTextToSize(clean(it.detalhe), w - vw - 14) : [];
      return { vt, vw, ld, ldt, h: ld.length * 4.7 * g.k + ldt.length * 4 * g.k + 4.6 * g.k };
    };
    return {
      medir(ctx, w) { L = lay(ctx, w); return L.h; },
      desenhar(ctx, x, y, w) {
        const { doc, g } = ctx; L = L || lay(ctx, w);
        const base = y + 4 * g.k;
        setF(doc, 'JostM', fs(g, 10.2), C.ink); L.ld.forEach((t, i) => doc.text(t, x, base + i * 4.7 * g.k));
        const lastW = doc.getTextWidth(L.ld[0]);
        setF(doc, it.incluso ? 'JostM' : 'Jost', fs(g, 10.2), it.incluso ? C.sage : C.ink); doc.text(L.vt, x + w, base, { align: 'right' });
        const x1 = x + lastW + 2.5, x2 = x + w - L.vw - 2.5;
        if (x2 - x1 > 4) { doc.setDrawColor(...C.rose); doc.setLineWidth(0.28); doc.setLineDashPattern([0.35, 1.25], 0); doc.line(x1, base - 0.6, x2, base - 0.6); doc.setLineDashPattern([], 0); }
        if (L.ldt.length) { setF(doc, 'Jost', fs(g, 8.8), C.gray); L.ldt.forEach((t, i) => doc.text(t, x, base + L.ld.length * 4.7 * g.k - 0.6 + i * 4 * g.k)); }
        doc.setDrawColor(...C.hair); doc.setLineWidth(0.15); doc.line(x, y + L.h - 0.6, x + w, y + L.h - 0.6);
      }
    };
  }
  function blocoSubtotal(rotulo, valor, destaque) {
    return {
      medir: ctx => (destaque ? 15 : 7.4) * ctx.g.k,
      desenhar(ctx, x, y, w) {
        const { doc, g } = ctx;
        if (destaque) {
          const h = 11.5 * g.k;
          doc.setFillColor(...C.wine); doc.roundedRect(x, y + 2.2, w, h, 2.4, 2.4, 'F');
          setF(doc, 'JostM', fs(g, 8), C.rose); tracked(doc, rotulo.toUpperCase(), x + 6, y + 2.2 + h / 2 + 1.1, 1 * g.k);
          setF(doc, 'CormSB', fs(g, 17), C.white); doc.text(brl(valor), x + w - 6, y + 2.2 + h / 2 + 2, { align: 'right' });
        } else {
          setF(doc, 'Jost', fs(g, 9.4), C.gray); doc.text(rotulo, x + w - 40 * g.k, y + 4.8 * g.k, { align: 'right' });
          setF(doc, 'JostM', fs(g, 10), valor < 0 ? C.sage : C.ink); doc.text((valor < 0 ? '− ' : '') + brl(Math.abs(valor)), x + w, y + 4.8 * g.k, { align: 'right' });
        }
      }
    };
  }
  function blocoCiencia(nomePaciente) {
    return {
      medir: ctx => 27 * ctx.g.k,
      desenhar(ctx, x, y, w) {
        const { doc, g } = ctx;
        doc.setDrawColor(...C.rose); doc.setLineWidth(0.25); doc.setLineDashPattern([1, 0.8], 0);
        doc.roundedRect(x, y + 2, w, 23 * g.k, 1.8, 1.8, 'S'); doc.setLineDashPattern([], 0);
        setF(doc, 'JostM', fs(g, 6.8), C.mauve); tracked(doc, 'CIÊNCIA DA PACIENTE', x + 5, y + 7 * g.k, 0.8 * g.k);
        setF(doc, 'Jost', fs(g, 8.8), C.gray); doc.text('Declaro que recebi este orçamento, li as condições e esclareci minhas dúvidas.', x + 5, y + 11.6 * g.k);
        const ly = y + 21 * g.k;
        doc.setDrawColor(...C.gray); doc.setLineWidth(0.2);
        doc.line(x + 5, ly, x + w * 0.62, ly); doc.line(x + w * 0.68, ly, x + w - 5, ly);
        setF(doc, 'Jost', fs(g, 7.4), C.gray);
        doc.text(nomePaciente ? `Assinatura — ${nomePaciente}` : 'Assinatura da paciente', x + 5, ly + 3.4 * g.k);
        doc.text('Data', x + w * 0.68, ly + 3.4 * g.k);
      }
    };
  }

  /* ---------- paginação de uma seção (um documento lógico) ---------- */
  function paginarSecao(ctx, secao) {
    const { g } = ctx; const { W, H, M } = g;
    const w = W - 2 * M;
    const limite = H - g.sigY - (g.k < 1 ? 10 : 14);
    const paginas = []; // cada página: lista de [bloco, y, de, ate]
    const yIni = ctx.yCorpo;
    let pg = null, y = yIni;
    const novaPagina = () => { pg = { itens: [] }; paginas.push(pg); };
    novaPagina();
    const blocos = secao.blocos;
    for (let b = 0; b < blocos.length; b++) {
      const bl = blocos[b];
      if (bl.quebravel) {
        const ls = bl.linhas(ctx, w); let i = 0;
        while (i < ls.length) {
          let j = i, hh = 0; const lh = bl.alturaLinha(ctx);
          while (j < ls.length && y + hh + (ls[j].gap ? lh * 0.55 : lh) + 2.5 <= limite) { hh += ls[j].gap ? lh * 0.55 : lh; j++; }
          if (j === i) { novaPagina(); y = yIni; continue; }
          pg.itens.push([bl, y, i, j]); y += bl.alturaDe(ctx, w, i, j); i = j;
          if (i < ls.length) { novaPagina(); y = yIni; }
        }
        continue;
      }
      let h = bl.medir(ctx, w);
      let need = h;
      if (bl.keepNext && blocos[b + 1]) need += blocos[b + 1].quebravel ? blocos[b + 1].alturaLinha(ctx) * 2 + 2.5 : blocos[b + 1].medir(ctx, w);
      if (y + need > limite && pg.itens.length) { novaPagina(); y = yIni; }
      pg.itens.push([bl, y]); y += h;
    }
    return paginas;
  }

  function renderizar(ctx, secoes) {
    const { doc, g } = ctx; const { W, M } = g; const w = W - 2 * M;
    let primeira = true;
    secoes.forEach(secao => {
      // mede altura do cabeçalho desenhando numa página de rascunho uma vez
      {
        const tmp = doc.getNumberOfPages();
        doc.addPage(); ctx.yCorpo = desenharCabecalho(ctx, secao); doc.deletePage(tmp + 1);
      }
      const paginas = paginarSecao(ctx, secao);
      paginas.forEach((pg, idx) => {
        if (!primeira) doc.addPage();
        primeira = false;
        marcaDagua(ctx);
        marcaTeste(ctx);
        desenharCabecalho(ctx, secao);
        pg.itens.forEach(([bl, y, de, ate]) => {
          if (bl.quebravel) bl.desenharLinhas(ctx, M, y, w, de, ate);
          else bl.desenhar(ctx, M, y, w);
        });
        desenharRodape(ctx, secao, idx + 1, paginas.length);
      });
    });
  }

  /* =================================================================
     Montagem dos documentos
     ================================================================= */
  function agruparPorVia(itens) {
    const grupos = {};
    itens.forEach(it => { const v = clean(it.via) || 'Oral'; (grupos[v] = grupos[v] || []).push(it); });
    return Object.keys(grupos).sort((a, b) => {
      const ia = VIA_ORDEM.indexOf(a), ib = VIA_ORDEM.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    }).map(v => [v, grupos[v]]);
  }

  function rotuloVia(v) {
    const map = { Oral: 'Uso oral', Sublingual: 'Uso sublingual', Vaginal: 'Uso vaginal', 'Tópico': 'Uso tópico', 'Transdérmico': 'Uso transdérmico', Intramuscular: 'Uso intramuscular', 'Subcutâneo': 'Uso subcutâneo', Endovenoso: 'Uso endovenoso', Nasal: 'Uso nasal', Retal: 'Uso retal', 'Oftálmico': 'Uso oftálmico', 'Inalatório': 'Uso inalatório' };
    return map[v] || `Uso ${v.toLowerCase()}`;
  }

  function blocosPrescricao(itens) {
    const blocos = []; let n = 1;
    agruparPorVia(itens).forEach(([via, lista]) => {
      blocos.push(blocoGrupo(rotuloVia(via)));
      lista.forEach(it => blocos.push(blocoItem(it, n++)));
    });
    return blocos;
  }

  /**
   * Gera o PDF.
   * dados = { medico, clinica, paciente, data(Date|string), tipo, itens, orientacoes, incluirOrientacoes,
   *           exames:[{nome}], indicacao, registro:[{rotulo, valor}], tamanho:'A4'|'A5', marcaDagua:bool }
   * retorna { blob, nomeArquivo, avisos:[], paginas }
   */
  const ROTULOS = { receita: 'Receita', orientacoes: 'Orientacoes', exames: 'Solicitacao de exames', registro: 'Registro da consulta', atestado: 'Atestado', orcamento: 'Orcamento', livreto: 'Livreto do ciclo' };
  // Primeiro_Ultimo_Documento_dd-mm-aaaa.pdf (sem acentos nem espaços)
  function nomeDoArquivo(nome, rotulo, data) {
    const ascii = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 ]+/g, ' ').trim();
    const partes = ascii(nome).split(/\s+/).filter(Boolean);
    const pac = partes.length > 1 ? [partes[0], partes[partes.length - 1]] : (partes.length ? [partes[0]] : ['Paciente']);
    const d = data instanceof Date ? data : new Date(data || Date.now());
    const dt = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    const rot = ascii(rotulo || 'Documento').split(/\s+/).map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w.toLowerCase()).join('_');
    return `${pac.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_')}_${rot}_${dt}.pdf`;
  }

  const medicoDe = m => Object.assign({}, m || {}, { nomeCompleto: [clean((m || {}).tratamento), clean((m || {}).nome)].filter(Boolean).join(' ') || 'Dra. Ana Paula Vianna', especialidade: clean((m || {}).especialidade) || 'Ginecologia e Reprodução' });

  function gerar(dados) {
    if (dados.tipo === 'livreto') return gerarLivreto(dados);
    const avisos = [];
    const data = dados.data instanceof Date ? dados.data : new Date(dados.data || Date.now());
    const medico = medicoDe(dados.medico);
    const { doc, g } = criarDocumento({ tamanho: dados.tamanho, medico, tituloArquivo: dados.titulo });
    const ctx = { doc, g, medico, clinica: dados.clinica || {}, paciente: dados.paciente || {}, data, marcaDagua: dados.marcaDagua !== false, yCorpo: null, digital: dados.digital || null };
    const secoes = [];
    const tipo = dados.tipo || 'receita';

    if (tipo === 'receita') {
      const itens = (dados.itens || []).filter(i => clean(i.nome));
      const controlados = itens.filter(i => i.controlado);
      const anti = itens.filter(i => i.antimicrobiano && !i.controlado);
      const simples = itens.filter(i => !i.antimicrobiano && !i.controlado);
      if (controlados.length) avisos.push(`Fora do PDF por exigir Receita de Controle Especial no modelo oficial da Anvisa: ${controlados.map(i => clean(i.nome)).join(', ')}.`);
      const orient = dados.incluirOrientacoes !== false ? clean(dados.orientacoes) : '';
      if (simples.length || (orient && !anti.length)) {
        const blocos = blocosPrescricao(simples);
        if (orient) { blocos.push(blocoTitulo('Orientações')); blocos.push(blocoTexto(orient)); }
        secoes.push({ titulo: simples.length ? 'Receituário' : 'Orientações médicas', blocos });
      }
      if (anti.length && ctx.digital) {
        // receita eletrônica: um único documento; a farmácia registra a dispensação no próprio sistema
        const blocos = blocosPrescricao(anti);
        blocos.push(blocoAviso('Receita de antimicrobiano válida por 10 dias a partir da data de emissão (RDC Anvisa nº 471/2021). Documento eletrônico assinado digitalmente: a dispensação é registrada pela farmácia após a validação da assinatura.'));
        secoes.push({ titulo: 'Receituário', subtitulo: 'Antimicrobiano', exigeSexo: true, blocos });
        if (orient && !simples.length) secoes.push({ titulo: 'Orientações médicas', blocos: [blocoTexto(orient)] });
      } else if (anti.length) {
        ['1ª via · retenção da farmácia', '2ª via · paciente'].forEach(via => {
          const blocos = blocosPrescricao(anti);
          blocos.push(blocoDispensacao());
          blocos.push(blocoAviso('Receita de antimicrobiano em duas vias, válida por 10 dias a partir da data de emissão. A 1ª via fica retida na farmácia; a 2ª via é devolvida à paciente com o registro de dispensação (RDC Anvisa nº 471/2021).'));
          secoes.push({ titulo: 'Receituário', subtitulo: 'Antimicrobiano', via, exigeSexo: true, blocos });
        });
        if (orient && !simples.length) secoes.push({ titulo: 'Orientações médicas', blocos: [blocoTexto(orient)] });
      }
      if (!secoes.length) throw new Error('Adicione ao menos um medicamento ou orientação para gerar o receituário.');
    } else if (tipo === 'orientacoes') {
      if (!clean(dados.orientacoes)) throw new Error('Escreva as orientações antes de gerar o PDF.');
      const pend = clean(dados.orientacoes).match(/\{[^}]+\}/g);
      if (pend) avisos.push(`O texto ainda tem campos sem preencher: ${[...new Set(pend)].join(', ')}.`);
      const sub = clean(dados.titulo) && !/^orienta[çc][õo]es( m[ée]dicas)?$/i.test(clean(dados.titulo)) ? clean(dados.titulo) : '';
      secoes.push({ titulo: 'Orientações', subtitulo: sub, blocos: blocosFolheto(dados.orientacoes) });
    } else if (tipo === 'orcamento') {
      const itens = (dados.itens || []).filter(i => clean(i.descricao));
      if (!itens.length) throw new Error('Adicione ao menos um item ao orçamento.');
      const blocos = []; const grupos = [];
      itens.forEach(i => { const gname = clean(i.grupo) || 'Itens'; let gr = grupos.find(x => x[0] === gname); if (!gr) grupos.push(gr = [gname, []]); gr[1].push(i); });
      grupos.forEach(([gname, lst]) => { blocos.push(blocoGrupo(gname)); lst.forEach(i => blocos.push(blocoLinhaValor(i))); });
      const soma = itens.reduce((a, i) => a + (i.incluso ? 0 : Number(i.valor) || 0), 0);
      const desc = Math.max(0, Number(dados.desconto) || 0);
      blocos.push(blocoEspaco(2));
      if (desc) { blocos.push(blocoSubtotal('Subtotal', soma)); blocos.push(blocoSubtotal('Desconto', -desc)); }
      blocos.push(blocoSubtotal('Total', Math.max(0, soma - desc), true));
      if (clean(dados.pagamento)) { blocos.push(blocoTitulo('Formas de pagamento')); blocos.push(blocoTexto(dados.pagamento)); }
      const inc = clean(dados.inclui).split('\n').map(t => t.replace(/^[-•+]\s*/, '').trim()).filter(Boolean);
      const ninc = clean(dados.nao_inclui).split('\n').map(t => t.replace(/^[-•x]\s*/i, '').trim()).filter(Boolean);
      if (inc.length) { blocos.push(blocoTitulo('Este orçamento inclui')); inc.forEach(t => blocos.push(blocoMarcador('pode', t))); }
      if (ninc.length) { blocos.push(blocoTitulo('Não está incluído')); ninc.forEach(t => blocos.push(blocoMarcador('evite', t))); }
      if (clean(dados.observacoes)) { blocos.push(blocoTitulo('Observações')); blocos.push(blocoTexto(dados.observacoes)); }
      const dias = Math.max(0, parseInt(dados.validade_dias, 10) || 0);
      if (dias) { const v = new Date(data); v.setDate(v.getDate() + dias); blocos.push(blocoEspaco(2)); blocos.push(blocoAviso(`Orçamento válido até ${dataExtenso(v)} (${dias} dias). Valores sujeitos a alteração após essa data. As medicações são estimativas e podem variar conforme a resposta ao tratamento e a farmácia.`)); }
      if (dados.ciencia) blocos.push(blocoCiencia(clean((dados.paciente || {}).nome)));
      secoes.push({ titulo: 'Orçamento', subtitulo: clean(dados.titulo), blocos });
    } else if (tipo === 'exames') {
      const ex = (dados.exames || []).map(e => clean(e.nome || e)).filter(Boolean);
      if (!ex.length) throw new Error('Adicione ao menos um exame à solicitação.');
      const blocos = [];
      if (clean(dados.indicacao)) { blocos.push(blocoTitulo('Indicação clínica')); blocos.push(blocoTexto(dados.indicacao)); }
      blocos.push(blocoTitulo('Solicito'));
      blocos.push(blocoTexto(ex.map((e, i) => `${i + 1}. ${e}`).join('\n'), { tam: 10.4, lh: 5.4 }));
      secoes.push({ titulo: 'Solicitação de exames', blocos, mostrarNascimento: true });
    } else if (tipo === 'atestado') {
      const t = clean(dados.texto);
      if (!t) throw new Error('Escreva o texto do atestado antes de gerar o PDF.');
      const pend = t.match(/\{[^}]+\}/g);
      if (pend) avisos.push(`O texto ainda tem campos sem preencher: ${[...new Set(pend)].join(', ')}.`);
      const blocos = [blocoEspaco(6), blocoTexto(t, { tam: 12, lh: 6.6, fonte: 'Jost' })];
      if (dados.cid && clean(dados.cid)) { blocos.push(blocoEspaco(4)); blocos.push(blocoTexto(`CID-10: ${clean(dados.cid).toUpperCase()} — informado com autorização expressa da paciente.`, { tam: 10, lh: 5, cor: C.gray })); }
      secoes.push({ titulo: clean(dados.titulo) || 'Atestado médico', blocos });
    } else if (tipo === 'registro') {
      const blocos = [];
      (dados.registro || []).forEach(sec => {
        const campos = (sec.campos || []).filter(c => clean(c.valor));
        if (!campos.length && !clean(sec.texto)) return;
        blocos.push(blocoTitulo(sec.titulo));
        campos.forEach(c => blocos.push(blocoCampo(c.rotulo, c.valor)));
        if (clean(sec.texto)) blocos.push(blocoTexto(sec.texto));
      });
      if (!blocos.length) throw new Error('A consulta ainda não tem registros para imprimir.');
      secoes.push({ titulo: 'Registro de consulta', subtitulo: dados.subtitulo || '', blocos, mostrarNascimento: true });
    }

    renderizar(ctx, secoes);
    const nomeArquivo = nomeDoArquivo(ctx.paciente.nome, dados.rotuloArquivo || ROTULOS[tipo], data);
    return { blob: doc.output('blob'), nomeArquivo, avisos, paginas: doc.getNumberOfPages() };
  }

  /**
   * Datas dos folhetos, calculadas a partir de uma data/hora de referência (ex.: a inseminação):
   *   {D+3} / {D-2} → "sex., 28/11"        {H-36} / {H+0} → "seg., 24/11, 21h00"
   *   {data_ref} → "quarta-feira, 26 de novembro de 2026"   {hora_ref} → "9h00"
   */
  const SEM = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
  const SEM_LONGO = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const TOKENS_DATA = /\{\s*(D|H)\s*([+-])\s*(\d{1,3})\s*\}|\{\s*(data_ref|hora_ref)\s*\}/gi;
  const temDatas = t => { TOKENS_DATA.lastIndex = 0; const r = TOKENS_DATA.test(String(t || '')); TOKENS_DATA.lastIndex = 0; return r; };
  function resolverDatas(texto, ref) {
    const base = ref instanceof Date ? ref : (ref ? new Date(ref) : null);
    if (!base || isNaN(base)) return String(texto || '');
    const curta = d => `${SEM[d.getDay()]}, ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
    return String(texto || '').replace(TOKENS_DATA, (m, u, sinal, n, nome) => {
      if (nome) return nome.toLowerCase() === 'data_ref' ? `${SEM_LONGO[base.getDay()]}, ${dataExtenso(base)}` : horaCurta(base);
      const d = new Date(base); const q = (sinal === '-' ? -1 : 1) * Number(n);
      if (u.toUpperCase() === 'D') { d.setDate(d.getDate() + q); return curta(d); }
      d.setTime(d.getTime() + q * 3600000); return `${curta(d)}, ${horaCurta(d)}`;
    });
  }

  /* =================================================================
     Livreto do ciclo de tratamento (fertilidade)
     Capa ilustrada, boas-vindas e etapas, cuidados, medicações a suspender
     antes da sedação, calendário de medicações com as datas do ciclo,
     controles, contatos, reta final do procedimento, jejum e orientações
     para o dia. Sempre em A4 (cabe o calendário de 7 dias por faixa).
     dados = { medico, clinica, paciente, data, livreto: {textos do modelo}, ciclo: {...} }
     ================================================================= */
  const LV = { band1: [248, 238, 241], band2: [241, 226, 231], linha: [228, 207, 214], cobreBg: [250, 237, 224], salviaBg: [231, 242, 236], card: [246, 229, 234], fundo: [252, 247, 248] };
  const dataLocal = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null; };
  const dataHora = (s, h) => { const d = dataLocal(s); if (!d) return null; const m = /^(\d{1,2}):(\d{2})/.exec(String(h || '')); d.setHours(m ? +m[1] : 0, m ? +m[2] : 0, 0, 0); return d; };
  const somaDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const difDias = (a, b) => Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate(), 12) - new Date(a.getFullYear(), a.getMonth(), a.getDate(), 12)) / 864e5);
  const ddmm = d => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
  const diaCurto = d => `${SEM[d.getDay()]}, ${ddmm(d)}`;
  const diaLongo = d => `${SEM_LONGO[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
  const horaDe = h => { const m = /^(\d{1,2}):(\d{2})/.exec(String(h || '')); return m ? `${pad2(m[1])}h${m[2]}` : ''; };
  function comOpacidade(doc, op, fn) {
    try { doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: op })); fn(); doc.restoreGraphicsState(); }
    catch (e) { fn(); }
  }

  /* ---------- ícones vetoriais (grade de 24, traço arredondado) ---------- */
  const ICONES_LIVRETO = ['consulta', 'exames', 'ultrassom', 'injecao', 'puncao', 'laboratorio', 'transferencia', 'coracao', 'atividade', 'rotina', 'alarme', 'alcool', 'gelo', 'estetica', 'geladeira', 'aviso', 'medicacao', 'telefone', 'mensagem', 'email', 'acompanhante', 'jejum', 'calendario', 'documento'];
  const ICONE_PALAVRA = [
    [/gatilho|indu[çc][ãa]o (final|da ovula)|esquec|alarme/, 'alarme'], [/ultrass|controle|monitor/, 'ultrassom'], [/pun[çc]|capta|[óo]vulo/, 'puncao'],
    [/transfer|embri/, 'transferencia'], [/beta|gravidez|positivo/, 'coracao'], [/laborat|fertiliza|cultivo/, 'laboratorio'],
    [/estimul|inje|aplica|medica|progesterona|endom|l[úu]tea/, 'injecao'], [/insemina/, 'laboratorio'], [/rela[çc][ãa]o|coito|f[ée]rtil/, 'coracao'],
    [/exame|sangue|sorolog|preparo/, 'exames'], [/consulta|planej|avalia/, 'consulta'], [/atividade|exerc|f[íi]sic/, 'atividade'],
    [/rotina|vida normal|hor[áa]rio/, 'rotina'], [/[áa]lcool|bebida|cigarro/, 'alcool'], [/rea[çc]|intoler|vermelh|gelo|local da/, 'gelo'],
    [/est[ée]tic|dent|cirurg/, 'estetica'], [/guardar|armazen|geladeira|refriger/, 'geladeira'], [/alerta|aten[çc]|sinal|sinais|urg/, 'aviso'],
    [/jejum/, 'jejum'], [/acompanhante/, 'acompanhante']
  ];
  const iconeDe = (texto, padrao = 'coracao') => { const t = String(texto || '').toLowerCase(); const a = ICONE_PALAVRA.find(([re]) => re.test(t)); return a ? a[1] : padrao; };
  function desenharIcone(doc, nome, cx, cy, tam, cor, peso = 1.6) {
    const s = tam / 24, X = x => cx + (x - 12) * s, Y = y => cy + (y - 12) * s;
    doc.setDrawColor(...cor); doc.setFillColor(...cor); doc.setLineWidth(peso * s); doc.setLineCap('round'); doc.setLineJoin('round');
    const l = (a, b, c, d) => doc.line(X(a), Y(b), X(c), Y(d));
    const pl = (pts, fechar) => { doc.moveTo(X(pts[0][0]), Y(pts[0][1])); for (let i = 1; i < pts.length; i++) doc.lineTo(X(pts[i][0]), Y(pts[i][1])); if (fechar) doc.close(); doc.stroke(); };
    const c = (x, y, r, st = 'S') => doc.circle(X(x), Y(y), r * s, st);
    const rr = (x, y, w, h, r) => doc.roundedRect(X(x), Y(y), w * s, h * s, r * s, r * s, 'S');
    const arco = (x, y, r, a0, a1) => { const n = Math.max(6, Math.round(Math.abs(a1 - a0) / 10)); const pts = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); } pl(pts); };
    const cam = ops => { ops.forEach(o => { if (o[0] === 'M') doc.moveTo(X(o[1]), Y(o[2])); else if (o[0] === 'L') doc.lineTo(X(o[1]), Y(o[2])); else if (o[0] === 'C') doc.curveTo(X(o[1]), Y(o[2]), X(o[3]), Y(o[4]), X(o[5]), Y(o[6])); else doc.close(); }); doc.stroke(); };
    const gota = (x, y, k) => cam([['M', x, y - 8 * k], ['C', x + 1.6 * k, y - 5.4 * k, x + 5.6 * k, y - 2 * k, x + 5.6 * k, y + 1.6 * k], ['C', x + 5.6 * k, y + 4.7 * k, x + 3.1 * k, y + 6.9 * k, x, y + 6.9 * k], ['C', x - 3.1 * k, y + 6.9 * k, x - 5.6 * k, y + 4.7 * k, x - 5.6 * k, y + 1.6 * k], ['C', x - 5.6 * k, y - 2 * k, x - 1.6 * k, y - 5.4 * k, x, y - 8 * k]]);
    switch (nome) {
      case 'consulta': l(5, 3, 5, 9); l(13, 3, 13, 9); l(5, 3, 6.6, 3); l(13, 3, 11.4, 3); arco(9, 9, 4, 0, 180); l(9, 13, 9, 15); arco(14, 15, 5, 180, 0); l(19, 15, 19, 12.6); c(19, 10.6, 2); break;
      case 'exames': gota(12, 12.6, 1.12); l(9.6, 15.2, 11, 16.6); break;
      case 'ultrassom': rr(2.5, 3, 19, 14, 2.2); l(12, 17, 12, 20.6); l(8, 20.6, 16, 20.6); l(12, 5, 7.2, 13.5); l(12, 5, 16.8, 13.5); arco(12, 5, 9.8, 61, 119); c(12, 10.4, 1.5); break;
      case 'injecao': pl([[15, 5], [19, 9], [9, 19], [5, 15]], true); l(9, 11, 11, 13); l(11.6, 8.4, 13.6, 10.4); l(7, 17, 2.6, 21.4); l(17, 7, 20.2, 3.8); l(18.6, 2.2, 21.8, 5.4); break;
      case 'puncao': c(12, 12, 9); c(12, 12, 6.4); c(14, 10, 1.9, 'F'); break;
      case 'laboratorio': l(9.5, 3, 14.5, 3); pl([[10.5, 3], [10.5, 9.5], [4.6, 18.8], [5.6, 21], [18.4, 21], [19.4, 18.8], [13.5, 9.5], [13.5, 3]]); l(7.4, 15, 16.6, 15); break;
      case 'transferencia': c(12, 12, 9); c(9.7, 9.7, 2.5); c(14.3, 9.7, 2.5); c(9.7, 14.3, 2.5); c(14.3, 14.3, 2.5); break;
      case 'coracao': cam([['M', 12, 20.5], ['C', 12, 20.5, 3, 15, 3, 9], ['C', 3, 6, 5.2, 4, 7.8, 4], ['C', 9.6, 4, 11.1, 5, 12, 6.6], ['C', 12.9, 5, 14.4, 4, 16.2, 4], ['C', 18.8, 4, 21, 6, 21, 9], ['C', 21, 15, 12, 20.5, 12, 20.5]]); break;
      case 'atividade': rr(1.5, 9, 3, 6, 1); rr(4.5, 6.5, 3.5, 11, 1.2); l(8, 12, 16, 12); rr(16, 6.5, 3.5, 11, 1.2); rr(19.5, 9, 3, 6, 1); break;
      case 'rotina': c(12, 12, 9); pl([[12, 6.6], [12, 12], [15.6, 14]]); break;
      case 'alarme': c(12, 13, 7.6); pl([[12, 9], [12, 13], [14.8, 14.6]]); l(3.6, 6.4, 6.6, 3.4); l(20.4, 6.4, 17.4, 3.4); l(7, 19.8, 5.4, 21.6); l(17, 19.8, 18.6, 21.6); break;
      case 'alcool': cam([['M', 7, 3], ['L', 17, 3], ['C', 17, 9.2, 15, 12, 12, 12], ['C', 9, 12, 7, 9.2, 7, 3]]); l(7.7, 7, 16.3, 7); l(12, 12, 12, 20.5); l(8.5, 20.5, 15.5, 20.5); break;
      case 'gelo': l(12, 2.5, 12, 21.5); l(3.8, 7.25, 20.2, 16.75); l(3.8, 16.75, 20.2, 7.25); pl([[9.8, 4.2], [12, 6.2], [14.2, 4.2]]); pl([[9.8, 19.8], [12, 17.8], [14.2, 19.8]]); break;
      case 'estetica': cam([['M', 11, 3], ['C', 11.6, 8.4, 13.6, 10.4, 19, 11], ['C', 13.6, 11.6, 11.6, 13.6, 11, 19], ['C', 10.4, 13.6, 8.4, 11.6, 3, 11], ['C', 8.4, 10.4, 10.4, 8.4, 11, 3]]); l(19, 15.5, 19, 21.5); l(16, 18.5, 22, 18.5); break;
      case 'geladeira': rr(6, 2, 12, 20, 2.2); l(6, 9.5, 18, 9.5); l(9, 5, 9, 7); l(9, 12.5, 9, 16); break;
      case 'aviso': pl([[12, 3], [22, 20.5], [2, 20.5]], true); l(12, 9.5, 12, 14.5); c(12, 17.3, 0.55, 'F'); break;
      case 'medicacao': rr(2.5, 8, 19, 8, 4); l(12, 8, 12, 16); break;
      case 'telefone': rr(6.5, 2, 11, 20, 2.2); l(10.5, 18.4, 13.5, 18.4); break;
      case 'mensagem': rr(3, 4, 18, 12.5, 3); pl([[8, 16.5], [7, 20.6], [12.5, 16.5]]); break;
      case 'email': rr(2.5, 5, 19, 14, 2); pl([[3, 6], [12, 13], [21, 6]]); break;
      case 'acompanhante': c(9, 7.5, 3.3); arco(9, 20.5, 6.8, 200, 340); c(16.6, 8.6, 2.7); arco(16.6, 20.6, 5.2, 235, 330); break;
      case 'jejum': c(13, 12, 5); l(4, 3, 4, 21); l(2.4, 3, 2.4, 7.4); l(5.6, 3, 5.6, 7.4); arco(4, 7.4, 1.6, 0, 180); l(21, 3, 21, 21); cam([['M', 21, 3], ['C', 23, 5, 23, 9, 21, 10]]); break;
      case 'calendario': rr(3.5, 5, 17, 15.5, 2); l(3.5, 9.5, 20.5, 9.5); l(8, 3, 8, 7); l(16, 3, 16, 7); c(8.5, 14.2, 0.7, 'F'); c(12, 14.2, 0.7, 'F'); c(15.5, 14.2, 0.7, 'F'); break;
      case 'documento': rr(5, 2.5, 14, 19, 2); l(8.5, 8, 15.5, 8); l(8.5, 12, 15.5, 12); l(8.5, 16, 13, 16); break;
      default: c(12, 12, 3, 'F');
    }
    doc.setLineCap('butt'); doc.setLineJoin('miter');
  }

  /* ---------- dados do ciclo, já normalizados ---------- */
  const abreviarDose = t => clean(t).replace(/\bcomprimidos?\b/gi, 'cp').replace(/\bc[áa]psulas?\b/gi, 'cáps').replace(/\baplica[çc][ãa]o\b/gi, 'aplic.').replace(/\bunidades\b/gi, 'UI');
  function normalizarCiclo(ci) {
    ci = ci || {};
    const pr = ci.procedimento || {};
    const inicio = dataLocal(ci.inicio);
    const procDia = dataLocal(pr.data);
    const proc = dataHora(pr.data, pr.hora);
    let dias = parseInt(ci.dias, 10);
    if (!(dias > 0)) dias = inicio && procDia && procDia >= inicio ? difDias(inicio, procDia) + 1 : 14;
    dias = Math.max(1, Math.min(35, dias));
    const meds = (ci.meds || []).filter(m => clean(m.nome)).map(m => {
      let de = parseInt(m.de, 10) || 1, ate = parseInt(m.ate, 10) || dias; if (ate < de) [de, ate] = [ate, de];
      return { nome: clean(m.nome), dose: clean(m.dose), via: clean(m.via), horario: clean(m.horario), de, ate };
    });
    const controles = (ci.controles || []).map(c => ({ d: dataLocal(c.data), hora: c.hora || '', us: c.us !== false, sangue: !!c.sangue })).filter(c => c.d)
      .sort((a, b) => a.d - b.d || String(a.hora).localeCompare(String(b.hora)));
    const final = (ci.final || []).filter(f => clean(f.med)).map(f => ({ med: clean(f.med), via: clean(f.via), d: dataLocal(f.data), hora: f.hora || '' }))
      .sort((a, b) => (a.d ? 0 : 1) - (b.d ? 0 : 1) || (a.d && b.d ? a.d - b.d : 0) || String(a.hora).localeCompare(String(b.hora)));
    const diaDe = d => inicio && d ? difDias(inicio, d) + 1 : null;
    return { protocolo: clean(ci.protocolo), inicio, dias, nhc: clean(ci.nhc), meds, controles, final, proc, procDia, procHora: pr.hora || '', obs: clean(ci.obs), diaDe };
  }

  /* ---------- páginas do livreto ---------- */
  function cabecalhoLivro(L) {
    const { doc, W, M } = L; const A = window.ASSETS.img;
    const sh = 10.5, sw = sh * 400 / 451;
    doc.addImage(A['logo-symbol'], 'PNG', M, 7.5, sw, sh, 'logoSym', 'SLOW');
    setF(doc, 'Ital', 13, C.wine); doc.text(L.medico.nomeCompleto, M + sw + 2.6, 13);
    setF(doc, 'Jost', 5.6, C.mauve); tracked(doc, L.medico.especialidade.toUpperCase(), M + sw + 2.7, 16.4, 0.75);
    setF(doc, 'CormI', 12.5, C.wine2); doc.text(L.tituloCorrido, W - M, 14.2, { align: 'right' });
    doc.setDrawColor(...C.rose); doc.setLineWidth(0.3); doc.line(M, 21, W - M, 21);
    doc.setDrawColor(...C.gold); doc.setLineWidth(0.9); doc.line(W - M - 30, 21, W - M, 21);
  }
  function novaPagina(L) { L.doc.addPage('a4', 'portrait'); cabecalhoLivro(L); L.y = L.top; }
  function caber(L, h) { if (L.y + h > L.bottom) novaPagina(L); }
  function rodapesLivro(L) {
    const { doc, M } = L; const n = doc.getNumberOfPages();
    for (let i = 2; i <= n; i++) {
      doc.setPage(i);
      const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
      doc.setDrawColor(...C.hair); doc.setLineWidth(0.25); doc.line(M, H - 13.5, W - M, H - 13.5);
      setF(doc, 'Jost', 7, C.gray); doc.text(doc.splitTextToSize(L.rodape, W - 2 * M - 20)[0] || '', M, H - 8.6);
      setF(doc, 'JostM', 7, C.mauve); doc.text(`${i} / ${n}`, W - M, H - 8.6, { align: 'right' });
    }
  }
  function tituloPagina(L, titulo, sub) {
    const { doc, W, M } = L;
    setF(doc, 'Jost', 9.4, C.gray); const ls = sub ? doc.splitTextToSize(sub, W - 2 * M) : [];
    caber(L, 16 + ls.length * 4.5 + 14);
    setF(doc, 'CormI', 25, C.wine); doc.text(titulo, M, L.y + 8);
    L.y += 12;
    if (ls.length) { setF(doc, 'Jost', 9.4, C.gray); ls.forEach((t, i) => doc.text(t, M, L.y + 2 + i * 4.5)); L.y += 2 + ls.length * 4.5; }
    L.y += 4;
  }
  // desenha blocos do motor comum (texto, marcadores, destaques…) com quebra de página
  function fluir(L, blocos, x = L.M, w = L.W - 2 * L.M) {
    const ctx = { doc: L.doc, g: L.g };
    for (let b = 0; b < blocos.length; b++) {
      const bl = blocos[b];
      if (bl.quebravel) {
        const ls = bl.linhas(ctx, w); const lh = bl.alturaLinha(ctx); let i = 0;
        while (i < ls.length) {
          let j = i, hh = 0;
          while (j < ls.length && L.y + hh + (ls[j].gap ? lh * 0.55 : lh) + 2.5 <= L.bottom) { hh += ls[j].gap ? lh * 0.55 : lh; j++; }
          if (j === i) { novaPagina(L); continue; }
          bl.desenharLinhas(ctx, x, L.y, w, i, j); L.y += bl.alturaDe(ctx, w, i, j); i = j;
          if (i < ls.length) novaPagina(L);
        }
        continue;
      }
      const h = bl.medir(ctx, w);
      let need = h;
      if (bl.keepNext && blocos[b + 1]) need += blocos[b + 1].quebravel ? blocos[b + 1].alturaLinha(ctx) * 2 + 2.5 : blocos[b + 1].medir(ctx, w);
      if (L.y + need > L.bottom) novaPagina(L);
      bl.desenhar(ctx, x, L.y, w); L.y += h;
    }
  }
  // rótulo de seção (não fica sozinho no pé da página)
  function rotuloSecao(L, texto, minimo = 34) { caber(L, minimo); fluir(L, [blocoEspaco(2), Object.assign(blocoGrupo(texto), { keepNext: false })]); }

  // Capa: estrada com marcos da jornada, título e quem é a paciente
  function capaLivro(L, N) {
    const { doc, W, H, M } = L; const T = L.T; const A = window.ASSETS.img;
    doc.setFillColor(...LV.fundo); doc.rect(0, 0, W, H, 'F');
    const x0 = M, y0 = 17, cw = W - 2 * M, ch = 130;
    doc.setFillColor(...LV.card); doc.roundedRect(x0, y0, cw, ch, 7, 7, 'F');
    comOpacidade(doc, 0.55, () => {
      doc.setFillColor(255, 255, 255);
      doc.circle(x0 + 26, y0 + 30, 17, 'F'); doc.circle(x0 + cw - 26, y0 + ch - 26, 19, 'F');
      doc.circle(x0 + cw - 46, y0 + 20, 6, 'F'); doc.circle(x0 + 14, y0 + ch - 16, 5, 'F'); doc.circle(x0 + cw * 0.55, y0 + ch * 0.52, 3, 'F');
    });
    const P = (x, y) => [x0 + x, y0 + y];
    const segs = [P(150, 116), [...P(110, 121), ...P(28, 120), ...P(36, 97)], [...P(43, 75), ...P(141, 92), ...P(143, 68)], [...P(145, 46), ...P(64, 58), ...P(57, 40)], [...P(51, 26), ...P(84, 19), ...P(110, 23)]];
    const trilha = (cor, larg, traco) => {
      doc.setDrawColor(...cor); doc.setLineWidth(larg); doc.setLineCap('round'); doc.setLineJoin('round');
      if (traco) doc.setLineDashPattern(traco, 0);
      doc.moveTo(segs[0][0], segs[0][1]); segs.slice(1).forEach(s => doc.curveTo(...s)); doc.stroke();
      if (traco) doc.setLineDashPattern([], 0);
      doc.setLineCap('butt'); doc.setLineJoin('miter');
    };
    comOpacidade(doc, 0.45, () => trilha(C.rose, 13.5));
    trilha(C.white, 11.4); trilha(C.wine, 9.6); trilha([255, 255, 255], 0.55, [2.6, 2.4]);
    // ponto da curva de Bézier
    const bz = (i, t) => { const a = i === 1 ? segs[0] : segs[i - 1].slice(4, 6); const s = segs[i]; const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * s[0] + 3 * u * t * t * s[2] + t * t * t * s[4], u * u * u * a[1] + 3 * u * u * t * s[1] + 3 * u * t * t * s[3] + t * t * t * s[5]]; };
    const pin = ([x, y], cor, n) => {
      const r = 5.4, cy = y - r * 1.8;
      comOpacidade(doc, 0.25, () => { doc.setFillColor(...C.ink); doc.ellipse(x, y + 0.6, 2.6, 0.9, 'F'); });
      doc.setFillColor(...cor); doc.circle(x, cy, r, 'F');
      doc.triangle(x - r * 0.72, cy + r * 0.62, x + r * 0.72, cy + r * 0.62, x, y, 'F');
      doc.setFillColor(255, 255, 255); doc.circle(x, cy, r * 0.58, 'F');
      setF(doc, 'JostM', 8.4, cor); doc.text(String(n), x, cy + 1.05, { align: 'center' });
    };
    pin(bz(1, 0.62), C.gold, 1); pin(bz(2, 0.52), C.wine2, 2); pin(bz(3, 0.5), C.mauve, 3); pin(bz(4, 0.45), C.gold, 4);
    // largada: bandeira e "Início do ciclo"
    const [sx, sy] = segs[0];
    doc.setDrawColor(...C.wine); doc.setLineWidth(0.6); doc.line(sx + 9, sy - 1, sx + 9, sy - 15);
    doc.setFillColor(...C.gold); doc.triangle(sx + 9.3, sy - 15, sx + 9.3, sy - 9.4, sx + 16, sy - 12.2, 'F');
    setF(doc, 'JostM', 8, C.wine2); doc.text('Início do ciclo', sx + 6.6, sy - 17.5, { align: 'right' });
    // chegada: coração
    const [ex, ey] = segs[4].slice(4, 6);
    doc.setFillColor(...C.wine2);
    const hx = ex + 13, hy = ey - 1, k = 0.42;
    doc.moveTo(hx, hy + 8.5 * k); doc.curveTo(hx, hy + 8.5 * k, hx - 9 * k, hy + 3 * k, hx - 9 * k, hy - 3 * k); doc.curveTo(hx - 9 * k, hy - 6 * k, hx - 6.8 * k, hy - 8 * k, hx - 4.2 * k, hy - 8 * k);
    doc.curveTo(hx - 2.4 * k, hy - 8 * k, hx - 0.9 * k, hy - 7 * k, hx, hy - 5.4 * k); doc.curveTo(hx + 0.9 * k, hy - 7 * k, hx + 2.4 * k, hy - 8 * k, hx + 4.2 * k, hy - 8 * k);
    doc.curveTo(hx + 6.8 * k, hy - 8 * k, hx + 9 * k, hy - 6 * k, hx + 9 * k, hy - 3 * k); doc.curveTo(hx + 9 * k, hy + 3 * k, hx, hy + 8.5 * k, hx, hy + 8.5 * k); doc.fill();
    doc.setDrawColor(...C.gold); doc.setLineWidth(0.5); doc.setLineCap('round');
    [[7, -6, 9.5, -8.5], [9, -1.5, 12.4, -1.8], [6, 3.6, 8.6, 5.8]].forEach(([a, b, c, d]) => doc.line(hx + a, hy + b, hx + c, hy + d));
    doc.setLineCap('butt');
    const lw = 20, lh = lw * 76 / 114;
    doc.addImage(A['logo-lotus'], 'PNG', x0 + cw - lw - 9, y0 + 8, lw, lh, 'lotus', 'SLOW');

    // título
    let y = y0 + ch + 21;
    setF(doc, 'Ital', 34, C.wine);
    const tl = doc.splitTextToSize(clean(T.titulo) || 'Jornada do tratamento', W - 2 * M);
    tl.forEach(t => { doc.text(t, W / 2, y, { align: 'center' }); y += 12; });
    if (clean(T.subtitulo)) { setF(doc, 'CormI', 15.5, C.wine2); doc.text(clean(T.subtitulo), W / 2, y - 3, { align: 'center' }); y += 4; }
    setF(doc, 'JostM', 7.6, C.goldDark);
    tracked(doc, ['Livreto do ciclo', N.protocolo].filter(Boolean).join('  ·  ').toUpperCase(), W / 2, y + 3, 1.1, { align: 'center' });
    y += 10;

    // cartão "preparado para"
    const p = L.paciente; const nome = clean(p.nome_social) || clean(p.nome) || '';
    const det = [N.inicio ? `Início: ${diaCurto(N.inicio)}/${N.inicio.getFullYear()}` : '', N.proc ? `${clean((T.procedimento || {}).rotulo) || 'Procedimento'}: ${diaCurto(N.proc)}` : '', N.nhc ? `Prontuário ${N.nhc}` : ''].filter(Boolean).join('   ·   ');
    const hc = det ? 27 : 21;
    doc.setFillColor(255, 255, 255); doc.setDrawColor(...C.blush2); doc.setLineWidth(0.4);
    doc.roundedRect(M + 18, y, W - 2 * M - 36, hc, 4, 4, 'FD');
    doc.setFillColor(...C.gold); doc.roundedRect(M + 18, y, 1.4, hc, 0.7, 0.7, 'F');
    setF(doc, 'JostM', 6.8, C.mauve); tracked(doc, 'PREPARADO PARA', W / 2, y + 6.6, 0.9, { align: 'center' });
    setF(doc, 'CormSB', 17, C.ink); doc.text(doc.splitTextToSize(nome || '____________________________', W - 2 * M - 46)[0], W / 2, y + 14.4, { align: 'center' });
    if (det) { setF(doc, 'Jost', 8.6, C.gray); doc.text(det, W / 2, y + 21.4, { align: 'center' }); }

    // marca
    const lgw = 44, lgh = lgw * 641 / 900;
    doc.addImage(A['logo-full'], 'PNG', (W - lgw) / 2, H - lgh - 13, lgw, lgh, 'logoFull', 'SLOW');
    const m = L.medico;
    const cred = [m.crm ? `CRM-${m.crm_uf || ''} ${m.crm}` : '', m.rqe ? `RQE ${m.rqe}` : ''].filter(Boolean).join('  ·  ');
    if (cred) { setF(doc, 'Jost', 7.2, C.gray); doc.text(cred, W / 2, H - 8.5, { align: 'center' }); }
  }

  // Etapas: ícones numerados ligados por uma trilha pontilhada
  function etapasLivro(L, etapas) {
    const { doc, M, W } = L; const w = W - 2 * M; const n = etapas.length;
    const por = n <= 5 ? n : n <= 10 ? Math.ceil(n / 2) : 5;
    const colW = w / Math.max(por, 3); const r = 7.6;
    const larguraLinha = Math.min(colW - 3, 40);
    for (let i0 = 0; i0 < n; i0 += por) {
      const linha = etapas.slice(i0, i0 + por);
      const off = (w - colW * linha.length) / 2;
      setF(doc, 'JostM', 8.3, C.ink);
      const rot = linha.map(t => doc.splitTextToSize(t, larguraLinha).slice(0, 3));
      const hRow = 2 * r + 6 + Math.max(...rot.map(x => x.length)) * 3.7 + 5;
      caber(L, hRow);
      const cy = L.y + r + 1.5;
      linha.forEach((t, j) => {
        const cx = M + off + colW * (j + 0.5);
        if (j < linha.length - 1) {
          doc.setDrawColor(...C.rose); doc.setLineWidth(0.5); doc.setLineCap('round'); doc.setLineDashPattern([0.1, 1.5], 0);
          doc.line(cx + r + 2.5, cy, cx + colW - r - 3.4, cy); doc.setLineDashPattern([], 0);
          const ax = cx + colW - r - 2.4; doc.setDrawColor(...C.gold); doc.setLineWidth(0.5);
          doc.line(ax - 1.4, cy - 1.4, ax, cy); doc.line(ax - 1.4, cy + 1.4, ax, cy); doc.setLineCap('butt');
        }
        doc.setFillColor(...C.blush); doc.setDrawColor(...C.rose); doc.setLineWidth(0.4); doc.circle(cx, cy, r, 'FD');
        desenharIcone(doc, iconeDe(t, 'coracao'), cx, cy, r * 1.15, C.wine2, 1.55);
        doc.setFillColor(...C.gold); doc.circle(cx + r * 0.74, cy - r * 0.74, 2.6, 'F');
        setF(doc, 'JostM', 6.8, C.white); doc.text(String(i0 + j + 1), cx + r * 0.74, cy - r * 0.74 + 0.95, { align: 'center' });
        setF(doc, 'JostM', 8.3, C.ink); rot[j].forEach((tt, k) => doc.text(tt, cx, cy + r + 5 + k * 3.7, { align: 'center' }));
      });
      L.y += hRow;
    }
  }

  // Cuidados: cartões com ícone, em duas colunas
  function cuidadosLivro(L, cards) {
    const { doc, M, W } = L; const gap = 4.5; const cw = (W - 2 * M - gap) / 2; const tx = 21;
    const med = cards.map(c => {
      setF(doc, 'JostM', 9.8, C.wine); const tl = doc.splitTextToSize(clean(c.titulo), cw - tx - 4);
      setF(doc, 'Jost', 8.7, C.ink); const xl = clean(c.texto) ? doc.splitTextToSize(clean(c.texto), cw - tx - 4) : [];
      return { c, tl, xl, h: Math.max(25, 7 + tl.length * 4.3 + 1 + xl.length * 3.9 + 4.5) };
    });
    for (let i = 0; i < med.length; i += 2) {
      const par = med.slice(i, i + 2); const h = Math.max(...par.map(x => x.h));
      caber(L, h + gap);
      par.forEach((m, j) => {
        const x = M + j * (cw + gap), y = L.y;
        doc.setFillColor(...C.blush); doc.setDrawColor(...C.blush2); doc.setLineWidth(0.35); doc.roundedRect(x, y, cw, h, 3.5, 3.5, 'FD');
        doc.setFillColor(255, 255, 255); doc.setDrawColor(...C.rose); doc.setLineWidth(0.35); doc.circle(x + 10.5, y + 11, 7, 'FD');
        desenharIcone(doc, m.c.icone || iconeDe(m.c.titulo + ' ' + m.c.texto, 'coracao'), x + 10.5, y + 11, 8.6, C.wine2, 1.6);
        setF(doc, 'JostM', 9.8, C.wine); m.tl.forEach((t, k) => doc.text(t, x + tx, y + 7.6 + k * 4.3));
        setF(doc, 'Jost', 8.7, C.ink); m.xl.forEach((t, k) => doc.text(t, x + tx, y + 7.6 + m.tl.length * 4.3 + 1 + k * 3.9));
      });
      L.y += h + gap;
    }
  }

  // Medicações a suspender antes da sedação: "## grupo · indicação · motivo", "nome | prazo", "* nota"
  function suspensaoLivro(L, texto) {
    const { doc, M, W } = L; const w = W - 2 * M;
    const blocos = [{
      keepNext: true, medir: () => 13,
      desenhar(ctx, x, y) {
        doc.setFillColor(...C.wine); doc.roundedRect(x, y, w, 10, 2.6, 2.6, 'F');
        desenharIcone(doc, 'aviso', x + 6.5, y + 5, 5.6, C.rose, 1.8);
        setF(doc, 'JostM', 8.2, C.white); tracked(doc, 'MEDICAÇÕES QUE PRECISAM SER SUSPENSAS ANTES DA SEDAÇÃO', x + 12, y + 6.3, 0.55);
      }
    }];
    let intro = [];
    const fecharIntro = () => { if (intro.length) { blocos.push(blocoTexto(intro.join('\n'), { tam: 9.2, lh: 4.4, cor: C.gray })); blocos.push(blocoEspaco(1.5)); intro = []; } };
    clean(texto).split('\n').forEach(raw => {
      const t = raw.trim(); let m;
      if (!t) return;
      if ((m = t.match(/^##?\s*(.+)$/))) {
        fecharIntro();
        const partes = m[1].split(/\s+[·|]\s+/); const tit = partes.shift();
        let ls = null;
        blocos.push({
          keepNext: true,
          medir() { setF(doc, 'Jost', 8.3, C.gray); ls = partes.length ? doc.splitTextToSize(partes.join(' · '), w - 4) : []; return 8.6 + ls.length * 3.7; },
          desenhar(ctx, x, y) { setF(doc, 'JostM', 9.6, C.wine2); doc.text(tit, x, y + 6); setF(doc, 'Jost', 8.3, C.gray); ls.forEach((s, i) => doc.text(s, x, y + 10 + i * 3.7)); }
        });
      } else if ((m = t.match(/^\*\s*(.+)$/))) {
        fecharIntro(); blocos.push(blocoEspaco(1)); blocos.push(blocoTexto('* ' + m[1], { fonte: 'JostL', tam: 8.4, lh: 3.9, cor: C.gray }));
      } else if (t.includes('|')) {
        fecharIntro();
        const [nome, prazo] = t.split('|').map(s => s.trim());
        let ls = null, pw = 0;
        blocos.push({
          medir() { setF(doc, 'JostM', 8.2, C.goldDark); pw = prazo ? doc.getTextWidth(prazo) + 7 : 0; setF(doc, 'Jost', 9.4, C.ink); ls = doc.splitTextToSize(nome, w - pw - 6); return Math.max(8.2, ls.length * 4.3 + 3.6); },
          desenhar(ctx, x, y) {
            const h = Math.max(8.2, ls.length * 4.3 + 3.6);
            setF(doc, 'Jost', 9.4, C.ink); ls.forEach((s, i) => doc.text(s, x + 2, y + 5.3 + i * 4.3));
            if (prazo) { doc.setFillColor(...LV.cobreBg); doc.roundedRect(x + w - pw, y + 1.4, pw, 5.6, 2.8, 2.8, 'F'); setF(doc, 'JostM', 8.2, C.goldDark); doc.text(prazo, x + w - pw / 2, y + 5.2, { align: 'center' }); }
            doc.setDrawColor(...C.hair); doc.setLineWidth(0.2); doc.line(x, y + h - 0.3, x + w, y + h - 0.3);
          }
        });
      } else intro.push(t);
    });
    fecharIntro();
    blocos.push(blocoEspaco(3));
    fluir(L, blocos);
  }

  // altura aproximada do calendário inteiro (título, faixa da paciente e semanas)
  const alturaCalendario = N => 46 + Math.ceil(N.dias / 7) * (6.5 + 15.5 + Math.max(N.meds.length, 4) * 10 + 9.4 * 2 + 7.5 + 6) + 10.5;
  // Calendário: faixas de 7 dias, cada medicação numa linha, controles e reta final
  function calendarioLivro(L, N) {
    const { doc, M, W } = L; const w = W - 2 * M;
    // o calendário começa na página atual só se couber inteiro; senão, página nova
    if (L.y > L.top + 1 && L.y + 10 + alturaCalendario(N) > L.bottom) novaPagina(L); else if (L.y > L.top + 1) L.y += 10;
    topoCalendario(L, N);
    const labW = 46, porFaixa = 7, colW = (w - labW) / porFaixa, headH = 15.5;
    const { ehGatilho, finaisNoCal, diaProc, diasGatilho } = marcosCalendario(N);
    calendarioSemanas(L, N, { labW, porFaixa, colW, headH, ehGatilho, finaisNoCal, diaProc, diasGatilho });
  }
  // título e faixa com a paciente (formatos em retrato)
  function topoCalendario(L, N) {
    const { doc, M, W } = L; const w = W - 2 * M;
    tituloPagina(L, 'Seu calendário de medicações', N.inicio ? 'A cada aplicação feita, marque o círculo. Aplique sempre no mesmo horário e traga este livreto aos controles.' : 'Preencha as datas a partir do primeiro dia da estimulação (Dia 01). A cada aplicação feita, marque o círculo.');
    // faixa com a paciente
    const p = L.paciente; const nome = clean(p.nome_social) || clean(p.nome) || '';
    const cols = [['Tratamento', N.protocolo], ['Dia 01', N.inicio ? `${diaCurto(N.inicio)}/${N.inicio.getFullYear()}` : ''], ['Prontuário', N.nhc]].filter(c => c[1]);
    const larg = cols.map(([a, b]) => { setF(doc, 'JostM', 6.4, C.mauve); const l1 = doc.getTextWidth(a.toUpperCase()) + 0.8 * a.length; setF(doc, 'Jost', 9.6, C.ink); return Math.max(l1, doc.getTextWidth(b)) + 7; });
    const cw = larg.reduce((a, b) => a + b, 0);
    doc.setFillColor(...C.blush); doc.setDrawColor(...C.blush2); doc.setLineWidth(0.3); doc.roundedRect(M, L.y, w, 14.5, 2.6, 2.6, 'FD');
    doc.setFillColor(...C.gold); doc.roundedRect(M, L.y, 1.3, 14.5, 0.65, 0.65, 'F');
    setF(doc, 'JostM', 6.4, C.mauve); tracked(doc, 'PACIENTE', M + 5, L.y + 5.2, 0.8);
    setF(doc, 'CormSB', 13.5, C.ink); doc.text(doc.splitTextToSize(nome || '—', w - cw - 12)[0], M + 5, L.y + 11);
    let cx = W - M - 2 - cw;
    cols.forEach(([a, b], i) => {
      doc.setDrawColor(...C.hair); doc.setLineWidth(0.2); doc.line(cx, L.y + 3, cx, L.y + 11.5);
      setF(doc, 'JostM', 6.4, C.mauve); tracked(doc, a.toUpperCase(), cx + 3.5, L.y + 5.2, 0.8);
      setF(doc, 'Jost', 9.6, C.ink); doc.text(b, cx + 3.5, L.y + 10.8); cx += larg[i];
    });
    L.y += 20;
  }
  // dia do procedimento, dias de gatilho e medicações da reta final que caem no calendário
  function marcosCalendario(N) {
    const ehGatilho = f => /ovidrel|gonapeptyl|gatilho|hcg|choriomon|triptorrelina|decapeptyl|leuprorrelina/i.test(f.med);
    const finaisNoCal = N.final.filter(f => f.d && N.diaDe(f.d) >= 1 && N.diaDe(f.d) <= N.dias);
    const diaProc = N.procDia ? N.diaDe(N.procDia) : null;
    const diasGatilho = new Set(finaisNoCal.filter(ehGatilho).map(f => N.diaDe(f.d)));
    return { ehGatilho, finaisNoCal, diaProc, diasGatilho };
  }
  function calendarioSemanas(L, N, { labW, porFaixa, colW, headH, finaisNoCal, diaProc, diasGatilho }) {
    const { doc, M, W } = L; const w = W - 2 * M;
    const linhas = [];
    N.meds.forEach(m => {
      setF(doc, 'JostM', 8.3, C.ink); const nl = doc.splitTextToSize(m.nome, labW - 3).slice(0, 2);
      setF(doc, 'Jost', 6.7, C.gray); const dl = doc.splitTextToSize([m.dose, horaDe(m.horario), m.via.toLowerCase()].filter(Boolean).join(' · '), labW - 3).slice(0, 2);
      linhas.push({ tipo: 'med', m, nl, dl, h: Math.max(9.8, nl.length * 3.4 + dl.length * 2.9 + 3.6) });
    });
    if (!N.meds.length) for (let i = 0; i < 4; i++) linhas.push({ tipo: 'vazia', h: 10 });
    linhas.push({ tipo: 'final', h: 10.5 }, { tipo: 'us', h: 9.4 }, { tipo: 'sangue', h: 9.4 }, { tipo: 'vazia', h: 7.5 });
    const nFaixas = Math.ceil(N.dias / porFaixa);

    const celulaTexto = (t, cx, y, maxW, tamanhos) => {
      for (const tam of tamanhos) { setF(doc, 'JostM', tam, C.wine2); if (doc.getTextWidth(t) <= maxW) { doc.text(t, cx, y, { align: 'center' }); return; } }
      let s = t; while (s.length > 2 && doc.getTextWidth(s + '…') > maxW) s = s.slice(0, -1); doc.text(s + '…', cx, y, { align: 'center' });
    };
    for (let f = 0; f < nFaixas; f++) {
      const d0 = f * porFaixa + 1, d1 = Math.min(N.dias, d0 + porFaixa - 1);
      // a linha "reta final" só aparece na semana que tem gatilho/antibiótico
      const lns = linhas.filter(ln => ln.tipo !== 'final' || finaisNoCal.some(fi => { const d = N.diaDe(fi.d); return d >= d0 && d <= d1; }));
      const corpoH = lns.reduce((a, l) => a + l.h, 0);
      caber(L, 8 + headH + corpoH + 4);
      setF(doc, 'JostM', 7.2, C.goldDark);
      tracked(doc, (`Semana ${f + 1}` + (N.inicio ? `  ·  ${ddmm(somaDias(N.inicio, d0 - 1))} a ${ddmm(somaDias(N.inicio, d1 - 1))}` : '')).toUpperCase(), M, L.y + 3.6, 0.9);
      L.y += 6.5;
      const y0 = L.y, bh = headH + corpoH;
      for (let j = 0; j < porFaixa; j++) {
        const d = d0 + j; if (d > d1) break;
        const x = M + labW + j * colW;
        const ehProc = d === diaProc;
        doc.setFillColor(...(ehProc ? LV.cobreBg : (j % 2 ? LV.band2 : LV.band1))); doc.roundedRect(x + 0.7, y0, colW - 1.4, bh, 2.4, 2.4, 'F');
        if (ehProc) { doc.setFillColor(...C.wine); doc.roundedRect(x + 0.7, y0, colW - 1.4, headH - 1.2, 2.4, 2.4, 'F'); }
        const cx = x + colW / 2;
        setF(doc, 'JostM', 8.2, ehProc ? C.white : C.wine); doc.text(`Dia ${pad2(d)}`, cx, y0 + 5.1, { align: 'center' });
        const dt = N.inicio ? somaDias(N.inicio, d - 1) : null;
        setF(doc, 'Jost', 6.8, ehProc ? C.rose : C.gray); doc.text(dt ? `${SEM[dt.getDay()]} ${ddmm(dt)}` : '___/___', cx, y0 + 8.9, { align: 'center' });
        const tag = ehProc ? (clean((L.T.procedimento || {}).rotulo) || 'Procedimento') : diasGatilho.has(d) ? 'Gatilho' : '';
        if (tag) {
          setF(doc, 'JostM', 5.5, C.white); const t = tag.toUpperCase(); const tw = Math.min(colW - 2.4, doc.getTextWidth(t) + 0.45 * (t.length - 1) + 3.2);
          doc.setFillColor(...(ehProc ? C.gold : C.goldDark)); doc.roundedRect(cx - tw / 2, y0 + 10.4, tw, 3.7, 1.85, 1.85, 'F');
          tracked(doc, t, cx, y0 + 13.05, 0.45, { align: 'center' });
        }
      }
      setF(doc, 'JostM', 6.8, C.wine); tracked(doc, 'MEDICAÇÃO', M + 1, y0 + headH - 3.4, 0.9);
      let yy = y0 + headH;
      const sep = y => { doc.setDrawColor(...LV.linha); doc.setLineWidth(0.25); doc.line(M, y, W - M, y); };
      lns.forEach(ln => {
        sep(yy);
        const cel = d => ({ x: M + labW + (d - d0) * colW, cx: M + labW + (d - d0) * colW + colW / 2 });
        if (ln.tipo === 'med') {
          setF(doc, 'JostM', 8.3, C.ink); ln.nl.forEach((t, i) => doc.text(t, M + 1, yy + 4.6 + i * 3.5));
          setF(doc, 'Jost', 6.7, C.gray); ln.dl.forEach((t, i) => doc.text(t, M + 1, yy + 4.6 + ln.nl.length * 3.5 + i * 3));
          for (let d = Math.max(d0, ln.m.de); d <= Math.min(d1, ln.m.ate); d++) {
            const { cx } = cel(d); const pw = colW - 3.2, ph = 6.4, py = yy + ln.h / 2;
            doc.setFillColor(255, 255, 255); doc.setDrawColor(...C.rose); doc.setLineWidth(0.25); doc.roundedRect(cx - pw / 2, py - ph / 2, pw, ph, ph / 2, ph / 2, 'FD');
            const dose = abreviarDose(ln.m.dose);
            doc.setDrawColor(...C.mauve); doc.setLineWidth(0.25);
            if (dose) { doc.circle(cx - pw / 2 + 2.7, py, 1.25, 'S'); celulaTexto(dose, cx + 1.9, py + 1, pw - 6.2, [6.8, 6.1, 5.5]); }
            else doc.circle(cx, py, 1.5, 'S');
          }
        } else if (ln.tipo === 'us' || ln.tipo === 'sangue') {
          setF(doc, 'JostM', 6.9, C.wine2); tracked(doc, ln.tipo === 'us' ? 'ULTRASSOM' : 'EXAME DE SANGUE', M + 1, yy + ln.h / 2 + 1.1, 0.7);
          N.controles.filter(c => ln.tipo === 'us' ? c.us : c.sangue).forEach(c => {
            const d = N.diaDe(c.d); if (d == null || d < d0 || d > d1) return;
            const { cx } = cel(d);
            desenharIcone(doc, ln.tipo === 'us' ? 'ultrassom' : 'exames', cx, yy + 3.5, 4.4, C.wine2, 1.8);
            setF(doc, 'JostM', 6.4, C.wine2); doc.text(horaDe(c.hora) || 'agendar', cx, yy + 8, { align: 'center' });
          });
        } else if (ln.tipo === 'final') {
          setF(doc, 'JostM', 6.9, C.wine2); tracked(doc, 'RETA FINAL', M + 1, yy + ln.h / 2 + 1.1, 0.7);
          const porDia = {}; finaisNoCal.forEach(fi => { const d = N.diaDe(fi.d); (porDia[d] = porDia[d] || []).push(fi); });
          Object.keys(porDia).forEach(k => {
            const d = +k; if (d < d0 || d > d1) return; const { cx } = cel(d);
            porDia[d].slice(0, 2).forEach((fi, i, arr) => {
              const yb = yy + (arr.length === 1 ? 4.6 : 3.6 + i * 4.6);
              setF(doc, 'JostM', 6.2, C.wine2); celulaTexto(`${horaDe(fi.hora) || '__h__'} ${fi.med.split(/[\s(]/)[0]}`, cx, yb, colW - 2, [6.2, 5.6, 5.2]);
              if (arr.length === 1) { setF(doc, 'Jost', 5.8, C.gray); doc.text(doc.splitTextToSize(fi.med.split(/[\s(]/).slice(1).join(' ').replace(/\).*$/, ''), colW - 2)[0] || '', cx, yb + 3.6, { align: 'center' }); }
            });
          });
        }
        yy += ln.h;
      });
      sep(yy);
      L.y = y0 + bh + 6;
    }
  }

  /* ---------- calendário numa folha só ---------- */
  // uma linha/coluna por medicação (doses diferentes do mesmo remédio ficam juntas, dia a dia)
  function medsAgrupadas(N) {
    const grupos = [];
    N.meds.forEach(m => {
      const k = m.nome.toLowerCase(); let g = grupos.find(x => x.k === k);
      if (!g) grupos.push(g = { k, nome: m.nome, via: m.via, horarios: [], doses: {}, todas: [] });
      for (let d = m.de; d <= m.ate; d++) g.doses[d] = m.dose;
      if (m.horario && !g.horarios.includes(m.horario)) g.horarios.push(m.horario);
      if (!g.todas.includes(m.dose)) g.todas.push(m.dose);
      if (!g.via) g.via = m.via;
    });
    grupos.forEach(g => { g.detalhe = [g.todas.length > 1 ? 'dose varia' : g.todas[0], g.horarios.map(horaDe).join(' e '), (g.via || '').toLowerCase()].filter(Boolean).join(' · '); });
    return grupos;
  }
  function textoCabe(doc, t, x, y, maxW, tamanhos, fam = 'JostM', cor = C.wine2, align = 'center') {
    for (const tam of tamanhos) { setF(doc, fam, tam, cor); if (doc.getTextWidth(t) <= maxW) { doc.text(t, x, y, { align }); return; } }
    let s = t; while (s.length > 2 && doc.getTextWidth(s + '…') > maxW) s = s.slice(0, -1); doc.text(s + '…', x, y, { align });
  }
  // dose do dia: pílula com o círculo para marcar
  function pilulaDose(doc, cx, cy, pw, dose) {
    const ph = 6.2; const t = abreviarDose(dose);
    doc.setFillColor(255, 255, 255); doc.setDrawColor(...C.rose); doc.setLineWidth(0.25); doc.roundedRect(cx - pw / 2, cy - ph / 2, pw, ph, ph / 2, ph / 2, 'FD');
    doc.setDrawColor(...C.mauve); doc.setLineWidth(0.25);
    if (t && pw >= 10) { doc.circle(cx - pw / 2 + 2.3, cy, 1.05, 'S'); textoCabe(doc, t, cx + 1.55, cy + 0.95, pw - 4.9, [6.6, 6, 5.4]); }
    else doc.circle(cx, cy, 1.45, 'S');
  }
  function etiqueta(doc, t, cx, y, maxW, fundo) {
    setF(doc, 'JostM', 5.4, C.white); const s = t.toUpperCase(); const tw = Math.min(maxW, doc.getTextWidth(s) + 0.4 * (s.length - 1) + 3);
    doc.setFillColor(...fundo); doc.roundedRect(cx - tw / 2, y, tw, 3.6, 1.8, 1.8, 'F'); tracked(doc, s, cx, y + 2.6, 0.4, { align: 'center' });
  }
  const cabePaisagem = N => N.dias <= 18;
  const alturaLinhas = N => 46 + 16 + N.dias * 10 + 4;
  const cabeLinhas = N => N.dias <= 24;

  // A) Folha deitada: todos os dias lado a lado, as medicações em linhas
  function calendarioPaisagem(L, N) {
    const { doc } = L; const ret = { W: L.W, H: L.H, bottom: L.bottom };
    doc.addPage('a4', 'landscape'); Object.assign(L, { W: 297, H: 210, bottom: 210 - 17 }); cabecalhoLivro(L);
    const { W, M } = L; const w = W - 2 * M; let y = L.top - 1;
    setF(doc, 'CormI', 23, C.wine); doc.text('Seu calendário de medicações', M, y + 7);
    setF(doc, 'Jost', 8.4, C.gray); doc.text(N.inicio ? 'Marque o círculo a cada aplicação feita. Aplique sempre no mesmo horário e traga este livreto aos controles.' : 'Preencha as datas a partir do Dia 01 e marque o círculo a cada aplicação feita.', M, y + 12.4);
    const p = L.paciente; const nome = clean(p.nome_social) || clean(p.nome) || '';
    setF(doc, 'CormSB', 13.5, C.ink); doc.text(nome, W - M, y + 6.4, { align: 'right' });
    setF(doc, 'Jost', 8, C.gray); doc.text([N.protocolo, N.inicio ? `Dia 01: ${diaCurto(N.inicio)}/${N.inicio.getFullYear()}` : '', N.nhc ? `Prontuário ${N.nhc}` : ''].filter(Boolean).join('  ·  '), W - M, y + 11.6, { align: 'right' });
    y += 17;
    const { finaisNoCal, diaProc, diasGatilho } = marcosCalendario(N);
    const grupos = medsAgrupadas(N);
    const labW = 38, colW = (w - labW) / N.dias, headH = 15;
    const linhas = grupos.map(g => {
      setF(doc, 'JostM', 8.2, C.ink); const nl = doc.splitTextToSize(g.nome, labW - 3).slice(0, 2);
      setF(doc, 'Jost', 6.5, C.gray); const dl = doc.splitTextToSize(g.detalhe, labW - 3).slice(0, 2);
      return { tipo: 'med', g, nl, dl, h: Math.max(9.6, nl.length * 3.3 + dl.length * 2.8 + 3.4) };
    });
    if (!grupos.length) for (let i = 0; i < 4; i++) linhas.push({ tipo: 'vazia', h: 10 });
    if (finaisNoCal.length) linhas.push({ tipo: 'final', h: 10.5 });
    linhas.push({ tipo: 'us', h: 9.2 }, { tipo: 'sangue', h: 9.2 }, { tipo: 'vazia', h: 8 });
    // os próximos controles sempre entram embaixo da tabela; as linhas se ajustam ao espaço que sobra
    const faixaH = 28; let corpo = linhas.reduce((a, l) => a + l.h, 0);
    const livre = L.bottom - y - headH - 2 - faixaH;
    const f = Math.min(1.3, livre / corpo); linhas.forEach(l => { l.h *= f; }); corpo *= f;
    const bh = headH + corpo;
    for (let d = 1; d <= N.dias; d++) {
      const x = M + labW + (d - 1) * colW, cx = x + colW / 2, ehProc = d === diaProc;
      doc.setFillColor(...(ehProc ? LV.cobreBg : (d % 2 ? LV.band1 : LV.band2))); doc.roundedRect(x + 0.5, y, colW - 1, bh, 2.2, 2.2, 'F');
      if (ehProc) { doc.setFillColor(...C.wine); doc.roundedRect(x + 0.5, y, colW - 1, headH - 1, 2.2, 2.2, 'F'); }
      setF(doc, 'JostM', 7.8, ehProc ? C.white : C.wine); doc.text(`Dia ${pad2(d)}`, cx, y + 4.9, { align: 'center' });
      const dt = N.inicio ? somaDias(N.inicio, d - 1) : null;
      textoCabe(doc, dt ? `${SEM[dt.getDay()]} ${ddmm(dt)}` : '___/___', cx, y + 8.6, colW - 1.6, [6.5, 5.9], 'Jost', ehProc ? C.rose : C.gray);
      const tag = ehProc ? (clean((L.T.procedimento || {}).rotulo) || 'Procedimento') : diasGatilho.has(d) ? 'Gatilho' : '';
      if (tag) etiqueta(doc, tag, cx, y + 10, colW - 1.8, ehProc ? C.gold : C.goldDark);
    }
    setF(doc, 'JostM', 6.6, C.wine); tracked(doc, 'MEDICAÇÃO', M + 1, y + headH - 3.2, 0.9);
    let yy = y + headH;
    const sep = yl => { doc.setDrawColor(...LV.linha); doc.setLineWidth(0.25); doc.line(M, yl, W - M, yl); };
    const cxDia = d => M + labW + (d - 1) * colW + colW / 2;
    const porDia = {}; finaisNoCal.forEach(fi => { const d = N.diaDe(fi.d); (porDia[d] = porDia[d] || []).push(fi); });
    linhas.forEach(ln => {
      sep(yy); const meio = yy + ln.h / 2;
      if (ln.tipo === 'med') {
        const t0 = meio - (ln.nl.length * 3.3 + ln.dl.length * 2.8) / 2 + 2.6;
        setF(doc, 'JostM', 8.2, C.ink); ln.nl.forEach((t, i) => doc.text(t, M + 1, t0 + i * 3.3));
        setF(doc, 'Jost', 6.5, C.gray); ln.dl.forEach((t, i) => doc.text(t, M + 1, t0 + ln.nl.length * 3.3 + i * 2.8));
        for (let d = 1; d <= N.dias; d++) if (ln.g.doses[d] !== undefined) pilulaDose(doc, cxDia(d), meio, Math.min(colW - 2.4, 17), ln.g.doses[d]);
      } else if (ln.tipo === 'us' || ln.tipo === 'sangue') {
        setF(doc, 'JostM', 6.6, C.wine2); tracked(doc, ln.tipo === 'us' ? 'ULTRASSOM' : 'EXAME DE SANGUE', M + 1, meio + 1, 0.6);
        N.controles.filter(c => ln.tipo === 'us' ? c.us : c.sangue).forEach(c => {
          const d = N.diaDe(c.d); if (d == null || d < 1 || d > N.dias) return;
          desenharIcone(doc, ln.tipo === 'us' ? 'ultrassom' : 'exames', cxDia(d), meio - 1.6, 4.2, C.wine2, 1.8);
          setF(doc, 'JostM', 6.1, C.wine2); doc.text(horaDe(c.hora) || '', cxDia(d), meio + 3.4, { align: 'center' });
        });
      } else if (ln.tipo === 'final') {
        setF(doc, 'JostM', 6.6, C.wine2); tracked(doc, 'RETA FINAL', M + 1, meio + 1, 0.6);
        Object.keys(porDia).forEach(k => {
          const d = +k, arr = porDia[d].slice(0, 2);
          arr.forEach((fi, i) => textoCabe(doc, `${horaDe(fi.hora) || '__h__'} ${fi.med.split(/[\s(]/)[0]}`, cxDia(d), meio + (arr.length === 1 ? 1 : -1 + i * 3.8), colW - 1.4, [5.9, 5.4, 5]));
        });
      }
      yy += ln.h;
    });
    sep(yy);
    controlesFaixa(L, N, M, yy + 6, w);
    Object.assign(L, ret); L.y = L.bottom + 1; // o que vem depois começa numa página em pé
  }

  // próximos controles em uma faixa de 6 quadros (folha deitada)
  function controlesFaixa(L, N, x, y, w) {
    const { doc } = L; const n = 6, gap = 3, bw = (w - gap * (n - 1)) / n, h = 16;
    setF(doc, 'JostM', 7, C.goldDark); tracked(doc, 'PRÓXIMOS CONTROLES', x, y + 2.6, 1);
    y += 5;
    for (let i = 0; i < n; i++) {
      const bx = x + i * (bw + gap), c = N.controles[i];
      doc.setFillColor(...C.blush); doc.setDrawColor(...C.blush2); doc.setLineWidth(0.3); doc.roundedRect(bx, y, bw, h, 2.4, 2.4, 'FD');
      doc.setFillColor(...C.gold); doc.circle(bx + 5, y + 5.4, 2.4, 'F');
      setF(doc, 'JostM', 6.3, C.white); doc.text(pad2(i + 1), bx + 5, y + 6.3, { align: 'center' });
      if (c) {
        textoCabe(doc, `${diaCurto(c.d)}${c.hora ? ' · ' + horaDe(c.hora) : ''}`, bx + 9, y + 6.5, bw - 10.5, [8.2, 7.4, 6.8], 'JostM', C.ink, 'left');
        const o = [c.us ? 'ultrassom' : '', c.sangue ? 'exame de sangue' : ''].filter(Boolean).join(' e ');
        if (o) textoCabe(doc, o, bx + 9, y + 11.6, bw - 10.5, [7, 6.4, 5.8], 'Jost', C.gray, 'left');
      } else {
        doc.setDrawColor(...C.rose); doc.setLineWidth(0.25);
        setF(doc, 'Jost', 7, C.gray); doc.text('/', bx + 16.3, y + 6.5); doc.text('às', bx + 23.5, y + 6.5); doc.text('h', bx + 33.4, y + 6.5);
        doc.line(bx + 9, y + 7.1, bx + 15.6, y + 7.1); doc.line(bx + 17.6, y + 7.1, bx + 22.6, y + 7.1); doc.line(bx + 27, y + 7.1, bx + 32.6, y + 7.1); doc.line(bx + 35, y + 7.1, bx + Math.min(bw - 2, 40), y + 7.1);
        doc.line(bx + 9, y + 12.4, bx + bw - 3, y + 12.4);
      }
    }
  }
  const viaCurta = v => ({ 'subcutânea': 'subcut.', 'subcutâneo': 'subcut.', intramuscular: 'IM', 'transdérmica': 'transd.' }[String(v || '').toLowerCase()] || String(v || '').toLowerCase());

  // B) Folha em pé: um dia por linha, as medicações em colunas
  function calendarioLinhas(L, N) {
    const { doc, M, W } = L; const w = W - 2 * M;
    if (L.y > L.top + 1 && L.y + 10 + alturaLinhas(N) > L.bottom) novaPagina(L); else if (L.y > L.top + 1) L.y += 10;
    topoCalendario(L, N);
    const { finaisNoCal, diaProc, diasGatilho } = marcosCalendario(N);
    const grupos = medsAgrupadas(N);
    const cols = [{ tipo: 'dia', w: 27 }];
    const medsCols = grupos.length ? grupos.map(g => ({ tipo: 'med', g })) : [0, 1, 2].map(() => ({ tipo: 'medvazia' }));
    const fixos = 27 + 17 + 17 + (finaisNoCal.length ? 25 : 0);
    let medW = Math.min(26, Math.max(16, (w - fixos - 22) / medsCols.length));
    let notasW = w - fixos - medW * medsCols.length;
    if (notasW < 14) { medW = (w - fixos - 14) / medsCols.length; notasW = 14; }
    medsCols.forEach(c => { c.w = medW; cols.push(c); });
    if (finaisNoCal.length) cols.push({ tipo: 'final', w: 25 });
    cols.push({ tipo: 'us', w: 17 }, { tipo: 'sangue', w: 17 }, { tipo: 'notas', w: notasW });
    let x = M; cols.forEach(c => { c.x = x; c.cx = x + c.w / 2; x += c.w; });
    const headH = 18, y0 = L.y;
    const rowH = Math.max(8, Math.min(11.5, (L.bottom - y0 - headH - 3) / N.dias));
    // cabeçalho das colunas
    cols.forEach(c => {
      const cab = (l1, l2) => { setF(doc, 'JostM', 6.3, C.wine); tracked(doc, l1, c.cx, y0 + (l2 ? 10.2 : 13.4), 0.4, { align: 'center' }); if (l2) tracked(doc, l2, c.cx, y0 + 13.4, 0.4, { align: 'center' }); };
      if (c.tipo === 'dia') { setF(doc, 'JostM', 6.3, C.wine); tracked(doc, 'DIA', c.x + 2, y0 + 13.4, 0.9); }
      else if (c.tipo === 'med') {
        setF(doc, 'JostM', 8, C.ink); const nl = doc.splitTextToSize(c.g.nome, c.w - 2).slice(0, 2);
        nl.forEach((t, i) => doc.text(t, c.cx, y0 + (nl.length === 1 ? 6.2 : 3.6) + i * 3.2, { align: 'center' }));
        textoCabe(doc, c.g.todas.length > 1 ? 'dose varia' : (c.g.todas[0] || ''), c.cx, y0 + 10.4, c.w - 1.6, [6.4, 5.8, 5.3], 'JostM', C.wine2);
        textoCabe(doc, [c.g.horarios.map(horaDe).join(' e '), viaCurta(c.g.via)].filter(Boolean).join(' · '), c.cx, y0 + 13.6, c.w - 1.6, [6, 5.5, 5], 'Jost', C.gray);
      } else if (c.tipo === 'medvazia') { doc.setDrawColor(...C.rose); doc.setLineWidth(0.25); doc.line(c.x + 2.5, y0 + 13.4, c.x + c.w - 2.5, y0 + 13.4); }
      else if (c.tipo === 'final') cab('RETA', 'FINAL');
      else if (c.tipo === 'us') cab('ULTRASSOM');
      else if (c.tipo === 'sangue') cab('EXAME DE', 'SANGUE');
      else cab('ANOTAÇÕES');
    });
    doc.setDrawColor(...C.wine); doc.setLineWidth(0.5); doc.line(M, y0 + headH - 1, W - M, y0 + headH - 1);
    const porDia = {}; finaisNoCal.forEach(fi => { const d = N.diaDe(fi.d); (porDia[d] = porDia[d] || []).push(fi); });
    let yy = y0 + headH;
    for (let d = 1; d <= N.dias; d++) {
      const ehProc = d === diaProc, meio = yy + rowH / 2;
      doc.setFillColor(...(ehProc ? LV.cobreBg : (d % 2 ? LV.band1 : [255, 255, 255]))); doc.roundedRect(M, yy + 0.3, w, rowH - 0.6, 2, 2, 'F');
      if (ehProc) { doc.setFillColor(...C.wine); doc.roundedRect(M, yy + 0.3, 27, rowH - 0.6, 2, 2, 'F'); }
      // dia: número, data e etiqueta (gatilho / procedimento)
      const dt = N.inicio ? somaDias(N.inicio, d - 1) : null;
      setF(doc, 'JostM', 8.4, ehProc ? C.white : C.wine); doc.text(`Dia ${pad2(d)}`, M + 2.2, meio - 0.3);
      setF(doc, 'Jost', 6.6, ehProc ? C.rose : C.gray); doc.text(dt ? diaCurto(dt) : '___/___', M + 2.2, meio + 3);
      const tag = ehProc ? (clean((L.T.procedimento || {}).rotulo) || 'Procedimento') : diasGatilho.has(d) ? 'Gatilho' : '';
      if (tag) etiqueta(doc, tag, M + 20.5, meio - 3.3, 12, ehProc ? C.gold : C.goldDark);
      cols.forEach(c => {
        if (c.tipo === 'med' && c.g.doses[d] !== undefined) pilulaDose(doc, c.cx, meio, Math.min(c.w - 3, 18), c.g.doses[d]);
        else if (c.tipo === 'us' || c.tipo === 'sangue') {
          const ct = N.controles.find(k => N.diaDe(k.d) === d && (c.tipo === 'us' ? k.us : k.sangue)); if (!ct) return;
          desenharIcone(doc, c.tipo === 'us' ? 'ultrassom' : 'exames', c.cx - 4.2, meio, 4, C.wine2, 1.8);
          setF(doc, 'JostM', 6.2, C.wine2); doc.text(horaDe(ct.hora) || '', c.cx - 1.6, meio + 1);
        } else if (c.tipo === 'final' && porDia[d]) {
          const arr = porDia[d].slice(0, 2);
          arr.forEach((fi, i) => textoCabe(doc, `${horaDe(fi.hora) || '__h__'} ${fi.med.split(/[\s(]/)[0]}`, c.cx, meio + (arr.length === 1 ? 1 : -1.2 + i * 3.6), c.w - 1.6, [6.2, 5.6, 5.1]));
        }
      });
      // divisórias das colunas
      doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.6);
      cols.slice(1).forEach(c => doc.line(c.x, yy + 0.3, c.x, yy + rowH - 0.3));
      yy += rowH;
    }
    L.y = yy + 6;
  }

  // Medicações compradas (para a paciente anotar) e próximos controles
  function controlesLivro(L, N) {
    const { doc, M, W } = L; const gap = 5; const so = !!L.controlesNaFolha; const cw = so ? W - 2 * M : (W - 2 * M - gap) / 2; const h = so ? 58 : 64;
    caber(L, h + 4);
    const y = L.y;
    (so ? [[M, 'Medicações compradas']] : [[M, 'Medicações compradas'], [M + cw + gap, 'Próximos controles']]).forEach(([x, t]) => {
      doc.setFillColor(...C.blush); doc.setDrawColor(...C.blush2); doc.setLineWidth(0.35); doc.roundedRect(x, y, cw, h, 3.5, 3.5, 'FD');
      setF(doc, 'CormSB', 13, C.wine); doc.text(t, x + 5, y + 8.4);
    });
    // compradas: linhas em branco
    doc.setDrawColor(...C.rose); doc.setLineWidth(0.25);
    for (let i = 0; i < 5; i++) {
      const yl = y + 19 + i * 9.4;
      setF(doc, 'Jost', 7.4, C.gray); doc.text('Data', M + 5, yl); doc.text('Medicação', M + 30, yl);
      doc.line(M + 11.5, yl + 0.6, M + 27, yl + 0.6); doc.line(M + 43, yl + 0.6, M + cw - 5, yl + 0.6);
    }
    // controles: até 6, numerados
    const x2 = M + cw + gap;
    for (let i = 0; i < (so ? 0 : 6); i++) {
      const yl = y + 18.5 + i * 7.6; const c = N.controles[i];
      doc.setFillColor(...C.gold); doc.circle(x2 + 7.2, yl - 1.2, 2.5, 'F');
      setF(doc, 'JostM', 6.6, C.white); doc.text(pad2(i + 1), x2 + 7.2, yl - 0.25, { align: 'center' });
      if (c) {
        setF(doc, 'JostM', 8.8, C.ink); const a = `${diaCurto(c.d)}${c.hora ? ' · ' + horaDe(c.hora) : ''}`; doc.text(a, x2 + 12, yl);
        const o = [c.us ? 'ultrassom' : '', c.sangue ? 'exame de sangue' : ''].filter(Boolean).join(' e ');
        if (o) { const aw = doc.getTextWidth(a); setF(doc, 'Jost', 7.6, C.gray); doc.text(doc.splitTextToSize(o, cw - 17 - aw)[0] || '', x2 + 14 + aw, yl); }
      } else {
        doc.setDrawColor(...C.rose); doc.setLineWidth(0.25);
        setF(doc, 'Jost', 7.4, C.gray); doc.text('/', x2 + 20.5, yl); doc.text('às', x2 + 33, yl); doc.text('h', x2 + 47.5, yl);
        doc.line(x2 + 12, yl + 0.6, x2 + 19.5, yl + 0.6); doc.line(x2 + 22, yl + 0.6, x2 + 30, yl + 0.6); doc.line(x2 + 38, yl + 0.6, x2 + 46.5, yl + 0.6); doc.line(x2 + 50, yl + 0.6, x2 + 56, yl + 0.6);
      }
    }
    L.y = y + h + 6;
  }

  // Dúvidas e contatos (com o recado da médica, se houver)
  function contatosLivro(L, N) {
    const { doc, M, W } = L; const T = L.T; const k = T.contatos || {}; const cl = L.clinica; const w = W - 2 * M;
    if (N.obs) {
      fluir(L, [{
        medir() { setF(doc, 'Jost', 9.6, C.ink); this.ls = doc.splitTextToSize(N.obs, w - 14); return this.ls.length * 4.6 + 14; },
        desenhar(ctx, x, y) {
          const h = this.ls.length * 4.6 + 10.5;
          doc.setFillColor(...C.blush2); doc.roundedRect(x, y, w, h, 3, 3, 'F'); doc.setFillColor(...C.gold); doc.roundedRect(x, y, 1.4, h, 0.7, 0.7, 'F');
          setF(doc, 'JostM', 6.8, C.goldDark); tracked(doc, `RECADO DE ${L.medico.nomeCompleto.toUpperCase()}`, x + 6, y + 5.8, 0.8);
          setF(doc, 'Jost', 9.6, C.ink); this.ls.forEach((t, i) => doc.text(t, x + 6, y + 11 + i * 4.6));
        }
      }]);
    }
    const itens = [
      ['telefone', 'Clínica', clean(k.clinica_tel) || clean(cl.telefone), clean(k.clinica_horario)],
      ['mensagem', 'WhatsApp da equipe', clean(k.whatsapp), clean(k.whatsapp_horario)],
      ['alarme', 'Fora do horário', clean(k.emergencia_tel), clean(k.emergencia_horario)],
      ['email', 'Envio de exames', clean(k.email_exames) || clean(cl.email), '']
    ].filter(i => i[2]);
    const lemb = clean(T.lembretes);
    if (!itens.length && !lemb && !clean(k.obs)) return;
    const cw = (w - 4) / 2;
    setF(doc, 'Jost', 9, C.ink); const ll = lemb ? doc.splitTextToSize(lemb, w - 12) : [];
    setF(doc, 'Jost', 8.4, C.gray); const ol = clean(k.obs) ? doc.splitTextToSize(clean(k.obs), w - 12) : [];
    const linhasItens = Math.ceil(itens.length / 2);
    const h = 12 + ll.length * 4.3 + (ll.length ? 3 : 0) + linhasItens * 13 + (ol.length ? ol.length * 3.9 + 4 : 0) + 3;
    caber(L, h + 4);
    const y = L.y;
    doc.setDrawColor(...C.rose); doc.setLineWidth(0.4); doc.setFillColor(255, 255, 255); doc.roundedRect(M, y, w, h, 4, 4, 'FD');
    setF(doc, 'CormSB', 14, C.wine); doc.text('Dúvidas, dor ou sangramento?', M + 6, y + 8.8);
    let yy = y + 14;
    setF(doc, 'Jost', 9, C.ink); ll.forEach((t, i) => doc.text(t, M + 6, yy + i * 4.3)); yy += ll.length * 4.3 + (ll.length ? 2 : 0);
    itens.forEach(([ic, rot, val, hor], i) => {
      const x = M + 6 + (i % 2) * cw, yi = yy + Math.floor(i / 2) * 13;
      doc.setFillColor(...C.blush2); doc.circle(x + 4.6, yi + 4.4, 4.6, 'F');
      desenharIcone(doc, ic, x + 4.6, yi + 4.4, 5.8, C.wine2, 1.8);
      setF(doc, 'JostM', 6.4, C.mauve); tracked(doc, rot.toUpperCase(), x + 11.5, yi + 2.4, 0.7);
      setF(doc, 'JostM', 9.8, C.ink); doc.text(doc.splitTextToSize(val, cw - 16)[0], x + 11.5, yi + 6.6);
      if (hor) { setF(doc, 'Jost', 7.2, C.gray); doc.text(doc.splitTextToSize(hor, cw - 16)[0], x + 11.5, yi + 10.2); }
    });
    yy += linhasItens * 13;
    if (ol.length) { setF(doc, 'Jost', 8.4, C.gray); ol.forEach((t, i) => doc.text(t, M + 6, yy + 2 + i * 3.9)); }
    L.y = y + h + 6;
  }

  // Reta final, data do procedimento e jejum
  function procedimentoLivro(L, N) {
    const { doc, M, W } = L; const P = L.T.procedimento || {}; const w = W - 2 * M;
    const semTokens = t => resolverDatas(t, N.proc).replace(TOKENS_DATA, '____');
    novaPagina(L);
    tituloPagina(L, clean(P.titulo) || 'Procedimento');
    if (clean(P.preparo)) { rotuloSecao(L, 'Preparo'); fluir(L, [blocoTexto(semTokens(P.preparo), { tam: 9.8, lh: 4.8 })]); }
    if (clean(P.alerta)) {
      fluir(L, [blocoEspaco(1.5), {
        medir() { setF(doc, 'Jost', 9.4, C.ink); this.ls = doc.splitTextToSize(clean(P.alerta), w - 22); return this.ls.length * 4.5 + 9.5; },
        desenhar(ctx, x, y) {
          const h = this.ls.length * 4.5 + 6.5;
          doc.setFillColor(...LV.cobreBg); doc.roundedRect(x, y, w, h, 3, 3, 'F');
          desenharIcone(doc, 'alarme', x + 8, y + h / 2, 7.4, C.goldDark, 1.7);
          setF(doc, 'Jost', 9.4, C.ink); this.ls.forEach((t, i) => doc.text(t, x + 16, y + 5.6 + i * 4.5));
        }
      }]);
    }
    if (N.final.length) {
      rotuloSecao(L, 'Medicações da reta final');
      const grupos = []; N.final.forEach(f => { const k = f.d ? f.d.toDateString() : '?'; let g = grupos.find(x => x.k === k); if (!g) grupos.push(g = { k, d: f.d, itens: [] }); g.itens.push(f); });
      grupos.forEach(g => {
        const chipW = 31, rx = M + chipW + 3, rw = w - chipW - 3;
        const rows = g.itens.map(f => { setF(doc, 'JostM', 9.6, C.ink); const ml = doc.splitTextToSize(f.med + (f.via ? ` — via ${f.via.toLowerCase()}` : ''), rw - 26); return { f, ml, h: Math.max(9.6, ml.length * 4.3 + 4.6) }; });
        const gh = Math.max(19, rows.reduce((a, r) => a + r.h + 1.6, -1.6));
        caber(L, gh + 5);
        const y = L.y;
        doc.setFillColor(...C.wine); doc.roundedRect(M, y, chipW, gh, 3, 3, 'F');
        setF(doc, 'JostM', 6.4, C.rose); tracked(doc, 'NO DIA', M + chipW / 2, y + gh / 2 - 3.4, 1, { align: 'center' });
        setF(doc, 'JostM', 11.5, C.white); doc.text(g.d ? diaCurto(g.d) : '___/___', M + chipW / 2, y + gh / 2 + 2.4, { align: 'center' });
        if (g.d) { setF(doc, 'Jost', 6.8, C.rose); doc.text(String(g.d.getFullYear()), M + chipW / 2, y + gh / 2 + 6.4, { align: 'center' }); }
        let yy = y;
        rows.forEach((r, i) => {
          doc.setFillColor(...(i % 2 ? LV.cobreBg : LV.salviaBg)); doc.roundedRect(rx, yy, rw, r.h, 2.4, 2.4, 'F');
          setF(doc, 'JostM', 9.4, C.wine2); doc.text(r.f.hora ? `Às ${horaDe(r.f.hora)}` : 'Às ___h___', rx + 4, yy + 5.9);
          setF(doc, 'JostM', 9.6, C.ink); r.ml.forEach((t, k2) => doc.text(t, rx + 24, yy + 5.9 + k2 * 4.3));
          yy += r.h + 1.6;
        });
        L.y = y + gh + 4;
      });
    }
    // o procedimento em destaque
    const rot = clean(P.rotulo) || 'Procedimento';
    const ant = parseInt(P.antecedencia, 10) || 0;
    caber(L, 30);
    const y = L.y + 2, h = 24;
    doc.setFillColor(...C.wine); doc.roundedRect(M, y, w, h, 4, 4, 'F');
    doc.setDrawColor(...C.rose); doc.setLineWidth(0.5); doc.circle(M + 13, y + h / 2, 8, 'S');
    desenharIcone(doc, iconeDe(rot + ' ' + (P.titulo || ''), 'calendario'), M + 13, y + h / 2, 10, C.white, 1.6);
    setF(doc, 'JostM', 7, C.rose); tracked(doc, rot.toUpperCase(), M + 26, y + 7.4, 1.1);
    if (N.proc) {
      // data em Cormorant; horário em Jost (os números da Cormorant parecem letras: "o8hoo")
      setF(doc, 'CormSB', 18, C.white); const dl = diaLongo(N.proc); doc.text(dl, M + 26, y + 15);
      if (N.procHora) { const dw = doc.getTextWidth(dl); setF(doc, 'JostM', 13, C.white); doc.text(`  ·  ${horaDe(N.procHora)}`, M + 26 + dw, y + 15); }
      if (N.procHora && ant) { const ch = new Date(N.proc.getTime() - ant * 60000); setF(doc, 'Jost', 8.8, [246, 220, 228]); doc.text(`Chegue às ${horaCurta(ch)} (${ant} minutos antes) com um documento com foto.`, M + 26, y + 20.4); }
    } else {
      setF(doc, 'Jost', 10, C.white); doc.text('Dia  ____/____/______   às  ____h____', M + 26, y + 15.5);
    }
    L.y = y + h + 6;
    if (clean(P.jejum)) {
      fluir(L, [{
        medir() { setF(doc, 'Jost', 9.6, C.ink); this.ls = doc.splitTextToSize(semTokens(P.jejum), w - 26); return this.ls.length * 4.6 + 16; },
        desenhar(ctx, x, y2) {
          const hh = this.ls.length * 4.6 + 12.5;
          doc.setFillColor(...C.blush); doc.setDrawColor(...C.rose); doc.setLineWidth(0.35); doc.roundedRect(x, y2, w, hh, 3.5, 3.5, 'FD');
          doc.setFillColor(255, 255, 255); doc.circle(x + 11, y2 + hh / 2, 7, 'F'); desenharIcone(doc, 'jejum', x + 11, y2 + hh / 2, 8.8, C.wine2, 1.6);
          setF(doc, 'JostM', 8, C.wine); tracked(doc, 'JEJUM ABSOLUTO', x + 22, y2 + 6.8, 1);
          setF(doc, 'Jost', 9.6, C.ink); this.ls.forEach((t, i) => doc.text(t, x + 22, y2 + 12 + i * 4.6));
        }
      }]);
    }
    if (clean(P.dia)) {
      L.y += 4;
      tituloPagina(L, clean(P.dia_titulo) || 'No dia do procedimento');
      fluir(L, blocosFolheto(semTokens(P.dia)));
    }
  }

  function encerramentoLivro(L) {
    const { doc, W } = L; const A = window.ASSETS.img; const t = clean(L.T.encerramento);
    setF(doc, 'CormI', 13.5, C.wine2); const ls = t ? doc.splitTextToSize(t, 130) : [];
    const lw = 14, lh = lw * 76 / 114;
    const h = 34 + ls.length * 5.6;
    // sem espaço para o fecho completo: tenta sem a flor antes de abrir uma página só para ele
    const comFlor = L.y + h + 6 <= L.bottom || L.y + h + 6 - (lh + 6) > L.bottom;
    caber(L, (comFlor ? h : h - lh - 6) + 6);
    let y = L.y + 6;
    if (comFlor) { doc.addImage(A['logo-lotus'], 'PNG', (W - lw) / 2, y, lw, lh, 'lotus', 'SLOW'); y += lh + 6; } else y += 2;
    setF(doc, 'CormI', 13.5, C.wine2); ls.forEach(s => { doc.text(s, W / 2, y, { align: 'center' }); y += 5.6; });
    setF(doc, 'Ital', 17, C.wine); doc.text(L.medico.nomeCompleto, W / 2, y + 4, { align: 'center' });
    const m = L.medico; const cred = [m.especialidade, m.crm ? `CRM-${m.crm_uf || ''} ${m.crm}` : '', m.rqe ? `RQE ${m.rqe}` : ''].filter(Boolean).join('  ·  ');
    setF(doc, 'Jost', 7.8, C.gray); doc.text(cred, W / 2, y + 9.2, { align: 'center' });
    L.y = y + 14;
  }

  function gerarLivreto(dados) {
    const { jsPDF } = window.jspdf;
    const data = dados.data instanceof Date ? dados.data : new Date(dados.data || Date.now());
    const medico = medicoDe(dados.medico);
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    registrarFontes(doc);
    const T = dados.livreto || {};
    const paciente = dados.paciente || {};
    const primeiro = (clean(paciente.nome_social) || clean(paciente.nome)).split(/\s+/)[0] || '';
    const vars = t => clean(t).replace(/\{\s*paciente\s*\}/gi, primeiro).replace(/\{\s*medica\s*\}/gi, medico.nomeCompleto);
    const Tv = Object.assign({}, T, { boas_vindas: vars(T.boas_vindas), encerramento: vars(T.encerramento), lembretes: vars(T.lembretes) });
    doc.setProperties({ title: `${clean(T.titulo) || 'Jornada do tratamento'} — ${clean(paciente.nome)}`, author: medico.nomeCompleto, creator: 'Consultório Dra. Ana Paula Vianna' });
    const cl = dados.clinica || {};
    const L = {
      doc, g: geometria('A4'), W: 210, H: 297, M: 17, top: 29, bottom: 297 - 19, y: 29,
      medico, clinica: cl, paciente, T: Tv, tituloCorrido: clean(T.titulo) || 'Jornada do tratamento',
      rodape: [clean(paciente.nome) ? `Livreto de ${clean(paciente.nome)}` : '', clean(cl.nome), clean((T.contatos || {}).clinica_tel) || clean(cl.telefone) ? `Tel. ${clean((T.contatos || {}).clinica_tel) || clean(cl.telefone)}` : ''].filter(Boolean).join('  ·  ')
    };
    const N = normalizarCiclo(dados.ciclo);
    const avisos = [];
    if (!N.inicio) avisos.push('Sem a data de início (Dia 01), o calendário sai com as datas em branco, para preencher à mão.');
    if (!N.meds.length) avisos.push('Nenhuma medicação no ciclo: o calendário sai com as linhas em branco, para preencher à mão.');
    if (N.final.some(f => !f.d)) avisos.push('Há medicação da reta final sem data: ela sai com o dia em branco.');

    capaLivro(L, N);
    novaPagina(L);
    tituloPagina(L, clean(Tv.boas_vindas_titulo) || 'Que bom caminhar com você');
    if (Tv.boas_vindas) fluir(L, [blocoTexto(Tv.boas_vindas, { tam: 10.4, lh: 5.3 })]);
    const etapas = clean(T.etapas).split('\n').map(s => s.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim()).filter(Boolean);
    if (etapas.length) { rotuloSecao(L, 'As etapas do seu ciclo'); L.y += 2; etapasLivro(L, etapas); }
    const cards = (T.cuidados || []).filter(c => clean(c.titulo) || clean(c.texto));
    if (cards.length) { rotuloSecao(L, 'Cuidados durante o tratamento'); L.y += 1.5; cuidadosLivro(L, cards); }
    if (clean(T.suspensao)) { L.y += 2; suspensaoLivro(L, T.suspensao); }
    // calendário com todos os dias seguidos numa folha só: folha deitada (padrão, até 18 dias);
    // ciclos mais longos saem em pé, um dia por linha (até 24); acima disso, em faixas de 7 dias
    let formato = clean((dados.ciclo || {}).calendario) || clean(T.calendario) || 'paisagem';
    if (formato === 'paisagem' && !cabePaisagem(N)) formato = cabeLinhas(N) ? 'linhas' : 'semanas';
    if (formato === 'linhas' && !cabeLinhas(N)) formato = 'semanas';
    L.controlesNaFolha = formato === 'paisagem'; // na folha deitada os próximos controles vão junto do calendário
    const desenharCal = { semanas: calendarioLivro, paisagem: calendarioPaisagem, linhas: calendarioLinhas }[formato] || calendarioLivro;
    const altCal = formato === 'semanas' ? alturaCalendario(N) : formato === 'linhas' ? alturaLinhas(N) : Infinity;
    // se o calendário não cabe no resto da página e sobra bastante espaço, controles e contatos vêm antes
    if (L.y > L.top + 1 && L.y + 10 + altCal > L.bottom && L.bottom - L.y > 150) { L.y += 4; controlesLivro(L, N); contatosLivro(L, N); desenharCal(L, N); }
    else { desenharCal(L, N); controlesLivro(L, N); contatosLivro(L, N); }
    const P = T.procedimento || {};
    if (clean(P.titulo) || N.final.length || N.proc) procedimentoLivro(L, N);
    encerramentoLivro(L);
    rodapesLivro(L);
    const nomeArquivo = nomeDoArquivo(paciente.nome, dados.rotuloArquivo || ROTULOS.livreto, data);
    return { blob: doc.output('blob'), nomeArquivo, avisos, paginas: doc.getNumberOfPages() };
  }

  window.DocumentosPDF = { gerar, idade, dataExtenso, nomeDoArquivo, brl, resolverDatas, temDatas, ICONES_LIVRETO, iconeDe };
})();
