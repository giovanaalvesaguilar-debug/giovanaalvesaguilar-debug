(() => {
  // ---------- Configurações (edite aqui) ----------
  const CONFIG = {
    duration: 18000,                 // tempo de uma travessia (ms)
    flightHeight: 0.34,              // altura do voo (fração da altura do banner)
    waveAmplitude: 0.03,             // quanto o avião sobe e desce
    trailEvery: 70,                  // intervalo entre pontos do rastro (ms)
    trailLife: 1500,                 // duração de cada ponto (ms)
    codeEvery: 6,                    // a cada N pontos, aparece um símbolo de código
    tokens: ["</>", "{ }", ";", "=>", "()"],
  };

  const banner = document.querySelector(".banner");
  const plane = document.getElementById("plane");
  const trail = document.getElementById("trail");
  if (!banner || !plane || !trail) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Medidas em cache (atualizadas só quando o tamanho muda)
  let W = 0, H = 0, PW = 0, PH = 0;
  const measure = () => {
    W = banner.clientWidth;
    H = banner.clientHeight;
    PW = plane.offsetWidth;
    PH = plane.offsetHeight;
  };
  new ResizeObserver(measure).observe(banner);
  measure();

  // Reaproveita um grupo fixo de elementos para o rastro (leve)
  const POOL = 32;
  const puffs = Array.from({ length: POOL }, () => {
    const el = document.createElement("span");
    el.className = "puff";
    trail.appendChild(el);
    return el;
  });
  const anims = new Array(POOL).fill(null);
  let next = 0, count = 0, lastPuff = 0;

  const spawnPuff = (x, y) => {
    const el = puffs[next];
    anims[next]?.cancel();

    const isCode = ++count % CONFIG.codeEvery === 0;
    el.classList.toggle("code", isCode);
    el.textContent = isCode
      ? CONFIG.tokens[Math.floor(Math.random() * CONFIG.tokens.length)]
      : "";

    anims[next] = el.animate(
      [
        { opacity: 0.95, transform: `translate(${x}px, ${y}px) scale(1)` },
        { opacity: 0, transform: `translate(${x - 46}px, ${y + 8}px) scale(.3)` },
      ],
      { duration: CONFIG.trailLife, easing: "ease-out" }
    );
    next = (next + 1) % POOL;
  };

  const place = (t) => {
    const x = -PW + t * (W + 2 * PW);
    const phase = t * Math.PI * 4;
    const y = H * CONFIG.flightHeight + Math.sin(phase) * H * CONFIG.waveAmplitude;
    const dy = Math.cos(phase) * H * CONFIG.waveAmplitude * Math.PI * 4;
    const angle = (Math.atan2(dy, W + 2 * PW) * 180) / Math.PI;
    plane.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`;
    return { x, y };
  };

  // Com "reduzir movimento": avião parado, sem rastro
  if (reduceMotion) {
    place(0.6);
    return;
  }

  const start = performance.now();
  const frame = (now) => {
    const t = ((now - start) % CONFIG.duration) / CONFIG.duration;
    const { x, y } = place(t);

    // Rastro sai da cauda do avião, só enquanto ele está visível
    if (now - lastPuff > CONFIG.trailEvery && x > -PW * 0.3 && x < W) {
      lastPuff = now;
      spawnPuff(x + 8, y + PH * 0.5);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
