/* PetMove — constantes de negócio (RN-01..RN-21) */
window.PM = window.PM || {};

PM.CONST = {
  TARIFA_BASE: 12.0,
  VALOR_POR_KM: 2.5,
  ADICIONAL_PORTE: { P: 0, M: 5, G: 10, GG: 15 },
  PACOTE_PASSEIO: { 30: 35, 45: 48, 60: 60 },
  VALOR_MINIMO_SERVICO: 20,
  TAXA_CANCELAMENTO: 8,
  COMISSAO_PLATAFORMA: 0.2,
  REPASSE_CONDUTOR: 0.8,
  VALIDADE_ANTIRRABICA_MESES: 12,
  IDADE_MINIMA_CONDUTOR: 21,
  LIMITE_OBSERVACOES: 300,
  TEMPO_OFERTA_SEGUNDOS: 30,
  TEMPO_BUSCA_MAXIMO_SEGUNDOS: 120,
  AUTO_ACEITE_MIN_SEGUNDOS: 5,
  AUTO_ACEITE_MAX_SEGUNDOS: 20,
  TENTATIVAS_CODIGO_ENTREGA: 3,
  LIMITE_FOTO_MB: 1,
  AVISO_VENCIMENTO_CNH_DIAS: 30,
};

/* TODO: troque pelo número real da loja (DDI+DDD+número, só dígitos) e pela mensagem inicial desejada */
PM.WHATSAPP = {
  numero: "5511999999999",
  mensagem: "Olá! Vim pelo site da PetMove e gostaria de saber mais sobre o serviço.",
};

PM.PORTES = ["P", "M", "G", "GG"];
PM.PORTE_LABEL = { P: "Pequeno (até 10kg)", M: "Médio (10-25kg)", G: "Grande (25-45kg)", GG: "Gigante (+45kg)" };

PM.TEMPERAMENTOS = ["Dócil", "Agitado", "Ansioso", "Reativo"];

PM.CONDUTOR_STATUS = {
  RASCUNHO: "RASCUNHO",
  EM_ANALISE: "EM_ANALISE",
  PENDENCIA: "PENDENCIA",
  REPROVADO: "REPROVADO",
  APROVADO: "APROVADO",
  SUSPENSO: "SUSPENSO",
  ATIVO: "ATIVO",
};

PM.SERVICO_TIPO = { TRANSPORTE: "TRANSPORTE", PASSEIO: "PASSEIO" };

PM.SERVICO_STATUS = {
  SOLICITADO: "SOLICITADO",
  PROCURANDO_CONDUTOR: "PROCURANDO_CONDUTOR",
  SEM_CONDUTOR: "SEM_CONDUTOR",
  ACEITO: "ACEITO",
  A_CAMINHO_ORIGEM: "A_CAMINHO_ORIGEM",
  NA_ORIGEM: "NA_ORIGEM",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  NO_DESTINO: "NO_DESTINO",
  CONCLUIDO: "CONCLUIDO",
  AVALIADO: "AVALIADO",
  CANCELADO_PELO_TUTOR: "CANCELADO_PELO_TUTOR",
  CANCELADO_PELO_CONDUTOR: "CANCELADO_PELO_CONDUTOR",
};

PM.SERVICO_STATUS_LABEL = {
  SOLICITADO: "Solicitado",
  PROCURANDO_CONDUTOR: "Procurando condutor",
  SEM_CONDUTOR: "Nenhum condutor disponível",
  ACEITO: "Condutor a caminho",
  A_CAMINHO_ORIGEM: "Condutor a caminho",
  NA_ORIGEM: "Condutor chegou",
  EM_ANDAMENTO: "Em andamento",
  NO_DESTINO: "Chegou ao destino",
  CONCLUIDO: "Concluído",
  AVALIADO: "Avaliado",
  CANCELADO_PELO_TUTOR: "Cancelado pelo tutor",
  CANCELADO_PELO_CONDUTOR: "Cancelado pelo condutor",
};

PM.FORMAS_PAGAMENTO = ["PIX", "Cartão", "Dinheiro"];

PM.VEICULO_TIPOS = ["Carro", "Moto", "Van"];

PM.DOCUMENTO_TIPO = {
  CNH_FRENTE: "cnh_frente",
  CNH_VERSO: "cnh_verso",
  SELFIE_DOCUMENTO: "selfie_documento",
  VEICULO_PLACA: "veiculo_placa",
  CRLV: "crlv",
  COMPROVANTE_RESIDENCIA: "comprovante_residencia",
  CARTEIRA_VACINACAO: "carteira_vacinacao",
};
