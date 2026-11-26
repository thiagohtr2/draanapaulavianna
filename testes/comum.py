"""Infraestrutura dos testes de interface (Playwright).

- Sobe um servidor HTTP local servindo a raiz do repositório.
- Troca o config.js por um vazio: o app abre em MODO DEMONSTRAÇÃO (nunca toca o Supabase real).
- Navegador: o Chromium do Playwright; defina CHROME=/caminho/do/chrome para usar outro.

Instalação (uma vez):
    pip install playwright pyhanko pyhanko-certvalidator pillow
    python -m playwright install chromium
"""
import os, sys, threading, functools, http.server, socketserver, contextlib

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'testes', 'saida')
os.makedirs(SAIDA, exist_ok=True)
CONFIG_DEMO = "window.APP_CONFIG = { SUPABASE_URL: '', SUPABASE_KEY: '' };"
LARGURAS = [320, 360, 390, 768, 1024, 1366, 1920]


class _Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass


@contextlib.contextmanager
def servidor():
    """Servidor estático na raiz do projeto, numa porta livre. Devolve a URL do index.html."""
    handler = functools.partial(_Silencioso, directory=RAIZ)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(('127.0.0.1', 0), handler) as srv:
        t = threading.Thread(target=srv.serve_forever, daemon=True); t.start()
        try: yield f'http://127.0.0.1:{srv.server_address[1]}/index.html'
        finally: srv.shutdown()


async def navegador(p):
    exe = os.environ.get('CHROME')
    return await p.chromium.launch(executable_path=exe) if exe else await p.chromium.launch()


async def nova_pagina(b, largura=390, altura=860, **kw):
    """Página em modo demonstração, com captura de erros de JavaScript em pg.erros."""
    ctx = await b.new_context(viewport={'width': largura, 'height': altura}, has_touch=largura < 600, **kw)
    await ctx.route('**/config.js', lambda r: r.fulfill(status=200, content_type='text/javascript', body=CONFIG_DEMO))
    pg = await ctx.new_page(); pg.erros = []
    pg.on('pageerror', lambda e: pg.erros.append(str(e)))
    return pg


async def entrar_demo(pg, base):
    """Zera os dados da demonstração e entra."""
    await pg.goto(base); await pg.evaluate('localStorage.clear(); sessionStorage.clear()')
    await pg.goto(base); await pg.wait_for_timeout(300)
    await pg.fill('#a-email', 'teste@exemplo.com'); await pg.fill('#a-senha', '12345678')
    await pg.click('button[type=submit]'); await pg.wait_for_timeout(900)


class Placar:
    """Conta verificações; imprime ✔/✘ e sai com código 1 se algo falhar."""
    def __init__(self): self.ok = 0; self.falhas = []
    def check(self, cond, nome, detalhe=''):
        if cond: self.ok += 1; print(f'  ✔ {nome}')
        else: self.falhas.append(f'{nome} {detalhe}'.strip()); print(f'  ✘ {nome} {detalhe}')
    def fim(self):
        print(f'\n{self.ok} verificações ok, {len(self.falhas)} falha(s).')
        for f in self.falhas: print('  -', f)
        sys.exit(1 if self.falhas else 0)
