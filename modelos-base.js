/* Modelos básicos de atestado (texto genérico, sem conteúdo clínico) — a médica pode editar à vontade.
   Variáveis preenchidas na hora: {paciente} {cpf} {data} {hora} {clinica} {idade}.
   Qualquer outra variável entre chaves (ex.: {dias}, {acompanhante}) é perguntada ao usar o modelo. */
window.MODELOS_BASE = [
  { tipo: 'atestado', nome: 'Atestado de afastamento', conteudo: { titulo: 'Atestado médico', texto: 'Atesto, para os devidos fins, que a Sra. {paciente}, inscrita no CPF nº {cpf}, foi atendida por mim nesta data, {data}, necessitando de {dias} de afastamento de suas atividades, a contar desta data, para sua recuperação.' } },
  { tipo: 'atestado', nome: 'Declaração de comparecimento', conteudo: { titulo: 'Declaração de comparecimento', texto: 'Declaro, para os devidos fins, que a Sra. {paciente}, inscrita no CPF nº {cpf}, compareceu a consulta médica nesta data, {data}, às {hora}.' } },
  { tipo: 'atestado', nome: 'Atestado de acompanhamento', conteudo: { titulo: 'Atestado de acompanhamento', texto: 'Atesto, para os devidos fins, que {acompanhante} esteve presente nesta data, {data}, às {hora}, acompanhando a paciente {paciente} em consulta médica.' } }
];
