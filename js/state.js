/* PetMove — estado efêmero de UI (rascunhos multi-etapa) */
window.PM = window.PM || {};

(function () {
  const CHAVE_SOLICITACAO = "petmove_rascunho_nova_solicitacao";

  let _novaSolicitacao = null;
  try {
    const raw = localStorage.getItem(CHAVE_SOLICITACAO);
    if (raw) _novaSolicitacao = JSON.parse(raw);
  } catch (e) {
    _novaSolicitacao = null;
  }

  PM.state = {
    cadastroCondutorId: null, // condutor em rascunho durante as etapas C-01..C-03

    get novaSolicitacao() {
      return _novaSolicitacao;
    },
    set novaSolicitacao(valor) {
      _novaSolicitacao = valor;
      try {
        if (valor) localStorage.setItem(CHAVE_SOLICITACAO, JSON.stringify(valor));
        else localStorage.removeItem(CHAVE_SOLICITACAO);
      } catch (e) {
        /* ignora se o armazenamento estiver indisponível */
      }
    },
  };
})();
