/* PetMove — dados iniciais (seção 10.1) */
window.PM = window.PM || {};

PM.CEPS = [
  { cep: "01310-100", logradouro: "Av. Paulista", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP", lat: -23.5613, lng: -46.6565 },
  { cep: "04538-133", logradouro: "Rua Iguatemi", bairro: "Itaim Bibi", cidade: "São Paulo", uf: "SP", lat: -23.587, lng: -46.6749 },
  { cep: "05407-002", logradouro: "Rua Teodoro Sampaio", bairro: "Pinheiros", cidade: "São Paulo", uf: "SP", lat: -23.567, lng: -46.696 },
  { cep: "02011-000", logradouro: "Av. Cruzeiro do Sul", bairro: "Santana", cidade: "São Paulo", uf: "SP", lat: -23.501, lng: -46.6291 },
  { cep: "03310-000", logradouro: "Rua Tuiuti", bairro: "Tatuapé", cidade: "São Paulo", uf: "SP", lat: -23.54, lng: -46.5771 },
  { cep: "04711-130", logradouro: "Av. Giovanni Gronchi", bairro: "Morumbi", cidade: "São Paulo", uf: "SP", lat: -23.618, lng: -46.708 },
  { cep: "01452-000", logradouro: "Rua Cardeal Brandão Vilela", bairro: "Vila Nova Conceição", cidade: "São Paulo", uf: "SP", lat: -23.586, lng: -46.669 },
  { cep: "05422-030", logradouro: "Rua Harmonia", bairro: "Vila Madalena", cidade: "São Paulo", uf: "SP", lat: -23.556, lng: -46.69 },
  { cep: "04094-050", logradouro: "Rua Domingos de Morais", bairro: "Vila Mariana", cidade: "São Paulo", uf: "SP", lat: -23.589, lng: -46.635 },
  { cep: "08210-001", logradouro: "Av. José Pinheiro Borges", bairro: "Itaquera", cidade: "São Paulo", uf: "SP", lat: -23.538, lng: -46.447 },
];

PM.buscarCep = function (cepDigitado) {
  const d = PM.util.onlyDigits(cepDigitado);
  return PM.CEPS.find((c) => PM.util.onlyDigits(c.cep) === d) || null;
};

PM.seed = async function seed() {
  const db = PM.db;
  const hash = (s) => PM.util.sha256(s);
  const hoje = new Date();
  const diasAtras = (n) => new Date(Date.now() - n * 86400000).toISOString();
  const diasFrente = (n) => new Date(Date.now() + n * 86400000).toISOString();

  /* ---------- Tutor de demonstração ---------- */
  const tutor = db.insert("usuario", {
    nome: "Marina Souza",
    email: "tutor@petmove.com",
    telefone: "(11) 98888-1111",
    senha_hash: await hash("senha123"),
    tipo: "tutor",
    foto: PM.util.placeholderImg("Marina"),
    criado_em: diasAtras(120),
  });

  const end1 = db.insert("endereco", {
    usuario_id: tutor.id,
    apelido: "Casa",
    cep: PM.CEPS[1].cep,
    logradouro: PM.CEPS[1].logradouro,
    numero: "210",
    complemento: "Apto 62",
    bairro: PM.CEPS[1].bairro,
    cidade: PM.CEPS[1].cidade,
    uf: PM.CEPS[1].uf,
    instrucoes: "Portaria 24h, avisar porteiro João. Cão de porte médio, dócil.",
    lat: PM.CEPS[1].lat,
    lng: PM.CEPS[1].lng,
    padrao: true,
  });
  db.insert("endereco", {
    usuario_id: tutor.id,
    apelido: "Petshop",
    cep: PM.CEPS[2].cep,
    logradouro: PM.CEPS[2].logradouro,
    numero: "980",
    complemento: "",
    bairro: PM.CEPS[2].bairro,
    cidade: PM.CEPS[2].cidade,
    uf: PM.CEPS[2].uf,
    instrucoes: "Loja no térreo, entrada pelos fundos.",
    lat: PM.CEPS[2].lat,
    lng: PM.CEPS[2].lng,
    padrao: false,
  });
  db.insert("endereco", {
    usuario_id: tutor.id,
    apelido: "Veterinário",
    cep: PM.CEPS[8].cep,
    logradouro: PM.CEPS[8].logradouro,
    numero: "455",
    complemento: "Sala 12",
    bairro: PM.CEPS[8].bairro,
    cidade: PM.CEPS[8].cidade,
    uf: PM.CEPS[8].uf,
    instrucoes: "Clínica Vet Amigo, interfone 12.",
    lat: PM.CEPS[8].lat,
    lng: PM.CEPS[8].lng,
    padrao: false,
  });

  const petOk = db.insert("pet", {
    usuario_id: tutor.id,
    nome: "Toby",
    especie: "cão",
    raca: "Jack Russell Terrier",
    porte: "P",
    peso: 8,
    idade: 3,
    sexo: "Macho",
    foto: PM.util.placeholderImg("Toby"),
    temperamento: ["Dócil", "Agitado"],
    necessidades: "Fica ansioso em carro por mais de 20 minutos.",
    vacina_antirrabica_data: diasAtras(60),
    ativo: true,
  });

  const petVencido = db.insert("pet", {
    usuario_id: tutor.id,
    nome: "Mel",
    especie: "gato",
    raca: "Siamês",
    porte: "P",
    peso: 4,
    idade: 5,
    sexo: "Fêmea",
    foto: PM.util.placeholderImg("Mel"),
    temperamento: ["Ansioso", "Reativo"],
    necessidades: "",
    vacina_antirrabica_data: diasAtras(420), // vencida — exercita RF-SOL-09 / CA-12
    ativo: true,
  });

  /* ---------- Administrador ---------- */
  const admin = db.insert("usuario", {
    nome: "Equipe PetMove",
    email: "admin@petmove.com",
    telefone: "(11) 90000-0000",
    senha_hash: await hash("admin123"),
    tipo: "admin",
    foto: PM.util.placeholderImg("Admin"),
    criado_em: diasAtras(300),
  });

  /* ---------- Condutores aprovados e online ---------- */
  async function criarCondutorAprovado({ nome, cpf, cnh, placa, tipoVeiculo, portesAceitos, nota, totalServicos, cep, ganhosDia = 0 }) {
    const usu = db.insert("usuario", {
      nome,
      email: `${nome.split(" ")[0].toLowerCase()}@petmove.com`,
      telefone: "(11) 97777-0000",
      senha_hash: await hash("senha123"),
      tipo: "condutor",
      foto: PM.util.placeholderImg(nome.split(" ")[0]),
      criado_em: diasAtras(200),
    });
    const cepInfo = PM.buscarCep(cep);
    const cond = db.insert("condutor", {
      usuario_id: usu.id,
      cpf,
      data_nascimento: "1990-05-10",
      cnh_numero: cnh,
      cnh_categoria: tipoVeiculo === "Moto" ? "A" : "B",
      cnh_validade: diasFrente(300),
      status_cadastro: PM.CONDUTOR_STATUS.ATIVO,
      data_envio: diasAtras(180),
      data_analise: diasAtras(178),
      analisado_por: admin.id,
      justificativa: "",
      nota_media: nota,
      total_servicos: totalServicos,
      online: true,
      lat_atual: cepInfo.lat,
      lng_atual: cepInfo.lng,
      ganhos_dia: ganhosDia,
    });
    db.insert("veiculo", {
      condutor_id: cond.id,
      marca: tipoVeiculo === "Moto" ? "Honda" : "Chevrolet",
      modelo: tipoVeiculo === "Moto" ? "CG 160" : "Onix",
      ano: 2021,
      cor: "Branco",
      placa,
      tipo: tipoVeiculo,
      portes_aceitos: portesAceitos,
      max_pets: tipoVeiculo === "Moto" ? 1 : 2,
      grade_divisoria: tipoVeiculo !== "Moto",
      caixa_transporte: true,
    });
    ["cnh_frente", "cnh_verso", "selfie_documento", "veiculo_placa"].forEach((tipo) => {
      db.salvarDocumento(cond.id, tipo, PM.util.placeholderImg(tipo));
    });
    return { usu, cond };
  }

  const c1 = await criarCondutorAprovado({
    nome: "Rafael Nogueira",
    cpf: "39053344705",
    cnh: "98765432100",
    placa: "ABC1D23",
    tipoVeiculo: "Carro",
    portesAceitos: ["P", "M", "G"],
    nota: 4.8,
    totalServicos: 132,
    cep: PM.CEPS[0].cep,
    ganhosDia: 96,
  });
  const c2 = await criarCondutorAprovado({
    nome: "Juliana Prado",
    cpf: "15350946056",
    cnh: "12345678900",
    placa: "XYZ4E56",
    tipoVeiculo: "Van",
    portesAceitos: ["P", "M", "G", "GG"],
    nota: 4.6,
    totalServicos: 87,
    cep: PM.CEPS[6].cep,
    ganhosDia: 64,
  });
  const c3 = await criarCondutorAprovado({
    nome: "Bruno Alencar",
    cpf: "74053324709",
    cnh: "45612378900",
    placa: "DEF7G89",
    tipoVeiculo: "Moto",
    portesAceitos: ["P"],
    nota: 4.9,
    totalServicos: 210,
    cep: PM.CEPS[7].cep,
    ganhosDia: 120,
  });

  /* ---------- Condutor em análise, com documentos enviados ---------- */
  const usuEmAnalise = db.insert("usuario", {
    nome: "Carla Menezes",
    email: "carla@petmove.com",
    telefone: "(11) 96666-2222",
    senha_hash: await hash("senha123"),
    tipo: "condutor",
    foto: PM.util.placeholderImg("Carla"),
    criado_em: diasAtras(2),
  });
  const condEmAnalise = db.insert("condutor", {
    usuario_id: usuEmAnalise.id,
    cpf: "26458245080",
    data_nascimento: "1995-02-20",
    cnh_numero: "78912345600",
    cnh_categoria: "B",
    cnh_validade: diasFrente(500),
    status_cadastro: PM.CONDUTOR_STATUS.EM_ANALISE,
    data_envio: diasAtras(1),
    data_analise: null,
    analisado_por: null,
    justificativa: "",
    nota_media: 0,
    total_servicos: 0,
    online: false,
    lat_atual: PM.CEPS[3].lat,
    lng_atual: PM.CEPS[3].lng,
    ganhos_dia: 0,
  });
  db.insert("veiculo", {
    condutor_id: condEmAnalise.id,
    marca: "Fiat",
    modelo: "Argo",
    ano: 2022,
    cor: "Cinza",
    placa: "HIJ2K34",
    tipo: "Carro",
    portes_aceitos: ["P", "M"],
    max_pets: 2,
    grade_divisoria: true,
    caixa_transporte: false,
  });
  ["cnh_frente", "cnh_verso", "selfie_documento", "veiculo_placa"].forEach((tipo) => {
    db.salvarDocumento(condEmAnalise.id, tipo, PM.util.placeholderImg(tipo));
  });

  /* ---------- Condutor com CNH vencida (RN-13) ---------- */
  const usuVencido = db.insert("usuario", {
    nome: "Eduardo Lima",
    email: "eduardo@petmove.com",
    telefone: "(11) 95555-3333",
    senha_hash: await hash("senha123"),
    tipo: "condutor",
    foto: PM.util.placeholderImg("Eduardo"),
    criado_em: diasAtras(400),
  });
  const condVencido = db.insert("condutor", {
    usuario_id: usuVencido.id,
    cpf: "88221100005",
    data_nascimento: "1988-08-08",
    cnh_numero: "32165498700",
    cnh_categoria: "B",
    cnh_validade: diasAtras(10), // vencida
    status_cadastro: PM.CONDUTOR_STATUS.SUSPENSO,
    data_envio: diasAtras(390),
    data_analise: diasAtras(388),
    analisado_por: admin.id,
    justificativa: "CNH vencida — cadastro suspenso automaticamente.",
    nota_media: 4.5,
    total_servicos: 58,
    online: false,
    lat_atual: PM.CEPS[4].lat,
    lng_atual: PM.CEPS[4].lng,
    ganhos_dia: 0,
  });
  db.insert("veiculo", {
    condutor_id: condVencido.id,
    marca: "VW",
    modelo: "Gol",
    ano: 2018,
    cor: "Preto",
    placa: "LMN5P67",
    tipo: "Carro",
    portes_aceitos: ["P", "M", "G"],
    max_pets: 2,
    grade_divisoria: false,
    caixa_transporte: true,
  });

  /* ---------- Histórico de serviços do tutor ---------- */
  function criarServicoHistorico({ pet, condutor, tipo, status, valor, distanciaKm, avaliar, motivoCancel }) {
    const criado = diasAtras(10 + Math.floor(Math.random() * 30));
    const srv = db.insert("servico", {
      tutor_id: tutor.id,
      condutor_id: condutor ? condutor.cond.id : null,
      pet_id: pet.id,
      tipo,
      status,
      origem_id: end1.id,
      destino_id: tipo === "TRANSPORTE" ? end1.id : null,
      duracao_passeio: tipo === "PASSEIO" ? 30 : null,
      observacoes: "",
      recebedor_nome: "Atendente",
      recebedor_telefone: "(11) 90000-1234",
      codigo_entrega: PM.util.codigoEntrega4(),
      forma_pagamento: "PIX",
      distancia_km: distanciaKm,
      valor,
      criado_em: criado,
      concluido_em: status.startsWith("CONCLUIDO") || status === "AVALIADO" ? diasAtras(9) : null,
      motivo_cancelamento: motivoCancel || null,
    });
    ["SOLICITADO", "ACEITO", "A_CAMINHO_ORIGEM", "NA_ORIGEM", "EM_ANDAMENTO", "NO_DESTINO", status]
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .forEach((st, i) => {
        db.insert("servico_evento", { servico_id: srv.id, status: st, descricao: PM.SERVICO_STATUS_LABEL[st] || st, ocorrido_em: diasAtras(10 - i * 0.1) });
      });
    db.insert("evidencia", { servico_id: srv.id, tipo: "embarque", arquivo: PM.util.placeholderImg("Embarque"), registrado_em: criado });
    db.insert("evidencia", { servico_id: srv.id, tipo: "desembarque", arquivo: PM.util.placeholderImg("Desembarque"), registrado_em: criado });
    if (avaliar) {
      db.insert("avaliacao", { servico_id: srv.id, nota: avaliar.nota, comentario: avaliar.comentario, criado_em: diasAtras(9) });
    }
    return srv;
  }

  criarServicoHistorico({
    pet: petOk,
    condutor: c1,
    tipo: "TRANSPORTE",
    status: "AVALIADO",
    valor: 24.5,
    distanciaKm: 5,
    avaliar: { nota: 5, comentario: "Muito cuidadoso com o Toby!" },
  });
  criarServicoHistorico({
    pet: petOk,
    condutor: c2,
    tipo: "PASSEIO",
    status: "AVALIADO",
    valor: 35,
    distanciaKm: 0,
    avaliar: { nota: 4, comentario: "Passeio tranquilo." },
  });
  criarServicoHistorico({
    pet: petVencido,
    condutor: c3,
    tipo: "TRANSPORTE",
    status: "CANCELADO_PELO_TUTOR",
    valor: 8,
    distanciaKm: 3,
    motivoCancel: "Compromisso desmarcado.",
  });
  criarServicoHistorico({
    pet: petOk,
    condutor: c1,
    tipo: "TRANSPORTE",
    status: "CONCLUIDO",
    valor: 27,
    distanciaKm: 6,
  });

  PM.util.log && PM.util.log("Seed concluído.");
};
