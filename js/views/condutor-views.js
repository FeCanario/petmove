/* PetMove — telas do Condutor: cadastro C-01..C-03, status C-04, operação C-05..C-08 */
window.PM = window.PM || {};

(function () {
  const CONST = PM.CONST;
  const CS = PM.CONDUTOR_STATUS;

  function usuarioLogado() {
    return PM.auth.usuarioAtual();
  }
  function condutorDe(usuarioId) {
    return PM.db.query("condutor", (c) => c.usuario_id === usuarioId)[0] || null;
  }
  function veiculoDe(condutorId) {
    return PM.db.query("veiculo", (v) => v.condutor_id === condutorId)[0] || null;
  }
  const STATUS_ATIVOS = ["ACEITO", "A_CAMINHO_ORIGEM", "NA_ORIGEM", "EM_ANDAMENTO", "NO_DESTINO"];
  function servicoAtivoDoCondutor(condutorId) {
    return PM.db.query("servico", (s) => s.condutor_id === condutorId && STATUS_ATIVOS.includes(s.status))[0] || null;
  }

  /* ===================== C-01 Cadastro — etapa 1: dados pessoais ===================== */
  function renderCadastroEtapa1(params, app) {
    const content = `
      ${PM.ui.progressoEtapas(1, 3, ["Dados pessoais", "Documentos", "Veículo"])}
      <div class="card">
        ${PM.ui.campoCaptura({ id: "foto", label: "Foto de perfil", helper: "Capturada pela câmera do dispositivo.", guia: "Enquadre seu rosto, com boa iluminação" })}
        <form data-form="cad1" class="mt-8">
          <div class="field"><label for="cd-nome">Nome completo</label><input id="cd-nome" name="nome" required></div>
          <div class="field-row">
            <div class="field"><label for="cd-cpf">CPF</label><input id="cd-cpf" name="cpf" required></div>
            <div class="field"><label for="cd-nasc">Data de nascimento</label><input id="cd-nasc" name="nascimento" type="date" required></div>
          </div>
          <div class="field"><label for="cd-tel">Telefone</label><input id="cd-tel" name="telefone" required></div>
          <div class="field"><label for="cd-email">E-mail</label><input id="cd-email" name="email" type="email" required></div>
          ${PM.ui.campoSenha({ id: "cd-senha", name: "senha", label: "Senha", minlength: 8, autocomplete: "new-password" })}
          <label class="checkbox-row"><input type="checkbox" name="termo" value="1"><span>Aceito o termo de responsabilidade sobre o transporte de animais.</span></label>
          <div data-errors class="mt-8"></div>
          <button class="btn btn-primary mt-8" type="submit">Continuar</button>
        </form>
      </div>`;
    PM.shared.paginaSimples(app, { title: "Cadastro de condutor", back: true, content });
    PM.ui.ativarTogglesSenha(app);

    PM.util.qs("#cd-cpf", app).addEventListener("input", (e) => (e.target.value = PM.util.maskCPF(e.target.value)));
    PM.util.qs("#cd-tel", app).addEventListener("input", (e) => (e.target.value = PM.util.maskTelefone(e.target.value)));
    let fotoPerfil = null;
    PM.ui.ativarCampoCaptura(app, (id, dataUrl) => (fotoPerfil = dataUrl));

    const formCad1 = PM.util.qs('[data-form="cad1"]', app);
    PM.formcache.ligar("condutor-cad1", formCad1);
    formCad1.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const d = PM.shared.formToObject(ev.target);
      const erros = [];
      if (!PM.util.validarCPF(d.cpf)) erros.push("CPF inválido.");
      if (PM.db.query("condutor", (c) => PM.util.onlyDigits(c.cpf) === PM.util.onlyDigits(d.cpf)).length) erros.push("Já existe um cadastro com este CPF.");
      if (PM.db.query("condutor", (c) => c.status_cadastro === CS.REPROVADO && PM.util.onlyDigits(c.cpf) === PM.util.onlyDigits(d.cpf)).length)
        erros.push("Este CPF já foi reprovado anteriormente e não pode se cadastrar novamente.");
      if (PM.util.idadeAnos(d.nascimento) < CONST.IDADE_MINIMA_CONDUTOR) erros.push(`Idade mínima de ${CONST.IDADE_MINIMA_CONDUTOR} anos.`);
      if (!PM.util.validarTelefone(d.telefone)) erros.push("Telefone inválido.");
      if (!PM.util.validarEmail(d.email)) erros.push("E-mail inválido.");
      if (PM.db.query("usuario", (u) => u.email.toLowerCase() === d.email.toLowerCase()).length) erros.push("Já existe uma conta com este e-mail.");
      if (!PM.util.validarSenha(d.senha)) erros.push("A senha deve ter no mínimo 8 caracteres.");
      if (!fotoPerfil) erros.push("Capture a foto de perfil.");
      if (d.termo !== "1") erros.push("É necessário aceitar o termo de responsabilidade.");
      if (erros.length) {
        PM.util.qs("[data-errors]", app).innerHTML = PM.shared.erroCard(erros);
        return;
      }
      const usu = PM.db.insert("usuario", {
        nome: d.nome.trim(),
        email: d.email.trim().toLowerCase(),
        telefone: d.telefone,
        senha_hash: await PM.util.sha256(d.senha),
        tipo: "condutor",
        foto: fotoPerfil,
        criado_em: new Date().toISOString(),
      });
      const cond = PM.db.insert("condutor", {
        usuario_id: usu.id,
        cpf: d.cpf,
        data_nascimento: new Date(d.nascimento).toISOString(),
        cnh_numero: "",
        cnh_categoria: "",
        cnh_validade: "",
        status_cadastro: CS.RASCUNHO,
        data_envio: null,
        data_analise: null,
        analisado_por: null,
        justificativa: "",
        nota_media: 0,
        total_servicos: 0,
        online: false,
        lat_atual: -23.5505,
        lng_atual: -46.6333,
        ganhos_dia: 0,
        termo_aceito_em: new Date().toISOString(),
      });
      PM.state.cadastroCondutorId = cond.id;
      await PM.auth.login({ email: d.email, senha: d.senha, perfil: "condutor" });
      PM.formcache.limpar("condutor-cad1");
      PM.router.navegar("#/condutor/cadastro/2");
    });
  }

  /* ===================== C-02 Cadastro — etapa 2: documentos ===================== */
  function renderCadastroEtapa2(params, app) {
    const cond = condutorDe(usuarioLogado().id);
    if (!cond) return PM.router.navegar("#/condutor/cadastro/1");
    const content = `
      ${PM.ui.progressoEtapas(2, 3, ["Dados pessoais", "Documentos", "Veículo"])}
      <div class="card">
        <form data-form="cad2">
          <div class="field"><label for="cd-cnh">Número de registro da CNH</label><input id="cd-cnh" name="cnh" required></div>
          <div class="field-row">
            <div class="field"><label for="cd-cat">Categoria</label>
              <select id="cd-cat" name="categoria"><option value="A">A (moto)</option><option value="B" selected>B (carro/van)</option></select>
            </div>
            <div class="field"><label for="cd-validade">Validade da CNH</label><input id="cd-validade" name="validade" type="date" required></div>
          </div>
          <div class="list mt-8">
            ${PM.ui.campoCaptura({ id: "cnh_frente", label: "Frente da CNH", helper: "Documento inteiro visível, sem reflexo, texto legível.", guia: "Enquadre o documento inteiro, sem reflexo" })}
            ${PM.ui.campoCaptura({ id: "cnh_verso", label: "Verso da CNH", guia: "Enquadre o documento inteiro, sem reflexo" })}
            ${PM.ui.campoCaptura({ id: "selfie_documento", label: "Selfie segurando a CNH ao lado do rosto", guia: "Rosto e documento visíveis, sem reflexo" })}
          </div>
          <div data-errors class="mt-8"></div>
          <button class="btn btn-primary mt-8" type="submit">Continuar</button>
        </form>
      </div>`;
    PM.shared.paginaSimples(app, { title: "Cadastro de condutor", back: true, content });

    const capturas = {};
    PM.ui.ativarCampoCaptura(app, (id, dataUrl) => (capturas[id] = dataUrl));

    const formCad2 = PM.util.qs('[data-form="cad2"]', app);
    PM.formcache.ligar("condutor-cad2", formCad2);
    formCad2.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const d = PM.shared.formToObject(ev.target);
      const erros = [];
      if (!PM.util.validarCNH(d.cnh)) erros.push("Número da CNH inválido.");
      if (new Date(d.validade) < new Date()) erros.push("CNH com validade expirada não é aceita.");
      ["cnh_frente", "cnh_verso", "selfie_documento"].forEach((tipo) => {
        if (!capturas[tipo]) erros.push(`Envie a imagem: ${tipo.replace("_", " ")}.`);
      });
      if (erros.length) {
        PM.util.qs("[data-errors]", app).innerHTML = PM.shared.erroCard(erros);
        return;
      }
      PM.db.update("condutor", cond.id, { cnh_numero: d.cnh, cnh_categoria: d.categoria, cnh_validade: new Date(d.validade).toISOString() });
      Object.keys(capturas).forEach((tipo) => PM.db.salvarDocumento(cond.id, tipo, capturas[tipo]));
      PM.formcache.limpar("condutor-cad2");
      PM.router.navegar("#/condutor/cadastro/3");
    });
  }

  /* ===================== C-03 Cadastro — etapa 3: veículo ===================== */
  function renderCadastroEtapa3(params, app) {
    const cond = condutorDe(usuarioLogado().id);
    if (!cond) return PM.router.navegar("#/condutor/cadastro/1");
    const content = `
      ${PM.ui.progressoEtapas(3, 3, ["Dados pessoais", "Documentos", "Veículo"])}
      <div class="card">
        <form data-form="cad3">
          <div class="field-row">
            <div class="field"><label for="v-marca">Marca</label><input id="v-marca" name="marca" required></div>
            <div class="field"><label for="v-modelo">Modelo</label><input id="v-modelo" name="modelo" required></div>
          </div>
          <div class="field-row">
            <div class="field"><label for="v-ano">Ano</label><input id="v-ano" name="ano" type="number" min="1990" max="2100" required></div>
            <div class="field"><label for="v-cor">Cor</label><input id="v-cor" name="cor" required></div>
          </div>
          <div class="field-row">
            <div class="field"><label for="v-placa">Placa</label><input id="v-placa" name="placa" required placeholder="ABC1D23"></div>
            <div class="field"><label for="v-tipo">Tipo</label>
              <select id="v-tipo" name="tipo">${PM.VEICULO_TIPOS.map((t) => `<option value="${t}">${t}</option>`).join("")}</select>
            </div>
          </div>
          <div class="field">
            <label>Portes de pet aceitos</label>
            ${PM.ui.chipGroup("portes", PM.PORTES, ["P"])}
            <span class="field-hint" data-aviso-moto></span>
          </div>
          <div class="field"><label for="v-max">Quantidade máxima de pets por viagem</label><input id="v-max" name="max_pets" type="number" min="1" max="4" value="1" required></div>
          <div class="field">
            <label>Equipamentos disponíveis</label>
            ${PM.ui.chipGroup("equip", ["Grade divisória", "Caixa de transporte"], [])}
          </div>
          ${PM.ui.campoCaptura({ id: "veiculo_placa", label: "Foto do veículo com a placa legível", guia: "Veículo e placa visíveis e legíveis" })}
          <div data-errors class="mt-8"></div>
          <button class="btn btn-primary mt-8" type="submit">Enviar para análise</button>
        </form>
      </div>`;
    PM.shared.paginaSimples(app, { title: "Cadastro de condutor", back: true, content });
    PM.ui.ativarChipGroup(app);
    PM.util.qs("#v-placa", app).addEventListener("input", (e) => (e.target.value = PM.util.maskPlaca(e.target.value)));

    let fotoVeiculo = null;
    PM.ui.ativarCampoCaptura(app, (id, dataUrl) => (fotoVeiculo = dataUrl));

    function checarMoto() {
      const tipo = PM.util.qs("#v-tipo", app).value;
      const aviso = PM.util.qs("[data-aviso-moto]", app);
      if (tipo === "Moto") {
        PM.util.qsa(".chip", app)
          .filter((c) => ["M", "G", "GG"].includes(c.dataset.chipValue))
          .forEach((c) => c.classList.remove("is-selected"));
        aviso.textContent = "Motocicletas só podem transportar pets de porte P, em caixa de transporte.";
      } else {
        aviso.textContent = "";
      }
    }
    PM.util.qs("#v-tipo", app).addEventListener("change", checarMoto);

    const formCad3 = PM.util.qs('[data-form="cad3"]', app);
    PM.formcache.ligar("condutor-cad3", formCad3);
    formCad3.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const d = PM.shared.formToObject(ev.target);
      const portes = PM.ui.valorChipGroup(app, "portes");
      const equip = PM.ui.valorChipGroup(app, "equip");
      const erros = [];
      if (!PM.util.validarPlaca(d.placa)) erros.push("Placa inválida (padrão Mercosul ou antigo).");
      if (PM.db.query("veiculo", (v) => PM.util.normalizarPlaca(v.placa) === PM.util.normalizarPlaca(d.placa)).length) erros.push("Esta placa já está cadastrada.");
      if (!portes.length) erros.push("Selecione ao menos um porte aceito.");
      const catMinima = d.tipo === "Moto" ? "A" : "B";
      if (d.tipo === "Moto" && cond.cnh_categoria !== "A") erros.push("Categoria A da CNH é obrigatória para motocicletas.");
      if (d.tipo !== "Moto" && !["A", "B"].includes(cond.cnh_categoria)) erros.push("Categoria mínima B é obrigatória para carro/van.");
      if (d.tipo === "Moto" && portes.some((p) => p !== "P")) erros.push("Motocicletas só podem transportar pets de porte P.");
      if (!fotoVeiculo) erros.push("Envie a foto do veículo com a placa legível.");
      if (erros.length) {
        PM.util.qs("[data-errors]", app).innerHTML = PM.shared.erroCard(erros);
        return;
      }
      PM.db.insert("veiculo", {
        condutor_id: cond.id,
        marca: d.marca,
        modelo: d.modelo,
        ano: Number(d.ano),
        cor: d.cor,
        placa: d.placa.toUpperCase(),
        tipo: d.tipo,
        portes_aceitos: portes,
        max_pets: Number(d.max_pets),
        grade_divisoria: equip.includes("Grade divisória"),
        caixa_transporte: equip.includes("Caixa de transporte"),
      });
      PM.db.salvarDocumento(cond.id, "veiculo_placa", fotoVeiculo);
      PM.fsm.transicionarCondutor(cond.id, CS.EM_ANALISE);
      PM.db.update("condutor", cond.id, { data_envio: new Date().toISOString() });
      PM.formcache.limpar("condutor-cad3");
      PM.ui.toast("Cadastro enviado para análise!", "success");
      PM.router.navegar("#/condutor/status");
    });
  }

  /* ===================== C-04 Status do cadastro ===================== */
  function renderStatusCadastro(params, app) {
    const cond = condutorDe(usuarioLogado().id);
    const eventos = [{ descricao: "Cadastro enviado", ocorrido_em: cond.data_envio }];
    if (cond.data_analise) eventos.push({ descricao: `Resultado: ${cond.status_cadastro}`, ocorrido_em: cond.data_analise });
    const docs = PM.db.listarDocumentos(cond.id);

    const mensagemStatus = {
      EM_ANALISE: "Seu cadastro está em análise. O prazo estimado é de até 24 horas.",
      PENDENCIA: "Foi identificada uma pendência no seu cadastro. Reenvie os documentos indicados.",
      REPROVADO: "Seu cadastro foi reprovado.",
      ATIVO: "Cadastro aprovado! Você já pode ficar online.",
      APROVADO: "Cadastro aprovado! Você já pode ficar online.",
      SUSPENSO: "Seu cadastro está suspenso.",
    }[cond.status_cadastro];

    const content = `
      <div class="card text-center">
        ${PM.ui.badge(
          cond.status_cadastro,
          ["REPROVADO", "SUSPENSO"].includes(cond.status_cadastro) ? "danger" : cond.status_cadastro === "PENDENCIA" ? "warning" : cond.status_cadastro === "EM_ANALISE" ? "neutral" : "success"
        )}
        <p class="mt-8">${PM.util.escapeHtml(mensagemStatus || "")}</p>
        ${cond.justificativa ? `<p class="text-muted mt-8" style="font-size:.85rem">Justificativa: ${PM.util.escapeHtml(cond.justificativa)}</p>` : ""}
      </div>
      <div class="card"><p class="section-title">Linha do tempo</p><div class="mt-8">${PM.ui.linhaDoTempo(eventos)}</div></div>
      <div class="card">
        <p class="section-title">Documentos enviados</p>
        <div class="doc-thumb-grid mt-8">${docs.map((d) => `<div class="doc-thumb"><img src="${d.arquivo}" alt="${d.tipo}"></div>`).join("")}</div>
      </div>
      ${cond.status_cadastro === CS.PENDENCIA ? `<button class="btn btn-primary" data-reenviar>Reenviar documentos</button>` : ""}
      <button class="btn btn-ghost" data-action="logout">Sair</button>
    `;
    PM.shared.paginaSimples(app, { title: "Status do cadastro", back: false, content });
    const reenviar = PM.util.qs("[data-reenviar]", app);
    if (reenviar) reenviar.addEventListener("click", () => PM.router.navegar("#/condutor/cadastro/2"));
  }

  /* ===================== C-05 Início ===================== */
  function renderHomeCondutor(params, app) {
    const usu = usuarioLogado();
    const cond = condutorDe(usu.id);

    if (cond.status_cadastro !== CS.ATIVO && cond.status_cadastro !== CS.APROVADO) {
      return PM.router.navegar("#/condutor/status");
    }
    if (new Date(cond.cnh_validade) < new Date()) {
      PM.fsm.transicionarCondutor(cond.id, CS.SUSPENSO, { justificativa: "CNH vencida — cadastro suspenso automaticamente." });
      PM.ui.toast("Sua CNH está vencida. Cadastro suspenso.", "danger");
      return PM.router.navegar("#/condutor/status");
    }
    const diasParaVencer = Math.round((new Date(cond.cnh_validade) - Date.now()) / 86400000);
    const oferta = PM.matching.ofertaPendenteParaCondutor(cond.id);
    const servicoAtivo = servicoAtivoDoCondutor(cond.id);
    const hoje = new Date().toDateString();
    const servicosHoje = PM.db.query("servico", (s) => s.condutor_id === cond.id && new Date(s.criado_em).toDateString() === hoje).length;

    const content = `
      <div class="card card-row" style="justify-content:space-between">
        <div>
          <p style="font-weight:700">${cond.online ? "Você está online" : "Você está offline"}</p>
          <p class="text-muted" style="font-size:.78rem">${cond.online ? "Recebendo ofertas de serviço" : "Fique online para receber ofertas"}</p>
        </div>
        <label class="switch"><input type="checkbox" data-toggle-online ${cond.online ? "checked" : ""}><span class="switch-slider"></span></label>
      </div>
      ${diasParaVencer <= CONST.AVISO_VENCIMENTO_CNH_DIAS ? `<div class="card" style="background:var(--color-warning-bg)"><p style="font-size:.85rem">⚠️ Sua CNH vence em ${diasParaVencer} dias.</p></div>` : ""}
      <div class="stat-grid">
        <div class="stat-box"><p class="stat-value">${PM.util.formatBRL(cond.ganhos_dia || 0)}</p><p class="stat-label">Ganhos hoje</p></div>
        <div class="stat-box"><p class="stat-value">${servicosHoje}</p><p class="stat-label">Serviços hoje</p></div>
        <div class="stat-box"><p class="stat-value">${cond.nota_media || "—"}</p><p class="stat-label">Nota atual</p></div>
      </div>
      ${
        servicoAtivo
          ? PM.ui.card(`<p class="section-title">Serviço em andamento</p><button class="btn btn-primary mt-8" data-abrir-servico="${servicoAtivo.id}">Continuar serviço</button>`)
          : oferta
          ? PM.ui.card(`<p class="section-title">Nova oferta disponível!</p><button class="btn btn-primary mt-8" data-abrir-oferta="${oferta.id}">Ver oferta</button>`)
          : PM.ui.emptyState("🐾", cond.online ? "Nenhuma oferta no momento" : "Fique online para começar", "")
      }
    `;
    PM.shared.paginaSimples(app, {
      title: "PetMove Condutor",
      actions: `<a class="icon-btn topbar-action-mobile" href="#/condutor/historico" aria-label="Histórico e ganhos">🕓</a>${PM.shared.logoutAction}`,
      sidebar: PM.ui.appSidebar({
        ativo: "home",
        usuario: usu,
        itens: [
          { key: "home", label: "Início", icon: "🏠", href: "#/condutor/home" },
          { key: "historico", label: "Histórico e ganhos", icon: "🕓", href: "#/condutor/historico" },
        ],
      }),
      content,
    });
    PM.util.qs("[data-toggle-online]", app).addEventListener("change", (e) => {
      PM.db.update("condutor", cond.id, { online: e.target.checked });
      PM.ui.toast(e.target.checked ? "Você está online." : "Você está offline.", "info");
      PM.router.render();
    });
    const abrirServ = PM.util.qs("[data-abrir-servico]", app);
    if (abrirServ) abrirServ.addEventListener("click", () => PM.router.navegar(`#/condutor/servico/${abrirServ.dataset.abrirServico}`));
    const abrirOferta = PM.util.qs("[data-abrir-oferta]", app);
    if (abrirOferta) abrirOferta.addEventListener("click", () => PM.router.navegar(`#/condutor/oferta/${abrirOferta.dataset.abrirOferta}`));

    PM._activeInterval = setInterval(() => {
      const aindaOferta = PM.matching.ofertaPendenteParaCondutor(cond.id);
      if ((aindaOferta && !oferta) || (!aindaOferta && oferta) || servicoAtivoDoCondutor(cond.id) !== servicoAtivo) PM.router.render();
    }, 1500);
  }

  /* ===================== C-06 Oferta ===================== */
  function renderOferta(params, app) {
    const cond = condutorDe(usuarioLogado().id);
    const servico = PM.db.get("servico", params.id);
    if (!servico || servico.oferta_condutor_id !== cond.id) {
      PM.ui.toast("Esta oferta não está mais disponível.", "info");
      return PM.router.navegar("#/condutor/home");
    }
    const pet = PM.db.get("pet", servico.pet_id);
    const origem = PM.db.get("endereco", servico.origem_id);
    const distanciaOrigem = Math.round(PM.util.haversineKm(cond.lat_atual, cond.lng_atual, origem.lat, origem.lng) * 10) / 10;
    const repasse = Math.round(servico.valor * CONST.REPASSE_CONDUTOR * 100) / 100;
    const expiraEm = new Date(servico.oferta_expira_em).getTime();

    function segsRestantes() {
      return Math.max(0, Math.round((expiraEm - Date.now()) / 1000));
    }

    const content = `
      <div class="card text-center">
        <p class="countdown-value">${segsRestantes()}s</p>
        <p class="countdown-caption">para responder</p>
      </div>
      <div class="card">
        <p class="section-title">${servico.tipo === "TRANSPORTE" ? "🚗 Transporte" : "🐕 Passeio"}</p>
        <p class="mt-8">Distância até a origem: <b>${distanciaOrigem} km</b></p>
        <p>Distância total estimada: <b>${servico.distancia_km} km</b></p>
        <p>Valor do repasse: <b>${PM.util.formatBRL(repasse)}</b></p>
        <div class="divider"></div>
        <p style="font-weight:700">${PM.util.escapeHtml(pet.nome)} · ${PM.PORTE_LABEL[pet.porte]}</p>
        <p class="text-muted" style="font-size:.82rem">Temperamento: ${pet.temperamento.join(", ") || "—"}</p>
        ${servico.observacoes ? `<p class="mt-8" style="font-size:.85rem">"${PM.util.escapeHtml(servico.observacoes)}"</p>` : ""}
      </div>
      <div class="btn-row">
        <button class="btn btn-danger" data-recusar>Recusar</button>
        <button class="btn btn-primary" data-aceitar>Aceitar</button>
      </div>
    `;
    PM.shared.paginaSimples(app, { title: "Nova oferta", back: false, content });
    PM.util.qs("[data-aceitar]", app).addEventListener("click", () => {
      const res = PM.matching.aceitar(servico.id, cond.id);
      if (!res.ok) {
        PM.ui.toast(res.erro, "danger");
        return PM.router.navegar("#/condutor/home");
      }
      PM.router.navegar(`#/condutor/servico/${servico.id}`);
    });
    PM.util.qs("[data-recusar]", app).addEventListener("click", () => {
      PM.matching.recusar(servico.id, cond.id);
      PM.router.navegar("#/condutor/home");
    });
    PM._activeInterval = setInterval(() => {
      if (segsRestantes() <= 0) PM.router.render();
      else PM.util.qs(".countdown-value", app).textContent = `${segsRestantes()}s`;
    }, 1000);
  }

  /* ===================== C-07 Serviço em andamento ===================== */
  function renderServicoCondutor(params, app) {
    const cond = condutorDe(usuarioLogado().id);
    const servico = PM.db.get("servico", params.id);
    if (!servico || servico.condutor_id !== cond.id) return PM.router.navegar("#/condutor/home");
    const pet = PM.db.get("pet", servico.pet_id);
    const tutorUsu = PM.db.get("usuario", servico.tutor_id);
    const origem = PM.db.get("endereco", servico.origem_id);
    const destino = servico.destino_id ? PM.db.get("endereco", servico.destino_id) : origem;

    const PASSOS = {
      ACEITO: { label: "Cheguei", proximo: "A_CAMINHO_ORIGEM" },
      A_CAMINHO_ORIGEM: { label: "Cheguei", proximo: "NA_ORIGEM" },
      NA_ORIGEM: { label: "Embarcar pet", proximo: "EM_ANDAMENTO", exigeFoto: "embarque" },
      EM_ANDAMENTO: { label: "Cheguei ao destino", proximo: "NO_DESTINO" },
      NO_DESTINO: { label: "Finalizar", proximo: "CONCLUIDO", exigeFoto: "desembarque", exigeCodigo: true },
    };
    const passo = PASSOS[servico.status];
    const enderecoAtual = ["ACEITO", "A_CAMINHO_ORIGEM", "NA_ORIGEM"].includes(servico.status) ? origem : destino;

    let cronometro = "";
    if (servico.tipo === "PASSEIO" && servico.status === "EM_ANDAMENTO") {
      const evtInicio = PM.db.query("servico_evento", (e) => e.servico_id === servico.id && e.status === "EM_ANDAMENTO")[0];
      const fimMs = evtInicio ? new Date(evtInicio.ocorrido_em).getTime() + servico.duracao_passeio * 60000 : Date.now();
      const restante = Math.max(0, Math.round((fimMs - Date.now()) / 1000));
      cronometro = `<div class="countdown mt-8"><p class="countdown-value">${PM.util.formatDuracao(restante)}</p><p class="countdown-caption">tempo restante do passeio</p></div>`;
    }

    const content = `
      <div class="card">
        <p class="section-title">${PM.SERVICO_STATUS_LABEL[servico.status]}</p>
        <p class="card-row mt-8"><img class="avatar" src="${tutorUsu.foto}" alt=""><span style="flex:1">${PM.util.escapeHtml(tutorUsu.nome)} · ${PM.util.escapeHtml(pet.nome)}</span></p>
        <a class="btn btn-secondary mt-8" href="tel:${PM.util.onlyDigits(tutorUsu.telefone)}">📞 Ligar</a>
      </div>
      <div class="card">
        <p class="section-title">Endereço</p>
        <p class="mt-8">${PM.util.escapeHtml(enderecoAtual.logradouro)}, ${PM.util.escapeHtml(enderecoAtual.numero)} — ${PM.util.escapeHtml(enderecoAtual.bairro)}</p>
        <p class="text-muted" style="font-size:.82rem">${PM.util.escapeHtml(enderecoAtual.instrucoes || "Sem instruções adicionais.")}</p>
      </div>
      ${cronometro}
      ${
        passo?.exigeFoto
          ? `<div class="card">${PM.ui.campoCaptura({ id: "foto_evidencia", label: passo.exigeFoto === "embarque" ? "Foto do embarque" : "Foto do desembarque", guia: "Enquadre o pet junto ao tutor ou recebedor" })}</div>`
          : ""
      }
      ${
        passo?.exigeCodigo
          ? `<div class="card"><p class="section-title">Código de entrega</p><input class="mt-8" data-codigo maxlength="4" placeholder="0000" style="font-size:1.4rem;letter-spacing:6px;text-align:center;padding:10px;border-radius:8px;border:1.5px solid var(--color-border);width:100%"></div>`
          : ""
      }
      <div data-errors></div>
      ${passo ? `<button class="btn btn-primary" data-avancar>${passo.label}</button>` : ""}
      ${["ACEITO", "A_CAMINHO_ORIGEM"].includes(servico.status) ? `<button class="btn btn-ghost" data-cancelar-condutor>Cancelar serviço</button>` : ""}
    `;
    PM.shared.paginaSimples(app, { title: "Serviço", back: false, content });

    let fotoEvidencia = null;
    PM.ui.ativarCampoCaptura(app, (id, dataUrl) => (fotoEvidencia = dataUrl));

    const avancarBtn = PM.util.qs("[data-avancar]", app);
    if (avancarBtn)
      avancarBtn.addEventListener("click", () => {
        const erros = [];
        if (passo.exigeFoto && !fotoEvidencia) erros.push("É necessário registrar a foto para avançar.");
        let tentativasEl;
        if (passo.exigeCodigo) {
          const codigo = PM.util.qs("[data-codigo]", app).value;
          if (codigo !== servico.codigo_entrega) {
            servico._tentativas = (servico._tentativas || 0) + 1;
            if (servico._tentativas >= CONST.TENTATIVAS_CODIGO_ENTREGA) {
              erros.push("Número máximo de tentativas excedido. Contate o suporte.");
            } else {
              erros.push(`Código incorreto. Tentativa ${servico._tentativas} de ${CONST.TENTATIVAS_CODIGO_ENTREGA}.`);
            }
          }
        }
        if (erros.length) {
          PM.util.qs("[data-errors]", app).innerHTML = PM.shared.erroCard(erros);
          return;
        }
        if (passo.exigeFoto) {
          PM.db.insert("evidencia", { servico_id: servico.id, tipo: passo.exigeFoto, arquivo: fotoEvidencia, registrado_em: new Date().toISOString() });
        }
        PM.fsm.transicionarServico(servico.id, passo.proximo, `Condutor avançou para ${PM.SERVICO_STATUS_LABEL[passo.proximo] || passo.proximo}.`);
        if (passo.proximo === "CONCLUIDO") {
          const repasse = Math.round(servico.valor * CONST.REPASSE_CONDUTOR * 100) / 100;
          PM.db.update("condutor", cond.id, {
            ganhos_dia: Math.round(((cond.ganhos_dia || 0) + repasse) * 100) / 100,
            total_servicos: (cond.total_servicos || 0) + 1,
          });
          PM.ui.toast("Serviço concluído!", "success");
          PM.router.navegar("#/condutor/home");
          return;
        }
        PM.router.render();
      });

    const cancelarBtn = PM.util.qs("[data-cancelar-condutor]", app);
    if (cancelarBtn)
      cancelarBtn.addEventListener("click", async () => {
        const overlay = PM.ui.abrirModal(`
          <h2 class="modal-title">Cancelar serviço</h2>
          <div class="field"><label>Motivo</label><textarea id="motivo-c" rows="2"></textarea></div>
          <div class="modal-actions"><button class="btn btn-secondary" data-modal-dismiss>Voltar</button><button class="btn btn-danger" data-act="ok">Confirmar</button></div>
        `);
        overlay.querySelector('[data-act="ok"]').addEventListener("click", () => {
          const motivo = overlay.querySelector("#motivo-c").value || "Sem motivo informado.";
          PM.fsm.transicionarServico(servico.id, "CANCELADO_PELO_CONDUTOR", `Cancelado pelo condutor: ${motivo}`);
          PM.ui.fecharModal();
          PM.router.navegar("#/condutor/home");
        });
      });

    if (servico.tipo === "PASSEIO" && servico.status === "EM_ANDAMENTO") PM._activeInterval = setInterval(() => PM.router.render(), 1000);
  }

  /* ===================== C-08 Histórico, ganhos e documentos ===================== */
  function renderHistoricoCondutor(params, app) {
    const usu = usuarioLogado();
    const cond = condutorDe(usu.id);
    const servicos = PM.db.query("servico", (s) => s.condutor_id === cond.id).sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
    const concluidos = servicos.filter((s) => ["CONCLUIDO", "AVALIADO"].includes(s.status));
    const totalHoje = cond.ganhos_dia || 0;
    const totalSemana = concluidos
      .filter((s) => Date.now() - new Date(s.criado_em).getTime() < 7 * 86400000)
      .reduce((acc, s) => acc + s.valor * CONST.REPASSE_CONDUTOR, 0);
    const docs = PM.db.listarDocumentos(cond.id);

    const content = `
      <div class="stat-grid">
        <div class="stat-box"><p class="stat-value">${PM.util.formatBRL(totalHoje)}</p><p class="stat-label">Hoje</p></div>
        <div class="stat-box"><p class="stat-value">${PM.util.formatBRL(totalSemana)}</p><p class="stat-label">Semana</p></div>
        <div class="stat-box"><p class="stat-value">${cond.nota_media || "—"}</p><p class="stat-label">Nota</p></div>
      </div>
      <div class="card">
        <p class="section-title">Serviços concluídos</p>
        <div class="list mt-8">
          ${
            concluidos.length
              ? concluidos
                  .map((s) => {
                    const av = PM.db.query("avaliacao", (a) => a.servico_id === s.id)[0];
                    return `<div class="card-row" style="justify-content:space-between;border-bottom:1px solid var(--color-border);padding-bottom:8px">
                <span>${PM.util.formatDataBR(s.criado_em)} · ${s.tipo === "TRANSPORTE" ? "Transporte" : "Passeio"}</span>
                <span>${PM.util.formatBRL(s.valor * CONST.REPASSE_CONDUTOR)}${av ? ` · ${PM.ui.estrelas(av.nota)}` : ""}</span>
              </div>`;
                  })
                  .join("")
              : PM.ui.emptyState("🕓", "Nenhum serviço concluído ainda", "")
          }
        </div>
      </div>
      <div class="card">
        <p class="section-title">Meus documentos</p>
        <p class="text-muted mt-8" style="font-size:.82rem">CNH válida até ${PM.util.formatDataBR(cond.cnh_validade)}</p>
        <div class="doc-thumb-grid mt-8">${docs.map((d) => `<div class="doc-thumb"><img src="${d.arquivo}" alt=""></div>`).join("")}</div>
      </div>
      <button class="btn btn-secondary" data-action="reset-dados">Reiniciar dados de demonstração</button>
      <button class="btn btn-danger" data-action="logout">Sair</button>
    `;
    PM.shared.paginaSimples(app, {
      title: "Histórico e ganhos",
      back: false,
      sidebar: PM.ui.appSidebar({
        ativo: "historico",
        usuario: usu,
        itens: [
          { key: "home", label: "Início", icon: "🏠", href: "#/condutor/home" },
          { key: "historico", label: "Histórico e ganhos", icon: "🕓", href: "#/condutor/historico" },
        ],
      }),
      content,
    });
  }

  PM.router.registrar("/condutor/cadastro/1", null, renderCadastroEtapa1);
  PM.router.registrar("/condutor/cadastro/2", "condutor", renderCadastroEtapa2);
  PM.router.registrar("/condutor/cadastro/3", "condutor", renderCadastroEtapa3);
  PM.router.registrar("/condutor/status", "condutor", renderStatusCadastro);
  PM.router.registrar("/condutor/home", "condutor", renderHomeCondutor);
  PM.router.registrar("/condutor/oferta/:id", "condutor", renderOferta);
  PM.router.registrar("/condutor/servico/:id", "condutor", renderServicoCondutor);
  PM.router.registrar("/condutor/historico", "condutor", renderHistoricoCondutor);
})();
