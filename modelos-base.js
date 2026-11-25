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
  const fol = (nome, titulo, referencia, linhas) => ({ tipo: 'orientacao', nome, conteudo: { sugerido: S, titulo, referencia, texto: linhas.join('\n') } });
  const orc = (nome, titulo, itens, inclui, naoInclui) => ({ tipo: 'orcamento', nome, conteudo: { sugerido: S, titulo,
    itens: itens.map(([grupo, descricao, detalhe]) => ({ grupo, descricao, detalhe, valor: null, incluso: false })), desconto: 0,
    pagamento: 'PIX ou transferência, à vista.\nCartão de crédito em até __ vezes.', inclui, nao_inclui: naoInclui, observacoes: '', validade_dias: 15, ciencia: true } });

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
    { tipo: 'atestado', nome: 'Atestado de acompanhamento', conteudo: { sugerido: S, titulo: 'Atestado de acompanhamento', texto: 'Atesto, para os devidos fins, que {acompanhante} esteve presente nesta data, {data}, às {hora}, acompanhando a paciente {paciente} em consulta médica.' } },

    /* ---------- Folhetos de orientação por protocolo ----------
       Conteúdo clínico SUGERIDO: revisar e ajustar à rotina da médica antes de usar.
       As datas {D±n} e {H±n} são calculadas a partir da data de referência informada na hora de usar. */
    fol('Inseminação intrauterina (IIU)', 'Inseminação intrauterina', 'Data e hora da inseminação', [
      '> Sua inseminação está marcada para {data_ref}, às {hora_ref}. Chegue 15 minutos antes.',
      '# Seu calendário',
      '@ {D-5} a {D-2} | Abstinência sexual do parceiro: de 2 a 5 dias antes da coleta do sêmen.',
      '@ {H-36} | Aplicar a medicação do gatilho da ovulação, exatamente no horário combinado.',
      '@ {H+0} | Coleta e preparo do sêmen no laboratório e, em seguida, a inseminação (cerca de 15 minutos).',
      '@ {D+14} | Exame de sangue beta-hCG (teste de gravidez).',
      '# No dia do procedimento',
      '+ Alimente-se normalmente: não é preciso jejum.',
      '+ Venha com a bexiga confortável — nem cheia, nem vazia.',
      '+ Traga documento com foto e o resultado dos últimos exames.',
      'x Não use cremes, óvulos ou duchas vaginais nas 48 horas anteriores, salvo se prescritos.',
      '# Depois da inseminação',
      '+ Pode voltar ao trabalho e às atividades habituais no mesmo dia.',
      '+ Relações sexuais estão liberadas, salvo outra orientação.',
      '+ Cólica leve e um pequeno sangramento nas primeiras horas são esperados.',
      '+ Use a progesterona conforme a receita, se ela foi prescrita.',
      'x Evite exercícios de alto impacto nas primeiras 24 horas.',
      'x Não tome medicações por conta própria, inclusive anti-inflamatórios.',
      '> Fale comigo ou procure atendimento se tiver febre, dor abdominal forte ou sangramento intenso.',
      '# Teste de gravidez',
      '1. Faça o beta-hCG no sangue em {D+14}. Não precisa de jejum.',
      '2. Não faça teste de farmácia antes dessa data: o resultado pode ser falso.',
      '3. Envie o resultado para mim assim que sair.'
    ]),
    fol('Coito programado', 'Coito programado', 'Data e hora do gatilho da ovulação', [
      '> Gatilho da ovulação: {data_ref}, às {hora_ref}. Aplique no horário exato.',
      '# Seu calendário',
      '@ {H+0} | Aplicar a medicação do gatilho.',
      '@ {D+1} e {D+2} | Ter relações sexuais nestes dois dias: a ovulação acontece cerca de 36 horas depois do gatilho.',
      '@ {D+16} | Exame de sangue beta-hCG (teste de gravidez).',
      '# Durante o ciclo',
      '+ Relações nos dias anteriores também estão liberadas e não atrapalham.',
      '+ Mantenha as atividades normais, inclusive exercícios leves e moderados.',
      '+ Use a progesterona exatamente como prescrita, se ela estiver na sua receita.',
      'x Evite lubrificantes comuns: podem prejudicar os espermatozoides. Se precisar, use um próprio para quem deseja engravidar.',
      'x Evite álcool e cigarro durante todo o tratamento.',
      '# Teste de gravidez',
      '1. Faça o beta-hCG no sangue em {D+16}.',
      '2. Não suspenda nenhuma medicação antes de falar comigo.'
    ]),
    fol('Punção folicular (captação de óvulos)', 'Punção folicular', 'Data e hora da punção', [
      '> Sua punção está marcada para {data_ref}, às {hora_ref}. Chegue 1 hora antes ao local indicado.',
      '# Seu calendário',
      '@ {H-36} | Aplicar o gatilho (maturação final dos óvulos), exatamente no horário combinado.',
      '@ {H-8} | Início do jejum de alimentos (8 horas antes da punção).',
      '@ {H-2} | Último gole de água (até 2 horas antes).',
      '@ {H+0} | Punção sob sedação: cerca de 20 a 30 minutos, mais o tempo de recuperação.',
      '# Prepare-se',
      '+ Venha com um adulto: a alta só é dada com acompanhante.',
      '+ Use roupas confortáveis e venha sem maquiagem, esmalte, joias e piercings.',
      '+ Traga documento com foto e os exames solicitados.',
      '+ Se o parceiro for colher o sêmen no dia, ele deve fazer abstinência de 2 a 5 dias.',
      'x Não use perfume, creme corporal ou desodorante perfumado no dia: o laboratório de embriologia é sensível a odores.',
      'x Não dirija nem opere máquinas nas 24 horas seguintes à sedação.',
      '# Depois da punção',
      '+ Repouse no restante do dia; no dia seguinte, pode retomar atividades leves.',
      '+ Cólica leve, sensação de inchaço e pequeno sangramento vaginal são comuns.',
      '+ Beba bastante líquido e prefira refeições leves.',
      'x Evite relações sexuais e exercícios intensos até a liberação médica.',
      'x Não tome anti-inflamatórios por conta própria: use apenas o analgésico prescrito.',
      '> Procure atendimento se tiver dor abdominal forte, falta de ar, barriga muito inchada, vômitos, febre ou sangramento intenso.'
    ]),
    fol('Transferência embrionária e pós-transferência', 'Transferência embrionária', 'Data e hora da transferência', [
      '> Sua transferência está marcada para {data_ref}, às {hora_ref}.',
      '# Seu calendário',
      '@ {H+0} | Transferência do embrião: procedimento rápido, em geral sem anestesia.',
      '@ Até o beta-hCG | Usar a progesterona todos os dias, nos horários da receita. Não suspenda por conta própria.',
      '@ {D+9} | Exame de sangue beta-hCG (teste de gravidez), pela manhã.',
      '# No dia',
      '+ Venha com a bexiga cheia: beba de 500 mL a 1 litro de água cerca de 1 hora antes e não urine.',
      '+ Alimente-se normalmente.',
      'x Não use perfume nem creme perfumado no dia.',
      '# Depois da transferência',
      '+ Pode retomar as atividades habituais no mesmo dia: repouso absoluto não é necessário.',
      '+ Pode tomar banho normalmente.',
      '+ Cólica leve ou um pequeno sangramento podem acontecer e não significam que o tratamento falhou.',
      'x Evite exercícios intensos, carregar peso e relações sexuais até o resultado do beta-hCG.',
      'x Evite banheira, piscina e mar até o resultado.',
      'x Não faça teste de farmácia antes da data do exame.',
      'x Não use medicações, chás ou suplementos sem me consultar.',
      '> Fale comigo se tiver sangramento intenso, dor forte ou febre.'
    ]),
    fol('Como aplicar a medicação injetável (subcutânea)', 'Aplicação de medicação injetável', '', [
      '# Antes de aplicar',
      '1. Lave bem as mãos com água e sabão.',
      '2. Separe a medicação, uma agulha nova e algodão com álcool 70%.',
      '3. Confira o nome, a dose e o horário na sua receita.',
      '# Passo a passo',
      '1. Escolha o local: barriga, a cerca de dois dedos do umbigo. Alterne os lados a cada dia.',
      '2. Limpe a pele com álcool e espere secar.',
      '3. Faça uma prega na pele com o polegar e o indicador.',
      '4. Introduza a agulha inteira, em ângulo reto (90 graus).',
      '5. Injete devagar e conte até 10 antes de retirar a agulha.',
      '6. Solte a prega e pressione de leve com algodão, sem massagear.',
      '# Cuidados',
      '+ Aplique sempre no mesmo horário, salvo outra orientação.',
      '+ Guarde a medicação como indica a bula: algumas ficam na geladeira (de 2 a 8 graus), fora da porta.',
      '+ Descarte as agulhas num recipiente rígido, como uma garrafa PET, e leve a uma farmácia ou unidade de saúde.',
      'x Não reutilize agulhas e não compartilhe canetas.',
      'x Não aplique sobre hematoma, cicatriz ou ferida.',
      '> Esqueceu uma dose ou aplicou errado? Não dobre a próxima: fale comigo no mesmo dia.'
    ]),

    /* ---------- Orçamentos (valores em branco: preencha e salve como o seu padrão) ---------- */
    orc('Inseminação intrauterina (IIU)', 'Inseminação intrauterina', [
      ['Honorários médicos', 'Consulta de planejamento do tratamento', ''],
      ['Honorários médicos', 'Ultrassonografias de monitorização da ovulação', 'Em média, 3 a 4 exames no ciclo'],
      ['Honorários médicos', 'Inseminação intrauterina', ''],
      ['Laboratório', 'Preparo seminal (capacitação espermática)', 'Realizado pelo laboratório parceiro'],
      ['Medicações (estimativa)', 'Indutores da ovulação e gatilho', 'Compra direta na farmácia; valor aproximado'],
      ['Medicações (estimativa)', 'Progesterona (suporte da fase lútea)', 'Se prescrita']
    ], 'Acompanhamento pelo WhatsApp durante o ciclo', 'Exames laboratoriais e beta-hCG\nNovo ciclo, caso necessário'),
    orc('Coito programado', 'Coito programado', [
      ['Honorários médicos', 'Consulta de planejamento do tratamento', ''],
      ['Honorários médicos', 'Ultrassonografias de monitorização da ovulação', 'Em média, 3 a 4 exames no ciclo'],
      ['Medicações (estimativa)', 'Indutores da ovulação e gatilho', 'Compra direta na farmácia; valor aproximado']
    ], 'Acompanhamento pelo WhatsApp durante o ciclo', 'Exames laboratoriais e beta-hCG'),
    orc('FIV/ICSI — ciclo completo', 'Fertilização in vitro (FIV/ICSI)', [
      ['Honorários médicos', 'Acompanhamento da estimulação ovariana', 'Consultas e ultrassonografias do ciclo'],
      ['Honorários médicos', 'Punção folicular (captação de óvulos)', ''],
      ['Honorários médicos', 'Transferência embrionária', ''],
      ['Procedimentos', 'Anestesia (sedação para a punção)', 'Equipe de anestesia'],
      ['Laboratório', 'Laboratório de embriologia (FIV/ICSI e cultivo)', ''],
      ['Laboratório', 'Congelamento de embriões excedentes', 'Se houver'],
      ['Medicações (estimativa)', 'Medicações da estimulação ovariana', 'Varia com a dose e a resposta; compra direta na farmácia']
    ], 'Acompanhamento pelo WhatsApp durante o ciclo', 'Taxa anual de armazenamento de embriões congelados\nExames laboratoriais e beta-hCG')
  ];
})();
