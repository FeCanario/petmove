/* PetMove — telas do Administrador: A-01 Fila de análise, A-02 Análise do cadastro */
window.PM = window.PM || {};

(function () {
  const CS = PM.CONDUTOR_STATUS;

  function condutoresComUsuario() {
    return PM.db.list("condutor").map((c) => ({ cond: c, usu: PM.db.get("usuario", c.usuario_id) }));
  }

  /* ===================== A-01 Fila de análise ===================== */
  function renderFila(params, app) {
    const todos = condutoresComUsuario();
    const pendentes = todos.filter((c) => c.cond.status_cadastro === CS.EM_ANALISE).sort((a, b) => new Date(a.cond.data_envio) - new Date(b.cond.data_envio));
    const contadores = {};
    todos.forEach((c) => (contadores[c.cond.status_cadastro] = (contadores[c.cond.status_cadastro] || 0) + 1));

    const content = `
      <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
        ${["EM_ANALISE", "ATIVO", "PENDENCIA", "REPROVADO"]
          .map((s) => `<div class="stat-box"><p class="stat-value">${contadores[s] || 0}</p><p class="stat-label">${s.replace("_", " ")}</p></div>`)
          .join("")}
      </div>
      <div class="card">
        <p class="section-title">Fila de análise (${pendentes.length})</p>
        <div class="list mt-8">
          ${
            pendentes.length
              ? pendentes
                  .map((c) => {
                    const esperaMin = Math.round((Date.now() - new Date(c.cond.data_envio).getTime()) / 60000);
                    return `
                <div class="card card-clickable" data-abrir="${c.cond.id}">
                  <div class="card-row" style="justify-content:space-between">
                    <span style="font-weight:700">${PM.util.escapeHtml(c.usu.nome)}</span>
                    ${PM.ui.badge(`${esperaMin} min`, "warning")}
                  </div>
                  <p class="text-muted" style="font-size:.8rem">Enviado em ${PM.util.formatDataHoraBR(c.cond.data_envio)}</p>
                </div>`;
                  })
                  .join("")
              : PM.ui.emptyState("✅", "Nenhum cadastro pendente", "")
          }
        </div>
      </div>
    `;
    PM.shared.paginaSimples(app, {
      title: "Fila de análise",
      wide: true,
      actions: PM.shared.logoutAction,
      sidebar: PM.ui.appSidebar({
        ativo: "fila",
        usuario: PM.auth.usuarioAtual(),
        itens: [{ key: "fila", label: "Fila de análise", icon: "📋", href: "#/admin/fila" }],
      }),
      content,
    });
    PM.util.qsa("[data-abrir]", app).forEach((el) => el.addEventListener("click", () => PM.router.navegar(`#/admin/analise/${el.dataset.abrir}`)));
  }

  /* ===================== A-02 Análise do cadastro ===================== */
  function renderAnalise(params, app) {
    const cond = PM.db.get("condutor", params.id);
    if (!cond) return PM.router.navegar("#/admin/fila");
    const usu = PM.db.get("usuario", cond.usuario_id);
    const veiculo = PM.db.query("veiculo", (v) => v.condutor_id === cond.id)[0];
    const docs = PM.db.listarDocumentos(cond.id);
    const docPor = (tipo) => docs.find((d) => d.tipo === tipo);

    const CHECKLIST = [
      { id: "legivel", label: "Documento legível" },
      { id: "nome", label: "Nome do cadastro igual ao da CNH" },
      { id: "rosto", label: "Rosto da selfie igual ao da foto do documento" },
      { id: "validade", label: "CNH dentro da validade" },
      { id: "categoria", label: "Categoria compatível com o veículo" },
      { id: "placa", label: "Placa da foto igual à declarada" },
    ];

    const content = `
      <div class="admin-grid two-col">
        <div class="list">
          <div class="card">
            <p class="section-title">Dados declarados</p>
            <div class="list mt-8" style="font-size:.88rem">
              <p><b>Nome:</b> ${PM.util.escapeHtml(usu.nome)}</p>
              <p><b>CPF:</b> ${PM.util.maskCPF(cond.cpf)}</p>
              <p><b>Nascimento:</b> ${PM.util.formatDataBR(cond.data_nascimento)} (${PM.util.idadeAnos(cond.data_nascimento)} anos)</p>
              <p><b>CNH:</b> ${cond.cnh_numero} · categoria ${cond.cnh_categoria} · validade ${PM.util.formatDataBR(cond.cnh_validade)}</p>
              <p><b>Veículo:</b> ${veiculo ? `${veiculo.marca} ${veiculo.modelo} ${veiculo.ano} · ${veiculo.tipo}` : "—"}</p>
              <p><b>Placa:</b> ${veiculo ? PM.util.maskPlaca(veiculo.placa) : "—"}</p>
              <p><b>Portes aceitos:</b> ${veiculo ? veiculo.portes_aceitos.join(", ") : "—"}</p>
            </div>
          </div>
          <div class="card">
            <p class="section-title">Checklist de conferência</p>
            <div class="checklist mt-8">
              ${CHECKLIST.map((c) => `<label><input type="checkbox" data-check="${c.id}"><span>${c.label}</span></label>`).join("")}
            </div>
          </div>
          <div class="card">
            <p class="section-title">Parecer</p>
            <textarea class="mt-8" data-justificativa rows="2" placeholder="Justificativa (obrigatória para reprovar ou marcar pendência)"></textarea>
            <div data-errors class="mt-8"></div>
            <div class="btn-row mt-8">
              <button class="btn btn-danger" data-acao="REPROVADO">Reprovar</button>
              <button class="btn btn-secondary" data-acao="PENDENCIA">Pendência</button>
            </div>
            <button class="btn btn-primary mt-8" data-acao="APROVADO" data-requer-checklist>Aprovar</button>
          </div>
        </div>
        <div class="list">
          <div class="card">
            <p class="section-title">Documentos enviados (toque para ampliar)</p>
            <div class="doc-thumb-grid mt-8">
              ${["cnh_frente", "cnh_verso", "selfie_documento", "veiculo_placa"]
                .map((tipo) => {
                  const d = docPor(tipo);
                  return d ? `<div class="doc-thumb" data-zoom="${d.arquivo}"><img src="${d.arquivo}" alt="${tipo}"></div>` : `<div class="doc-thumb">${PM.ui.emptyState("—", "Não enviado", "")}</div>`;
                })
                .join("")}
            </div>
          </div>
        </div>
      </div>
    `;
    PM.shared.paginaSimples(app, { title: "Análise do cadastro", back: true, wide: true, content });

    PM.util.qsa("[data-zoom]", app).forEach((el) =>
      el.addEventListener("click", () => {
        PM.ui.abrirModal(`<div class="modal-img-zoom"><img src="${el.dataset.zoom}" alt=""></div><div class="modal-actions mt-8"><button class="btn btn-secondary" data-modal-dismiss>Fechar</button></div>`);
      })
    );

    function checklistCompleto() {
      return PM.util.qsa("[data-check]", app).every((c) => c.checked);
    }

    PM.util.qsa("[data-acao]", app).forEach((btn) =>
      btn.addEventListener("click", () => {
        const acao = btn.dataset.acao;
        const justificativa = PM.util.qs("[data-justificativa]", app).value.trim();
        const errosEl = PM.util.qs("[data-errors]", app);
        if (acao === "APROVADO" && !checklistCompleto()) {
          errosEl.innerHTML = PM.shared.erroCard(["Confirme todos os itens do checklist antes de aprovar."]);
          return;
        }
        if (acao !== "APROVADO" && !justificativa) {
          errosEl.innerHTML = PM.shared.erroCard(["Justificativa é obrigatória para reprovar ou marcar pendência."]);
          return;
        }
        const admin = PM.auth.usuarioAtual();
        PM.fsm.transicionarCondutor(cond.id, acao, { analisadoPor: admin.id, parecer: acao, justificativa });
        PM.ui.toast(
          acao === "APROVADO" ? "Cadastro aprovado." : acao === "REPROVADO" ? "Cadastro reprovado." : "Cadastro marcado como pendência.",
          acao === "APROVADO" ? "success" : "danger"
        );
        PM.router.navegar("#/admin/fila");
      })
    );
  }

  PM.router.registrar("/admin/fila", "admin", renderFila);
  PM.router.registrar("/admin/analise/:id", "admin", renderAnalise);
})();
