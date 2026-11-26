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
  // Livreto do ciclo: textos fixos do livreto; as datas e medicações vêm do ciclo de cada paciente.
  // {paciente} = primeiro nome. Telefones e e-mail de contato ficam em branco para a médica preencher.
  const CUIDADO = {
    atividade: { icone: 'atividade', titulo: 'Atividade física', texto: 'A partir do 5º dia de estimulação, os ovários ficam maiores e mais sensíveis. Prefira caminhadas leves e evite atividades de impacto: corrida, crossfit, ciclismo, aulas aeróbicas, pilates e fisioterapia.' },
    rotina: { icone: 'rotina', titulo: 'Vida normal', texto: 'No início do tratamento você pode manter a rotina: trabalhar, dirigir e ter relações sexuais, salvo orientação diferente.' },
    alcool: { icone: 'alcool', titulo: 'Álcool e cigarro', texto: 'Não consuma bebidas alcoólicas nem fume durante o tratamento: eles prejudicam a resposta às medicações e a qualidade dos óvulos.' },
    esqueceu: { icone: 'alarme', titulo: 'Esqueceu uma aplicação?', texto: 'Não aplique duas doses juntas. Avise a equipe assim que perceber, pelos contatos deste livreto, para receber a orientação certa.' },
    reacao: { icone: 'gelo', titulo: 'Reação no local da aplicação', texto: 'Vermelhidão, um pequeno inchaço ou coceira podem acontecer. Uma compressa fria por alguns minutos ajuda. Se não melhorar, entre em contato.' },
    estetica: { icone: 'estetica', titulo: 'Estética, dentista e cirurgias', texto: 'Durante a estimulação, adie procedimentos estéticos, tratamentos dentários e pequenas cirurgias. Tintura e química no cabelo estão liberadas.' },
    guardar: { icone: 'geladeira', titulo: 'Como guardar as medicações', texto: 'Siga a orientação da farmácia: algumas ficam na geladeira (nunca no congelador) e outras em temperatura ambiente. No transporte, use bolsa térmica.' },
    alerta: { icone: 'aviso', titulo: 'Sinais de alerta', texto: 'Procure a equipe se tiver dor abdominal forte, barriga muito inchada, falta de ar, vômitos ou sangramento intenso.' }
  };
  const SUSPENSAO = [
    'Algumas medicações precisam ser suspensas antes de procedimentos com sedação. Avise a equipe se você usa alguma delas (tempo mínimo de suspensão antes do procedimento):',
    '## Análogos do GLP-1 · controle do diabetes ou emagrecimento · reduzir o risco de aspiração pulmonar',
    'Lixisenatida | 1 dia antes',
    'Liraglutida (Victoza®, Saxenda®) | 2 dias antes',
    'Tirzepatida (Mounjaro®) | 15 dias antes',
    'Semaglutida (Ozempic®, Rybelsus®, Wegovy®) | 21 dias antes',
    '## Inibidores da SGLT2 · controle do diabetes · reduzir o risco de cetoacidose',
    'Dapagliflozina (Forxiga®) | 2 dias antes',
    'Empagliflozina (Jardiance®) | 2 dias antes',
    '* Se você tem diabetes, converse com o seu endocrinologista sobre como substituir a medicação nesse período.'
  ].join('\n');
  const liv = (nome, protocolos, c) => ({ tipo: 'livreto', nome, conteudo: {
    sugerido: S, protocolos, titulo: 'Jornada do tratamento', subtitulo: 'Seu guia do ciclo, passo a passo',
    boas_vindas_titulo: c.boas_vindas_titulo, boas_vindas: c.boas_vindas, etapas: c.etapas.join('\n'),
    cuidados: c.cuidados.map(x => ({ ...x })), suspensao: c.suspensao || '',
    lembretes: 'Aplique as medicações sempre no mesmo horário, de preferência à noite. Em caso de dúvida sobre a aplicação, dor ou sangramento, fale com a equipe.',
    contatos: { clinica_tel: '', clinica_horario: 'Segunda a sexta, em horário comercial', whatsapp: '', whatsapp_horario: 'Mensagens em horário comercial', emergencia_tel: '', emergencia_horario: 'Noites, fins de semana e feriados', email_exames: '', obs: 'Se você faz os controles fora de Salvador, envie as ultrassonografias por e-mail no mesmo dia do exame e avise a equipe.' },
    procedimento: { ...c.procedimento, dia: c.procedimento.dia.join('\n') },
    encerramento: 'Cada etapa deste caminho é cuidada com atenção e carinho. Conte com a nossa equipe sempre que precisar.'
  } });

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
    ], 'Acompanhamento pelo WhatsApp durante o ciclo', 'Taxa anual de armazenamento de embriões congelados\nExames laboratoriais e beta-hCG'),

    /* ---------- Protocolo padrão do ciclo (exemplo): tudo contado a partir do Dia 01 ---------- */
    { tipo: 'ciclo', nome: 'Exemplo — FIV com antagonista', conteudo: { sugerido: S, protocolo: 'FIV / ICSI', dias: '', modelo_id: '', obs: '',
      meds: [
        { nome: 'Gonal-f', dose: '225 UI', via: 'Subcutânea', horario: '20:00', de: 1, ate: 10 },
        { nome: 'Menopur', dose: '75 UI', via: 'Subcutânea', horario: '20:00', de: 1, ate: 10 },
        { nome: 'Cetrotide', dose: '0,25 mg', via: 'Subcutânea', horario: '08:00', de: 6, ate: 9 }
      ],
      controles: [{ dia: 5, hora: '08:30', us: true, sangue: true }, { dia: 7, hora: '08:30', us: true, sangue: false }, { dia: 9, hora: '08:00', us: true, sangue: true }],
      final: [
        { med: 'Cetrotide 0,25 mg', via: 'Subcutânea', dia: 10, hora: '08:00' },
        { med: 'Ovidrel 250 mcg', via: 'Subcutânea', dia: 10, hora: '20:00' },
        { med: 'Azitromicina 1 g (1 comprimido) ou 500 mg (2 comprimidos), após o jantar', via: 'Oral', dia: 11, hora: '20:00' }
      ],
      procedimento: { dia: 12, hora: '08:00' } } },

    /* ---------- Livretos do ciclo de tratamento (fertilidade) ---------- */
    liv('Livreto do ciclo — FIV / ICSI', ['FIV / ICSI', 'Congelamento de óvulos'], {
      boas_vindas_titulo: 'Que bom caminhar com você',
      boas_vindas: 'Querida {paciente}, este livreto acompanha você em cada etapa do tratamento. Aqui estão o seu calendário de medicações, as datas dos controles, o preparo para a punção e os cuidados do dia a dia.\nGuarde-o com você, marque cada aplicação feita e traga-o a todos os controles. Se surgir qualquer dúvida, fale com a nossa equipe: estamos aqui para cuidar de você.',
      etapas: ['Consulta e planejamento', 'Exames e preparo', 'Estimulação ovariana', 'Ultrassons de controle', 'Indução final (gatilho)', 'Punção ovariana', 'Laboratório: fertilização e cultivo', 'Transferência embrionária', 'Teste de gravidez (beta-hCG)'],
      cuidados: [CUIDADO.atividade, CUIDADO.rotina, CUIDADO.alcool, CUIDADO.esqueceu, CUIDADO.reacao, CUIDADO.estetica, CUIDADO.guardar, CUIDADO.alerta],
      suspensao: SUSPENSAO,
      procedimento: {
        titulo: 'Punção ovariana', rotulo: 'Punção', antecedencia: 30,
        preparo: 'Para a punção, o termo de consentimento precisa estar assinado e entregue até o dia do procedimento, e as sorologias atualizadas (feitas há menos de 3 meses).',
        alerta: 'Siga os horários à risca e coloque alarmes no celular: o horário do gatilho é calculado para a punção e não pode atrasar.',
        jejum: 'Fique em jejum absoluto a partir de {H-8} (8 horas antes da punção): não coma nem beba nada — nem água, chá, suco, balas ou chiclete.',
        dia_titulo: 'No dia da punção',
        dia: [
          '> A sedação é feita na veia. Depois da punção, você fica em observação por cerca de 20 a 30 minutos e recebe as orientações de alta.',
          '+ Venha com um acompanhante adulto: a alta só é dada com acompanhante.',
          '+ Se for preciso colher o sêmen no mesmo dia, o parceiro deve fazer abstinência sexual de 2 a 5 dias.',
          '+ Avise a equipe sobre alergias, doenças e medicações em uso.',
          '+ Remédios de uso contínuo, como os de pressão, podem ser tomados com um pequeno gole de água.',
          '+ Venha com roupas confortáveis.',
          'x Não beba álcool nem fume nas 24 horas antes do procedimento.',
          'x Retire próteses dentárias móveis, aparelhos auditivos, óculos ou lentes de contato, joias e piercings.',
          'x Não use maquiagem, cremes, óleos, hidratantes, perfume ou qualquer produto com cheiro.',
          'x Retire unhas de gel, se usar.',
          'x Não programe viagens para o dia do procedimento e não dirija nas 24 horas seguintes à sedação.'
        ]
      }
    }),
    liv('Livreto do ciclo — Inseminação intrauterina', ['Inseminação intrauterina'], {
      boas_vindas_titulo: 'Que bom caminhar com você',
      boas_vindas: 'Querida {paciente}, este livreto acompanha você em cada etapa da inseminação. Aqui estão o seu calendário de medicações, as datas dos controles, o preparo para o procedimento e os cuidados do dia a dia.\nMarque cada aplicação feita e traga o livreto a todos os controles. Se surgir qualquer dúvida, fale com a nossa equipe.',
      etapas: ['Consulta e planejamento', 'Exames e preparo', 'Estímulo da ovulação', 'Ultrassons de controle', 'Indução da ovulação (gatilho)', 'Inseminação', 'Suporte da fase lútea', 'Teste de gravidez (beta-hCG)'],
      cuidados: [{ icone: 'atividade', titulo: 'Atividade física', texto: 'Atividades leves estão liberadas. Quando os folículos estiverem maiores, evite exercícios de impacto, conforme a orientação dos controles.' }, CUIDADO.rotina, CUIDADO.alcool, CUIDADO.esqueceu, CUIDADO.reacao, CUIDADO.guardar, CUIDADO.alerta],
      procedimento: {
        titulo: 'Inseminação intrauterina', rotulo: 'Inseminação', antecedencia: 15,
        preparo: 'O parceiro deve fazer abstinência sexual de 2 a 5 dias antes da coleta do sêmen. A coleta é feita no laboratório, em geral cerca de 2 horas antes da inseminação — confirme o horário com a equipe.',
        alerta: 'Siga os horários à risca e coloque alarmes no celular: o horário do gatilho é calculado para a inseminação.',
        jejum: '',
        dia_titulo: 'No dia da inseminação',
        dia: [
          '> A inseminação é rápida e costuma ser indolor, parecida com a coleta do preventivo. Não precisa de jejum nem de anestesia.',
          '+ Depois do procedimento você pode retomar a rotina normalmente.',
          '+ Use a progesterona exatamente como prescrita, se ela estiver na sua receita.',
          'x Evite lubrificantes comuns: eles prejudicam os espermatozoides.',
          'x Evite álcool e cigarro durante todo o tratamento.'
        ]
      }
    }),
    liv('Livreto do ciclo — Coito programado', ['Coito programado'], {
      boas_vindas_titulo: 'Que bom caminhar com você',
      boas_vindas: 'Querida {paciente}, este livreto reúne o seu calendário de medicações, as datas dos controles e o dia indicado para as relações. Marque cada aplicação feita e traga o livreto aos controles.',
      etapas: ['Consulta e planejamento', 'Estímulo da ovulação', 'Ultrassons de controle', 'Indução da ovulação (gatilho)', 'Relações programadas', 'Teste de gravidez (beta-hCG)'],
      cuidados: [CUIDADO.rotina, CUIDADO.alcool, CUIDADO.esqueceu, CUIDADO.reacao, CUIDADO.guardar, CUIDADO.alerta],
      procedimento: {
        titulo: 'Relações programadas', rotulo: 'Relação', antecedencia: 0,
        preparo: 'As relações sexuais devem acontecer na data indicada abaixo, contada a partir do gatilho. Siga também a orientação sobre os dias seguintes.',
        alerta: 'Coloque um alarme para o horário do gatilho: ele marca o momento da ovulação.',
        jejum: '', dia_titulo: 'Dicas para o período fértil',
        dia: [
          '+ Mantenha relações na data indicada e, se não houver outra orientação, também no dia seguinte.',
          '+ Use a progesterona exatamente como prescrita, se ela estiver na sua receita.',
          'x Evite lubrificantes comuns: eles prejudicam os espermatozoides.',
          'x Evite álcool e cigarro durante todo o tratamento.'
        ]
      }
    }),
    liv('Livreto do ciclo — Transferência de embrião congelado', ['Transferência de embrião congelado'], {
      boas_vindas_titulo: 'Que bom caminhar com você',
      boas_vindas: 'Querida {paciente}, este livreto acompanha o preparo do endométrio para a transferência do embrião. Aqui estão o seu calendário de medicações, as datas dos controles e as orientações para o dia da transferência.',
      etapas: ['Consulta e planejamento', 'Preparo do endométrio', 'Ultrassons de controle', 'Início da progesterona', 'Transferência embrionária', 'Teste de gravidez (beta-hCG)'],
      cuidados: [CUIDADO.rotina, CUIDADO.alcool, CUIDADO.esqueceu, CUIDADO.guardar, CUIDADO.alerta],
      procedimento: {
        titulo: 'Transferência embrionária', rotulo: 'Transferência', antecedencia: 30,
        preparo: 'A transferência é rápida, feita sem anestesia e guiada por ultrassom. Em geral, a bexiga precisa estar moderadamente cheia: siga a orientação da equipe sobre quanta água beber antes.',
        alerta: 'Não interrompa o estradiol nem a progesterona sem falar com a equipe.',
        jejum: '', dia_titulo: 'No dia da transferência',
        dia: [
          '> Depois da transferência você pode retomar atividades leves. Repouso absoluto não é necessário.',
          '+ Venha com roupas confortáveis.',
          '+ Mantenha a progesterona e as demais medicações exatamente como prescritas.',
          'x Não use perfume ou cremes com cheiro no dia.',
          'x Evite álcool e cigarro durante todo o tratamento.'
        ]
      }
    })
  ];
})();
