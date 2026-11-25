import csv, io, sys, unicodedata, json, os
src, out = sys.argv[1], sys.argv[2]
def rd(n): return list(csv.DictReader(io.open(os.path.join(src,n), encoding='latin-1', newline=''), delimiter=';'))
caps = rd('CID-10-CAPITULOS.CSV'); cats = rd('CID-10-CATEGORIAS.CSV'); subs = rd('CID-10-SUBCATEGORIAS.CSV')
def norm(s): return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower()
def cap_of(code3):
    for c in caps:
        if c['CATINIC'] <= code3 <= c['CATFIM']: return int(c['NUMCAP'])
    return None
rows = []
for c in cats:
    k = c['CAT'].strip(); d = c['DESCRICAO'].strip()
    if not k or not d: continue
    rows.append((k, d, 'categoria', cap_of(k), None))
for s in subs:
    k = s['SUBCAT'].strip(); d = s['DESCRICAO'].strip()
    if not k or not d: continue
    code = k[:3] + '.' + k[3:]
    rs = (s.get('RESTRSEXO') or '').strip()
    sex = {'F': 'F', 'M': 'M', '1': 'M', '3': 'F'}.get(rs)
    rows.append((code, d, 'subcategoria', cap_of(k[:3]), sex))
# checagem
codes = [r[0] for r in rows]; assert len(codes) == len(set(codes)), 'duplicados'
q = lambda v: 'null' if v is None else ("'" + str(v).replace("'", "''") + "'")
chunk = 2500
for i in range(0, len(rows), chunk):
    vals = ',\n'.join(f"({q(r[0])},{q(r[1])},{q(r[2])},{'null' if r[3] is None else r[3]},{q(r[4])},{q(norm(r[0].replace('.','') + ' ' + r[0] + ' ' + r[1]))})" for r in rows[i:i+chunk])
    open(f'{out}/cid_{i//chunk:02d}.sql','w').write('insert into public.cid10 (codigo, descricao, nivel, capitulo, restr_sexo, busca) values\n' + vals + '\non conflict (codigo) do update set descricao = excluded.descricao, nivel = excluded.nivel, capitulo = excluded.capitulo, restr_sexo = excluded.restr_sexo, busca = excluded.busca;\n')
print(len(rows), 'linhas;', sum(1 for r in rows if r[2]=='categoria'), 'categorias;', sum(1 for r in rows if r[4]), 'com restrição de sexo')
print([r for r in rows if r[0] in ('N76','N76.0','N97.9','O80','Z32.1')])
# lista para o modo demonstração: capítulos de ginecologia/obstetrícia (N70–N98, O, Z30–Z39) + alguns gerais
demo = [{'codigo': r[0], 'descricao': r[1]} for r in rows if (r[0][:1] == 'N' and 'N70' <= r[0][:3] <= 'N98') or r[0][:3] in ('Z30','Z31','Z32','Z34','Z35','Z01','E28','E03','R10','B37','A56','A59','A63')]
open(f'{out}/cid-demo.json','w').write(json.dumps(demo, ensure_ascii=False))
print('demo:', len(demo))
# TSV para importação direta pelo banco
bad = [r for r in rows if any(('\t' in str(x) or '\n' in str(x) or '\r' in str(x)) for x in r if x is not None)]
assert not bad, bad[:3]
with open(f'{out}/cid10.tsv', 'w', encoding='utf-8', newline='') as f:
    f.write('codigo\tdescricao\tnivel\tcapitulo\trestr_sexo\tbusca\n')
    for r in rows: f.write('\t'.join(['' if x is None else str(x) for x in r] + [norm(r[0].replace('.','') + ' ' + r[0] + ' ' + r[1])]) + '\n')
print('tsv ok')
