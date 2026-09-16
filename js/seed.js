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

  const petBidu = db.insert("pet", {
    usuario_id: tutor.id,
    nome: "Bidu",
    especie: "cão",
    raca: "Labrador",
    porte: "G",
    peso: 30,
    idade: 4,
    sexo: "Macho",
    foto: PM.util.placeholderImg("Bidu"),
    temperamento: ["Agitado", "Dócil"],
    necessidades: "Precisa de grade divisória, é grande e se movimenta bastante.",
    vacina_antirrabica_data: diasAtras(90),
    ativo: true,
  });

  const petNina = db.insert("pet", {
    usuario_id: tutor.id,
    nome: "Nina",
    especie: "gato",
    raca: "Persa",
    porte: "M",
    peso: 15,
    idade: 2,
    sexo: "Fêmea",
    foto: PM.util.placeholderImg("Nina"),
    temperamento: ["Dócil"],
    necessidades: "",
    vacina_antirrabica_data: diasAtras(30),
    ativo: true,
  });

  /* ---------- Segundo tutor de demonstração (mostra isolamento de dados entre contas) ---------- */
  const tutor2 = db.insert("usuario", {
    nome: "Diego Ferraz",
    email: "diego@petmove.com",
    telefone: "(11) 97654-3210",
    senha_hash: await hash("senha123"),
    tipo: "tutor",
    foto: PM.util.placeholderImg("Diego"),
    criado_em: diasAtras(45),
  });
  const tutor2End1 = db.insert("endereco", {
    usuario_id: tutor2.id,
    apelido: "Casa",
    cep: PM.CEPS[4].cep,
    logradouro: PM.CEPS[4].logradouro,
    numero: "128",
    complemento: "Casa 2",
    bairro: PM.CEPS[4].bairro,
    cidade: PM.CEPS[4].cidade,
    uf: PM.CEPS[4].uf,
    instrucoes: "Portão azul, campainha ao lado.",
    lat: PM.CEPS[4].lat,
    lng: PM.CEPS[4].lng,
    padrao: true,
  });
  db.insert("endereco", {
    usuario_id: tutor2.id,
    apelido: "Trabalho",
    cep: PM.CEPS[0].cep,
    logradouro: PM.CEPS[0].logradouro,
    numero: "1500",
    complemento: "Sala 803",
    bairro: PM.CEPS[0].bairro,
    cidade: PM.CEPS[0].cidade,
    uf: PM.CEPS[0].uf,
    instrucoes: "Recepção do prédio, pedir para chamar Diego.",
    lat: PM.CEPS[0].lat,
    lng: PM.CEPS[0].lng,
    padrao: false,
  });
  const petThor = db.insert("pet", {
    usuario_id: tutor2.id,
    nome: "Thor",
    especie: "cão",
    raca: "Golden Retriever",
    porte: "G",
    peso: 32,
    idade: 5,
    sexo: "Macho",
    foto: PM.util.placeholderImg("Thor"),
    temperamento: ["Dócil"],
    necessidades: "",
    vacina_antirrabica_data: diasAtras(50),
    ativo: true,
  });
  const petLuna = db.insert("pet", {
    usuario_id: tutor2.id,
    nome: "Luna",
    especie: "gato",
    raca: "Sem raça definida",
    porte: "P",
    peso: 3.5,
    idade: 1,
    sexo: "Fêmea",
    foto: PM.util.placeholderImg("Luna"),
    temperamento: ["Ansioso", "Dócil"],
    necessidades: "Primeira vez saindo de casa, pode se assustar fácil.",
    vacina_antirrabica_data: diasAtras(20),
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

  /* ---------- Segundo condutor em análise (enviado antes de Carla, testa ordenação por data) ---------- */
  const usuEmAnalise2 = db.insert("usuario", {
    nome: "Marcos Vinícius",
    email: "marcos@petmove.com",
    telefone: "(11) 96222-1188",
    senha_hash: await hash("senha123"),
    tipo: "condutor",
    foto: PM.util.placeholderImg("Marcos"),
    criado_em: diasAtras(4),
  });
  const condEmAnalise2 = db.insert("condutor", {
    usuario_id: usuEmAnalise2.id,
    cpf: "05633216070",
    data_nascimento: "1992-11-02",
    cnh_numero: "65498712300",
    cnh_categoria: "A",
    cnh_validade: diasFrente(600),
    status_cadastro: PM.CONDUTOR_STATUS.EM_ANALISE,
    data_envio: diasAtras(3),
    data_analise: null,
    analisado_por: null,
    justificativa: "",
    nota_media: 0,
    total_servicos: 0,
    online: false,
    lat_atual: PM.CEPS[5].lat,
    lng_atual: PM.CEPS[5].lng,
    ganhos_dia: 0,
  });
  db.insert("veiculo", {
    condutor_id: condEmAnalise2.id,
    marca: "Yamaha",
    modelo: "Factor 150",
    ano: 2023,
    cor: "Vermelha",
    placa: "MVX9A81",
    tipo: "Moto",
    portes_aceitos: ["P"],
    max_pets: 1,
    grade_divisoria: false,
    caixa_transporte: true,
  });
  ["cnh_frente", "cnh_verso", "selfie_documento", "veiculo_placa"].forEach((tipo) => {
    db.salvarDocumento(condEmAnalise2.id, tipo, PM.util.placeholderImg(tipo));
  });

  /* ---------- Condutor com pendência (documento ilegível) ---------- */
  const usuPendencia = db.insert("usuario", {
    nome: "Patrícia Lima",
    email: "patricia@petmove.com",
    telefone: "(11) 96111-3344",
    senha_hash: await hash("senha123"),
    tipo: "condutor",
    foto: PM.util.placeholderImg("Patricia"),
    criado_em: diasAtras(6),
  });
  const condPendencia = db.insert("condutor", {
    usuario_id: usuPendencia.id,
    cpf: "89246531007",
    data_nascimento: "1991-04-18",
    cnh_numero: "14785236900",
    cnh_categoria: "B",
    cnh_validade: diasFrente(400),
    status_cadastro: PM.CONDUTOR_STATUS.PENDENCIA,
    data_envio: diasAtras(5),
    data_analise: diasAtras(4),
    analisado_por: admin.id,
    justificativa: "Foto da frente da CNH está ilegível. Reenvie com melhor iluminação e sem reflexo.",
    nota_media: 0,
    total_servicos: 0,
    online: false,
    lat_atual: PM.CEPS[2].lat,
    lng_atual: PM.CEPS[2].lng,
    ganhos_dia: 0,
  });
  db.insert("veiculo", {
    condutor_id: condPendencia.id,
    marca: "Hyundai",
    modelo: "HB20",
    ano: 2020,
    cor: "Azul",
    placa: "PLX4B56",
    tipo: "Carro",
    portes_aceitos: ["P", "M"],
    max_pets: 2,
    grade_divisoria: true,
    caixa_transporte: true,
  });
  ["cnh_frente", "cnh_verso", "selfie_documento", "veiculo_placa"].forEach((tipo) => {
    db.salvarDocumento(condPendencia.id, tipo, PM.util.placeholderImg(tipo));
  });

  /* ---------- Condutor reprovado (RN-19: bloqueia novo cadastro com o mesmo CPF) ---------- */
  const usuReprovado = db.insert("usuario", {
    nome: "Igor Santos",
    email: "igor@petmove.com",
    telefone: "(11) 96999-2233",
    senha_hash: await hash("senha123"),
    tipo: "condutor",
    foto: PM.util.placeholderImg("Igor"),
    criado_em: diasAtras(15),
  });
  const condReprovado = db.insert("condutor", {
    usuario_id: usuReprovado.id,
    cpf: "35817246091",
    data_nascimento: "1993-07-25",
    cnh_numero: "25836914700",
    cnh_categoria: "B",
    cnh_validade: diasFrente(300),
    status_cadastro: PM.CONDUTOR_STATUS.REPROVADO,
    data_envio: diasAtras(14),
    data_analise: diasAtras(13),
    analisado_por: admin.id,
    justificativa: "O rosto da selfie não corresponde à foto do documento enviado.",
    nota_media: 0,
    total_servicos: 0,
    online: false,
    lat_atual: PM.CEPS[9].lat,
    lng_atual: PM.CEPS[9].lng,
    ganhos_dia: 0,
  });
  db.insert("veiculo", {
    condutor_id: condReprovado.id,
    marca: "Renault",
    modelo: "Kwid",
    ano: 2019,
    cor: "Cinza",
    placa: "IGX1S23",
    tipo: "Carro",
    portes_aceitos: ["P"],
    max_pets: 1,
    grade_divisoria: false,
    caixa_transporte: true,
  });
  ["cnh_frente", "cnh_verso", "selfie_documento", "veiculo_placa"].forEach((tipo) => {
    db.salvarDocumento(condReprovado.id, tipo, PM.util.placeholderImg(tipo));
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
  function criarServicoHistorico({ tutorUsuario = tutor, origem = end1, pet, condutor, tipo, status, valor, distanciaKm, avaliar, motivoCancel }) {
    const criado = diasAtras(10 + Math.floor(Math.random() * 30));
    const srv = db.insert("servico", {
      tutor_id: tutorUsuario.id,
      condutor_id: condutor ? condutor.cond.id : null,
      pet_id: pet.id,
      tipo,
      status,
      origem_id: origem.id,
      destino_id: tipo === "TRANSPORTE" ? origem.id : null,
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
  criarServicoHistorico({
    pet: petBidu,
    condutor: c2,
    tipo: "TRANSPORTE",
    status: "AVALIADO",
    valor: 32,
    distanciaKm: 4,
    avaliar: { nota: 5, comentario: "Cuidou super bem do Bidu, que é bem grande e agitado." },
  });
  criarServicoHistorico({
    pet: petNina,
    condutor: c1,
    tipo: "PASSEIO",
    status: "AVALIADO",
    valor: 48,
    distanciaKm: 0,
    avaliar: { nota: 4, comentario: "Passeio tranquilo, só demorou um pouco para começar." },
  });
  criarServicoHistorico({
    pet: petOk,
    condutor: c2,
    tipo: "PASSEIO",
    status: "CONCLUIDO",
    valor: 60,
    distanciaKm: 0,
  });
  criarServicoHistorico({
    pet: petVencido,
    condutor: c3,
    tipo: "TRANSPORTE",
    status: "AVALIADO",
    valor: 20,
    distanciaKm: 2,
    avaliar: { nota: 5, comentario: "Rápido e cuidadoso, ótima experiência." },
  });
  criarServicoHistorico({
    pet: petBidu,
    condutor: c1,
    tipo: "PASSEIO",
    status: "CANCELADO_PELO_CONDUTOR",
    valor: 0,
    distanciaKm: 0,
    motivoCancel: "Imprevisto de última hora.",
  });

  /* ---------- Histórico de serviços do Diego (segundo tutor) ---------- */
  criarServicoHistorico({
    tutorUsuario: tutor2,
    origem: tutor2End1,
    pet: petThor,
    condutor: c1,
    tipo: "TRANSPORTE",
    status: "AVALIADO",
    valor: 29.5,
    distanciaKm: 3,
    avaliar: { nota: 5, comentario: "Motorista muito atencioso com o Thor." },
  });
  criarServicoHistorico({
    tutorUsuario: tutor2,
    origem: tutor2End1,
    pet: petLuna,
    condutor: c3,
    tipo: "PASSEIO",
    status: "AVALIADO",
    valor: 35,
    distanciaKm: 0,
    avaliar: { nota: 4, comentario: "Luna ainda fica meio assustada, mas foi bem." },
  });
  criarServicoHistorico({
    tutorUsuario: tutor2,
    origem: tutor2End1,
    pet: petThor,
    condutor: c2,
    tipo: "PASSEIO",
    status: "CONCLUIDO",
    valor: 48,
    distanciaKm: 0,
  });

  PM.util.log && PM.util.log("Seed concluído.");
};
