/* PetMove — autenticação e sessão (RF-AUT-01..06) */
window.PM = window.PM || {};

(function () {
  const SESSION_KEY = "petmove_sessao";

  PM.auth = {
    sessaoAtual() {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    usuarioAtual() {
      const s = this.sessaoAtual();
      return s ? PM.db.get("usuario", s.usuario_id) : null;
    },

    condutorAtual() {
      const u = this.usuarioAtual();
      if (!u || u.tipo !== "condutor") return null;
      return PM.db.query("condutor", (c) => c.usuario_id === u.id)[0] || null;
    },

    async cadastrarTutor({ nome, email, telefone, senha, aceiteTermos }) {
      const erros = [];
      if (!nome || nome.trim().length < 2) erros.push("Informe seu nome completo.");
      if (!PM.util.validarEmail(email)) erros.push("E-mail inválido.");
      if (!PM.util.validarTelefone(telefone)) erros.push("Telefone inválido. Use DDD + 9 dígitos.");
      if (!PM.util.validarSenha(senha)) erros.push("A senha deve ter no mínimo 8 caracteres.");
      if (!aceiteTermos) erros.push("É necessário aceitar os Termos de Uso.");
      if (PM.db.query("usuario", (u) => u.email.toLowerCase() === (email || "").toLowerCase()).length) {
        erros.push("Já existe uma conta com este e-mail.");
      }
      if (erros.length) return { ok: false, erros };

      const usuario = PM.db.insert("usuario", {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone,
        senha_hash: await PM.util.sha256(senha),
        tipo: "tutor",
        foto: PM.util.placeholderImg(nome.trim().split(" ")[0]),
        criado_em: new Date().toISOString(),
        termos_aceitos_em: new Date().toISOString(),
      });
      return { ok: true, usuario };
    },

    async login({ email, senha, perfil }) {
      const usuario = PM.db.query("usuario", (u) => u.email.toLowerCase() === (email || "").trim().toLowerCase())[0];
      if (!usuario) return { ok: false, erro: "E-mail ou senha inválidos." };
      const hash = await PM.util.sha256(senha || "");
      if (hash !== usuario.senha_hash) return { ok: false, erro: "E-mail ou senha inválidos." };
      if (usuario.tipo !== perfil) {
        return { ok: false, erro: `Esta conta é do tipo ${usuario.tipo}. Selecione o perfil correto para entrar.` };
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify({ usuario_id: usuario.id, tipo: usuario.tipo }));
      return { ok: true, usuario };
    },

    logout() {
      localStorage.removeItem(SESSION_KEY);
    },
  };
})();
