/* PetMove — máquinas de estado (seção 8): grafos explícitos de transição válida */
window.PM = window.PM || {};

(function () {
  const S = PM.SERVICO_STATUS;
  const SERVICO_GRAFO = {
    [S.SOLICITADO]: [S.PROCURANDO_CONDUTOR, S.CANCELADO_PELO_TUTOR],
    [S.PROCURANDO_CONDUTOR]: [S.ACEITO, S.SEM_CONDUTOR, S.CANCELADO_PELO_TUTOR],
    [S.SEM_CONDUTOR]: [S.PROCURANDO_CONDUTOR, S.CANCELADO_PELO_TUTOR],
    [S.ACEITO]: [S.A_CAMINHO_ORIGEM, S.CANCELADO_PELO_TUTOR, S.CANCELADO_PELO_CONDUTOR],
    [S.A_CAMINHO_ORIGEM]: [S.NA_ORIGEM, S.CANCELADO_PELO_TUTOR, S.CANCELADO_PELO_CONDUTOR],
    [S.NA_ORIGEM]: [S.EM_ANDAMENTO, S.CANCELADO_PELO_TUTOR],
    [S.EM_ANDAMENTO]: [S.NO_DESTINO],
    [S.NO_DESTINO]: [S.CONCLUIDO],
    [S.CONCLUIDO]: [S.AVALIADO],
    [S.AVALIADO]: [],
    [S.CANCELADO_PELO_TUTOR]: [],
    [S.CANCELADO_PELO_CONDUTOR]: [],
  };

  const C = PM.CONDUTOR_STATUS;
  const CONDUTOR_GRAFO = {
    [C.RASCUNHO]: [C.EM_ANALISE],
    [C.EM_ANALISE]: [C.PENDENCIA, C.REPROVADO, C.APROVADO],
    [C.PENDENCIA]: [C.EM_ANALISE],
    [C.APROVADO]: [C.ATIVO, C.SUSPENSO, C.EM_ANALISE],
    [C.ATIVO]: [C.SUSPENSO, C.EM_ANALISE],
    [C.SUSPENSO]: [C.EM_ANALISE, C.ATIVO],
    [C.REPROVADO]: [],
  };

  PM.fsm = {
    /* Avança o status de um serviço, validando a transição e gravando o evento (CA-09) */
    transicionarServico(servicoId, novoStatus, descricao) {
      const servico = PM.db.get("servico", servicoId);
      if (!servico) throw new Error("Serviço não encontrado.");
      const permitidas = SERVICO_GRAFO[servico.status] || [];
      if (!permitidas.includes(novoStatus)) {
        throw new Error(`Transição inválida: ${servico.status} → ${novoStatus}`);
      }
      const agora = new Date().toISOString();
      const patch = { status: novoStatus };
      if (novoStatus === S.CONCLUIDO || novoStatus === S.CANCELADO_PELO_TUTOR || novoStatus === S.CANCELADO_PELO_CONDUTOR) {
        patch.concluido_em = agora;
      }
      const atualizado = PM.db.update("servico", servicoId, patch);
      PM.db.insert("servico_evento", {
        servico_id: servicoId,
        status: novoStatus,
        descricao: descricao || PM.SERVICO_STATUS_LABEL[novoStatus] || novoStatus,
        ocorrido_em: agora,
      });
      window.dispatchEvent(new CustomEvent("pm:servico-mudou", { detail: { servicoId, status: novoStatus } }));
      return atualizado;
    },

    transicoesPermitidasServico(statusAtual) {
      return SERVICO_GRAFO[statusAtual] || [];
    },

    /* Avança o status de cadastro do condutor, validando a transição e registrando log_analise quando houver parecer */
    transicionarCondutor(condutorId, novoStatus, { analisadoPor, parecer, justificativa } = {}) {
      const condutor = PM.db.get("condutor", condutorId);
      if (!condutor) throw new Error("Condutor não encontrado.");
      const permitidas = CONDUTOR_GRAFO[condutor.status_cadastro] || [];
      if (!permitidas.includes(novoStatus)) {
        throw new Error(`Transição inválida: ${condutor.status_cadastro} → ${novoStatus}`);
      }
      const agora = new Date().toISOString();
      const patch = { status_cadastro: novoStatus };
      if ([C.APROVADO, C.REPROVADO, C.PENDENCIA, C.SUSPENSO].includes(novoStatus)) {
        patch.data_analise = agora;
        patch.analisado_por = analisadoPor || null;
        patch.justificativa = justificativa || "";
      }
      if (novoStatus === C.APROVADO) {
        // aprovado já habilita operação; a ausência de mais nada a verificar promove direto para ATIVO
        patch.status_cadastro = C.ATIVO;
      }
      const atualizado = PM.db.update("condutor", condutorId, patch);
      if (analisadoPor || parecer) {
        PM.db.insert("log_analise", {
          condutor_id: condutorId,
          admin_id: analisadoPor || null,
          parecer: parecer || novoStatus,
          justificativa: justificativa || "",
          registrado_em: agora,
        });
      }
      window.dispatchEvent(new CustomEvent("pm:condutor-mudou", { detail: { condutorId, status: patch.status_cadastro } }));
      return atualizado;
    },

    condutorPodeOperar(condutor) {
      if (!condutor) return false;
      if (condutor.status_cadastro !== C.ATIVO) return false;
      const validade = new Date(condutor.cnh_validade);
      return validade.getTime() >= Date.now();
    },
  };
})();
