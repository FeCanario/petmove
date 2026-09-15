/* PetMove — telas do Tutor (T-03 a T-14) */
window.PM = window.PM || {};

(function () {
  const CONST = PM.CONST;

  function tutor() {
    return PM.auth.usuarioAtual();
  }
  function petsDoTutor(tutorId, incluirInativos = false) {
    return PM.db.query("pet", (p) => p.usuario_id === tutorId && (incluirInativos || p.ativo));
  }
  function enderecosDoTutor(tutorId) {
    return PM.db.query("endereco", (e) => e.usuario_id === tutorId);
  }
  const STATUS_ATIVOS = [
    "SOLICITADO",
    "PROCURANDO_CONDUTOR",
    "SEM_CONDUTOR",
    "ACEITO",
    "A_CAMINHO_ORIGEM",
    "NA_ORIGEM",
    "EM_ANDAMENTO",
    "NO_DESTINO",
  ];
  function servicoAtivoDoTutor(tutorId) {
    return PM.db.query("servico", (s) => s.tutor_id === tutorId && STATUS_ATIVOS.includes(s.status))[0] || null;
  }
  function servicoAtivoParaPet(petId) {
    return PM.db.query("servico", (s) => s.pet_id === petId && STATUS_ATIVOS.includes(s.status))[0] || null;
  }
  function condutorDoServico(servico) {
    if (!servico || !servico.condutor_id) return null;
    const cond = PM.db.get("condutor", servico.condutor_id);
    if (!cond) return null;
    const usu = PM.db.get("usuario", cond.usuario_id);
    const veiculo = PM.db.query("veiculo", (v) => v.condutor_id === cond.id)[0];
    return { cond, usu, veiculo };
  }
  function eventosDoServico(servicoId) {
    return PM.db.query("servico_evento", (e) => e.servico_id === servicoId).sort((a, b) => new Date(a.ocorrido_em) - new Date(b.ocorrido_em));
  }
  function evidenciasDoServico(servicoId) {
    return PM.db.query("evidencia", (e) => e.servico_id === servicoId);
  }
  function avaliacaoDoServico(servicoId) {
    return PM.db.query("avaliacao", (a) => a.servico_id === servicoId)[0] || null;
  }

  function recalcularNotaMedia(condutorId) {
    const servicos = PM.db.query("servico", (s) => s.condutor_id === condutorId);
    const notas = servicos.map((s) => avaliacaoDoServico(s.id)).filter(Boolean).map((a) => a.nota);
    if (!notas.length) return;
    const media = notas.reduce((a, b) => a + b, 0) / notas.length;
    PM.db.update("condutor", condutorId, { nota_media: Math.round(media * 10) / 10 });
  }

  function calcularEstimativa({ tipo, origem, destino, duracaoMin, porte }) {
    if (tipo === PM.SERVICO_TIPO.TRANSPORTE) {
      const distanciaKm = Math.round(PM.util.haversineKm(origem.lat, origem.lng, destino.lat, destino.lng) * 10) / 10;
      const preco = PM.util.calcularPrecoTransporte(distanciaKm, porte);
      const duracaoEstMin = Math.max(6, Math.round((distanciaKm / 25) * 60));
      return { distanciaKm, duracaoEstMin, preco };
    }
    const preco = PM.util.calcularPrecoPasseio(duracaoMin);
    const distanciaKm = Math.round(((duracaoMin / 60) * 5) * 10) / 10;
    return { distanciaKm, duracaoEstMin: duracaoMin, preco };
  }

  async function cancelarServico(servicoId, redirecionarPara) {
    const servico = PM.db.get("servico", servicoId);
    const comTaxa = !["SOLICITADO", "PROCURANDO_CONDUTOR", "SEM_CONDUTOR"].includes(servico.status);
    const overlay = PM.ui.abrirModal(`
      <h2 class="modal-title">Cancelar serviço</h2>
      <p class="modal-text">${comTaxa ? `Como o condutor já aceitou, será cobrada uma taxa de <b>${PM.util.formatBRL(CONST.TAXA_CANCELAMENTO)}</b>.` : "Cancelamento gratuito, o condutor ainda não aceitou."}</p>
      <div class="field"><label for="motivo-cancel">Motivo</label><textarea id="motivo-cancel" rows="2" placeholder="Conte o que aconteceu"></textarea></div>
      <div class="modal-actions">
        <button class="btn btn-secondary" data-modal-dismiss>Voltar</button>
        <button class="btn btn-danger" data-act="confirmar-cancel">Confirmar cancelamento</button>
      </div>
    `);
    overlay.querySelector('[data-act="confirmar-cancel"]').addEventListener("click", () => {
      const motivo = overlay.querySelector("#motivo-cancel").value || "Sem motivo informado.";
      PM.matching.cancelar(servicoId);
      PM.fsm.transicionarServico(servicoId, PM.SERVICO_STATUS.CANCELADO_PELO_TUTOR, `Cancelado pelo tutor: ${motivo}`);
      PM.ui.fecharModal();
      PM.ui.toast("Serviço cancelado.", "info");
      PM.router.navegar(redirecionarPara || "#/tutor/home");
    });
  }

  /* ===================== T-03 Início ===================== */
  function renderHome(params, app) {
    const t = tutor();
    const pets = petsDoTutor(t.id);
    const enderecos = enderecosDoTutor(t.id);
    const totalServicos = PM.db.query("servico", (s) => s.tutor_id === t.id).length;
    const servicoAtivo = servicoAtivoDoTutor(t.id);

    const content = `
      <div class="card">
        <p class="section-title">Olá, ${PM.util.escapeHtml(t.nome.split(" ")[0])} 👋</p>
        <p class="section-subtitle">Para onde seu pet vai hoje?</p>
        <div class="stat-grid mt-8">
          <div class="stat-box"><p class="stat-value">${pets.length}</p><p class="stat-label">Pets</p></div>
          <div class="stat-box"><p class="stat-value">${enderecos.length}</p><p class="stat-label">Endereços</p></div>
          <div class="stat-box"><p class="stat-value">${totalServicos}</p><p class="stat-label">Serviços</p></div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-main">
          ${
            servicoAtivo
              ? PM.ui.card(`
            <p class="section-title">Serviço em andamento</p>
            <p class="section-subtitle">${PM.SERVICO_STATUS_LABEL[servicoAtivo.status]} · ${PM.util.escapeHtml(PM.db.get("pet", servicoAtivo.pet_id)?.nome || "")}</p>
            <button class="btn btn-primary mt-8" data-ir-servico="${servicoAtivo.id}">Abrir acompanhamento</button>
          `)
              : ""
          }

          <div class="service-grid">
            <button class="service-tile" data-novo-servico="TRANSPORTE"><span class="icon">🚗</span><span>Transporte</span></button>
            <button class="service-tile alt" data-novo-servico="PASSEIO"><span class="icon">🐕</span><span>Passeio</span></button>
          </div>
        </div>

        <div class="dashboard-side">
          <div class="card">
            <div class="card-row" style="justify-content:space-between">
              <p class="section-title mb-0">Meus pets</p>
              <a class="link-btn" href="#/tutor/pets">Ver todos</a>
            </div>
            ${
              pets.length
                ? `<div class="list mt-8">${pets
                    .slice(0, 3)
                    .map(
                      (p) => `
                  <div class="card-row">
                    <img class="pet-thumb" src="${p.foto}" alt="${PM.util.escapeHtml(p.nome)}">
                    <div style="flex:1">
                      <p style="font-weight:700">${PM.util.escapeHtml(p.nome)}</p>
                      <p class="text-muted" style="font-size:.78rem">${PM.util.escapeHtml(p.raca)} · ${PM.PORTE_LABEL[p.porte]}</p>
                    </div>
                    ${PM.ui.badgeStatusVacina(PM.util.vacinaVencida(p.vacina_antirrabica_data))}
                  </div>`
                    )
                    .join("")}</div>`
                : PM.ui.emptyState("🐾", "Nenhum pet cadastrado", "Cadastre seu pet para solicitar serviços.", `<a class="btn btn-primary mt-8" href="#/tutor/pet/novo">Cadastrar pet</a>`)
            }
          </div>

          <div class="card">
            <div class="card-row" style="justify-content:space-between">
              <p class="section-title mb-0">Meus endereços</p>
              <a class="link-btn" href="#/tutor/enderecos">Ver todos</a>
            </div>
            ${
              enderecos.length
                ? `<div class="list mt-8">${enderecos
                    .slice(0, 3)
                    .map(
                      (e) => `
                  <div class="card-row" style="justify-content:space-between">
                    <span style="font-weight:700">${PM.util.escapeHtml(e.apelido)}</span>
                    ${e.padrao ? PM.ui.badge("Padrão", "primary") : ""}
                  </div>`
                    )
                    .join("")}</div>`
                : PM.ui.emptyState("📍", "Nenhum endereço cadastrado", "", `<a class="btn btn-secondary mt-8" href="#/tutor/endereco/novo">Adicionar endereço</a>`)
            }
          </div>
        </div>
      </div>
    `;

    PM.shared.paginaTutor(app, { title: "PetMove", activeNav: "home", content });
    PM.util.qsa("[data-novo-servico]", app).forEach((btn) =>
      btn.addEventListener("click", () => {
        if (!petsDoTutor(t.id).length) {
          PM.ui.toast("Cadastre um pet antes de solicitar um serviço.", "danger");
          PM.router.navegar("#/tutor/pet/novo");
          return;
        }
        PM.state.novaSolicitacao = { tipo: btn.dataset.novoServico };
        PM.router.navegar("#/tutor/solicitar");
      })
    );
    const btnServ = PM.util.qs("[data-ir-servico]", app);
    if (btnServ) btnServ.addEventListener("click", () => PM.router.navegar(`#/tutor/servico/${btnServ.dataset.irServico}`));
  }

  /* ===================== T-04 Meus pets ===================== */
  function renderPets(params, app) {
    const t = tutor();
    const pets = petsDoTutor(t.id, true);
    const content = pets.length
      ? `<div class="list pets-grid-desktop">
          ${pets
            .map(
              (p) => `
            <div class="card">
              <div class="card-row">
                <img class="pet-thumb" src="${p.foto}" alt="${PM.util.escapeHtml(p.nome)}">
                <div style="flex:1">
                  <p style="font-weight:700">${PM.util.escapeHtml(p.nome)} ${!p.ativo ? PM.ui.badge("Inativo", "neutral") : ""}</p>
                  <p class="text-muted" style="font-size:.8rem">${PM.util.escapeHtml(p.raca)} · ${PM.PORTE_LABEL[p.porte]} · ${p.peso}kg</p>
                  <div class="mt-8">${PM.ui.badgeStatusVacina(PM.util.vacinaVencida(p.vacina_antirrabica_data))}</div>
                </div>
              </div>
              <div class="btn-row mt-8">
                <button class="btn btn-secondary btn-sm" data-editar="${p.id}">Editar</button>
                <button class="btn ${p.ativo ? "btn-ghost" : "btn-secondary"} btn-sm" data-toggle="${p.id}">${p.ativo ? "Inativar" : "Reativar"}</button>
              </div>
            </div>`
            )
            .join("")}
        </div>`
      : PM.ui.emptyState("🐾", "Nenhum pet cadastrado", "Toque em + para adicionar seu primeiro pet.");

    PM.shared.paginaTutor(app, {
      title: "Meus pets",
      activeNav: "pets",
      actions: `<a class="icon-btn" href="#/tutor/pet/novo" aria-label="Adicionar pet">＋</a>`,
      content,
    });

    PM.util.qsa("[data-editar]", app).forEach((b) => b.addEventListener("click", () => PM.router.navegar(`#/tutor/pet/${b.dataset.editar}/editar`)));
    PM.util.qsa("[data-toggle]", app).forEach((b) =>
      b.addEventListener("click", async () => {
        const pet = PM.db.get("pet", b.dataset.toggle);
        const ok = await PM.ui.confirmar({
          titulo: pet.ativo ? "Inativar pet" : "Reativar pet",
          mensagem: pet.ativo ? "O histórico de serviços será preservado." : "O pet voltará a aparecer para novas solicitações.",
        });
        if (ok) {
          PM.db.update("pet", pet.id, { ativo: !pet.ativo });
          PM.router.render();
        }
      })
    );
  }

  /* ===================== T-05 Cadastro/edição de pet ===================== */
  function renderFormPet(params, app) {
    const editando = !!params.id;
    const pet = editando ? PM.db.get("pet", params.id) : null;

    const content = `
      <div class="card">
        ${PM.ui.campoCaptura({ id: "foto", label: "Foto do pet", helper: "Toque para usar a câmera ou escolher da galeria.", value: pet?.foto })}
        <form data-form="pet" class="mt-8">
          <div class="field"><label for="p-nome">Nome</label><input id="p-nome" name="nome" required value="${pet ? PM.util.escapeHtml(pet.nome) : ""}"></div>
          <div class="field-row">
            <div class="field"><label for="p-especie">Espécie</label>
              <select id="p-especie" name="especie">
                <option value="cão" ${pet?.especie === "cão" ? "selected" : ""}>Cão</option>
                <option value="gato" ${pet?.especie === "gato" ? "selected" : ""}>Gato</option>
              </select>
            </div>
            <div class="field"><label for="p-raca">Raça</label><input id="p-raca" name="raca" required value="${pet ? PM.util.escapeHtml(pet.raca) : ""}"></div>
          </div>
          <div class="field-row">
            <div class="field"><label for="p-peso">Peso (kg)</label><input id="p-peso" name="peso" type="number" min="0.5" step="0.1" required value="${pet?.peso ?? ""}"></div>
            <div class="field"><label for="p-idade">Idade (anos)</label><input id="p-idade" name="idade" type="number" min="0" required value="${pet?.idade ?? ""}"></div>
          </div>
          <div class="field-row">
            <div class="field"><label for="p-porte">Porte</label>
              <select id="p-porte" name="porte">
                ${PM.PORTES.map((p) => `<option value="${p}" ${pet?.porte === p ? "selected" : ""}>${PM.PORTE_LABEL[p]}</option>`).join("")}
              </select>
            </div>
            <div class="field"><label for="p-sexo">Sexo</label>
              <select id="p-sexo" name="sexo">
                <option ${pet?.sexo === "Macho" ? "selected" : ""}>Macho</option>
                <option ${pet?.sexo === "Fêmea" ? "selected" : ""}>Fêmea</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label>Temperamento</label>
            ${PM.ui.chipGroup("temperamento", PM.TEMPERAMENTOS, pet?.temperamento || [])}
          </div>
          <div class="field"><label for="p-necessidades">Necessidades especiais</label>
            <textarea id="p-necessidades" name="necessidades" rows="2" placeholder="Medicação, enjoo em carro, mobilidade reduzida...">${pet ? PM.util.escapeHtml(pet.necessidades || "") : ""}</textarea>
          </div>
          <div class="field"><label for="p-vacina">Data da última vacina antirrábica</label>
            <input id="p-vacina" name="vacina" type="date" required value="${pet?.vacina_antirrabica_data ? pet.vacina_antirrabica_data.slice(0, 10) : ""}">
            <span class="field-hint">Válida por 12 meses a partir da data informada.</span>
          </div>
          <div data-errors></div>
          <button class="btn btn-primary mt-8" type="submit">Salvar</button>
        </form>
      </div>`;

    PM.shared.paginaSimples(app, { title: editando ? "Editar pet" : "Novo pet", back: true, content });
    PM.ui.ativarChipGroup(app);
    let fotoAtual = pet?.foto || null;
    PM.ui.ativarCampoCaptura(app, (id, dataUrl) => (fotoAtual = dataUrl));

    PM.util.qs("#p-peso", app).addEventListener("input", (e) => {
      const sugestao = PM.util.porteMaisProximo(e.target.value);
      PM.util.qs("#p-porte", app).value = sugestao;
    });

    const chaveCachePet = `pet:${params.id || "novo"}`;
    const formPet = PM.util.qs('[data-form="pet"]', app);
    PM.formcache.ligar(chaveCachePet, formPet);
    formPet.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const dados = PM.shared.formToObject(ev.target);
      const erros = [];
      if (!fotoAtual) erros.push("Adicione uma foto do pet.");
      if (!dados.vacina) erros.push("Informe a data da última vacina antirrábica.");
      if (erros.length) {
        PM.util.qs("[data-errors]", app).innerHTML = PM.shared.erroCard(erros);
        return;
      }
      const payload = {
        nome: dados.nome.trim(),
        especie: dados.especie,
        raca: dados.raca.trim(),
        porte: dados.porte,
        peso: Number(dados.peso),
        idade: Number(dados.idade),
        sexo: dados.sexo,
        foto: fotoAtual,
        temperamento: PM.ui.valorChipGroup(app, "temperamento"),
        necessidades: dados.necessidades || "",
        vacina_antirrabica_data: new Date(dados.vacina).toISOString(),
      };
      if (editando) {
        PM.db.update("pet", pet.id, payload);
        PM.ui.toast("Pet atualizado.", "success");
      } else {
        PM.db.insert("pet", Object.assign({ usuario_id: tutor().id, ativo: true }, payload));
        PM.ui.toast("Pet cadastrado.", "success");
      }
      PM.formcache.limpar(chaveCachePet);
      PM.router.navegar("#/tutor/pets");
    });
  }

  /* ===================== T-06 Meus endereços ===================== */
  function renderEnderecos(params, app) {
    const t = tutor();
    const enderecos = enderecosDoTutor(t.id);
    const content = enderecos.length
      ? `<div class="list">
        ${enderecos
          .map(
            (e) => `
          <div class="card">
            <div class="card-row" style="justify-content:space-between">
              <p style="font-weight:700">${PM.util.escapeHtml(e.apelido)}</p>
              ${e.padrao ? PM.ui.badge("Padrão", "primary") : ""}
            </div>
            <p class="text-muted" style="font-size:.82rem">${PM.util.escapeHtml(e.logradouro)}, ${PM.util.escapeHtml(e.numero)} — ${PM.util.escapeHtml(e.bairro)}, ${PM.util.escapeHtml(e.cidade)}/${e.uf}</p>
            <div class="btn-row mt-8">
              <button class="btn btn-secondary btn-sm" data-editar="${e.id}">Editar</button>
              ${!e.padrao ? `<button class="btn btn-ghost btn-sm" data-padrao="${e.id}">Definir padrão</button>` : ""}
              <button class="btn btn-ghost btn-sm" data-excluir="${e.id}">Excluir</button>
            </div>
          </div>`
          )
          .join("")}
      </div>`
      : PM.ui.emptyState("📍", "Nenhum endereço cadastrado", "Adicione um endereço para solicitar serviços.");

    PM.shared.paginaTutor(app, {
      title: "Meus endereços",
      activeNav: "perfil",
      actions: `<a class="icon-btn" href="#/tutor/endereco/novo" aria-label="Adicionar endereço">＋</a>`,
      content,
    });

    PM.util.qsa("[data-editar]", app).forEach((b) => b.addEventListener("click", () => PM.router.navegar(`#/tutor/endereco/${b.dataset.editar}/editar`)));
    PM.util.qsa("[data-padrao]", app).forEach((b) =>
      b.addEventListener("click", () => {
        enderecosDoTutor(t.id).forEach((e) => PM.db.update("endereco", e.id, { padrao: e.id === b.dataset.padrao }));
        PM.router.render();
      })
    );
    PM.util.qsa("[data-excluir]", app).forEach((b) =>
      b.addEventListener("click", async () => {
        const vinculado = PM.db.query("servico", (s) => STATUS_ATIVOS.includes(s.status) && (s.origem_id === b.dataset.excluir || s.destino_id === b.dataset.excluir)).length;
        if (vinculado) {
          PM.ui.toast("Este endereço está vinculado a um serviço em andamento e não pode ser excluído.", "danger");
          return;
        }
        const ok = await PM.ui.confirmar({ titulo: "Excluir endereço", mensagem: "Esta ação não pode ser desfeita.", perigo: true });
        if (ok) {
          PM.db.remove("endereco", b.dataset.excluir);
          PM.router.render();
        }
      })
    );
  }

  /* ===================== T-07 Cadastro/edição de endereço ===================== */
  function renderFormEndereco(params, app) {
    const editando = !!params.id;
    const end = editando ? PM.db.get("endereco", params.id) : null;
    const content = `
      <div class="card">
        <form data-form="endereco">
          <div class="field-row">
            <div class="field" style="flex:0 0 140px"><label for="e-cep">CEP</label><input id="e-cep" name="cep" required value="${end ? end.cep : ""}"></div>
            <div class="field" style="align-self:flex-end;padding-bottom:12px"><button class="btn btn-secondary btn-sm" type="button" data-buscar-cep>Buscar CEP</button></div>
          </div>
          <div class="field"><label for="e-logradouro">Logradouro</label><input id="e-logradouro" name="logradouro" required value="${end ? PM.util.escapeHtml(end.logradouro) : ""}"></div>
          <div class="field-row">
            <div class="field"><label for="e-numero">Número</label><input id="e-numero" name="numero" required value="${end ? PM.util.escapeHtml(end.numero) : ""}"></div>
            <div class="field"><label for="e-complemento">Complemento</label><input id="e-complemento" name="complemento" value="${end ? PM.util.escapeHtml(end.complemento || "") : ""}"></div>
          </div>
          <div class="field"><label for="e-bairro">Bairro</label><input id="e-bairro" name="bairro" required value="${end ? PM.util.escapeHtml(end.bairro) : ""}"></div>
          <div class="field-row">
            <div class="field"><label for="e-cidade">Cidade</label><input id="e-cidade" name="cidade" required value="${end ? PM.util.escapeHtml(end.cidade) : ""}"></div>
            <div class="field" style="flex:0 0 90px"><label for="e-uf">UF</label><input id="e-uf" name="uf" maxlength="2" required value="${end ? end.uf : ""}"></div>
          </div>
          <div class="field"><label for="e-instrucoes">Instruções de acesso</label>
            <textarea id="e-instrucoes" name="instrucoes" rows="2" placeholder="Portaria, andar, interfone, cachorro solto no quintal...">${end ? PM.util.escapeHtml(end.instrucoes || "") : ""}</textarea>
          </div>
          <div class="field"><label for="e-apelido">Apelido</label><input id="e-apelido" name="apelido" required placeholder="Casa, Petshop, Veterinário..." value="${end ? PM.util.escapeHtml(end.apelido) : ""}"></div>
          <label class="checkbox-row"><input type="checkbox" name="padrao" ${end?.padrao ? "checked" : ""}><span>Definir como endereço padrão de origem</span></label>
          <div data-errors class="mt-8"></div>
          <button class="btn btn-primary mt-8" type="submit">Salvar</button>
        </form>
      </div>`;
    PM.shared.paginaSimples(app, { title: editando ? "Editar endereço" : "Novo endereço", back: true, content });

    let coords = end ? { lat: end.lat, lng: end.lng } : null;
    PM.util.qs("#e-cep", app).addEventListener("input", (e) => (e.target.value = PM.util.maskCEP(e.target.value)));
    PM.util.qs("[data-buscar-cep]", app).addEventListener("click", () => {
      const info = PM.buscarCep(PM.util.qs("#e-cep", app).value);
      if (!info) {
        PM.ui.toast("CEP fora da base local de simulação. Preencha manualmente.", "info");
        return;
      }
      PM.util.qs("#e-logradouro", app).value = info.logradouro;
      PM.util.qs("#e-bairro", app).value = info.bairro;
      PM.util.qs("#e-cidade", app).value = info.cidade;
      PM.util.qs("#e-uf", app).value = info.uf;
      coords = { lat: info.lat, lng: info.lng };
      PM.ui.toast("Endereço preenchido a partir do CEP.", "success");
    });

    const chaveCacheEndereco = `endereco:${params.id || "novo"}`;
    const formEndereco = PM.util.qs('[data-form="endereco"]', app);
    PM.formcache.ligar(chaveCacheEndereco, formEndereco);
    formEndereco.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const dados = PM.shared.formToObject(ev.target);
      if (!coords) {
        const info = PM.buscarCep(dados.cep);
        coords = info ? { lat: info.lat, lng: info.lng } : { lat: -23.55 + (Math.random() - 0.5) * 0.05, lng: -46.63 + (Math.random() - 0.5) * 0.05 };
      }
      const payload = {
        cep: dados.cep,
        logradouro: dados.logradouro.trim(),
        numero: dados.numero.trim(),
        complemento: dados.complemento || "",
        bairro: dados.bairro.trim(),
        cidade: dados.cidade.trim(),
        uf: dados.uf.toUpperCase(),
        instrucoes: dados.instrucoes || "",
        apelido: dados.apelido.trim(),
        lat: coords.lat,
        lng: coords.lng,
        padrao: dados.padrao === "on",
      };
      if (payload.padrao) {
        enderecosDoTutor(tutor().id).forEach((e) => PM.db.update("endereco", e.id, { padrao: false }));
      }
      if (editando) {
        PM.db.update("endereco", end.id, payload);
        PM.ui.toast("Endereço atualizado.", "success");
      } else {
        PM.db.insert("endereco", Object.assign({ usuario_id: tutor().id }, payload));
        PM.ui.toast("Endereço cadastrado.", "success");
      }
      PM.formcache.limpar(chaveCacheEndereco);
      PM.router.navegar("#/tutor/enderecos");
    });
  }

  /* ===================== T-08 Nova solicitação ===================== */
  function renderNovaSolicitacao(params, app) {
    const t = tutor();
    const pets = petsDoTutor(t.id);
    const enderecos = enderecosDoTutor(t.id);
    let rasc = PM.state.novaSolicitacao || {};
    let tipo = rasc.tipo || PM.SERVICO_TIPO.TRANSPORTE;

    function iconeEndereco(apelido) {
      const a = (apelido || "").toLowerCase();
      if (a.includes("casa") || a.includes("apto") || a.includes("apart")) return "🏠";
      if (a.includes("pet") || a.includes("shop") || a.includes("loja")) return "🛍️";
      if (a.includes("vet") || a.includes("clínic") || a.includes("clinic")) return "⚕️";
      if (a.includes("trabalho") || a.includes("escritório") || a.includes("escritorio")) return "💼";
      return "📍";
    }

    function enderecosCards(name, valorSelecionado) {
      if (!enderecos.length) {
        return PM.ui.emptyState("📍", "Nenhum endereço cadastrado", "Cadastre um endereço para continuar.", `<a class="btn btn-primary mt-8" href="#/tutor/endereco/novo">Cadastrar endereço</a>`);
      }
      return enderecos
        .map(
          (e) => `
        <label class="pick-card">
          <input type="radio" name="${name}" value="${e.id}" ${valorSelecionado === e.id ? "checked" : ""}>
          <span class="pick-card-icon">${iconeEndereco(e.apelido)}</span>
          <div style="flex:1">
            <p style="font-weight:700">${PM.util.escapeHtml(e.apelido)} ${e.padrao ? PM.ui.badge("Padrão", "primary") : ""}</p>
            <p class="text-muted" style="font-size:.78rem">${PM.util.escapeHtml(e.logradouro)}, ${PM.util.escapeHtml(e.numero)} — ${PM.util.escapeHtml(e.bairro)}</p>
          </div>
        </label>`
        )
        .join("");
    }

    function html() {
      return `
      <div class="card">
        <p class="section-title">① Tipo de serviço</p>
        <div class="profile-select">
          <button type="button" data-tipo="TRANSPORTE" class="${tipo === "TRANSPORTE" ? "is-active" : ""}">🚗 Transporte</button>
          <button type="button" data-tipo="PASSEIO" class="${tipo === "PASSEIO" ? "is-active" : ""}">🐕 Passeio</button>
        </div>
      </div>

      <div class="card">
        <p class="section-title">② Selecione o pet</p>
        <div class="list mt-8">
          ${pets
            .map((p) => {
              const vencida = PM.util.vacinaVencida(p.vacina_antirrabica_data);
              const ocupado = servicoAtivoParaPet(p.id);
              return `
              <label class="pick-card ${vencida || ocupado ? "is-disabled" : ""}">
                <input type="radio" name="pet" value="${p.id}" ${rasc.petId === p.id ? "checked" : ""} ${vencida || ocupado ? "disabled" : ""}>
                <img class="pet-thumb" src="${p.foto}" alt="">
                <div style="flex:1">
                  <p style="font-weight:700">${PM.util.escapeHtml(p.nome)}</p>
                  ${vencida ? `<p class="text-danger" style="font-size:.76rem">Vacinação antirrábica vencida — solicitação bloqueada</p>` : ""}
                  ${ocupado && !vencida ? `<p class="text-danger" style="font-size:.76rem">Já existe um serviço em andamento para este pet</p>` : ""}
                </div>
                ${PM.ui.badgeStatusVacina(vencida)}
              </label>`;
            })
            .join("")}
        </div>
      </div>

      <div class="card">
        <p class="section-title">③ Endereço de origem</p>
        <div class="list mt-8">${enderecosCards("origem", rasc.origemId || enderecos.find((e) => e.padrao)?.id)}</div>
      </div>

      ${
        tipo === "TRANSPORTE"
          ? `<div class="card">
              <p class="section-title">④ Endereço de destino</p>
              <div class="list mt-8">${enderecosCards("destino", rasc.destinoId)}</div>
            </div>`
          : `<div class="card">
              <p class="section-title">④ Duração do passeio</p>
              <div class="profile-select mt-8">
                ${[30, 45, 60]
                  .map((d) => `<button type="button" data-duracao="${d}" class="${(rasc.duracaoMin || 30) === d ? "is-active" : ""}">${d} min</button>`)
                  .join("")}
              </div>
            </div>`
      }

      <div class="card">
        <p class="section-title">⑤ Observações ao condutor</p>
        <textarea name="observacoes" maxlength="${CONST.LIMITE_OBSERVACOES}" rows="2" placeholder="Até 300 caracteres" class="mt-8">${rasc.observacoes || ""}</textarea>
      </div>

      <div class="card">
        <p class="section-title">⑥ Quem vai receber o pet no destino</p>
        <div class="field-row mt-8">
          <div class="field"><input name="recebedorNome" placeholder="Nome" value="${rasc.recebedorNome || ""}"></div>
          <div class="field"><input name="recebedorTelefone" placeholder="Telefone" value="${rasc.recebedorTelefone || ""}"></div>
        </div>
      </div>

      <div class="card">
        <p class="section-title">⑦ Forma de pagamento</p>
        ${PM.ui.chipGroup("pagamento", PM.FORMAS_PAGAMENTO, [rasc.formaPagamento || "PIX"], { unico: true })}
      </div>

      <div data-errors></div>
      <button class="btn btn-primary" data-ver-resumo>Ver resumo</button>
      `;
    }

    function montar() {
      const app2 = app;
      PM.shared.paginaSimples(app2, { title: "Nova solicitação", back: true, content: html() });
      PM.ui.ativarChipGroup(app2);
      PM.util.qsa("[data-tipo]", app2).forEach((b) =>
        b.addEventListener("click", () => {
          const atual = coletar();
          tipo = b.dataset.tipo;
          atual.tipo = tipo;
          rasc = atual;
          PM.state.novaSolicitacao = atual;
          montar();
        })
      );
    }
    montar();

    function coletar() {
      const petId = (PM.util.qs('input[name="pet"]:checked', app) || {}).value;
      const origemId = (PM.util.qs('input[name="origem"]:checked', app) || {}).value || "";
      const destinoId = (PM.util.qs('input[name="destino"]:checked', app) || {}).value || null;
      const duracaoBtn = PM.util.qs('[data-duracao].is-active', app);
      const duracaoMin = duracaoBtn ? Number(duracaoBtn.dataset.duracao) : 30;
      const observacoes = PM.util.qs('textarea[name="observacoes"]', app).value;
      const recebedorNome = PM.util.qs('input[name="recebedorNome"]', app).value;
      const recebedorTelefone = PM.util.qs('input[name="recebedorTelefone"]', app).value;
      const formaPagamento = PM.ui.valorChipGroup(app, "pagamento")[0] || "PIX";
      return { tipo, petId, origemId, destinoId, duracaoMin, observacoes, recebedorNome, recebedorTelefone, formaPagamento };
    }

    // Rascunho automático: salva a cada alteração para não perder o preenchimento ao sair da tela
    app.addEventListener("input", () => (PM.state.novaSolicitacao = coletar()));
    app.addEventListener("change", () => (PM.state.novaSolicitacao = coletar()));

    // Delegação porque o botão "Ver resumo" é recriado a cada montar()
    app.addEventListener("click", (ev) => {
      const btnTipo = ev.target.closest("[data-duracao]");
      if (btnTipo) {
        PM.util.qsa("[data-duracao]", app).forEach((b) => b.classList.toggle("is-active", b === btnTipo));
        PM.state.novaSolicitacao = coletar();
        return;
      }
      if (ev.target.closest(".chip")) {
        PM.state.novaSolicitacao = coletar();
        return;
      }
      const btnResumo = ev.target.closest("[data-ver-resumo]");
      if (!btnResumo) return;

      const dados = coletar();
      const erros = [];
      if (!dados.petId) erros.push("Selecione um pet disponível.");
      if (!dados.origemId) erros.push("Selecione o endereço de origem.");
      if (dados.tipo === "TRANSPORTE" && !dados.destinoId) erros.push("Selecione o endereço de destino.");
      if (dados.tipo === "TRANSPORTE" && dados.destinoId && dados.destinoId === dados.origemId) erros.push("O destino deve ser diferente da origem.");
      if (!dados.recebedorNome || !dados.recebedorTelefone) erros.push("Informe nome e telefone de quem vai receber o pet.");
      if (dados.petId) {
        const pet = PM.db.get("pet", dados.petId);
        if (PM.util.vacinaVencida(pet.vacina_antirrabica_data)) erros.push("Este pet está com a vacinação antirrábica vencida ou não informada.");
        if (servicoAtivoParaPet(pet.id)) erros.push("Já existe um serviço em andamento para este pet.");
      }
      if (erros.length) {
        PM.util.qs("[data-errors]", app).innerHTML = PM.shared.erroCard(erros);
        return;
      }
      PM.state.novaSolicitacao = dados;
      PM.router.navegar("#/tutor/solicitar/resumo");
    });
  }

  /* ===================== T-09 Resumo e confirmação ===================== */
  function renderResumo(params, app) {
    const rasc = PM.state.novaSolicitacao;
    if (!rasc) {
      PM.router.navegar("#/tutor/solicitar");
      return;
    }
    const pet = PM.db.get("pet", rasc.petId);
    const origem = PM.db.get("endereco", rasc.origemId);
    const destino = rasc.destinoId ? PM.db.get("endereco", rasc.destinoId) : null;
    const est = calcularEstimativa({ tipo: rasc.tipo, origem, destino, duracaoMin: rasc.duracaoMin, porte: pet.porte });

    const content = `
      <div class="card">
        <div class="card-row">
          <img class="pet-thumb" src="${pet.foto}" alt="">
          <div><p style="font-weight:700">${PM.util.escapeHtml(pet.nome)}</p><p class="text-muted" style="font-size:.8rem">${PM.PORTE_LABEL[pet.porte]}</p></div>
        </div>
      </div>
      <div class="card">
        <p class="section-title">Trajeto</p>
        <p class="mt-8">📍 ${PM.util.escapeHtml(origem.apelido)} — ${PM.util.escapeHtml(origem.logradouro)}, ${PM.util.escapeHtml(origem.numero)}</p>
        ${
          rasc.tipo === "TRANSPORTE"
            ? `<p>🏁 ${PM.util.escapeHtml(destino.apelido)} — ${PM.util.escapeHtml(destino.logradouro)}, ${PM.util.escapeHtml(destino.numero)}</p>`
            : `<p>🔁 Passeio de ${rasc.duracaoMin} min e retorno ao mesmo endereço</p>`
        }
        <p class="text-muted mt-8" style="font-size:.82rem">Distância estimada: ${est.distanciaKm} km · Duração estimada: ${est.duracaoEstMin} min</p>
      </div>
      <div class="card">
        <p class="section-title">Detalhamento do preço</p>
        <div class="list mt-8" style="font-size:.86rem">
          ${
            rasc.tipo === "TRANSPORTE"
              ? `
            <div class="card-row" style="justify-content:space-between"><span>Tarifa base</span><span>${PM.util.formatBRL(est.preco.tarifaBase)}</span></div>
            <div class="card-row" style="justify-content:space-between"><span>Distância (${est.distanciaKm} km)</span><span>${PM.util.formatBRL(est.preco.distanciaValor)}</span></div>
            <div class="card-row" style="justify-content:space-between"><span>Adicional de porte</span><span>${PM.util.formatBRL(est.preco.adicionalPorte)}</span></div>`
              : `<div class="card-row" style="justify-content:space-between"><span>Pacote de ${rasc.duracaoMin} min</span><span>${PM.util.formatBRL(est.preco.valor)}</span></div>`
          }
          <div class="divider"></div>
          <div class="card-row" style="justify-content:space-between;font-weight:800;font-size:1rem"><span>Total</span><span>${PM.util.formatBRL(est.preco.valor)}</span></div>
        </div>
      </div>
      <div class="card">
        <p class="text-muted" style="font-size:.8rem">Cancelamento gratuito antes do aceite do condutor. Após o aceite, taxa de ${PM.util.formatBRL(CONST.TAXA_CANCELAMENTO)}.</p>
      </div>
      <button class="btn btn-primary" data-confirmar>Confirmar solicitação</button>
    `;

    PM.shared.paginaSimples(app, { title: "Resumo", back: true, content });
    PM.util.qs("[data-confirmar]", app).addEventListener("click", () => {
      const servico = PM.db.insert("servico", {
        tutor_id: tutor().id,
        condutor_id: null,
        pet_id: pet.id,
        tipo: rasc.tipo,
        status: PM.SERVICO_STATUS.SOLICITADO,
        origem_id: origem.id,
        destino_id: destino ? destino.id : null,
        duracao_passeio: rasc.tipo === "PASSEIO" ? rasc.duracaoMin : null,
        observacoes: rasc.observacoes || "",
        recebedor_nome: rasc.recebedorNome,
        recebedor_telefone: rasc.recebedorTelefone,
        codigo_entrega: PM.util.codigoEntrega4(),
        forma_pagamento: rasc.formaPagamento,
        distancia_km: est.distanciaKm,
        valor: est.preco.valor,
        criado_em: new Date().toISOString(),
        concluido_em: null,
        motivo_cancelamento: null,
      });
      PM.db.insert("servico_evento", { servico_id: servico.id, status: PM.SERVICO_STATUS.SOLICITADO, descricao: "Solicitação criada.", ocorrido_em: servico.criado_em });
      PM.state.novaSolicitacao = null;
      PM.matching.iniciarBusca(servico.id);
      PM.router.navegar(`#/tutor/servico/${servico.id}`);
    });
  }

  /* ===================== T-10 / T-11 Busca e acompanhamento ===================== */
  function renderAcompanhamento(params, app) {
    const servico = PM.db.get("servico", params.id);
    if (!servico) {
      PM.router.navegar("#/tutor/home");
      return;
    }
    const pet = PM.db.get("pet", servico.pet_id);

    function render() {
      if ([PM.SERVICO_STATUS.PROCURANDO_CONDUTOR, PM.SERVICO_STATUS.SEM_CONDUTOR].includes(servico.status)) {
        renderBuscando();
      } else if ([PM.SERVICO_STATUS.CONCLUIDO, PM.SERVICO_STATUS.AVALIADO].includes(servico.status)) {
        PM.router.navegar(servico.status === "CONCLUIDO" ? `#/tutor/servico/${servico.id}/avaliar` : `#/tutor/servico/${servico.id}/detalhe`);
      } else {
        renderEmExecucao();
      }
    }

    function renderBuscando() {
      const semCondutor = servico.status === PM.SERVICO_STATUS.SEM_CONDUTOR;
      const decorrido = Math.round((Date.now() - new Date(servico.busca_iniciada_em).getTime()) / 1000);
      const content = `
        <div class="card text-center">
          ${semCondutor ? "" : `<div class="spinner"></div>`}
          <p class="section-title mt-8">${semCondutor ? "Nenhum condutor aceitou" : "Procurando condutor…"}</p>
          <p class="text-muted">${semCondutor ? "Você pode continuar buscando ou cancelar." : `Tempo decorrido: ${PM.util.formatDuracao(decorrido)}`}</p>
          <p class="text-muted mt-8" style="font-size:.8rem">${PM.util.escapeHtml(pet.nome)} · ${servico.tipo === "TRANSPORTE" ? "Transporte" : "Passeio"}</p>
        </div>
        <div class="btn-row">
          ${semCondutor ? `<button class="btn btn-primary" data-continuar>Continuar buscando</button>` : ""}
          <button class="btn ${semCondutor ? "btn-secondary" : "btn-danger"}" data-cancelar>Cancelar ${semCondutor ? "" : "busca"}</button>
        </div>
      `;
      PM.shared.paginaSimples(app, { title: "Buscando condutor", back: false, content });
      PM.util.qs("[data-cancelar]", app).addEventListener("click", () => cancelarServico(servico.id, "#/tutor/home"));
      const contBtn = PM.util.qs("[data-continuar]", app);
      if (contBtn) contBtn.addEventListener("click", () => PM.matching.buscarNovamente(servico.id));
      if (!semCondutor) PM._activeInterval = setInterval(() => PM.router.render(), 1000);
    }

    function renderEmExecucao() {
      const info = condutorDoServico(servico);
      const eventos = eventosDoServico(servico.id);
      const evidencias = evidenciasDoServico(servico.id);
      const embarcado = ["EM_ANDAMENTO", "NO_DESTINO"].includes(servico.status);
      let cronometroHtml = "";
      if (servico.tipo === "PASSEIO" && servico.status === "EM_ANDAMENTO") {
        const inicioEvt = eventos.find((e) => e.status === "EM_ANDAMENTO");
        const fimMs = inicioEvt ? new Date(inicioEvt.ocorrido_em).getTime() + servico.duracao_passeio * 60000 : Date.now();
        const restanteSeg = Math.max(0, Math.round((fimMs - Date.now()) / 1000));
        cronometroHtml = `<div class="countdown mt-8"><p class="countdown-value">${PM.util.formatDuracao(restanteSeg)}</p><p class="countdown-caption">tempo restante do passeio</p></div>`;
      }
      const podeCancelar = ["ACEITO", "A_CAMINHO_ORIGEM", "NA_ORIGEM"].includes(servico.status);
      const content = `
        ${
          info
            ? `<div class="card">
          <div class="card-row">
            <img class="avatar" src="${info.usu.foto}" alt="">
            <div style="flex:1">
              <p style="font-weight:700">${PM.util.escapeHtml(info.usu.nome)} ${PM.ui.estrelas(info.cond.nota_media)}</p>
              <p class="text-muted" style="font-size:.8rem">${info.veiculo.modelo} · ${PM.util.maskPlaca(info.veiculo.placa)}</p>
            </div>
          </div>
          <div class="mt-8">${PM.ui.badge("✓ Documentação verificada", "success")}</div>
          <a class="btn btn-secondary mt-8" href="tel:${PM.util.onlyDigits(info.usu.telefone)}">📞 Ligar para o condutor</a>
        </div>`
            : ""
        }
        <div class="card">
          <p class="section-title">${PM.SERVICO_STATUS_LABEL[servico.status]}</p>
          <p class="text-muted" style="font-size:.82rem">${PM.util.escapeHtml(pet.nome)} · ${servico.tipo === "TRANSPORTE" ? "Transporte" : "Passeio"}</p>
          ${cronometroHtml}
        </div>
        ${
          embarcado
            ? `<div class="card delivery-code"><p style="font-size:.8rem;opacity:.85">Código de entrega</p><p class="delivery-code-value">${servico.codigo_entrega}</p><p style="font-size:.76rem;opacity:.85">Informe este código a quem vai receber o pet</p></div>`
            : ""
        }
        ${
          evidencias.length
            ? `<div class="card"><p class="section-title">Fotos recebidas</p><div class="doc-thumb-grid mt-8">${evidencias
                .map((ev) => `<div class="doc-thumb"><img src="${ev.arquivo}" alt="${ev.tipo}"></div>`)
                .join("")}</div></div>`
            : ""
        }
        <div class="card">
          <p class="section-title">Linha do tempo</p>
          <div class="mt-8">${PM.ui.linhaDoTempo(eventos)}</div>
        </div>
        ${podeCancelar ? `<button class="btn btn-danger" data-cancelar>Cancelar serviço</button>` : ""}
      `;
      PM.shared.paginaSimples(app, { title: "Acompanhamento", back: false, content });
      const cancelBtn = PM.util.qs("[data-cancelar]", app);
      if (cancelBtn) cancelBtn.addEventListener("click", () => cancelarServico(servico.id, "#/tutor/home"));
      PM._activeInterval = setInterval(() => PM.router.render(), 1000);
    }

    render();
  }

  /* ===================== T-12 Conclusão e avaliação ===================== */
  function renderAvaliacao(params, app) {
    const servico = PM.db.get("servico", params.id);
    if (!servico) return PM.router.navegar("#/tutor/home");
    const pet = PM.db.get("pet", servico.pet_id);
    const evidencias = evidenciasDoServico(servico.id);
    const info = condutorDoServico(servico);

    const content = `
      <div class="card">
        <p class="section-title">Serviço concluído 🎉</p>
        <p class="text-muted" style="font-size:.82rem">${PM.util.escapeHtml(pet.nome)} · ${servico.tipo === "TRANSPORTE" ? "Transporte" : "Passeio"} · ${PM.util.formatDataHoraBR(servico.concluido_em)}</p>
        <div class="stat-grid mt-8">
          <div class="stat-box"><p class="stat-value">${servico.distancia_km}km</p><p class="stat-label">Distância</p></div>
          <div class="stat-box"><p class="stat-value">${PM.util.formatBRL(servico.valor)}</p><p class="stat-label">Valor</p></div>
          <div class="stat-box"><p class="stat-value">${servico.forma_pagamento}</p><p class="stat-label">Pagamento</p></div>
        </div>
        ${evidencias.length ? `<div class="doc-thumb-grid mt-8">${evidencias.map((e) => `<div class="doc-thumb"><img src="${e.arquivo}" alt=""></div>`).join("")}</div>` : ""}
      </div>
      <div class="card">
        <p class="section-title">Avalie ${info ? PM.util.escapeHtml(info.usu.nome.split(" ")[0]) : "o condutor"}</p>
        <div class="mt-8">${PM.ui.estrelas(0, true, "nota")}</div>
        <textarea name="comentario" rows="2" placeholder="Comentário opcional" class="mt-8"></textarea>
      </div>
      <button class="btn btn-primary" data-enviar>Enviar avaliação</button>
      <button class="btn btn-ghost" data-pular>Pular</button>
    `;
    PM.shared.paginaSimples(app, { title: "Avaliação", back: false, content });
    PM.ui.ativarEstrelas(app);

    PM.util.qs("[data-enviar]", app).addEventListener("click", () => {
      const nota = Number(PM.util.qs("[data-stars-value]", app).value);
      if (!nota) {
        PM.ui.toast("Selecione de 1 a 5 estrelas.", "danger");
        return;
      }
      const comentario = PM.util.qs('textarea[name="comentario"]', app).value;
      PM.db.insert("avaliacao", { servico_id: servico.id, nota, comentario, criado_em: new Date().toISOString() });
      if (info) recalcularNotaMedia(info.cond.id);
      PM.fsm.transicionarServico(servico.id, PM.SERVICO_STATUS.AVALIADO, "Tutor avaliou o serviço.");
      PM.ui.toast("Obrigado pela avaliação!", "success");
      PM.router.navegar(`#/tutor/servico/${servico.id}/detalhe`);
    });
    PM.util.qs("[data-pular]", app).addEventListener("click", () => PM.router.navegar("#/tutor/historico"));
  }

  /* ===================== T-13 Histórico ===================== */
  function renderHistorico(params, app) {
    const t = tutor();
    const pets = petsDoTutor(t.id, true);
    const query = new URLSearchParams(location.hash.split("?")[1] || "");
    const filtroPet = query.get("pet") || "";
    const filtroPeriodo = query.get("periodo") || "todos";

    let servicos = PM.db.query("servico", (s) => s.tutor_id === t.id).sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
    if (filtroPet) servicos = servicos.filter((s) => s.pet_id === filtroPet);
    if (filtroPeriodo !== "todos") {
      const dias = Number(filtroPeriodo);
      const limite = Date.now() - dias * 86400000;
      servicos = servicos.filter((s) => new Date(s.criado_em).getTime() >= limite);
    }

    const content = `
      <div class="card">
        <div class="field-row">
          <div class="field">
            <label>Pet</label>
            <select data-filtro-pet>
              <option value="">Todos</option>
              ${pets.map((p) => `<option value="${p.id}" ${filtroPet === p.id ? "selected" : ""}>${PM.util.escapeHtml(p.nome)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Período</label>
            <select data-filtro-periodo>
              <option value="todos" ${filtroPeriodo === "todos" ? "selected" : ""}>Todos</option>
              <option value="7" ${filtroPeriodo === "7" ? "selected" : ""}>Últimos 7 dias</option>
              <option value="30" ${filtroPeriodo === "30" ? "selected" : ""}>Últimos 30 dias</option>
              <option value="90" ${filtroPeriodo === "90" ? "selected" : ""}>Últimos 90 dias</option>
            </select>
          </div>
        </div>
      </div>
      ${
        servicos.length
          ? `<div class="list">${servicos
              .map((s) => {
                const pet = PM.db.get("pet", s.pet_id);
                const tipoIcon = s.tipo === "TRANSPORTE" ? "🚗" : "🐕";
                const cor = s.status.includes("CANCELADO") ? "danger" : s.status === "AVALIADO" || s.status === "CONCLUIDO" ? "success" : "neutral";
                return `
              <div class="card card-clickable" data-abrir="${s.id}">
                <div class="card-row" style="justify-content:space-between">
                  <span>${tipoIcon} ${PM.util.escapeHtml(pet?.nome || "—")}</span>
                  ${PM.ui.badge(PM.SERVICO_STATUS_LABEL[s.status], cor)}
                </div>
                <div class="card-row mt-8" style="justify-content:space-between">
                  <span class="text-muted" style="font-size:.8rem">${PM.util.formatDataBR(s.criado_em)}</span>
                  <span style="font-weight:700">${PM.util.formatBRL(s.valor)}</span>
                </div>
              </div>`;
              })
              .join("")}</div>`
          : PM.ui.emptyState("🕓", "Nenhum serviço encontrado", "Ajuste os filtros ou solicite seu primeiro serviço.")
      }
    `;
    PM.shared.paginaTutor(app, { title: "Histórico", activeNav: "historico", content });
    PM.util.qsa("[data-abrir]", app).forEach((c) => c.addEventListener("click", () => PM.router.navegar(`#/tutor/servico/${c.dataset.abrir}/detalhe`)));
    function atualizarFiltro() {
      const pet = PM.util.qs("[data-filtro-pet]", app).value;
      const periodo = PM.util.qs("[data-filtro-periodo]", app).value;
      location.hash = `#/tutor/historico?pet=${pet}&periodo=${periodo}`;
      PM.router.render();
    }
    PM.util.qs("[data-filtro-pet]", app).addEventListener("change", atualizarFiltro);
    PM.util.qs("[data-filtro-periodo]", app).addEventListener("change", atualizarFiltro);
  }

  /* ===================== T-14 Detalhe do serviço ===================== */
  function renderDetalhe(params, app) {
    const servico = PM.db.get("servico", params.id);
    if (!servico) return PM.router.navegar("#/tutor/historico");
    const pet = PM.db.get("pet", servico.pet_id);
    const info = condutorDoServico(servico);
    const eventos = eventosDoServico(servico.id);
    const evidencias = evidenciasDoServico(servico.id);
    const avaliacao = avaliacaoDoServico(servico.id);

    const content = `
      <div class="card">
        <div class="card-row" style="justify-content:space-between">
          <p style="font-weight:700">${PM.util.escapeHtml(pet.nome)} · ${servico.tipo === "TRANSPORTE" ? "Transporte" : "Passeio"}</p>
          ${PM.ui.badge(PM.SERVICO_STATUS_LABEL[servico.status], servico.status.includes("CANCELADO") ? "danger" : "success")}
        </div>
        ${servico.motivo_cancelamento ? `<p class="text-danger mt-8" style="font-size:.82rem">Motivo: ${PM.util.escapeHtml(servico.motivo_cancelamento)}</p>` : ""}
      </div>
      ${
        info
          ? `<div class="card card-row">
        <img class="avatar" src="${info.usu.foto}" alt="">
        <div><p style="font-weight:700">${PM.util.escapeHtml(info.usu.nome)}</p><p class="text-muted" style="font-size:.8rem">${info.veiculo.modelo} · ${PM.util.maskPlaca(info.veiculo.placa)}</p></div>
      </div>`
          : ""
      }
      ${avaliacao ? `<div class="card"><p class="section-title">Sua avaliação</p><div class="mt-8">${PM.ui.estrelas(avaliacao.nota)}</div>${avaliacao.comentario ? `<p class="mt-8" style="font-size:.85rem">"${PM.util.escapeHtml(avaliacao.comentario)}"</p>` : ""}</div>` : ""}
      ${evidencias.length ? `<div class="card"><p class="section-title">Fotos</p><div class="doc-thumb-grid mt-8">${evidencias.map((e) => `<div class="doc-thumb"><img src="${e.arquivo}" alt=""></div>`).join("")}</div></div>` : ""}
      <div class="card">
        <p class="section-title">Linha do tempo</p>
        <div class="mt-8">${PM.ui.linhaDoTempo(eventos)}</div>
      </div>
      <div class="card">
        <p class="section-title">Resumo financeiro</p>
        <div class="card-row mt-8" style="justify-content:space-between"><span>Distância</span><span>${servico.distancia_km} km</span></div>
        <div class="card-row" style="justify-content:space-between"><span>Forma de pagamento</span><span>${servico.forma_pagamento}</span></div>
        <div class="card-row" style="justify-content:space-between;font-weight:800"><span>Total</span><span>${PM.util.formatBRL(servico.valor)}</span></div>
      </div>
      ${["CONCLUIDO", "AVALIADO", "CANCELADO_PELO_TUTOR"].includes(servico.status) ? `<button class="btn btn-secondary" data-repetir>Repetir este serviço</button>` : ""}
    `;
    PM.shared.paginaSimples(app, { title: "Detalhe do serviço", back: true, content });
    const repetirBtn = PM.util.qs("[data-repetir]", app);
    if (repetirBtn)
      repetirBtn.addEventListener("click", () => {
        PM.state.novaSolicitacao = {
          tipo: servico.tipo,
          petId: servico.pet_id,
          origemId: servico.origem_id,
          destinoId: servico.destino_id,
          duracaoMin: servico.duracao_passeio || 30,
          observacoes: servico.observacoes,
          recebedorNome: servico.recebedor_nome,
          recebedorTelefone: servico.recebedor_telefone,
          formaPagamento: servico.forma_pagamento,
        };
        PM.router.navegar("#/tutor/solicitar/resumo");
      });
  }

  /* ===================== Perfil ===================== */
  function renderPerfil(params, app) {
    const t = tutor();
    const content = `
      <div class="card text-center">
        <img class="avatar avatar-lg" style="margin:0 auto 8px" src="${t.foto}" alt="">
        <p style="font-weight:800">${PM.util.escapeHtml(t.nome)}</p>
        <p class="text-muted" style="font-size:.82rem">${PM.util.escapeHtml(t.email)} · ${PM.util.escapeHtml(t.telefone)}</p>
      </div>
      <div class="list">
        <a class="card card-row card-clickable" href="#/tutor/pets"><span>🐾</span><span style="flex:1">Meus pets</span><span>›</span></a>
        <a class="card card-row card-clickable" href="#/tutor/enderecos"><span>📍</span><span style="flex:1">Meus endereços</span><span>›</span></a>
      </div>
      <button class="btn btn-secondary" data-action="reset-dados">Reiniciar dados de demonstração</button>
      <button class="btn btn-danger" data-action="logout">Sair</button>
    `;
    PM.shared.paginaTutor(app, { title: "Perfil", activeNav: "perfil", content });
  }

  PM.router.registrar("/tutor/home", "tutor", renderHome);
  PM.router.registrar("/tutor/pets", "tutor", renderPets);
  PM.router.registrar("/tutor/pet/novo", "tutor", renderFormPet);
  PM.router.registrar("/tutor/pet/:id/editar", "tutor", renderFormPet);
  PM.router.registrar("/tutor/enderecos", "tutor", renderEnderecos);
  PM.router.registrar("/tutor/endereco/novo", "tutor", renderFormEndereco);
  PM.router.registrar("/tutor/endereco/:id/editar", "tutor", renderFormEndereco);
  PM.router.registrar("/tutor/solicitar", "tutor", renderNovaSolicitacao);
  PM.router.registrar("/tutor/solicitar/resumo", "tutor", renderResumo);
  PM.router.registrar("/tutor/servico/:id", "tutor", renderAcompanhamento);
  PM.router.registrar("/tutor/servico/:id/avaliar", "tutor", renderAvaliacao);
  PM.router.registrar("/tutor/historico", "tutor", renderHistorico);
  PM.router.registrar("/tutor/servico/:id/detalhe", "tutor", renderDetalhe);
  PM.router.registrar("/tutor/perfil", "tutor", renderPerfil);
})();
