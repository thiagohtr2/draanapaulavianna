// Assinatura digital de PDF (padrão aceito pelo VALIDAR/ITI):
//  - metadados OID de documento de saúde gravados ANTES de assinar
//    (2.16.76.1.12.1.x = tipo do documento; 2.16.76.1.4.2.2.1 = CRM; 2.16.76.1.4.2.2.2 = UF; .3 = especialidade)
//  - dicionário de assinatura /Adobe.PPKLite /adbe.pkcs7.detached com DocMDP (P=2), sem /Perms (Guia do Desenvolvedor do ITI)
//  - CMS SignedData destacado, SHA-256, atributos assinados: contentType, messageDigest, signingCertificateV2
// O provedor (certificado em nuvem) só assina o hash dos atributos — a chave nunca sai da certificadora.
import { PDFDocument, PDFName, PDFNumber, PDFHexString, PDFString, PDFArray, PDFDict } from 'npm:pdf-lib@1.17.1';
import * as asn1js from 'npm:asn1js@3.0.5';
import * as pkijs from 'npm:pkijs@3.2.4';

export const OID_DOC = {
  receita: '2.16.76.1.12.1.1',   // Prescrição de medicamento
  atestado: '2.16.76.1.12.1.2',  // Atestado médico
  exames: '2.16.76.1.12.1.3'     // Solicitação de exame
} as const;
export const NOME_DOC: Record<string, string> = { receita: 'Prescrição de medicamento', atestado: 'Atestado médico', exames: 'Solicitação de exame' };
const OID_CRM = '2.16.76.1.4.2.2.1', OID_UF = '2.16.76.1.4.2.2.2', OID_ESP = '2.16.76.1.4.2.2.3';

const BR_PLACEHOLDER = '/ByteRange [ 0 1111111111 2222222222 3333333333 ]';
const TAM_ASSINATURA = 24000; // bytes reservados para o CMS (cadeia ICP-Brasil completa cabe com folga)

export interface Preparado { pdf: Uint8Array; inicio: number; fim: number; hash: Uint8Array }

const enc = new TextEncoder();
function indexOf(hay: Uint8Array, needle: Uint8Array, from = 0): number {
  outer: for (let i = from; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}
async function sha256(...partes: Uint8Array[]): Promise<Uint8Array> {
  const n = partes.reduce((a, p) => a + p.length, 0); const buf = new Uint8Array(n); let o = 0;
  for (const p of partes) { buf.set(p, o); o += p.length; }
  return new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
}

/** Grava os metadados ITI e reserva o espaço da assinatura. Devolve o PDF preparado e o hash do conteúdo assinado. */
export async function prepararPDF(bytes: Uint8Array, opt: { tipo: keyof typeof OID_DOC; crm: string; uf: string; especialidade?: string; nome: string; local?: string; motivo?: string; data?: Date }): Promise<Preparado> {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const ctx = pdf.context;
  const info = ctx.lookup(ctx.trailerInfo.Info) as PDFDict | undefined;
  const infoDict = info instanceof PDFDict ? info : ctx.obj({}) as PDFDict;
  if (!(info instanceof PDFDict)) ctx.trailerInfo.Info = ctx.register(infoDict);
  infoDict.set(PDFName.of(OID_DOC[opt.tipo]), PDFHexString.fromText(NOME_DOC[opt.tipo]));
  infoDict.set(PDFName.of(OID_CRM), PDFString.of(String(opt.crm).replace(/\D/g, '')));
  infoDict.set(PDFName.of(OID_UF), PDFString.of(String(opt.uf).toUpperCase()));
  if (opt.especialidade) infoDict.set(PDFName.of(OID_ESP), PDFHexString.fromText(opt.especialidade));

  const data = opt.data || new Date();
  const transform = ctx.obj({ Type: 'TransformParams', P: 2, V: PDFName.of('1.2') });
  const ref = ctx.obj({ Type: 'SigRef', TransformMethod: 'DocMDP', TransformParams: ctx.register(transform) });
  const sig = ctx.obj({
    Type: 'Sig', Filter: 'Adobe.PPKLite', SubFilter: 'adbe.pkcs7.detached',
    ByteRange: PDFArray.withContext(ctx),
    Contents: PDFHexString.of('0'.repeat(TAM_ASSINATURA * 2)),
    Reference: ctx.obj([ref]),
    Name: PDFHexString.fromText(opt.nome), M: PDFString.fromDate(data),
    Reason: PDFHexString.fromText(opt.motivo || NOME_DOC[opt.tipo]),
    Location: PDFHexString.fromText(opt.local || 'Brasil')
  }) as PDFDict;
  const br = sig.get(PDFName.of('ByteRange')) as PDFArray;
  [0, 1111111111, 2222222222, 3333333333].forEach(n => br.push(PDFNumber.of(n)));
  const sigRef = ctx.register(sig);

  const pagina = pdf.getPages()[0];
  const widget = ctx.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Sig', Rect: [0, 0, 0, 0], V: sigRef, T: PDFHexString.fromText('Assinatura1'), F: 132, P: pagina.ref });
  const widgetRef = ctx.register(widget);
  const annots = pagina.node.lookup(PDFName.of('Annots'));
  if (annots instanceof PDFArray) annots.push(widgetRef); else pagina.node.set(PDFName.of('Annots'), ctx.obj([widgetRef]));
  pdf.catalog.set(PDFName.of('AcroForm'), ctx.obj({ Fields: [widgetRef], SigFlags: 3 }));

  const saida = await pdf.save({ useObjectStreams: false, addDefaultPage: false, updateFieldAppearances: false });
  // localizar placeholders
  const posBR = indexOf(saida, enc.encode(BR_PLACEHOLDER));
  if (posBR < 0) throw new Error('ByteRange não encontrado.');
  const marcaContents = enc.encode('/Contents <');
  let inicio = indexOf(saida, marcaContents, Math.max(0, posBR - TAM_ASSINATURA * 3));
  while (inicio >= 0 && saida[inicio + marcaContents.length] !== 0x30) inicio = indexOf(saida, marcaContents, inicio + 1);
  if (inicio < 0) throw new Error('Espaço da assinatura não encontrado.');
  inicio += marcaContents.length - 1; // posição do '<'
  const fim = inicio + TAM_ASSINATURA * 2 + 2; // depois do '>'
  if (saida[fim - 1] !== 0x3e) throw new Error('Espaço da assinatura corrompido.');
  const valores = `/ByteRange [ 0 ${inicio} ${fim} ${saida.length - fim} ]`;
  if (valores.length > BR_PLACEHOLDER.length) throw new Error('Documento grande demais para assinar.');
  saida.set(enc.encode(valores.padEnd(BR_PLACEHOLDER.length, ' ')), posBR);
  const hash = await sha256(saida.subarray(0, inicio), saida.subarray(fim));
  return { pdf: saida, inicio, fim, hash };
}

const OID = {
  data: '1.2.840.113549.1.7.1', signedData: '1.2.840.113549.1.7.2', contentType: '1.2.840.113549.1.9.3',
  messageDigest: '1.2.840.113549.1.9.4', signingCertV2: '1.2.840.113549.1.9.16.2.47',
  sha256: '2.16.840.1.101.3.4.2.1', rsa: '1.2.840.113549.1.1.1'
};
const ab = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
function lerCert(der: Uint8Array) { return pkijs.Certificate.fromBER(ab(der)); }

/** Atributos assinados (DER do SET, que é o que o provedor assina). */
export async function atributosAssinados(hashDoc: Uint8Array, certDER: Uint8Array) {
  const cert = lerCert(certDER);
  const certHash = await sha256(certDER);
  const essV2 = new asn1js.Sequence({ value: [new asn1js.Sequence({ value: [new asn1js.Sequence({ value: [
    new asn1js.OctetString({ valueHex: ab(certHash) }),
    new asn1js.Sequence({ value: [
      new asn1js.Sequence({ value: [new asn1js.Constructed({ idBlock: { tagClass: 3, tagNumber: 4 }, value: [cert.issuer.toSchema()] })] }),
      new asn1js.Integer({ valueHex: cert.serialNumber.valueBlock.valueHexView.slice().buffer })
    ] })
  ] })] })] });
  let attrs = [
    new pkijs.Attribute({ type: OID.contentType, values: [new asn1js.ObjectIdentifier({ value: OID.data })] }),
    new pkijs.Attribute({ type: OID.messageDigest, values: [new asn1js.OctetString({ valueHex: ab(hashDoc) })] }),
    new pkijs.Attribute({ type: OID.signingCertV2, values: [essV2] })
  ];
  // DER: SET OF ordenado pela codificação
  const cod = (a: pkijs.Attribute) => new Uint8Array(a.toSchema().toBER());
  attrs = attrs.sort((a, b) => { const x = cod(a), y = cod(b); for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length; });
  const der = new Uint8Array(new asn1js.Set({ value: attrs.map(a => a.toSchema()) }).toBER());
  return { attrs, der, hash: await sha256(der), cert };
}

/** Monta o CMS SignedData destacado com a assinatura RSA devolvida pelo provedor. */
export function montarCMS(attrs: pkijs.Attribute[], cert: pkijs.Certificate, cadeia: Uint8Array[], assinatura: Uint8Array): Uint8Array {
  const si = new pkijs.SignerInfo({
    version: 1,
    sid: new pkijs.IssuerAndSerialNumber({ issuer: cert.issuer, serialNumber: cert.serialNumber }),
    digestAlgorithm: new pkijs.AlgorithmIdentifier({ algorithmId: OID.sha256 }),
    signedAttrs: new pkijs.SignedAndUnsignedAttributes({ type: 0, attributes: attrs }),
    signatureAlgorithm: new pkijs.AlgorithmIdentifier({ algorithmId: OID.rsa, algorithmParams: new asn1js.Null() }),
    signature: new asn1js.OctetString({ valueHex: ab(assinatura) })
  });
  const certs = [cert, ...cadeia.map(lerCert)];
  const sd = new pkijs.SignedData({
    version: 1,
    digestAlgorithms: [new pkijs.AlgorithmIdentifier({ algorithmId: OID.sha256, algorithmParams: new asn1js.Null() })],
    encapContentInfo: new pkijs.EncapsulatedContentInfo({ eContentType: OID.data }),
    certificates: certs,
    signerInfos: [si]
  });
  const ci = new pkijs.ContentInfo({ contentType: OID.signedData, content: sd.toSchema(true) });
  return new Uint8Array(ci.toSchema().toBER());
}

/** Coloca o CMS no espaço reservado. */
export function embutir(p: Preparado, cms: Uint8Array): Uint8Array {
  const hex = Array.from(cms, b => b.toString(16).padStart(2, '0')).join('');
  if (hex.length > TAM_ASSINATURA * 2) throw new Error('Assinatura maior que o espaço reservado.');
  const out = p.pdf.slice();
  out.set(enc.encode(hex.padEnd(TAM_ASSINATURA * 2, '0')), p.inicio + 1);
  return out;
}

export function pemParaDER(pem: string): Uint8Array {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}
export function certsDoPEM(pem: string): Uint8Array[] {
  return (pem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || []).map(pemParaDER);
}
export function nomeDoCert(der: Uint8Array): { nome: string; cpf: string } {
  const c = lerCert(der); let nome = '';
  for (const tv of c.subject.typesAndValues) if (tv.type === '2.5.4.3') nome = tv.value.valueBlock.value;
  // ICP-Brasil: CN "NOME:CPF"
  const m = nome.match(/^(.*?):(\d{11})$/);
  return m ? { nome: m[1], cpf: m[2] } : { nome, cpf: '' };
}
