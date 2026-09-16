/* PetMove — componentes de UI reutilizáveis */
window.PM = window.PM || {};

PM.ui = {
  h(strings, ...values) {
    return strings.reduce((acc, s, i) => acc + s + (values[i] !== undefined ? values[i] : ""), "");
  },

  topBar({ title, back, actions = "", wide = false }) {
    return `
      <header class="topbar ${wide ? "topbar-wide" : ""}">
        ${back ? `<button class="icon-btn" data-nav-back aria-label="Voltar">←</button>` : `<span class="icon-btn spacer"></span>`}
        <h1 class="topbar-title">${PM.util.escapeHtml(title)}</h1>
        <div class="topbar-actions">${actions}</div>
      </header>`;
  },

  bottomNav(ativo, usuario) {
    const itens = [
      { key: "home", label: "Início", icon: "🏠", href: "#/tutor/home" },
      { key: "pets", label: "Pets", icon: "🐾", href: "#/tutor/pets" },
      { key: "historico", label: "Histórico", icon: "🕓", href: "#/tutor/historico" },
      { key: "perfil", label: "Perfil", icon: "👤", href: "#/tutor/perfil" },
    ];
    return `
      <nav class="bottom-nav">
        <div class="bottom-nav-brand"><img src="assets/PetMove.jpeg" alt="">PetMove</div>
        ${itens
          .map(
            (i) => `
          <a class="bottom-nav-item ${ativo === i.key ? "is-active" : ""}" href="${i.href}">
            <span class="bottom-nav-icon">${i.icon}</span>
            <span class="bottom-nav-label">${i.label}</span>
          </a>`
          )
          .join("")}
        ${
          usuario
            ? `<div class="bottom-nav-profile">
                <a class="bottom-nav-profile-user" href="#/tutor/perfil">
                  <img class="avatar" src="${usuario.foto}" alt="">
                  <span class="bottom-nav-profile-name">${PM.util.escapeHtml(usuario.nome)}</span>
                </a>
                <button type="button" class="bottom-nav-logout" data-action="logout">⎋ Sair</button>
              </div>`
            : ""
        }
      </nav>`;
  },

  /* Barra lateral genérica pra Condutor/Admin no computador (some por completo no celular) */
  appSidebar({ itens, ativo, usuario, perfilHref }) {
    const nomeUsuario = usuario
      ? `<img class="avatar" src="${usuario.foto}" alt=""><span class="bottom-nav-profile-name">${PM.util.escapeHtml(usuario.nome)}</span>`
      : "";
    return `
      <nav class="app-sidebar">
        <div class="bottom-nav-brand"><img src="assets/PetMove.jpeg" alt="">PetMove</div>
        ${itens
          .map(
            (i) => `
          <a class="bottom-nav-item ${ativo === i.key ? "is-active" : ""}" href="${i.href}">
            <span class="bottom-nav-icon">${i.icon}</span>
            <span class="bottom-nav-label">${i.label}</span>
          </a>`
          )
          .join("")}
        ${
          usuario
            ? `<div class="bottom-nav-profile">
                ${perfilHref ? `<a class="bottom-nav-profile-user" href="${perfilHref}">${nomeUsuario}</a>` : `<div class="bottom-nav-profile-user">${nomeUsuario}</div>`}
                <button type="button" class="bottom-nav-logout" data-action="logout">⎋ Sair</button>
              </div>`
            : ""
        }
      </nav>`;
  },

  card(inner, cls = "") {
    return `<div class="card ${cls}">${inner}</div>`;
  },

  emptyState(icon, title, subtitle, actionHtml = "") {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <p class="empty-state-title">${PM.util.escapeHtml(title)}</p>
        ${subtitle ? `<p class="empty-state-subtitle">${PM.util.escapeHtml(subtitle)}</p>` : ""}
        ${actionHtml}
      </div>`;
  },

  chipGroup(name, options, selecionados = [], { unico = false } = {}) {
    return `
      <div class="chip-group" data-chip-group="${name}" ${unico ? 'data-chip-unico="1"' : ""}>
        ${options
          .map(
            (op) => `
          <button type="button" class="chip ${selecionados.includes(op) ? "is-selected" : ""}" data-chip-value="${PM.util.escapeHtml(op)}">
            ${PM.util.escapeHtml(op)}
          </button>`
          )
          .join("")}
      </div>`;
  },

  ativarChipGroup(root) {
    PM.util.qsa("[data-chip-group]", root).forEach((grupo) => {
      const unico = grupo.dataset.chipUnico === "1";
      PM.util.qsa(".chip", grupo).forEach((chip) => {
        chip.addEventListener("click", () => {
          if (unico) {
            PM.util.qsa(".chip", grupo).forEach((c) => c.classList.toggle("is-selected", c === chip));
          } else {
            chip.classList.toggle("is-selected");
          }
        });
      });
    });
  },

  valorChipGroup(root, name) {
    const grupo = PM.util.qs(`[data-chip-group="${name}"]`, root);
    if (!grupo) return [];
    return PM.util.qsa(".chip.is-selected", grupo).map((c) => c.dataset.chipValue);
  },

  estrelas(nota, interativo = false, name = "nota") {
    const cheias = Math.round(nota);
    if (!interativo) {
      return `<span class="stars" aria-label="${nota} de 5 estrelas">${[1, 2, 3, 4, 5]
        .map((i) => `<span class="${i <= cheias ? "star-on" : "star-off"}">★</span>`)
        .join("")}</span>`;
    }
    return `
      <div class="stars-input" data-stars-input="${name}">
        ${[1, 2, 3, 4, 5]
          .map((i) => `<button type="button" class="star-btn" data-star-value="${i}" aria-label="${i} estrelas">★</button>`)
          .join("")}
        <input type="hidden" name="${name}" value="0" data-stars-value>
      </div>`;
  },

  ativarEstrelas(root) {
    PM.util.qsa("[data-stars-input]", root).forEach((grupo) => {
      const hidden = PM.util.qs("[data-stars-value]", grupo);
      const botoes = PM.util.qsa(".star-btn", grupo);
      function pintar(valor) {
        botoes.forEach((b) => b.classList.toggle("is-on", Number(b.dataset.starValue) <= valor));
      }
      botoes.forEach((b) => {
        b.addEventListener("click", () => {
          hidden.value = b.dataset.starValue;
          pintar(Number(b.dataset.starValue));
        });
      });
    });
  },

  linhaDoTempo(eventos) {
    if (!eventos.length) return this.emptyState("🕓", "Sem eventos ainda", "");
    return `
      <ol class="timeline">
        ${eventos
          .map(
            (e) => `
          <li class="timeline-item">
            <span class="timeline-dot"></span>
            <div class="timeline-body">
              <p class="timeline-label">${PM.util.escapeHtml(e.descricao)}</p>
              <p class="timeline-time">${PM.util.formatDataHoraBR(e.ocorrido_em)}</p>
            </div>
          </li>`
          )
          .join("")}
      </ol>`;
  },

  progressoEtapas(atual, total, labels) {
    return `
      <div class="progress-steps">
        <p class="progress-steps-label">Etapa ${atual} de ${total} — ${PM.util.escapeHtml(labels[atual - 1] || "")}</p>
        <div class="progress-steps-track">
          ${labels.map((_, i) => `<span class="progress-steps-dot ${i < atual ? "is-done" : ""} ${i === atual - 1 ? "is-current" : ""}"></span>`).join("")}
        </div>
      </div>`;
  },

  badgeStatusVacina(vencida) {
    return vencida
      ? `<span class="badge badge-danger">Vacina vencida</span>`
      : `<span class="badge badge-success">Vacina em dia</span>`;
  },

  badge(texto, tipo = "neutral") {
    return `<span class="badge badge-${tipo}">${PM.util.escapeHtml(texto)}</span>`;
  },

  /* Campo de captura de imagem com moldura-guia. `guia` é o texto mostrado dentro da moldura antes de
     capturar — cada uso passa o texto certo pro seu contexto (documento, pet, rosto, veículo etc.),
     em vez do texto de documento (RF-DOC-07) aparecer fora de contexto. */
  campoCaptura({ id, label, helper, value, guia }) {
    return `
      <div class="capture-field" data-capture="${id}">
        <p class="capture-label">${PM.util.escapeHtml(label)}</p>
        ${helper ? `<p class="capture-helper">${PM.util.escapeHtml(helper)}</p>` : ""}
        <div class="capture-frame ${value ? "has-image" : ""}" data-capture-frame>
          ${value ? `<img src="${value}" alt="${PM.util.escapeHtml(label)}" class="capture-preview">` : `<div class="capture-guide">${PM.util.escapeHtml(guia || "Toque em \"Capturar foto\" para continuar")}</div>`}
        </div>
        <input type="file" accept="image/*" capture="environment" class="capture-input" data-capture-input hidden>
        <div class="capture-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-capture-btn>${value ? "Recapturar" : "Capturar foto"}</button>
          ${value ? `<span class="capture-ok">✓ Capturado</span>` : ""}
        </div>
      </div>`;
  },

  ativarCampoCaptura(root, onChange) {
    PM.util.qsa("[data-capture]", root).forEach((campo) => {
      const id = campo.dataset.capture;
      const input = PM.util.qs("[data-capture-input]", campo);
      const btn = PM.util.qs("[data-capture-btn]", campo);
      const frame = PM.util.qs("[data-capture-frame]", campo);
      btn.addEventListener("click", () => input.click());
      input.addEventListener("change", async () => {
        if (!input.files || !input.files[0]) return;
        const dataUrl = await PM.util.comprimirImagem(input.files[0]);
        frame.classList.add("has-image");
        frame.innerHTML = `<img src="${dataUrl}" class="capture-preview" alt="">`;
        btn.textContent = "Recapturar";
        if (!PM.util.qs(".capture-ok", campo)) {
          campo.querySelector(".capture-actions").insertAdjacentHTML("beforeend", `<span class="capture-ok">✓ Capturado</span>`);
        }
        onChange && onChange(id, dataUrl);
      });
    });
  },

  ICON_EYE: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  ICON_EYE_OFF: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-2.61 3.88M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,

  /* Campo de senha com botão de olho para mostrar/ocultar */
  campoSenha({ id, name, label, placeholder = "", minlength, required = true, autocomplete = "current-password" }) {
    return `
      <div class="field">
        <label for="${id}">${PM.util.escapeHtml(label)}</label>
        <div class="password-wrap">
          <input id="${id}" name="${name}" type="password" ${required ? "required" : ""} ${minlength ? `minlength="${minlength}"` : ""} placeholder="${PM.util.escapeHtml(placeholder)}" autocomplete="${autocomplete}">
          <button type="button" class="password-toggle" data-toggle-senha aria-label="Mostrar senha">${PM.ui.ICON_EYE}</button>
        </div>
      </div>`;
  },

  ativarTogglesSenha(root) {
    PM.util.qsa("[data-toggle-senha]", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = btn.previousElementSibling;
        const mostrando = input.type === "text";
        input.type = mostrando ? "password" : "text";
        btn.innerHTML = mostrando ? PM.ui.ICON_EYE : PM.ui.ICON_EYE_OFF;
        btn.setAttribute("aria-label", mostrando ? "Mostrar senha" : "Ocultar senha");
      });
    });
  },

  toast(msg, tipo = "info") {
    const container = PM.util.qs("#toast-container");
    if (!container) return;
    const el = document.createElement("div");
    el.className = `toast toast-${tipo}`;
    el.textContent = msg;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-visible"));
    setTimeout(() => {
      el.classList.remove("is-visible");
      setTimeout(() => el.remove(), 300);
    }, 3200);
  },

  abrirModal(innerHtml) {
    const overlay = PM.util.qs("#modal-root");
    overlay.innerHTML = `<div class="modal-backdrop" data-modal-close><div class="modal-box" role="dialog">${innerHtml}</div></div>`;
    overlay.classList.add("is-open");
    overlay.querySelector("[data-modal-close]").addEventListener("click", (e) => {
      if (e.target.dataset.modalClose !== undefined && e.target === e.currentTarget) PM.ui.fecharModal();
    });
    PM.util.qsa("[data-modal-dismiss]", overlay).forEach((b) => b.addEventListener("click", () => PM.ui.fecharModal()));
    return overlay;
  },

  fecharModal() {
    const overlay = PM.util.qs("#modal-root");
    overlay.classList.remove("is-open");
    overlay.innerHTML = "";
  },

  confirmar({ titulo, mensagem, confirmarLabel = "Confirmar", cancelarLabel = "Cancelar", perigo = false }) {
    return new Promise((resolve) => {
      const overlay = this.abrirModal(`
        <h2 class="modal-title">${PM.util.escapeHtml(titulo)}</h2>
        <p class="modal-text">${PM.util.escapeHtml(mensagem)}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" data-modal-dismiss data-act="cancelar">${cancelarLabel}</button>
          <button class="btn ${perigo ? "btn-danger" : "btn-primary"}" data-act="confirmar">${confirmarLabel}</button>
        </div>
      `);
      overlay.querySelector('[data-act="confirmar"]').addEventListener("click", () => {
        PM.ui.fecharModal();
        resolve(true);
      });
      overlay.querySelector('[data-act="cancelar"]').addEventListener("click", () => resolve(false));
    });
  },
};
