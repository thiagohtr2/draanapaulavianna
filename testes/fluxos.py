"""Testes de ponta a ponta dos fluxos principais, no modo demonstração.

    python testes/fluxos.py          # celular (390 px) e computador (1366 px)
    python testes/fluxos.py 390      # só uma largura
"""
import asyncio, sys
from playwright.async_api import async_playwright
from comum import servidor, navegador, nova_pagina, entrar_demo, Placar

T = Placar()

async def dlg_titulo(pg):
    await pg.wait_for_timeout(900)
    return (await pg.locator('dialog[open] h2').last.text_content()) if await pg.locator('dialog[open]').count() else None

async def fechar(pg):
    for _ in range(8):
        if not await pg.locator('dialog[open]').count(): return
        x = pg.locator('dialog[open] .dlg-head [data-close]').last
        if await x.count(): await x.click()
        else: await pg.keyboard.press('Escape')
        await pg.wait_for_timeout(300)

async def rodar(b, BASE, W):
    print(f'\n== {W} px ==')
    pg = await nova_pagina(b, W, 900, accept_downloads=True)
    await entrar_demo(pg, BASE)
    T.check(await pg.locator('.stat-link').count() == 1, 'Início mostra a produção do mês')

    # ---- pacientes: área, retornos, filtros
    await pg.goto(BASE + '#pacientes'); await pg.wait_for_timeout(500)
    linha = (await pg.locator('#lista-p .row:has-text("Mariana")').inner_text()).replace('\n', ' ')
    T.check('Fertilidade' in linha and '2º retorno' in linha and 'Antes:' in linha, 'lista mostra área, nº do retorno e consultas anteriores', linha[:120])
    await pg.select_option('#f-area', 'Fertilidade'); await pg.wait_for_timeout(200)
    T.check(await pg.locator('#lista-p .row').count() == 1, 'filtro por área')
    await pg.select_option('#f-area', ''); await pg.fill('#busca', 'fertil'); await pg.wait_for_timeout(200)
    T.check(await pg.locator('#lista-p .row').count() == 1, 'busca pela área'); await pg.fill('#busca', '')

    # ---- nova consulta: sugestão de área e retorno
    await pg.click('#lista-p .row:has-text("Mariana")'); await pg.wait_for_timeout(600)
    await pg.click('main .card [data-x="nova"]'); await pg.wait_for_timeout(600)
    dica = (await pg.text_content('#nc-dica')).strip()
    T.check('3º retorno' in dica and await pg.input_value('#nc-area') == 'Fertilidade', 'nova consulta sugere “Fertilidade · 3º retorno”', dica)
    await pg.select_option('#nc-area', 'Obstétrica (pré-natal)'); await pg.wait_for_timeout(150)
    T.check(await pg.input_value('#nc-tipo') == 'Primeira consulta', 'trocar de área sugere primeira consulta')
    await fechar(pg)

    # ---- consulta em andamento: faturamento
    cs = await pg.evaluate("DB.consultas.list()")
    rasc = [c['id'] for c in cs if c['status'] == 'rascunho'][0]
    await pg.goto(BASE + '#consulta-' + rasc); await pg.wait_for_timeout(700)
    await pg.fill('#c-serv', 'Retorno de fertilidade'); await pg.wait_for_timeout(250)
    esperado = await pg.evaluate(f"Promise.all([DB.consultas.get('{rasc}'), DB.valores.list()]).then(([c, v]) => (v.find(x => x.clinica_id === c.clinica_id && x.servico === 'Retorno de fertilidade' && x.plano === 'Particular') || {{}}).valor)")
    val = await pg.input_value('#c-valor')
    T.check(esperado is not None and val == f"{esperado:.2f}".replace('.', ','), 'valor da tabela entra sozinho', f'{val} / tabela {esperado}')
    await pg.wait_for_timeout(1500)
    sv = await pg.evaluate(f"DB.consultas.get('{rasc}').then(c=>[c.servico,c.valor])")
    T.check(sv == ['Retorno de fertilidade', esperado], 'faturamento salvo na consulta', str(sv))

    # ---- pré-visualizações
    await pg.click('[data-x="doc-novo"][data-tipo="receita"]'); await pg.wait_for_timeout(300)
    await pg.click('#doc-editor [data-med]:has-text("Ácido fólico")'); await pg.wait_for_timeout(150)
    await pg.click('#doc-editor [data-ed="previa"]')
    T.check((await dlg_titulo(pg) or '').startswith('Pré-visualização'), 'pré-visualizar receita'); await fechar(pg)
    await pg.check('#doc-editor [data-e="assinar"]'); await pg.click('#doc-editor [data-ed="previa"]')
    T.check((await dlg_titulo(pg) or '').startswith('Pré-visualização'), 'pré-visualizar receita no modelo eletrônico'); await fechar(pg)
    await pg.uncheck('#doc-editor [data-e="assinar"]')

    # ---- salvar vários sem abrir o PDF e juntar
    await pg.click('#doc-editor [data-ed="salvar"]'); await pg.wait_for_timeout(900)
    T.check(await pg.locator('dialog[open]').count() == 0, '“Salvar” não abre o PDF')
    await pg.click('[data-x="doc-novo"][data-tipo="orientacoes"]'); await pg.wait_for_timeout(300)
    await pg.click('#doc-editor [data-ed="usar-modelo"]'); await pg.wait_for_timeout(300)
    await pg.click('dialog[open] #em-l [data-id] >> text=Inseminação'); await pg.wait_for_timeout(400)
    await pg.click('#doc-editor [data-ed="salvar"]'); await pg.wait_for_timeout(500)
    T.check('data e hora de referência' in (await pg.locator('.toast').last.text_content()), 'folheto exige a data de referência')
    await pg.fill('#doc-editor [data-f="data_ref"]', '2026-11-28T09:00')
    await pg.click('#doc-editor [data-ed="salvar"]'); await pg.wait_for_timeout(900)
    await pg.click('[data-x="doc-novo"][data-tipo="orcamento"]'); await pg.wait_for_timeout(300)
    await pg.click('#doc-editor [data-ed="usar-modelo"]'); await pg.wait_for_timeout(300)
    await pg.click('dialog[open] #em-l [data-id] >> text=Coito'); await pg.wait_for_timeout(400)
    await pg.click('#doc-editor [data-ed="salvar"]'); await pg.wait_for_timeout(400)
    T.check('Preencha o valor' in (await pg.locator('.toast').last.text_content()), 'orçamento exige os valores')
    for i in range(3): await pg.fill(f'#doc-editor [data-oi="{i}"][data-k="valor"]', '500')
    T.check((await pg.text_content('#doc-editor [data-total]')).strip().startswith('R$'), 'total do orçamento na tela')
    await pg.click('#doc-editor [data-ed="salvar"]'); await pg.wait_for_timeout(900)
    T.check(await pg.locator('#docs-lista [data-doc]').count() == 3, '3 documentos salvos na consulta')
    await pg.click('[data-ver-todos]')
    await pg.wait_for_selector('dialog[open] [data-print]', timeout=15000)
    T.check('3 documentos' in (await dlg_titulo(pg) or ''), '“Ver todos em um PDF”')
    T.check(await pg.locator('dialog[open] [data-print]').count() == 1, 'botão “Imprimir tudo”'); await fechar(pg)

    # ---- receita assinada (demonstração: assinatura de teste)
    await pg.click('[data-x="doc-novo"][data-tipo="receita"]'); await pg.wait_for_timeout(300)
    await pg.click('#doc-editor [data-med]:has-text("Ácido fólico")'); await pg.check('#doc-editor [data-e="assinar"]')
    await pg.click('#doc-editor [data-ed="emitir"]'); await pg.wait_for_timeout(500)
    T.check('CPF' in (await pg.locator('.toast').last.text_content()), 'assinatura exige o CPF da paciente')
    await pg.evaluate(f"DB.consultas.get('{rasc}').then(c=>DB.pacientes.get(c.paciente_id)).then(p=>DB.pacientes.save({{...p, cpf:'123.456.789-09'}}, p.clinicas))")
    await pg.reload(); await pg.wait_for_timeout(900)
    await pg.click('#doc-editor [data-ed="emitir"]'); await pg.wait_for_timeout(1600)
    alertas = ' '.join(await pg.eval_on_selector_all('dialog[open] .alert', 'e=>e.map(x=>x.textContent)'))
    T.check('TESTE' in alertas and 'Código de acesso' in alertas, 'receita assinada (teste) com código de acesso'); await fechar(pg)

    # ---- modelos: “Ver PDF”
    for tm in ['prescricao', 'exames', 'atestado', 'orientacao', 'orcamento']:
        await pg.goto(BASE + '#modelos'); await pg.wait_for_timeout(300); await pg.click(f'[data-tm="{tm}"]')
        await pg.click('[data-mid] >> nth=0'); await pg.wait_for_timeout(300); await pg.click('dialog[open] [data-m="prev"]')
        T.check(await pg.locator('dialog[open] iframe, dialog[open] a[download], dialog[open] [data-save]').count() > 0 or bool(await dlg_titulo(pg)), f'“Ver PDF” do modelo ({tm})')
        await fechar(pg)

    # ---- tabela de valores
    await pg.goto(BASE + '#valores'); await pg.wait_for_timeout(500)
    antes = await pg.locator('[data-vid]').count()
    await pg.click('.page-head [data-x="novo"]'); await pg.wait_for_timeout(300)
    await pg.fill('#vl-sv', 'Coleta de preventivo'); await pg.fill('#vl-pl', 'Unimed'); await pg.fill('#vl-v', '52,5')
    await pg.click('dialog[open] [data-ok]'); await pg.wait_for_timeout(500)
    T.check(await pg.locator('[data-vid]').count() == antes + 1, 'cadastrar valor')
    await pg.click('.page-head [data-x="novo"]'); await pg.wait_for_timeout(300)
    await pg.fill('#vl-sv', 'coleta de preventivo'); await pg.fill('#vl-pl', 'unimed'); await pg.fill('#vl-v', '60')
    await pg.click('dialog[open] [data-ok]'); await pg.wait_for_timeout(300)
    T.check(await pg.locator('dialog[open]').count() == 1, 'valor duplicado é recusado'); await fechar(pg)

    # ---- produção e planilha
    await pg.goto(BASE + '#producao'); await pg.wait_for_timeout(500); await pg.click('[data-pp="ano"]'); await pg.wait_for_timeout(200)
    T.check('R$' in await pg.text_content('.prod-stats'), 'produção do ano')
    async with pg.expect_download() as dl: await pg.click('[data-x="csv"]')
    d = await dl.value
    T.check(d.suggested_filename.endswith('.csv'), 'planilha da produção', d.suggested_filename)

    # ---- sair
    await pg.click('[data-acao="sair"]:visible'); await pg.wait_for_timeout(300); await pg.click('dialog[open] [data-ok]'); await pg.wait_for_timeout(800)
    T.check(await pg.locator('#a-email').count() == 1, 'sair da conta volta ao login')
    T.check(not pg.erros, 'sem erros de JavaScript', '; '.join(pg.erros)[:300])
    await pg.context.close()

async def main(larguras):
    with servidor() as BASE:
        async with async_playwright() as p:
            b = await navegador(p)
            for w in larguras: await rodar(b, BASE, w)
            await b.close()
    T.fim()

if __name__ == '__main__':
    asyncio.run(main([int(x) for x in sys.argv[1:]] or [390, 1366]))
