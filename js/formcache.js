/* PetMove — rascunho automático de formulários (salva no localStorage enquanto o usuário digita) */
window.PM = window.PM || {};

(function () {
  function chave(id) {
    return `petmove_rascunho_${id}`;
  }

  function coletar(form) {
    const dados = PM.shared.formToObject(form);
    // nunca guardamos senha em rascunho
    Object.keys(dados).forEach((k) => {
      const el = form.elements[k];
      if (el && el.type === "password") delete dados[k];
    });
    const chips = {};
    PM.util.qsa("[data-chip-group]", form).forEach((grupo) => {
      chips[grupo.dataset.chipGroup] = PM.ui.valorChipGroup(form, grupo.dataset.chipGroup);
    });
    return { dados, chips };
  }

  PM.formcache = {
    salvar(id, form) {
      try {
        localStorage.setItem(chave(id), JSON.stringify(coletar(form)));
      } catch (e) {
        /* armazenamento cheio ou indisponível: ignora silenciosamente */
      }
    },

    restaurar(id, form) {
      let raw;
      try {
        raw = localStorage.getItem(chave(id));
      } catch (e) {
        return false;
      }
      if (!raw) return false;
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        return false;
      }
      const { dados = {}, chips = {} } = parsed;
      let algoRestaurado = false;
      Object.entries(dados).forEach(([name, value]) => {
        if (!value) return;
        const els = form.querySelectorAll(`[name="${CSS.escape(name)}"]`);
        if (!els.length) return;
        if (els[0].type === "checkbox") {
          els[0].checked = value === "on" || value === "1" || value === true;
        } else if (els[0].type === "radio") {
          els.forEach((r) => (r.checked = r.value === value));
        } else {
          els[0].value = value;
        }
        algoRestaurado = true;
      });
      Object.entries(chips).forEach(([grupoNome, valores]) => {
        if (!valores || !valores.length) return;
        const grupo = form.querySelector(`[data-chip-group="${CSS.escape(grupoNome)}"]`);
        if (!grupo) return;
        PM.util.qsa(".chip", grupo).forEach((c) => c.classList.toggle("is-selected", valores.includes(c.dataset.chipValue)));
        algoRestaurado = true;
      });
      return algoRestaurado;
    },

    limpar(id) {
      try {
        localStorage.removeItem(chave(id));
      } catch (e) {
        /* ignora */
      }
    },

    /* Restaura o rascunho salvo (se houver) e passa a salvar a cada alteração do formulário */
    ligar(id, form) {
      const restaurou = this.restaurar(id, form);
      if (restaurou) PM.ui.toast("Continuamos de onde você parou.", "info");
      const salvar = () => this.salvar(id, form);
      form.addEventListener("input", salvar);
      form.addEventListener("change", salvar);
      return restaurou;
    },
  };
})();
