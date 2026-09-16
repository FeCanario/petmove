/* PetMove — T-01 Login, T-02 Cadastro do tutor */
window.PM = window.PM || {};

(function () {
  function renderLogin(params, app) {
    let perfil = "tutor";

    function html() {
      const linkCadastro =
        perfil === "tutor"
          ? `<a class="link-btn" href="#/cadastro/tutor">Criar conta de tutor</a>`
          : perfil === "condutor"
          ? `<a class="link-btn" href="#/condutor/cadastro/1">Quero ser condutor PetMove</a>`
          : `<span class="text-muted" style="font-size:.78rem">Acesso restrito à equipe PetMove.</span>`;

      return `
        <div class="auth-shell">
          <div class="auth-visual">
            <img src="assets/PetMove.jpeg" alt="PetMove">
            <h2>Conforto e carinho em cada passeio</h2>
            <ul>
              <li>🪪 Condutores com identidade verificada</li>
              <li>📸 Fotos no embarque e no desembarque</li>
              <li>🔢 Código de entrega em toda corrida</li>
              <li>⭐ Avaliação e histórico completo de cada serviço</li>
            </ul>
          </div>
          <div class="auth-form-side">
            <div class="auth-card card">
              <a class="link-btn" href="#/" style="display:inline-block;margin-bottom:10px;font-size:.82rem">← Voltar ao site</a>
              <div class="auth-logo"><img src="assets/PetMove.jpeg" alt="PetMove"></div>
              <p class="auth-title">PetMove</p>
              <p class="auth-subtitle">Conforto e carinho em cada passeio</p>

              <div class="profile-select" data-profile-select>
                <button type="button" data-profile="tutor" class="${perfil === "tutor" ? "is-active" : ""}">Tutor</button>
                <button type="button" data-profile="condutor" class="${perfil === "condutor" ? "is-active" : ""}">Condutor</button>
                <button type="button" data-profile="admin" class="${perfil === "admin" ? "is-active" : ""}">Administrador</button>
              </div>

              <form data-form="login">
                <div class="field">
                  <label for="login-email">E-mail</label>
                  <input id="login-email" name="email" type="email" required placeholder="voce@email.com" autocomplete="username">
                </div>
                ${PM.ui.campoSenha({ id: "login-senha", name: "senha", label: "Senha", placeholder: "Mínimo 8 caracteres", minlength: 8 })}
                <div data-errors></div>
                <button class="btn btn-primary" type="submit">Entrar</button>
              </form>

              <p class="text-center mt-8" data-cadastro-link>${linkCadastro}</p>
            </div>
          </div>
        </div>`;
    }

    function montar() {
      PM.shared.montar(app, html());
      PM.ui.ativarTogglesSenha(app);
      PM.util.qsa("[data-profile]", app).forEach((btn) => {
        btn.addEventListener("click", () => {
          perfil = btn.dataset.profile;
          montar();
        });
      });
      const form = PM.util.qs('[data-form="login"]', app);
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const dados = PM.shared.formToObject(form);
        const res = await PM.auth.login({ email: dados.email, senha: dados.senha, perfil });
        const errosEl = PM.util.qs("[data-errors]", app);
        if (!res.ok) {
          errosEl.innerHTML = PM.shared.erroCard([res.erro]);
          return;
        }
        PM.ui.toast(`Bem-vindo(a), ${res.usuario.nome.split(" ")[0]}!`, "success");
        PM.router.navegar(PM.router.homePorPerfil(perfil));
      });
    }

    montar();
  }

  function renderCadastroTutor(params, app) {
    const html = `
      ${PM.ui.topBar({ title: "Criar conta", back: true })}
      <div class="page">
        <div class="card">
          <p class="section-title">Cadastro de tutor</p>
          <form data-form="cadastro-tutor">
            <div class="field">
              <label for="ct-nome">Nome completo</label>
              <input id="ct-nome" name="nome" required placeholder="Seu nome">
            </div>
            <div class="field">
              <label for="ct-email">E-mail</label>
              <input id="ct-email" name="email" type="email" required placeholder="voce@email.com">
            </div>
            <div class="field">
              <label for="ct-telefone">Telefone</label>
              <input id="ct-telefone" name="telefone" required placeholder="(11) 90000-0000" data-mask="telefone">
            </div>
            ${PM.ui.campoSenha({ id: "ct-senha", name: "senha", label: "Senha", placeholder: "Mínimo 8 caracteres", minlength: 8, autocomplete: "new-password" })}
            ${PM.ui.campoSenha({ id: "ct-senha2", name: "senha2", label: "Confirmar senha", placeholder: "Repita a senha", minlength: 8, autocomplete: "new-password" })}
            <label class="checkbox-row">
              <input type="checkbox" name="termos" value="1">
              <span>Li e aceito os <a class="link-btn" href="#" data-ver-termos="1">Termos de Uso</a> da PetMove.</span>
            </label>
            <div data-errors class="mt-8"></div>
            <button class="btn btn-primary mt-8" type="submit">Cadastrar</button>
          </form>
        </div>
      </div>`;
    PM.shared.montar(app, html);
    PM.ui.ativarTogglesSenha(app);

    PM.util.qs("[data-mask='telefone']", app).addEventListener("input", (e) => {
      e.target.value = PM.util.maskTelefone(e.target.value);
    });

    PM.util.qs("[data-ver-termos]", app).addEventListener("click", (e) => {
      e.preventDefault();
      PM.ui.abrirModal(`
        <h2 class="modal-title">Termos de Uso</h2>
        <p class="modal-text">Ao usar o PetMove, você concorda com o tratamento dos dados informados
        para viabilizar o transporte e o passeio do seu pet, sempre com o menor compartilhamento possível
        de informações entre tutores, condutores e a equipe da plataforma.</p>
        <div class="modal-actions"><button class="btn btn-primary" data-modal-dismiss>Entendi</button></div>
      `);
    });

    const form = PM.util.qs('[data-form="cadastro-tutor"]', app);
    PM.formcache.ligar("cadastro-tutor", form);
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const dados = PM.shared.formToObject(form);
      const errosEl = PM.util.qs("[data-errors]", app);
      if (dados.senha !== dados.senha2) {
        errosEl.innerHTML = PM.shared.erroCard(["As senhas não coincidem."]);
        return;
      }
      const res = await PM.auth.cadastrarTutor({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        senha: dados.senha,
        aceiteTermos: dados.termos === "1",
      });
      if (!res.ok) {
        errosEl.innerHTML = PM.shared.erroCard(res.erros);
        return;
      }
      await PM.auth.login({ email: dados.email, senha: dados.senha, perfil: "tutor" });
      PM.formcache.limpar("cadastro-tutor");
      PM.ui.toast("Conta criada com sucesso!", "success");
      PM.router.navegar("#/tutor/home");
    });
  }

  PM.router.registrar("/login", null, renderLogin);
  PM.router.registrar("/cadastro/tutor", null, renderCadastroTutor);
})();
