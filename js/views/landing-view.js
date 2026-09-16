/* PetMove — homepage institucional (público, sem login) */
window.PM = window.PM || {};

(function () {
  function scrollParaSecao(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function render(params, app) {
    const html = `
      <div class="landing">
        <header class="landing-nav">
          <div class="landing-nav-inner">
            <div class="landing-brand"><img src="assets/PetMove.jpeg" alt="PetMove">PetMove</div>
            <nav class="landing-nav-links">
              <button type="button" data-scroll="como-funciona">Como funciona</button>
              <button type="button" data-scroll="servicos">Serviços</button>
              <button type="button" data-scroll="seguranca">Segurança</button>
              <button type="button" data-scroll="seja-condutor">Seja um condutor</button>
            </nav>
            <div class="landing-nav-actions">
              <a class="btn btn-secondary btn-sm" href="#/login">Entrar</a>
              <a class="btn btn-primary btn-sm" href="#/cadastro/tutor">Criar conta</a>
            </div>
          </div>
        </header>

        <section class="landing-hero">
          <div class="landing-hero-text">
            <h1>Transporte e passeio para o seu pet, com quem você confia.</h1>
            <p class="lead">O PetMove conecta você a condutores credenciados para levar, trazer e passear com o seu animal — com identidade verificada, fotos no embarque e desembarque e código de entrega em cada corrida.</p>
            <div class="landing-hero-actions">
              <a class="btn btn-primary" href="#/cadastro/tutor">Sou tutor, quero começar</a>
              <a class="btn btn-secondary" href="#/condutor/cadastro/1">Quero ser condutor</a>
            </div>
          </div>
          <div class="landing-hero-visual"><img src="assets/PetMove.jpeg" alt="PetMove"></div>
        </section>

        <div class="landing-stats-strip">
          <div class="landing-stats-grid">
            <div class="stat"><b>4</b>documentos conferidos antes de cada condutor operar</div>
            <div class="stat"><b>2</b>fotos obrigatórias: embarque e desembarque</div>
            <div class="stat"><b>4 dígitos</b>código de entrega em toda corrida</div>
          </div>
        </div>

        <section class="landing-section" id="como-funciona">
          <div class="landing-container">
            <h2>Como funciona</h2>
            <p class="section-lead">Da solicitação até a avaliação, em quatro passos simples.</p>
            <div class="landing-steps">
              <div class="landing-step"><div class="num">1</div><p style="font-weight:700">Cadastre seu pet</p><p class="text-muted" style="font-size:.85rem">Porte, temperamento e data da vacina antirrábica.</p></div>
              <div class="landing-step"><div class="num">2</div><p style="font-weight:700">Peça o serviço</p><p class="text-muted" style="font-size:.85rem">Transporte ou passeio, com o preço detalhado antes de confirmar.</p></div>
              <div class="landing-step"><div class="num">3</div><p style="font-weight:700">Acompanhe em tempo real</p><p class="text-muted" style="font-size:.85rem">Veja quem está a caminho: foto, nome, nota e placa do veículo.</p></div>
              <div class="landing-step"><div class="num">4</div><p style="font-weight:700">Avalie o serviço</p><p class="text-muted" style="font-size:.85rem">Histórico completo, com fotos e linha do tempo de cada corrida.</p></div>
            </div>
          </div>
        </section>

        <section class="landing-section" id="servicos" style="background:#fff">
          <div class="landing-container">
            <h2>Dois serviços, um só app</h2>
            <p class="section-lead">Escolha o que o seu pet precisa hoje.</p>
            <div class="landing-services-grid">
              <div class="landing-service-card transporte">
                <span style="font-size:2rem">🚗</span>
                <h3>Transporte</h3>
                <p>O condutor busca o pet no seu endereço e leva a um destino: petshop, veterinário, hotelzinho ou adestrador.</p>
                <ul><li>Cobrado por distância percorrida</li><li>Destino obrigatório na solicitação</li><li>Recebedor confirma com o código de entrega</li></ul>
              </div>
              <div class="landing-service-card passeio">
                <span style="font-size:2rem">🐕</span>
                <h3>Passeio</h3>
                <p>O condutor busca o pet em casa, passeia pela duração contratada e devolve no mesmo endereço.</p>
                <ul><li>Pacotes de 30, 45 ou 60 minutos</li><li>Cronômetro visível durante todo o passeio</li><li>Pet retorna sempre para a origem</li></ul>
              </div>
            </div>
          </div>
        </section>

        <section class="landing-section landing-security" id="seguranca">
          <div class="landing-container">
            <h2>Segurança em primeiro lugar</h2>
            <p class="section-lead">Seu pet não fala — por isso construímos a plataforma inteira em torno de confiança e evidência.</p>
            <div class="landing-security-grid">
              <div class="landing-security-col">
                <h3>Antes do serviço</h3>
                <ul>
                  <li><span class="ico">🪪</span>CPF e CNH conferidos, com dígitos verificadores</li>
                  <li><span class="ico">📄</span>Foto da frente e do verso da CNH</li>
                  <li><span class="ico">🤳</span>Selfie do condutor segurando o documento</li>
                  <li><span class="ico">🚘</span>Foto do veículo com a placa legível</li>
                  <li><span class="ico">✅</span>Cadastro só libera corridas depois de aprovado por um administrador</li>
                </ul>
              </div>
              <div class="landing-security-col">
                <h3>Durante o serviço</h3>
                <ul>
                  <li><span class="ico">📸</span>Foto obrigatória no embarque e no desembarque</li>
                  <li><span class="ico">🔢</span>Código de entrega de 4 dígitos para encerrar o serviço</li>
                  <li><span class="ico">🕓</span>Linha do tempo com data e hora de cada etapa</li>
                  <li><span class="ico">👤</span>Identificação do condutor exibida antes do embarque</li>
                  <li><span class="ico">💉</span>Pet com vacina antirrábica vencida não pode ser transportado</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section class="landing-section" id="seja-condutor" style="background:#fff">
          <div class="landing-container">
            <div class="landing-cta-banner">
              <div>
                <h2>Seja um condutor PetMove</h2>
                <p style="opacity:.9;max-width:440px">Tem tempo livre e gosta de animais? Cadastre-se em três etapas simples, direto pelo celular.</p>
                <ul>
                  <li>🕒 Defina quando ficar online</li>
                  <li>💰 Receba 80% do valor de cada corrida</li>
                  <li>📱 Cadastro 100% pelo celular</li>
                </ul>
              </div>
              <a class="btn btn-primary" href="#/condutor/cadastro/1">Quero ser condutor</a>
            </div>
          </div>
        </section>

        <footer class="landing-footer">
          <div class="landing-footer-grid">
            <div>
              <div class="landing-footer-brand"><img src="assets/PetMove.jpeg" alt="PetMove">PetMove</div>
              <p style="font-size:.85rem;max-width:320px;opacity:.85">Conforto e carinho em cada passeio. Transporte e passeio de pets com condutores credenciados.</p>
            </div>
            <div>
              <h4>Plataforma</h4>
              <ul>
                <li><button type="button" data-scroll="como-funciona">Como funciona</button></li>
                <li><button type="button" data-scroll="seguranca">Segurança</button></li>
                <li><button type="button" data-scroll="seja-condutor">Seja um condutor</button></li>
              </ul>
            </div>
            <div>
              <h4>Conta</h4>
              <ul>
                <li><a href="#/login">Entrar</a></li>
                <li><a href="#/cadastro/tutor">Criar conta de tutor</a></li>
                <li><a href="#/condutor/cadastro/1">Cadastro de condutor</a></li>
              </ul>
            </div>
          </div>
          <p class="landing-footer-bottom">© 2026 PetMove. Todos os direitos reservados.</p>
        </footer>

        <a class="whatsapp-fab" target="_blank" rel="noopener"
           href="https://wa.me/${PM.WHATSAPP.numero}?text=${encodeURIComponent(PM.WHATSAPP.mensagem)}"
           aria-label="Falar no WhatsApp">
          <svg viewBox="0 0 32 32" fill="#fff"><path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.3.64 4.45 1.75 6.29L4 29l7.9-1.7a11.97 11.97 0 0 0 4.12.73h.01c6.63 0 12.02-5.4 12.02-12.02C28.05 8.4 22.65 3 16.02 3Zm0 21.86h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-4.69 1.01 1-4.57-.24-.38a9.83 9.83 0 0 1-1.51-5.31c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.99c0 5.45-4.45 9.84-9.93 9.84Zm5.44-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.91-2.2-.24-.57-.49-.5-.67-.5-.17 0-.37-.02-.57-.02s-.52.07-.8.37c-.27.3-1.05 1.02-1.05 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"/></svg>
        </a>
      </div>
    `;
    PM.shared.montar(app, html);
    PM.util.qsa("[data-scroll]", app).forEach((btn) => btn.addEventListener("click", () => scrollParaSecao(btn.dataset.scroll)));
  }

  PM.router.registrar("/", null, render);
})();
