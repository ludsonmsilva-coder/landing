import { useEffect, useRef } from "react";

/**
 * Books3D — mockup 3D real de dois e-books, em CSS 3D puro.
 *
 * Uso:
 *   import Books3D from "./Books3D";
 *   <Books3D
 *     books={[
 *       { front: "/assets/cover-1000-prompts.png",
 *         back:  "/assets/back-1000-prompts.png",
 *         spine: "1000 PROMPTS DE IA" },
 *       { front: "/assets/cover-5-ias.png",
 *         back:  "/assets/back-5-ias.png",
 *         spine: "5 IAS PARA RENTA EXTRA" },
 *     ]}
 *   />
 *
 * Props por livro:
 *   front  (obrigatório) caminho do PNG da capa
 *   back   (opcional)    caminho do PNG da contracapa; sem ele, gera superfície elegante
 *   spine  (obrigatório) texto da lombada
 *
 * Nenhuma dependência externa. Não usa localStorage.
 */
export default function Books3D({ books = [], duration = 12000, className = "" }) {
  const rootRef = useRef(null);
  const state = useRef({
    angle: 0,          // graus, acumulado
    speed: 360 / duration, // graus por ms
    factor: 1,         // 1 normal · 0.25 hover · 0 arrastando
    dragging: false,
    lastX: 0,
    moved: 0,
    raf: 0,
    last: 0,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const s = state.current;

    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
    const books3d = Array.from(root.querySelectorAll("[data-book]"));

    // Sombreamento por face: luz principal em cima/à esquerda, à frente.
    const LUZ = -28; // deslocamento angular da luz, em graus
    const rad = (d) => (d * Math.PI) / 180;
    const sombra = (normal) => {
      const i = Math.max(0, Math.cos(rad(normal - LUZ)));
      // expoente <1 alarga o falloff: a capa continua legível em 45° e 135°
      return (0.46 * (1 - Math.pow(i, 0.55))).toFixed(3);
    };

    const pintar = () => {
      const a = s.angle;
      root.style.setProperty("--r", `${a}deg`);
      root.style.setProperty("--sh-front", sombra(a));
      root.style.setProperty("--sh-back", sombra(a + 180));
      root.style.setProperty("--sh-spine", sombra(a - 90));
      root.style.setProperty("--sh-fore", sombra(a + 90));
      // sombra projetada acompanha a silhueta: mais estreita a 90°/270°
      const largura = 0.55 + 0.45 * Math.abs(Math.cos(rad(a)));
      root.style.setProperty("--shadow-scale", largura.toFixed(3));
    };

    const quadro = (t) => {
      if (!s.last) s.last = t;
      const dt = Math.min(t - s.last, 50); // trava saltos ao voltar de aba oculta
      s.last = t;
      if (!s.dragging && !reduzido.matches) {
        s.angle = (s.angle + s.speed * dt * s.factor) % 360;
      }
      pintar();
      s.raf = requestAnimationFrame(quadro);
    };

    if (reduzido.matches) {
      s.angle = -22; // pose estática, capa legível
      pintar();
    } else {
      s.raf = requestAnimationFrame(quadro);
    }

    // ---- hover: desacelera sem parar ----
    const entra = () => { s.factor = 0.25; };
    const sai = () => { if (!s.dragging) s.factor = 1; };
    root.addEventListener("pointerenter", entra);
    root.addEventListener("pointerleave", sai);

    // ---- arrastar / swipe horizontal ----
    const inicio = (e) => {
      s.dragging = true;
      s.moved = 0;
      s.lastX = e.clientX;
      root.setPointerCapture?.(e.pointerId);
      root.classList.add("b3d-dragging");
    };
    const move = (e) => {
      if (!s.dragging) return;
      const dx = e.clientX - s.lastX;
      s.lastX = e.clientX;
      s.moved += Math.abs(dx);
      s.angle = (s.angle + dx * 0.45) % 360;
      pintar();
      if (s.moved > 8 && e.cancelable) e.preventDefault(); // só bloqueia o scroll se for swipe de verdade
    };
    const fim = (e) => {
      if (!s.dragging) return;
      s.dragging = false;
      s.last = 0;
      s.factor = 1;
      root.releasePointerCapture?.(e.pointerId);
      root.classList.remove("b3d-dragging");
    };
    root.addEventListener("pointerdown", inicio);
    root.addEventListener("pointermove", move, { passive: false });
    root.addEventListener("pointerup", fim);
    root.addEventListener("pointercancel", fim);

    return () => {
      cancelAnimationFrame(s.raf);
      root.removeEventListener("pointerenter", entra);
      root.removeEventListener("pointerleave", sai);
      root.removeEventListener("pointerdown", inicio);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", fim);
      root.removeEventListener("pointercancel", fim);
    };
  }, [duration, books.length]);

  return (
    <div className={`b3d-stage ${className}`} ref={rootRef}>
      <style>{CSS_3D}</style>

      <div className="b3d-plataforma" aria-hidden="true" />

      <div className="b3d-fila">
        {books.map((b, i) => (
          <div className={`b3d-slot b3d-slot-${i + 1}`} key={i}>
            <div className="b3d-flutua">
              <div className="b3d-book" data-book>
                {/* capa: PNG real, sem redesenho */}
                <div
                  className="b3d-face b3d-front"
                  style={{ backgroundImage: `url(${b.front})` }}
                >
                  <span className="b3d-veu" style={{ opacity: "var(--sh-front)" }} />
                  <span className="b3d-brilho" />
                </div>

                {/* contracapa */}
                <div
                  className={`b3d-face b3d-back${b.back ? "" : " b3d-back-gerada"}`}
                  style={b.back ? { backgroundImage: `url(${b.back})` } : undefined}
                >
                  <span className="b3d-veu" style={{ opacity: "var(--sh-back)" }} />
                </div>

                {/* lombada */}
                <div className="b3d-face b3d-spine">
                  <span className="b3d-spine-txt">{b.spine}</span>
                  <span className="b3d-veu" style={{ opacity: "var(--sh-spine)" }} />
                </div>

                {/* corte / bloco de páginas */}
                <div className="b3d-face b3d-fore">
                  <span className="b3d-veu" style={{ opacity: "var(--sh-fore)" }} />
                </div>

                <div className="b3d-face b3d-top" />
                <div className="b3d-face b3d-bottom" />
              </div>
            </div>
            <div className="b3d-sombra" aria-hidden="true" />
          </div>
        ))}
      </div>

      <p className="b3d-dica" aria-hidden="true">Arrastra para girar</p>
    </div>
  );
}

const CSS_3D = `
.b3d-stage{
  --w: clamp(150px, 20vw, 250px);
  --h: calc(var(--w) * 1.42);
  --d: clamp(26px, 3.4vw, 44px);
  --pagina: #f4f1e8;
  --pagina-linha: #cfc7b6;
  --neon: #a76eff;
  --oro: #f5b301;

  --r: 0deg;
  --sh-front: 0; --sh-back: .5; --sh-spine: .4; --sh-fore: .4;
  --shadow-scale: 1;

  position: relative;
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
  padding: clamp(30px, 6vw, 60px) 0 clamp(40px, 7vw, 80px);
  perspective: 1600px;
  perspective-origin: 50% 42%;
  touch-action: pan-y;
  cursor: grab;
  user-select: none;
}
.b3d-stage.b3d-dragging{ cursor: grabbing; }

/* plataforma neon já existente na página */
.b3d-plataforma{
  position:absolute; left:50%; bottom: clamp(18px,4vw,34px);
  width: min(78%, 620px); aspect-ratio: 3.2 / 1;
  transform: translateX(-50%);
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 50% 50%, rgba(167,110,255,.42) 0%, rgba(167,110,255,.14) 45%, transparent 70%);
  box-shadow: 0 0 60px 12px rgba(167,110,255,.28);
  pointer-events:none;
}
.b3d-plataforma::after{
  content:""; position:absolute; inset:22% 8%;
  border-radius:50%;
  border:1px solid rgba(167,110,255,.55);
  box-shadow: 0 0 18px rgba(167,110,255,.5), inset 0 0 22px rgba(167,110,255,.25);
}

.b3d-fila{
  position:relative;
  display:flex; justify-content:center; align-items:flex-end;
  gap: clamp(6px, 1.6vw, 26px);
  transform-style: preserve-3d;
}
.b3d-slot{ position:relative; transform-style: preserve-3d; }
/* profundidade: o segundo livro recua e sobe um pouco */
.b3d-slot-2{ transform: translateZ(-70px) translateY(-10px); }

@keyframes b3dFlutua{
  0%,100%{ transform: translateY(-6px); }
  50%    { transform: translateY(-20px); }
}
.b3d-flutua{
  transform-style: preserve-3d;
  animation: b3dFlutua 6s ease-in-out infinite;
  will-change: transform;
}
.b3d-slot-2 .b3d-flutua{ animation-delay: -3s; }

.b3d-book{
  position:relative;
  width: var(--w); height: var(--h);
  transform-style: preserve-3d;
  transform: rotateY(var(--r));
  will-change: transform;
}

.b3d-face{
  position:absolute; left:50%; top:50%;
  backface-visibility: hidden;
  overflow:hidden;
}
/* véu de sombreamento controlado por JS conforme o ângulo */
.b3d-veu{
  position:absolute; inset:0;
  background:#0b0518;
  pointer-events:none;
  transition: opacity .12s linear;
}

/* ---- capa e contracapa ---- */
.b3d-front, .b3d-back{
  width: var(--w); height: var(--h);
  margin-left: calc(var(--w) / -2); margin-top: calc(var(--h) / -2);
  background-size: cover; background-position:center;
  border-radius: 2px 5px 5px 2px;
  box-shadow:
    inset -1px 0 0 rgba(255,255,255,.14),
    inset 0 1px 0 rgba(255,255,255,.10),
    inset 0 -1px 0 rgba(0,0,0,.35);
}
.b3d-front{ transform: translateZ(calc(var(--d) / 2)); }
/* contorno dourado discreto nas quinas */
.b3d-front, .b3d-back, .b3d-spine, .b3d-fore{
  outline: 1px solid rgba(245,179,1,.18);
  outline-offset: -1px;
}
.b3d-back{
  transform: rotateY(180deg) translateZ(calc(var(--d) / 2));
  border-radius: 5px 2px 2px 5px;
}
/* contracapa gerada quando não há PNG: superfície sóbria, sem inventar textos */
.b3d-back-gerada{
  background:
    radial-gradient(ellipse at 30% 20%, #3d1f7a 0%, #241050 48%, #150931 100%);
}
.b3d-back-gerada::after{
  content:""; position:absolute; inset:0;
  background:
    repeating-linear-gradient(115deg, rgba(255,255,255,.028) 0 2px, transparent 2px 7px);
}

/* chanfro na quina viva da capa (lado da lombada) */
.b3d-front::after, .b3d-back::after{
  content:""; position:absolute; top:0; bottom:0; width:9px;
  background: linear-gradient(90deg, rgba(0,0,0,.42), rgba(0,0,0,0));
  pointer-events:none;
}
.b3d-front::after{ left:0; }
.b3d-back::after{ right:0; transform: scaleX(-1); }

/* reflexo especular fixo na capa, luz vindo de cima/esquerda */
.b3d-brilho{
  position:absolute; inset:0; pointer-events:none;
  background: linear-gradient(118deg,
    rgba(255,255,255,.20) 0%,
    rgba(255,255,255,.06) 22%,
    transparent 46%,
    transparent 100%);
  mix-blend-mode: screen;
}

/* ---- lombada ---- */
.b3d-spine{
  width: var(--d); height: var(--h);
  margin-left: calc(var(--d) / -2); margin-top: calc(var(--h) / -2);
  transform: rotateY(-90deg) translateZ(calc(var(--w) / 2));
  background:
    linear-gradient(90deg, #150931 0%, #3a1d78 18%, #4c2a95 50%, #2d1560 82%, #120726 100%);
  display:flex; align-items:center; justify-content:center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.12), inset 0 -1px 0 rgba(0,0,0,.4);
}
.b3d-spine::before, .b3d-spine::after{
  content:""; position:absolute; left:14%; right:14%; height:1px;
  background: rgba(245,179,1,.55);
}
.b3d-spine::before{ top: 7%; }
.b3d-spine::after{ bottom: 7%; }
.b3d-spine-txt{
  writing-mode: vertical-rl;
  font-family: system-ui, "Segoe UI", Roboto, sans-serif;
  font-weight: 800;
  font-size: clamp(7px, .78vw, 10px);
  letter-spacing: .14em;
  color:#fff;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0,0,0,.6);
  padding: 0 1px;
}

/* ---- corte / bloco de páginas ---- */
.b3d-fore{
  width: var(--d); height: var(--h);
  margin-left: calc(var(--d) / -2); margin-top: calc(var(--h) / -2);
  transform: rotateY(90deg) translateZ(calc(var(--w) / 2));
  background:
    repeating-linear-gradient(90deg,
      var(--pagina) 0 1.1px,
      var(--pagina-linha) 1.1px 1.7px),
    var(--pagina);
  box-shadow:
    inset 3px 0 6px rgba(0,0,0,.30),
    inset -3px 0 6px rgba(0,0,0,.22),
    inset 0 2px 4px rgba(0,0,0,.18);
  border-radius: 0 2px 2px 0;
}

/* ---- topo e base ---- */
.b3d-top, .b3d-bottom{
  width: var(--w); height: var(--d);
  margin-left: calc(var(--w) / -2); margin-top: calc(var(--d) / -2);
  background:
    repeating-linear-gradient(180deg,
      var(--pagina) 0 1.1px,
      var(--pagina-linha) 1.1px 1.7px),
    var(--pagina);
}
.b3d-top{
  transform: rotateX(90deg) translateZ(calc(var(--h) / 2));
  box-shadow: inset 0 0 12px rgba(0,0,0,.16);
}
.b3d-bottom{
  transform: rotateX(-90deg) translateZ(calc(var(--h) / 2));
  filter: brightness(.72);
}

/* ---- sombra projetada ---- */
.b3d-sombra{
  position:absolute; left:50%; bottom: -26px;
  width: calc(var(--w) * .92); height: calc(var(--w) * .20);
  transform: translateX(-50%) scaleX(var(--shadow-scale));
  background: radial-gradient(ellipse at 50% 50%, rgba(6,2,16,.62) 0%, rgba(6,2,16,.28) 42%, transparent 72%);
  filter: blur(9px);
  pointer-events:none;
}

.b3d-dica{
  position:absolute; left:50%; bottom: 6px; transform: translateX(-50%);
  margin:0;
  font-family: system-ui, sans-serif;
  font-size: 10px; letter-spacing:.22em; text-transform:uppercase;
  color: rgba(201,182,245,.55);
  pointer-events:none;
}

@media (max-width: 640px){
  .b3d-stage{ --w: clamp(112px, 33vw, 160px); perspective: 1100px; }
  .b3d-slot-2{ transform: translateZ(-46px) translateY(-8px); }
}

@media (prefers-reduced-motion: reduce){
  .b3d-flutua{ animation: none; }
  .b3d-veu{ transition: none; }
  .b3d-dica{ display:none; }
}
`;
