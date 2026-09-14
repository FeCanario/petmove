/* PetMove — utilitários: validação, máscara, cálculo, formatação, imagem */
window.PM = window.PM || {};

PM.util = {
  uid(prefix) {
    const rnd = Math.random().toString(36).slice(2, 10);
    const t = Date.now().toString(36);
    return `${prefix ? prefix + "_" : ""}${t}${rnd}`;
  },

  codigoEntrega4() {
    return String(Math.floor(1000 + Math.random() * 9000));
  },

  async sha256(text) {
    // crypto.subtle só existe em "contexto seguro" (HTTPS ou localhost). Ao abrir o app
    // pelo IP da rede local no celular (http://192.168.x.x), ele fica indisponível — por
    // isso sempre há um cálculo em JS puro como reserva, garantindo o mesmo hash em qualquer contexto.
    if (window.crypto && window.crypto.subtle && window.isSecureContext) {
      try {
        const enc = new TextEncoder().encode(text);
        const buf = await crypto.subtle.digest("SHA-256", enc);
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch (e) {
        // segue para o cálculo em JS puro
      }
    }
    return PM.util._sha256Puro(text);
  },

  _sha256Puro(texto) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));

    const bytes = new TextEncoder().encode(texto);
    const bitLen = bytes.length * 8;
    const padded = new Uint8Array((((bytes.length + 9 + 63) >> 6) << 6));
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 8, Math.floor(bitLen / 4294967296), false);
    dv.setUint32(padded.length - 4, bitLen >>> 0, false);

    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Uint32Array(64);

    for (let chunk = 0; chunk < padded.length; chunk += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(chunk + i * 4, false);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0;
        d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      H = [(H[0] + a) >>> 0, (H[1] + b) >>> 0, (H[2] + c) >>> 0, (H[3] + d) >>> 0, (H[4] + e) >>> 0, (H[5] + f) >>> 0, (H[6] + g) >>> 0, (H[7] + h) >>> 0];
    }
    return H.map((x) => x.toString(16).padStart(8, "0")).join("");
  },

  onlyDigits(s) {
    return (s || "").replace(/\D/g, "");
  },

  validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
  },

  validarTelefone(tel) {
    const d = this.onlyDigits(tel);
    return /^\d{2}9\d{8}$/.test(d);
  },

  maskTelefone(tel) {
    const d = this.onlyDigits(tel).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  },

  validarSenha(senha) {
    return (senha || "").length >= 8;
  },

  validarCPF(cpf) {
    const d = this.onlyDigits(cpf);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    const calc = (len) => {
      let soma = 0;
      for (let i = 0; i < len; i++) soma += parseInt(d[i], 10) * (len + 1 - i);
      const resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    };
    return calc(9) === parseInt(d[9], 10) && calc(10) === parseInt(d[10], 10);
  },

  maskCPF(cpf) {
    const d = this.onlyDigits(cpf).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  },

  maskCPFOculto(cpf) {
    const d = this.onlyDigits(cpf);
    if (d.length !== 11) return cpf || "";
    return `***.${d.slice(3, 6)}.***-${d.slice(9)}`;
  },

  /* CNH: 11 dígitos com dígito verificador mod-11 próprio do protótipo (não é o algoritmo oficial do Denatran) */
  validarCNH(numero) {
    const d = this.onlyDigits(numero);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    let soma = 0,
      peso = 9;
    for (let i = 0; i < 9; i++) soma += parseInt(d[i], 10) * peso--;
    let dv1 = soma % 11;
    if (dv1 >= 10) dv1 = 0;
    soma = 0;
    peso = 1;
    for (let i = 0; i < 9; i++) soma += parseInt(d[i], 10) * peso++;
    let dv2 = soma % 11;
    if (dv2 >= 10) dv2 = 0;
    return dv1 === parseInt(d[9], 10) && dv2 === parseInt(d[10], 10);
  },

  maskCNHOculto(numero) {
    const d = this.onlyDigits(numero);
    if (d.length < 4) return numero || "";
    return `${"*".repeat(d.length - 4)}${d.slice(-4)}`;
  },

  normalizarPlaca(placa) {
    return (placa || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  },

  validarPlaca(placa) {
    const p = (placa || "").toUpperCase().replace(/[\s-]/g, "");
    const mercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/;
    const antiga = /^[A-Z]{3}\d{4}$/;
    return mercosul.test(p) || antiga.test(p);
  },

  maskPlaca(placa) {
    const p = (placa || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
    if (p.length <= 3) return p;
    return `${p.slice(0, 3)}-${p.slice(3)}`;
  },

  maskCEP(cep) {
    const d = this.onlyDigits(cep).slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  },

  idadeAnos(dataNascISO) {
    const nasc = new Date(dataNascISO);
    if (isNaN(nasc.getTime())) return 0;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const aindaNaoFezAniversario =
      hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate());
    if (aindaNaoFezAniversario) idade--;
    return idade;
  },

  porteMaisProximo(pesoKg) {
    const p = Number(pesoKg) || 0;
    if (p <= 10) return "P";
    if (p <= 25) return "M";
    if (p <= 45) return "G";
    return "GG";
  },

  vacinaVencida(dataUltimaVacinaISO) {
    if (!dataUltimaVacinaISO) return true;
    const data = new Date(dataUltimaVacinaISO);
    if (isNaN(data.getTime())) return true;
    const limite = new Date(data);
    limite.setMonth(limite.getMonth() + PM.CONST.VALIDADE_ANTIRRABICA_MESES);
    return limite.getTime() < Date.now();
  },

  haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  calcularPrecoTransporte(distanciaKm, porte) {
    const adicional = PM.CONST.ADICIONAL_PORTE[porte] || 0;
    const bruto = PM.CONST.TARIFA_BASE + distanciaKm * PM.CONST.VALOR_POR_KM + adicional;
    const valor = Math.max(bruto, PM.CONST.VALOR_MINIMO_SERVICO);
    return {
      tarifaBase: PM.CONST.TARIFA_BASE,
      distanciaValor: distanciaKm * PM.CONST.VALOR_POR_KM,
      adicionalPorte: adicional,
      valor: Math.round(valor * 100) / 100,
    };
  },

  calcularPrecoPasseio(duracaoMin) {
    const valor = PM.CONST.PACOTE_PASSEIO[duracaoMin] || PM.CONST.PACOTE_PASSEIO[30];
    return { valor: Math.max(valor, PM.CONST.VALOR_MINIMO_SERVICO) };
  },

  formatBRL(valor) {
    return (Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  },

  formatDataBR(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR");
  },

  formatDataHoraBR(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  },

  formatDuracao(segundos) {
    const s = Math.max(0, Math.round(segundos));
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const r = (s % 60).toString().padStart(2, "0");
    return `${m}:${r}`;
  },

  /* Redimensiona/comprime uma imagem (File ou dataURL) para caber no limite em MB, devolve dataURL JPEG */
  comprimirImagem(fileOrDataUrl, maxMB = PM.CONST.LIMITE_FOTO_MB, maxDim = 1280) {
    return new Promise((resolve, reject) => {
      const processar = (src) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const escala = maxDim / Math.max(width, height);
            width = Math.round(width * escala);
            height = Math.round(height * escala);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          let qualidade = 0.9;
          let dataUrl = canvas.toDataURL("image/jpeg", qualidade);
          const limiteBytes = maxMB * 1024 * 1024 * 1.37; // fator aprox. base64
          while (dataUrl.length > limiteBytes && qualidade > 0.2) {
            qualidade -= 0.1;
            dataUrl = canvas.toDataURL("image/jpeg", qualidade);
          }
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = src;
      };
      if (typeof fileOrDataUrl === "string") {
        processar(fileOrDataUrl);
      } else {
        const reader = new FileReader();
        reader.onload = () => processar(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrDataUrl);
      }
    });
  },

  /* Imagem fictícia (SVG) usada quando a câmera/arquivo não está disponível (seed e fallback de captura) */
  placeholderImg(label, bg = "#e4dcc8", fg = "#1e3a5f") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320">
      <rect width="100%" height="100%" fill="${bg}"/>
      <rect x="12" y="12" width="456" height="296" rx="14" fill="none" stroke="${fg}" stroke-width="4" stroke-dasharray="10 8"/>
      <text x="50%" y="50%" font-family="Segoe UI, Arial, sans-serif" font-size="26" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${this.escapeHtml(label)}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  },

  escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },

  qs(sel, root) {
    return (root || document).querySelector(sel);
  },
  qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  },
};
