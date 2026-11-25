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
    gray: [104, 86, 93], hair: [230, 211, 216], white: [255, 255, 255]
  };

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
    doc.text(local + dataExtenso(ctx.data), rx, secao.via ? ry + 1.4 : y, { align: 'right' });

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
    // assinatura
    const sy = H - g.sigY;
    doc.setDrawColor(...C.wine); doc.setLineWidth(0.3);
    const sw = 72 * g.k;
    doc.line(W / 2 - sw / 2, sy, W / 2 + sw / 2, sy);
    setF(doc, 'CormSB', fs(g, 13), C.wine);
    doc.text(m.nomeCompleto, W / 2, sy + 5.2 * g.k, { align: 'center' });
    setF(doc, 'Jost', fs(g, 8), C.gray);
    const cred = [m.especialidade, m.crm ? `CRM-${m.crm_uf || ''} ${m.crm}` : '', m.rqe ? `RQE ${m.rqe}` : ''].filter(Boolean).join('  ·  ');
    doc.text(cred, W / 2, sy + 9.4 * g.k, { align: 'center' });

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
  function blocoEspaco(mm) { return { medir: (ctx) => mm * ctx.g.k, desenhar() {} }; }

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
      if (bl.keepNext && blocos[b + 1] && !blocos[b + 1].quebravel) need += blocos[b + 1].medir(ctx, w);
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
  const ROTULOS = { receita: 'Receita', orientacoes: 'Orientacoes', exames: 'Solicitacao de exames', registro: 'Registro da consulta', atestado: 'Atestado' };
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

  function gerar(dados) {
    const avisos = [];
    const data = dados.data instanceof Date ? dados.data : new Date(dados.data || Date.now());
    const m = dados.medico || {};
    const medico = Object.assign({}, m, { nomeCompleto: [clean(m.tratamento), clean(m.nome)].filter(Boolean).join(' ') || 'Dra. Ana Paula Vianna', especialidade: clean(m.especialidade) || 'Ginecologia e Fertilidade' });
    const { doc, g } = criarDocumento({ tamanho: dados.tamanho, medico, tituloArquivo: dados.titulo });
    const ctx = { doc, g, medico, clinica: dados.clinica || {}, paciente: dados.paciente || {}, data, marcaDagua: dados.marcaDagua !== false, yCorpo: null };
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
      if (anti.length) {
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
      secoes.push({ titulo: 'Orientações médicas', blocos: [blocoTexto(dados.orientacoes)] });
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

  window.DocumentosPDF = { gerar, idade, dataExtenso, nomeDoArquivo };
})();
