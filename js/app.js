/* PetMove — bootstrap da aplicação */
window.PM = window.PM || {};

(function () {
  document.addEventListener("click", (ev) => {
    const back = ev.target.closest("[data-nav-back]");
    if (back) {
      ev.preventDefault();
      PM.router.voltar();
    }
  });

  async function iniciar() {
    const recemCriado = PM.db.inicializarSeVazio();
    if (recemCriado) {
      await PM.seed();
    }
    PM.matching.retomarBuscasPendentes();
    PM.router.iniciar();
  }

  iniciar();
})();
