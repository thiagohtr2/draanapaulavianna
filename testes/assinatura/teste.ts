// Teste da assinatura digital (núcleo usado pela função assinar-documento), com certificado de TESTE.
//   bash testes/assinatura/rodar.sh  [arquivo.pdf]
import { PDFDocument, StandardFonts } from 'npm:pdf-lib@1.17.1';
import { prepararPDF, atributosAssinados, montarCMS, embutir, pemParaDER, certsDoPEM } from '../../supabase/functions/_shared/pdf-assinatura.ts';
const [dir, entrada] = [Deno.args[0], Deno.args[1]];
let bytes: Uint8Array;
if (entrada) bytes = await Deno.readFile(entrada);
else { const d = await PDFDocument.create(); const p = d.addPage(); p.drawText('Receita de teste', { x: 50, y: 700, font: await d.embedFont(StandardFonts.Helvetica), size: 20 }); bytes = await d.save(); }
const cert = certsDoPEM(await Deno.readTextFile(`${dir}/leaf.pem`))[0], ca = certsDoPEM(await Deno.readTextFile(`${dir}/ca.pem`))[0];
const chave = await crypto.subtle.importKey('pkcs8', pemParaDER(await Deno.readTextFile(`${dir}/leaf.pk8`)) as BufferSource, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
const prep = await prepararPDF(bytes, { tipo: 'receita', crm: '12345', uf: 'BA', especialidade: 'Ginecologia e Reprodução', nome: 'Dra. Teste', local: 'Salvador/BA' });
const at = await atributosAssinados(prep.hash, cert);
const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, at.der as BufferSource));
await Deno.writeFile(`${dir}/assinado.pdf`, embutir(prep, montarCMS(at.attrs, at.cert, [ca], sig)));
console.log('PDF assinado:', `${dir}/assinado.pdf`);
