/* PetMove — wrappers de página comuns aos três perfis */
window.PM = window.PM || {};
PM.shared = {};

(function () {
  PM.shared.logoutAction = `<button class="icon-btn topbar-action-mobile" data-action="logout" aria-label="Sair">⎋</button>`;

  function ligarAcoesComuns(root) {
    PM.util.qsa('[data-action="logout"]', root).forEach((logoutBtn) => {
      logoutBtn.addEventListener("click", async () => {
        const ok = await PM.ui.confirmar({ titulo: "Sair", mensagem: "Deseja encerrar a sessão? Seus dados continuam salvos neste dispositivo." });
        if (ok) {
          PM.auth.logout();
          PM.router.navegar("#/");
        }
      });
    });
    PM.util.qsa('[data-action="reset-dados"]', root).forEach((resetBtn) => {
      resetBtn.addEventListener("click", async () => {
        const ok = await PM.ui.confirmar({
          titulo: "Reiniciar dados de demonstração",
          mensagem: "Isso vai apagar tudo e recriar os dados iniciais (seed). Deseja continuar?",
          perigo: true,
          confirmarLabel: "Reiniciar",
        });
        if (ok) {
          PM.auth.logout();
          PM.db.reiniciar();
          await PM.seed();
          PM.ui.toast("Dados reiniciados.", "success");
          PM.router.navegar("#/");
        }
      });
    });
  }

  PM.shared.montar = function (app, html) {
    app.innerHTML = html;
    document.body.classList.toggle("layout-sidebar", html.includes("bottom-nav") || html.includes("app-sidebar"));
    ligarAcoesComuns(app);
    return app;
  };

  PM.shared.paginaTutor = function (app, { title, back, actions = "", activeNav = "", content }) {
    const html = `
      ${PM.ui.topBar({ title, back, actions })}
      <div class="page">${content}</div>
      ${PM.ui.bottomNav(activeNav, PM.auth.usuarioAtual())}
    `;
    return PM.shared.montar(app, html);
  };

  PM.shared.paginaSimples = function (app, { title, back, actions = "", wide = false, sidebar = "", content }) {
    const html = `
      ${PM.ui.topBar({ title, back, actions, wide })}
      <div class="page ${wide ? "page-wide" : ""}">${content}</div>
      ${sidebar}
    `;
    return PM.shared.montar(app, html);
  };

  PM.shared.formToObject = function (form) {
    const fd = new FormData(form);
    const obj = {};
    for (const [k, v] of fd.entries()) obj[k] = v;
    return obj;
  };

  PM.shared.erroCard = function (mensagens) {
    if (!mensagens || !mensagens.length) return "";
    return `<div class="form-errors"><ul>${mensagens.map((m) => `<li>${PM.util.escapeHtml(m)}</li>`).join("")}</ul></div>`;
  };
})();
