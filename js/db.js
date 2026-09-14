/* PetMove — camada de dados local (RNF-01/02/12): troca futura por API sem alterar as telas */
window.PM = window.PM || {};

(function () {
  const DB_KEY = "petmove_db";
  const DOCS_KEY = "petmove_documentos"; // área separada, RNF-07
  const TABELAS = [
    "usuario",
    "pet",
    "endereco",
    "condutor",
    "veiculo",
    "documento",
    "servico",
    "servico_evento",
    "evidencia",
    "avaliacao",
    "log_analise",
  ];

  function vazio() {
    const obj = {};
    TABELAS.forEach((t) => (obj[t] = []));
    return obj;
  }

  function carregar(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("PM.db: erro ao ler", key, e);
      return null;
    }
  }

  function salvar(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  let cache = carregar(DB_KEY);
  let cacheDocs = carregar(DOCS_KEY);

  PM.db = {
    existe() {
      return !!cache;
    },

    /* Cria as tabelas vazias caso ainda não existam. Retorna true se acabou de criar (para o app decidir se semeia). */
    inicializarSeVazio() {
      if (cache) return false;
      cache = vazio();
      cacheDocs = { documentos: [] };
      salvar(DB_KEY, cache);
      salvar(DOCS_KEY, cacheDocs);
      return true;
    },

    /* Limpa tudo. Quem chamar é responsável por rodar o seed depois (RNF-13). */
    reiniciar() {
      cache = vazio();
      cacheDocs = { documentos: [] };
      salvar(DB_KEY, cache);
      salvar(DOCS_KEY, cacheDocs);
    },

    list(tabela) {
      return (cache[tabela] || []).slice();
    },

    get(tabela, id) {
      return (cache[tabela] || []).find((r) => r.id === id) || null;
    },

    query(tabela, predicado) {
      return (cache[tabela] || []).filter(predicado);
    },

    insert(tabela, registro) {
      if (!cache[tabela]) cache[tabela] = [];
      const rec = Object.assign({ id: PM.util.uid(tabela.slice(0, 3)) }, registro);
      cache[tabela].push(rec);
      salvar(DB_KEY, cache);
      return rec;
    },

    update(tabela, id, patch) {
      const lista = cache[tabela] || [];
      const idx = lista.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      lista[idx] = Object.assign({}, lista[idx], patch);
      salvar(DB_KEY, cache);
      return lista[idx];
    },

    remove(tabela, id) {
      cache[tabela] = (cache[tabela] || []).filter((r) => r.id !== id);
      salvar(DB_KEY, cache);
    },

    /* Documentos — área isolada, acessível só pelo próprio condutor e pelo admin (RNF-07) */
    salvarDocumento(condutorId, tipo, dataUrl) {
      const doc = {
        id: PM.util.uid("doc"),
        condutor_id: condutorId,
        tipo,
        arquivo: dataUrl,
        enviado_em: new Date().toISOString(),
        conferido: false,
      };
      cacheDocs.documentos.push(doc);
      salvar(DOCS_KEY, cacheDocs);
      this.insert("documento", { condutor_id: condutorId, tipo, arquivo_ref: doc.id, enviado_em: doc.enviado_em, conferido: false });
      return doc;
    },

    listarDocumentos(condutorId) {
      return cacheDocs.documentos.filter((d) => d.condutor_id === condutorId);
    },

    documentoPorTipo(condutorId, tipo) {
      const docs = cacheDocs.documentos.filter((d) => d.condutor_id === condutorId && d.tipo === tipo);
      return docs.length ? docs[docs.length - 1] : null;
    },

    excluirDocumentosDoUsuario(condutorId) {
      cacheDocs.documentos = cacheDocs.documentos.filter((d) => d.condutor_id !== condutorId);
      salvar(DOCS_KEY, cacheDocs);
      cache.documento = (cache.documento || []).filter((d) => d.condutor_id !== condutorId);
      salvar(DB_KEY, cache);
    },

    /* Recarrega o cache quando outra aba grava no localStorage (sincronização entre perfis) */
    recarregarDoStorage() {
      const nova = carregar(DB_KEY);
      if (nova) cache = nova;
      const novosDocs = carregar(DOCS_KEY);
      if (novosDocs) cacheDocs = novosDocs;
    },
  };

  window.addEventListener("storage", (ev) => {
    if (ev.key === DB_KEY || ev.key === DOCS_KEY) {
      PM.db.recarregarDoStorage();
      window.dispatchEvent(new CustomEvent("pm:db-changed"));
    }
  });
})();
