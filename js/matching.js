/* PetMove — busca e oferta de condutor (RF-MAT-01..07), com timers de simulação */
window.PM = window.PM || {};

(function () {
  const timers = {}; // servicoId -> { ofertaTimeout, autoAceiteTimeout, buscaTimeout }

  function limparTimers(servicoId) {
    const t = timers[servicoId];
    if (!t) return;
    clearTimeout(t.ofertaTimeout);
    clearTimeout(t.autoAceiteTimeout);
    clearTimeout(t.buscaTimeout);
  }

  PM.matching = {
    condutoresElegiveis(servico) {
      const pet = PM.db.get("pet", servico.pet_id);
      const origem = PM.db.get("endereco", servico.origem_id);
      const veiculos = PM.db.list("veiculo");
      const emAndamento = new Set(
        PM.db
          .query("servico", (s) => s.id !== servico.id && !["CONCLUIDO", "AVALIADO", "CANCELADO_PELO_TUTOR", "CANCELADO_PELO_CONDUTOR"].includes(s.status))
          .map((s) => s.condutor_id)
      );
      return PM.db
        .list("condutor")
        .filter((c) => PM.fsm.condutorPodeOperar(c) && c.online && !emAndamento.has(c.id))
        .map((c) => ({ condutor: c, veiculo: veiculos.find((v) => v.condutor_id === c.id) }))
        .filter((e) => e.veiculo && e.veiculo.portes_aceitos.includes(pet.porte))
        .map((e) => ({ ...e, distanciaOrigem: PM.util.haversineKm(origem.lat, origem.lng, e.condutor.lat_atual, e.condutor.lng_atual) }))
        .sort((a, b) => a.distanciaOrigem - b.distanciaOrigem);
    },

    iniciarBusca(servicoId) {
      const servico = PM.db.get("servico", servicoId);
      const fila = this.condutoresElegiveis(servico).map((e) => e.condutor.id);
      PM.db.update("servico", servicoId, { fila_condutores: fila, busca_iniciada_em: new Date().toISOString() });
      PM.fsm.transicionarServico(servicoId, PM.SERVICO_STATUS.PROCURANDO_CONDUTOR, "Buscando condutor disponível.");
      timers[servicoId] = {};
      timers[servicoId].buscaTimeout = setTimeout(() => {
        const s = PM.db.get("servico", servicoId);
        if (s && s.status === PM.SERVICO_STATUS.PROCURANDO_CONDUTOR) {
          PM.fsm.transicionarServico(servicoId, PM.SERVICO_STATUS.SEM_CONDUTOR, "Nenhum condutor aceitou em 2 minutos.");
        }
      }, PM.CONST.TEMPO_BUSCA_MAXIMO_SEGUNDOS * 1000);
      this._ofertarProximo(servicoId);
    },

    buscarNovamente(servicoId) {
      const servico = PM.db.get("servico", servicoId);
      const fila = this.condutoresElegiveis(servico).map((e) => e.condutor.id);
      PM.db.update("servico", servicoId, { fila_condutores: fila });
      PM.fsm.transicionarServico(servicoId, PM.SERVICO_STATUS.PROCURANDO_CONDUTOR, "Buscando novamente.");
      timers[servicoId] = timers[servicoId] || {};
      timers[servicoId].buscaTimeout = setTimeout(() => {
        const s = PM.db.get("servico", servicoId);
        if (s && s.status === PM.SERVICO_STATUS.PROCURANDO_CONDUTOR) {
          PM.fsm.transicionarServico(servicoId, PM.SERVICO_STATUS.SEM_CONDUTOR, "Nenhum condutor aceitou em 2 minutos.");
        }
      }, PM.CONST.TEMPO_BUSCA_MAXIMO_SEGUNDOS * 1000);
      this._ofertarProximo(servicoId);
    },

    _ofertarProximo(servicoId) {
      const servico = PM.db.get("servico", servicoId);
      if (!servico) return;
      const fila = servico.fila_condutores || [];
      if (!fila.length) {
        PM.fsm.transicionarServico(servicoId, PM.SERVICO_STATUS.SEM_CONDUTOR, "Nenhum condutor disponível no momento.");
        return;
      }
      const proximoId = fila[0];
      const restante = fila.slice(1);
      PM.db.update("servico", servicoId, {
        fila_condutores: restante,
        oferta_condutor_id: proximoId,
        oferta_expira_em: new Date(Date.now() + PM.CONST.TEMPO_OFERTA_SEGUNDOS * 1000).toISOString(),
      });
      window.dispatchEvent(new CustomEvent("pm:oferta-nova", { detail: { servicoId, condutorId: proximoId } }));

      timers[servicoId] = timers[servicoId] || {};
      clearTimeout(timers[servicoId].ofertaTimeout);
      clearTimeout(timers[servicoId].autoAceiteTimeout);

      timers[servicoId].ofertaTimeout = setTimeout(() => {
        const s2 = PM.db.get("servico", servicoId);
        if (s2 && s2.status === PM.SERVICO_STATUS.PROCURANDO_CONDUTOR && s2.oferta_condutor_id === proximoId) {
          this._ofertarProximo(servicoId);
        }
      }, PM.CONST.TEMPO_OFERTA_SEGUNDOS * 1000);

      const sessao = PM.auth.sessaoAtual();
      const condutorLogado = sessao && sessao.tipo === "condutor";
      if (!condutorLogado) {
        const min = PM.CONST.AUTO_ACEITE_MIN_SEGUNDOS;
        const max = PM.CONST.AUTO_ACEITE_MAX_SEGUNDOS;
        const delay = (min + Math.random() * (max - min)) * 1000;
        timers[servicoId].autoAceiteTimeout = setTimeout(() => {
          const s3 = PM.db.get("servico", servicoId);
          if (s3 && s3.status === PM.SERVICO_STATUS.PROCURANDO_CONDUTOR && s3.oferta_condutor_id === proximoId) {
            this.aceitar(servicoId, proximoId);
          }
        }, delay);
      }
    },

    ofertaPendenteParaCondutor(condutorId) {
      return PM.db.query(
        "servico",
        (s) => s.status === PM.SERVICO_STATUS.PROCURANDO_CONDUTOR && s.oferta_condutor_id === condutorId
      )[0] || null;
    },

    aceitar(servicoId, condutorId) {
      const servico = PM.db.get("servico", servicoId);
      if (!servico || servico.oferta_condutor_id !== condutorId) return { ok: false, erro: "Esta oferta não está mais disponível." };
      limparTimers(servicoId);
      PM.db.update("servico", servicoId, { condutor_id: condutorId, oferta_condutor_id: null, oferta_expira_em: null, fila_condutores: [] });
      PM.fsm.transicionarServico(servicoId, PM.SERVICO_STATUS.ACEITO, "Condutor aceitou a solicitação.");
      return { ok: true };
    },

    recusar(servicoId, condutorId) {
      const servico = PM.db.get("servico", servicoId);
      if (!servico || servico.oferta_condutor_id !== condutorId) return;
      clearTimeout(timers[servicoId]?.ofertaTimeout);
      clearTimeout(timers[servicoId]?.autoAceiteTimeout);
      PM.db.update("servico", servicoId, { oferta_condutor_id: null, oferta_expira_em: null });
      this._ofertarProximo(servicoId);
    },

    cancelar(servicoId) {
      limparTimers(servicoId);
    },

    /* Recuperação após reabertura do app (RNF-02): reativa a oferta de qualquer serviço ainda em busca */
    retomarBuscasPendentes() {
      PM.db.query("servico", (s) => s.status === PM.SERVICO_STATUS.PROCURANDO_CONDUTOR).forEach((s) => {
        if (!timers[s.id]) {
          timers[s.id] = {};
          if (s.oferta_condutor_id) {
            this._ofertarProximo(s.id);
          } else {
            this._ofertarProximo(s.id);
          }
        }
      });
    },
  };
})();
