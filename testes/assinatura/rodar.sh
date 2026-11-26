#!/usr/bin/env bash
# Gera um certificado de TESTE, assina um PDF com o mesmo código da função assinar-documento
# e valida com o pyHanko (assinatura íntegra, DocMDP e metadados do ITI).
# Requer: deno, openssl, python com pyhanko (pip install pyhanko pyhanko-certvalidator).
set -euo pipefail
cd "$(dirname "$0")"; D=$(mktemp -d)
openssl req -x509 -newkey rsa:2048 -nodes -keyout "$D/ca.key" -out "$D/ca.pem" -days 30 -subj "/C=BR/O=Teste/CN=AC Teste" -addext "basicConstraints=critical,CA:TRUE" -addext "keyUsage=critical,keyCertSign,cRLSign" 2>/dev/null
openssl req -newkey rsa:2048 -nodes -keyout "$D/leaf.key" -out "$D/leaf.csr" -subj "/C=BR/O=ICP-Brasil/CN=MEDICA TESTE:12345678909" 2>/dev/null
printf "basicConstraints=CA:FALSE\nkeyUsage=critical,digitalSignature,nonRepudiation\n" > "$D/ext.cnf"
openssl x509 -req -in "$D/leaf.csr" -CA "$D/ca.pem" -CAkey "$D/ca.key" -CAcreateserial -out "$D/leaf.pem" -days 30 -extfile "$D/ext.cnf" 2>/dev/null
openssl pkcs8 -topk8 -nocrypt -in "$D/leaf.key" -out "$D/leaf.pk8"
deno run -A teste.ts "$D" ${1:-}
python3 - "$D" <<'PY'
import sys
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign.validation import validate_pdf_signature
from pyhanko_certvalidator import ValidationContext
from pyhanko.keys import load_cert_from_pemder
d = sys.argv[1]
vc = ValidationContext(trust_roots=[load_cert_from_pemder(f'{d}/ca.pem')], allow_fetching=False)
r = PdfFileReader(open(f'{d}/assinado.pdf', 'rb')); s = r.embedded_signatures[0]
st = validate_pdf_signature(s, vc)
info = r.trailer['/Info']
ok = st.bottom_line and s.docmdp_level is not None and '/2.16.76.1.12.1.1' in info and '/2.16.76.1.4.2.2.1' in info
print('assinatura válida:', st.bottom_line, '| DocMDP:', s.docmdp_level, '| OIDs ITI:', '/2.16.76.1.12.1.1' in info)
sys.exit(0 if ok else 1)
PY
