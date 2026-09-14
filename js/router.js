/* PetMove — roteador por hash com guarda de perfil */
window.PM = window.PM || {};

(function () {
  const rotas = [];

  function combinar(padrao, hash) {
    const partesPadrao = padrao.split("/").filter(Boolean);
    const partesHash = hash.split("/").filter(Boolean);
    if (partesPadrao.length !== partesHash.length) return null;
    const params = {};
    for (let i = 0; i < partesPadrao.length; i++) {
      const p = partesPadrao[i];
      if (p.startsWith(":")) params[p.slice(1)] = decodeURIComponent(partesHash[i]);
      else if (p !== partesHash[i]) return null;
    }
    return params;
  }

  function encontrarRota(hash) {
    for (const r of rotas) {
      const params = combinar(r.path, hash);
      if (params) return { rota: r, params };
    }
    return null;
  }

  PM.router = {
    registrar(path, perfilRequerido, render) {
      rotas.push({ path, perfilRequerido, render });
    },

    navegar(hash) {
      if (location.hash === hash) {
        this.render();
      } else {
        location.hash = hash;
      }
    },

    voltar() {
      history.back();
    },

    render() {
      const hashCompleto = (location.hash || "#/").replace(/^#/, "");
      const hash = hashCompleto.split("?")[0];
      const achado = encontrarRota(hash);
      const app = document.getElementById("app");
      const sessao = PM.auth.sessaoAtual();

      if (!achado) {
        this.navegar(sessao ? PM.router.homePorPerfil(sessao.tipo) : "#/");
        return;
      }

      if (PM._activeInterval) {
        clearInterval(PM._activeInterval);
        PM._activeInterval = null;
      }
      if (PM._activeListeners) {
        PM._activeListeners.forEach(({ evt, fn }) => window.removeEventListener(evt, fn));
        PM._activeListeners = null;
      }

      const { rota, params } = achado;

      if (rota.perfilRequerido && (!sessao || sessao.tipo !== rota.perfilRequerido)) {
        this.navegar("#/login");
        return;
      }
      if ((rota.path === "/login" || rota.path === "/") && sessao) {
        this.navegar(PM.router.homePorPerfil(sessao.tipo));
        return;
      }

      try {
        rota.render(params, app);
      } catch (e) {
        console.error("Erro ao renderizar rota", hash, e);
        app.innerHTML = `<div class="page"><div class="card">Ocorreu um erro ao abrir esta tela.</div></div>`;
      }
      window.scrollTo(0, 0);
    },

    homePorPerfil(tipo) {
      if (tipo === "tutor") return "#/tutor/home";
      if (tipo === "condutor") return "#/condutor/home";
      if (tipo === "admin") return "#/admin/fila";
      return "#/login";
    },

    iniciar() {
      window.addEventListener("hashchange", () => this.render());
      window.addEventListener("pm:db-changed", () => this.render());
      this.render();
    },
  };
})();
