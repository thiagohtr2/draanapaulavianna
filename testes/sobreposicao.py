"""Auditoria de layout: procura elementos sobrepostos, textos cortados, conteúdo vazando de cartões
e rolagem horizontal, em todas as telas e diálogos principais, em 7 larguras (320 a 1920 px).

    python testes/sobreposicao.py            # todas as larguras
    python testes/sobreposicao.py 390 1366   # só algumas
"""
import asyncio, sys, json
from playwright.async_api import async_playwright
from comum import servidor, navegador, nova_pagina, entrar_demo, LARGURAS

DETECT = r"""(root) => {
  root = root ? document.querySelector(root) : document.body;
  const SEL = 'button, a, input, select, textarea, .label, .field > span, .chip, .area-selo, .hist-ant, .hist-ult b, .valor, .stat b, .resumo-prod li > *, .fat-dica, h1, h2, h3, p, img, .avatar, .title, .meta > span, .num, summary h2, dt, dd, .savestate, .stat span';
  const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('.sr-only') && !e.closest('[hidden]') && !e.closest('details:not([open]) > :not(summary)'); };
  const layer = e => { let p = e; while (p && p !== document.body) { const cs = getComputedStyle(p); if (cs.position === 'fixed' || cs.position === 'sticky' || p.tagName === 'DIALOG') return p; p = p.parentElement; } return null; };
  const els = [...root.querySelectorAll(SEL)].filter(vis);
  const clip = e => { let r = e.getBoundingClientRect(); r = { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; let p = e.parentElement; while (p && p !== document.body) { const cs = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(cs.overflowY + cs.overflowX)) { const q = p.getBoundingClientRect(); r = { left: Math.max(r.left, q.left), top: Math.max(r.top, q.top), right: Math.min(r.right, q.right), bottom: Math.min(r.bottom, q.bottom) }; } p = p.parentElement; } return r; };
  const rects = els.map(clip), lay = els.map(layer);
  const name = e => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0,2).join('.') : '') + ' "' + (e.textContent || e.value || e.alt || '').trim().slice(0, 28) + '"');
  const out = [];
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    const a = els[i], b = els[j]; if (lay[i] !== lay[j] || a.contains(b) || b.contains(a)) continue;
    const r = rects[i], s = rects[j];
    const w = Math.min(r.right, s.right) - Math.max(r.left, s.left), h = Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top);
    if (w > 1 && h > 1) out.push('SOBREPÕE: ' + name(a) + '  x  ' + name(b) + ` (${Math.round(w)}x${Math.round(h)})`);
  }
  for (const e of els) {
    if (e.matches('button, .chip, .btn, .title, h1, h2, h3, .label, .field > span, .stat b, .valor') && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible') out.push('CORTADO: ' + name(e));
    const p = e.closest('.card, .row, .rx, dialog .dlg, .pad-item, .summary-card, .orc-item, .assin-box, .orc-total, .area-selo');
    if (p && p !== e) { const pr = p.getBoundingClientRect(), r = e.getBoundingClientRect(); if (r.right > pr.right + 1 || r.left < pr.left - 1) out.push('VAZA DO CARTÃO: ' + name(e)); }
  }
  const W = document.documentElement.clientWidth; if (document.documentElement.scrollWidth > W) out.push('ROLAGEM HORIZONTAL ' + document.documentElement.scrollWidth + '>' + W);
  return [...new Set(out)];
}"""


async def main(larguras):
    rel = {}
    with servidor() as BASE:
        async with async_playwright() as p:
            b = await navegador(p)
            for w in larguras:
                pg = await nova_pagina(b, w, 900)
                async def chk(nome, root=None):
                    await pg.evaluate("document.querySelectorAll('.toast').forEach(t=>t.remove())")
                    r = await pg.evaluate(DETECT, root)
                    if r: rel[nome] = r
                esc = lambda: pg.keyboard.press('Escape')
                await entrar_demo(pg, BASE)
                cs = await pg.evaluate("DB.consultas.list()")
                rasc = [c['id'] for c in cs if c['status'] == 'rascunho'][0]
                fin = [c['id'] for c in cs if c['status'] == 'finalizada'][0]
                ps = await pg.evaluate("DB.pacientes.list()")
                for r in ['#inicio', '#pacientes', '#modelos', '#clinicas', '#perfil', '#valores', '#producao', '#paciente-' + ps[2]['id'], '#consulta-' + rasc, '#consulta-' + fin]:
                    await pg.goto(BASE + r); await pg.wait_for_timeout(400); await chk(f'{w} {r[:20]}')
                for tm in ['medicamentos', 'prescricao', 'exames', 'atestado', 'orientacao', 'ciclo', 'livreto', 'orcamento', 'texto']:
                    await pg.goto(BASE + '#modelos'); await pg.wait_for_timeout(250); await pg.click(f'[data-tm="{tm}"]'); await pg.wait_for_timeout(200); await chk(f'{w} modelos-{tm}')
                    if tm != 'medicamentos':
                        await pg.click('[data-mid] >> nth=0'); await pg.wait_for_timeout(300); await chk(f'{w} dlg-modelo-{tm}', 'dialog'); await esc(); await pg.wait_for_timeout(150)
                await pg.goto(BASE + '#producao'); await pg.wait_for_timeout(300)
                for per in ['ano', 'pers']:
                    await pg.click(f'[data-pp="{per}"]'); await pg.wait_for_timeout(200); await chk(f'{w} producao-{per}')
                await pg.goto(BASE + '#valores'); await pg.wait_for_timeout(300); await pg.click('[data-vid] >> nth=0'); await pg.wait_for_timeout(300); await chk(f'{w} dlg-valor', 'dialog'); await esc(); await pg.wait_for_timeout(150)
                await pg.goto(BASE + '#consulta-' + fin); await pg.wait_for_timeout(400)
                await pg.click('[data-x="fat-editar"]'); await pg.wait_for_timeout(300); await chk(f'{w} dlg-faturamento', 'dialog'); await esc(); await pg.wait_for_timeout(150)
                await pg.goto(BASE + '#consulta-' + rasc); await pg.wait_for_timeout(400)
                for tp, mod in [('orientacoes', 'Transfer'), ('orcamento', 'FIV')]:
                    await pg.click(f'[data-x="doc-novo"][data-tipo="{tp}"]'); await pg.wait_for_timeout(250)
                    if await pg.locator('dialog[open]').count(): await pg.click('dialog[open] .btn-danger'); await pg.wait_for_timeout(250)
                    await pg.click('#doc-editor [data-ed="usar-modelo"]'); await pg.wait_for_timeout(250)
                    await pg.click(f'dialog[open] #em-l [data-id] >> text={mod}'); await pg.wait_for_timeout(400)
                    await chk(f'{w} editor-{tp}', '#doc-editor')
                await pg.click('[data-x="doc-novo"][data-tipo="receita"]'); await pg.wait_for_timeout(250)
                if await pg.locator('dialog[open]').count(): await pg.click('dialog[open] .btn-danger'); await pg.wait_for_timeout(250)
                await pg.check('#doc-editor [data-e="assinar"]'); await chk(f'{w} editor-receita-assinar', '#doc-editor')
                await chk(f'{w} ciclo-e-livreto', '#s-ciclo')
                await pg.click('#ciclo-corpo [data-cx="padrao-usar"]'); await pg.wait_for_timeout(300); await pg.click('dialog[open] #em-l [data-id] >> nth=0'); await pg.wait_for_timeout(300)
                if await pg.locator('dialog[open] [data-ok]:has-text("Substituir")').count(): await pg.click('dialog[open] [data-ok]'); await pg.wait_for_timeout(300)
                await chk(f'{w} dlg-dia01', 'dialog'); await esc(); await pg.wait_for_timeout(150)
                pac = await pg.evaluate(f"DB.consultas.get('{rasc}').then(c=>c.paciente_id)")
                await pg.goto(BASE + '#paciente-' + pac); await pg.wait_for_timeout(400)
                await pg.click('[data-aba="docs"]'); await pg.wait_for_timeout(200); await pg.click('[data-x="novo-doc"]'); await pg.wait_for_timeout(250); await pg.click('dialog[open] [data-nd="livreto"]'); await pg.wait_for_timeout(600)
                await chk(f'{w} dlg-livreto', 'dialog'); await esc(); await pg.wait_for_timeout(150)
                await pg.goto(BASE + '#paciente-' + ps[2]['id']); await pg.wait_for_timeout(400)
                await pg.click('main .card [data-x="nova"]'); await pg.wait_for_timeout(500); await chk(f'{w} dlg-nova-consulta', 'dialog'); await esc(); await pg.wait_for_timeout(150)
                await pg.click('[data-aba="docs"]'); await pg.wait_for_timeout(200); await chk(f'{w} ficha-documentos')
                await pg.click('[data-x="juntar-docs"]'); await pg.wait_for_timeout(250); await chk(f'{w} dlg-juntar', 'dialog'); await esc(); await pg.wait_for_timeout(150)
                await pg.click('[data-x="enviar-docs"]'); await pg.wait_for_timeout(300); await chk(f'{w} dlg-enviar', 'dialog'); await esc()
                if pg.erros: rel[f'{w} ERROS JS'] = pg.erros
                await pg.context.close()
            await b.close()
    print(json.dumps(rel, ensure_ascii=False, indent=1))
    print(f'telas com problema: {len(rel)}')
    sys.exit(1 if rel else 0)

if __name__ == '__main__':
    asyncio.run(main([int(x) for x in sys.argv[1:]] or LARGURAS))
