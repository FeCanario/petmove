/* PetMove — estado efêmero de UI (rascunhos multi-etapa), não persistido no "banco" */
window.PM = window.PM || {};
PM.state = {
  novaSolicitacao: null, // rascunho da tela T-08 até a confirmação em T-09
  cadastroCondutorId: null, // condutor em rascunho durante as etapas C-01..C-03
};
