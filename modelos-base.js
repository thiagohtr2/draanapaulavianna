/* =====================================================================
   Modelos sugeridos — carregados no primeiro acesso de cada conta.
   São pontos de partida para a médica revisar, editar e salvar como o
   seu próprio padrão. Itens marcados com "sugerido: true" mostram o selo
   "Sugerido" até serem editados e salvos.
   Atestados: {paciente} {cpf} {data} {hora} {idade} {clinica} entram
   sozinhos; {dias} e qualquer outro {campo} são perguntados na hora.
   ===================================================================== */
(function () {
  const S = true;
  const t = (campo, nome, texto) => ({ tipo: 'texto', nome, conteudo: { campo, texto, auto: false, sugerido: S } });
  const item = (nome, apresentacao, via, quantidade, posologia, antimicrobiano = false) => ({ nome, apresentacao, via, quantidade, posologia, antimicrobiano, controlado: false });

  window.MODELOS_BASE = [
    /* ---------- Textos padrão de cada campo ---------- */
    t('motivo', 'Rotina ginecológica', 'Consulta de rotina ginecológica, sem queixas no momento.'),
    t('motivo', 'Desejo de engravidar', 'Deseja engravidar. Tentando há __ meses.'),
    t('hda', 'Roteiro da história', 'Paciente de __ anos, G_ P_ A_, refere ________ há ________. Associado a ________. Nega ________. Já fez uso de ________.'),
    t('gineco_obs', 'Sem queixas ginecológicas', 'Ciclos menstruais regulares. Vida sexual ativa, parceria fixa. Nega dispareunia, sinusiorragia, corrimento ou prurido vulvar.'),
    t('exame_fisico', 'Exame físico e mamas normais', 'Bom estado geral, corada, hidratada, eupneica, afebril. Mamas simétricas, sem nódulos palpáveis, sem retrações ou descarga papilar; axilas e fossas supraclaviculares livres.'),
    t('exame_gineco', 'Exame ginecológico normal', 'Vulva e vagina sem lesões. Especular: colo epitelizado, conteúdo vaginal fisiológico. Toque: útero de volume normal, móvel, indolor; anexos não palpáveis.'),
    t('resultados', 'Roteiro de resultados', 'Exames de __/__/____: Hb __ g/dL; glicemia __ mg/dL; TSH __ mUI/L.\nColpocitologia (__/__/____): ________.\nUSG transvaginal (__/__/____): útero ________; endométrio __ mm; ovários ________.'),
    t('conduta', 'Rotina', 'Orientações gerais fornecidas. Solicitados exames de rotina. Retorno com resultados.'),
    t('orientacoes', 'Orientações gerais', '- Retornar com os exames solicitados.\n- Procurar atendimento se houver sangramento intenso, febre ou dor forte.'),
    t('indicacao_exames', 'Rotina anual', 'Rotina ginecológica anual.'),
    t('adendo', 'Contato por telefone', 'Contato telefônico em __/__/____: ________.'),
    t('antecedentes', 'Sem comorbidades', 'Nega hipertensão, diabetes, tireoidopatias e outras comorbidades. Nega cirurgias prévias. Antecedentes familiares: ________.'),
    t('medicacoes_uso', 'Nenhuma medicação', 'Nega uso de medicações contínuas.'),
    t('alergias', 'Nega alergias', 'Nega alergias medicamentosas.'),
    t('observacoes', 'Contato preferido', 'Prefere contato por WhatsApp.'),

    /* ---------- Prescrições ---------- */
    { tipo: 'prescricao', nome: 'Vaginose bacteriana', conteudo: { sugerido: S, itens: [item('Metronidazol', '250 mg comprimido', 'Oral', '28 comprimidos', 'Tomar 2 comprimidos, via oral, de 12 em 12 horas, por 7 dias.', true)], orientacoes: '- Não ingerir bebida alcoólica durante o tratamento e até 24 horas após o término.\n- Completar todo o tratamento, mesmo com melhora dos sintomas.' } },
    { tipo: 'prescricao', nome: 'Candidíase vulvovaginal', conteudo: { sugerido: S, itens: [item('Miconazol', 'creme vaginal 2%', 'Vaginal', '1 bisnaga', 'Aplicar 1 aplicador cheio via vaginal, à noite, ao deitar, por 7 noites.')], orientacoes: '- Evitar duchas vaginais.\n- Preferir roupas íntimas de algodão.' } },
    { tipo: 'prescricao', nome: 'Cistite não complicada', conteudo: { sugerido: S, itens: [item('Fosfomicina trometamol', '3 g envelope', 'Oral', '1 envelope', 'Dissolver o conteúdo de 1 envelope em meio copo de água e tomar em dose única, à noite, com a bexiga vazia.', true)], orientacoes: '- Aumentar a ingestão de água.\n- Procurar atendimento se houver febre, dor lombar ou piora dos sintomas.' } },
    { tipo: 'prescricao', nome: 'Cólica menstrual', conteudo: { sugerido: S, itens: [item('Ibuprofeno', '400 mg comprimido', 'Oral', '1 caixa', 'Tomar 1 comprimido, via oral, de 8 em 8 horas, se dor, durante a menstruação, por até 3 dias.')], orientacoes: '- Tomar após as refeições.\n- Procurar atendimento se a dor não melhorar.' } },
    { tipo: 'prescricao', nome: 'Pré-concepcional', conteudo: { sugerido: S, itens: [item('Ácido fólico', '5 mg comprimido', 'Oral', '1 caixa', 'Tomar 1 comprimido, via oral, uma vez ao dia, de uso contínuo.')], orientacoes: '- Iniciar pelo menos 30 dias antes de engravidar e manter até o fim do 1º trimestre.\n- Manter alimentação equilibrada e atividade física regular.' } },

    /* ---------- Solicitações de exames ---------- */
    { tipo: 'exames', nome: 'Rotina ginecológica anual', conteudo: { sugerido: S, indicacao: 'Rotina ginecológica anual.', exames: ['Hemograma completo', 'Glicemia de jejum', 'Colesterol total e frações', 'Triglicerídeos', 'TSH', 'Urina tipo 1 (EAS)', 'Colpocitologia oncótica', 'Ultrassonografia transvaginal', 'Ultrassonografia de mamas', 'Mamografia bilateral'].map(nome => ({ nome })) } },
    { tipo: 'exames', nome: 'Investigação de infertilidade', conteudo: { sugerido: S, indicacao: 'Investigação de infertilidade conjugal.', exames: ['Hormônio antimülleriano (AMH)', 'FSH, LH e estradiol (2º ao 4º dia do ciclo)', 'TSH', 'Prolactina', 'Ultrassonografia transvaginal com contagem de folículos antrais', 'Histerossalpingografia', 'Anti-HIV, VDRL, HBsAg e anti-HCV'].map(nome => ({ nome })) } },
    { tipo: 'exames', nome: 'Pré-concepcional', conteudo: { sugerido: S, indicacao: 'Avaliação pré-concepcional.', exames: ['Hemograma completo', 'Tipagem sanguínea ABO e fator Rh', 'Glicemia de jejum', 'TSH', 'Anti-HIV', 'VDRL', 'HBsAg', 'Anti-HCV', 'Rubéola IgG', 'Toxoplasmose IgG e IgM', 'Colpocitologia oncótica'].map(nome => ({ nome })) } },

    /* ---------- Atestados (texto genérico, sem conteúdo clínico) ---------- */
    { tipo: 'atestado', nome: 'Atestado de afastamento', conteudo: { sugerido: S, titulo: 'Atestado médico', texto: 'Atesto, para os devidos fins, que a Sra. {paciente}, inscrita no CPF nº {cpf}, foi atendida por mim nesta data, {data}, necessitando de {dias} de afastamento de suas atividades, a contar desta data, para sua recuperação.' } },
    { tipo: 'atestado', nome: 'Declaração de comparecimento', conteudo: { sugerido: S, titulo: 'Declaração de comparecimento', texto: 'Declaro, para os devidos fins, que a Sra. {paciente}, inscrita no CPF nº {cpf}, compareceu a consulta médica nesta data, {data}, às {hora}.' } },
    { tipo: 'atestado', nome: 'Atestado de acompanhamento', conteudo: { sugerido: S, titulo: 'Atestado de acompanhamento', texto: 'Atesto, para os devidos fins, que {acompanhante} esteve presente nesta data, {data}, às {hora}, acompanhando a paciente {paciente} em consulta médica.' } }
  ];
})();
