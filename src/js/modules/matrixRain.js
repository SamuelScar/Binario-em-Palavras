/**
 * @fileoverview Efeito visual de "chuva" estilo Matrix em canvas 2D, com
 * suporte a prefers-reduced-motion e pausa por visibilidade. Todas as funções
 * preservam o comportamento atual e não expõem APIs públicas além de init/cleanup.
 */
const CHARACTER_SET = "01ABCDEFGHIJKLMNPQRSTUVWXYZ";
const FONT_SIZE = 18;
const TRAIL_OPACITY = 0.08;
const STATIC_DENSITY = 1.6;

let canvas = null;
let context = null;
let animationFrameId = 0;
let resizeRafId = 0;
let visibilityListenerAttached = false;
let motionListenerAttached = false;
let reduceMotionQuery = null;
let columns = [];
let activeContainer = null;
let isAnimating = false;
let isReducedMotion = false;

function createCanvas() {
  const element = document.createElement("canvas");
  element.className = "matrix-rain-canvas";
  element.setAttribute("aria-hidden", "true");
  element.style.position = "fixed";
  element.style.inset = "0";
  element.style.width = "100%";
  element.style.height = "100%";
  element.style.pointerEvents = "none";
  element.style.zIndex = "0";
  element.style.opacity = "0.75";
  element.style.mixBlendMode = "screen";
  element.style.filter = "drop-shadow(0 0 4px rgba(0, 255, 110, 0.25))";
  return element;
}

function initColumns() {
  if (!canvas) {
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width;
  canvas.height = height;

  const columnCount = Math.ceil(width / FONT_SIZE);

  columns = Array.from({ length: columnCount }, () =>
    Math.floor(Math.random() * (height / FONT_SIZE)),
  );
}

function drawFrame() {
  if (!context || !canvas) {
    isAnimating = false;
    return;
  }

  if (isReducedMotion || document.hidden) {
    isAnimating = false;
    return;
  }

  context.fillStyle = `rgba(0, 0, 0, ${TRAIL_OPACITY})`;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = `${FONT_SIZE}px var(--matrix-font, "VT323", "IBM Plex Mono", monospace)`;
  context.fillStyle = "rgba(0, 255, 140, 0.85)";

  columns.forEach((drop, index) => {
    const text =
      CHARACTER_SET[Math.floor(Math.random() * CHARACTER_SET.length)];
    const x = index * FONT_SIZE;
    const y = drop * FONT_SIZE;

    context.fillText(text, x, y);

    if (y > canvas.height && Math.random() > 0.975) {
      columns[index] = 0;
    } else {
      columns[index] = drop + 1;
    }
  });

  animationFrameId = window.requestAnimationFrame(drawFrame);
}

function drawStaticGrid() {
  if (!context || !canvas) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0, 0, 0, 0.92)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = `${FONT_SIZE}px var(--matrix-font, "VT323", "IBM Plex Mono", monospace)`;
  context.fillStyle = "rgba(0, 255, 120, 0.35)";

  for (let y = 0; y < canvas.height; y += FONT_SIZE * STATIC_DENSITY) {
    for (let x = 0; x < canvas.width; x += FONT_SIZE * STATIC_DENSITY) {
      const text =
        CHARACTER_SET[Math.floor(Math.random() * CHARACTER_SET.length)];
      context.fillText(text, x, y);
    }
  }
}

function handleResize() {
  if (resizeRafId) {
    window.cancelAnimationFrame(resizeRafId);
  }

  resizeRafId = window.requestAnimationFrame(() => {
    resizeRafId = 0;
    initColumns();

    if (isReducedMotion) {
      drawStaticGrid();
    }
  });
}

function handleVisibilityChange() {
  if (!canvas) {
    return;
  }

  if (document.hidden) {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }
    isAnimating = false;
  } else if (!isReducedMotion && !isAnimating) {
    isAnimating = true;
    animationFrameId = window.requestAnimationFrame(drawFrame);
  }
}

function handleMotionPreferenceChange(event) {
  isReducedMotion = Boolean(event.matches);

  if (isReducedMotion) {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }
    isAnimating = false;
    drawStaticGrid();
    return;
  }

  initColumns();
  isAnimating = true;
  animationFrameId = window.requestAnimationFrame(drawFrame);
}

/**
 * Inicializa o efeito Matrix no container indicado (padrão: body).
 * É idempotente: não duplica canvas se já estiver anexado.
 * @param {{container?: HTMLElement}} [options]
 * @returns {void}
 */
export function init(options = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (canvas && canvas.isConnected) {
    return;
  }

  const container = options.container || document.body;

  if (!container) {
    return;
  }

  canvas = createCanvas();
  context = canvas.getContext("2d", { alpha: true });

  if (!context) {
    canvas.remove();
    canvas = null;
    return;
  }

  activeContainer = container;
  activeContainer.appendChild(canvas);

  reduceMotionQuery =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  isReducedMotion = Boolean(reduceMotionQuery?.matches);

  initColumns();

  window.addEventListener("resize", handleResize, { passive: true });
  visibilityListenerAttached = true;
  document.addEventListener("visibilitychange", handleVisibilityChange, false);

  if (reduceMotionQuery && typeof reduceMotionQuery.addEventListener === "function") {
    reduceMotionQuery.addEventListener("change", handleMotionPreferenceChange);
    motionListenerAttached = true;
  } else if (reduceMotionQuery && typeof reduceMotionQuery.addListener === "function") {
    reduceMotionQuery.addListener(handleMotionPreferenceChange);
    motionListenerAttached = true;
  }

  if (isReducedMotion) {
    drawStaticGrid();
    return;
  }

  isAnimating = true;
  animationFrameId = window.requestAnimationFrame(drawFrame);
}

/**
 * Remove o canvas, listeners e cancela animações, liberando recursos.
 * É seguro chamar múltiplas vezes.
 * @returns {void}
 */
export function cleanup() {
  if (typeof window === "undefined") {
    return;
  }

  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
  }

  if (resizeRafId) {
    window.cancelAnimationFrame(resizeRafId);
    resizeRafId = 0;
  }

  window.removeEventListener("resize", handleResize);

  if (visibilityListenerAttached) {
    document.removeEventListener("visibilitychange", handleVisibilityChange, false);
    visibilityListenerAttached = false;
  }

  if (motionListenerAttached && reduceMotionQuery) {
    if (typeof reduceMotionQuery.removeEventListener === "function") {
      reduceMotionQuery.removeEventListener("change", handleMotionPreferenceChange);
    } else if (typeof reduceMotionQuery.removeListener === "function") {
      reduceMotionQuery.removeListener(handleMotionPreferenceChange);
    }
    motionListenerAttached = false;
  }

  reduceMotionQuery = null;
  isAnimating = false;

  if (canvas) {
    canvas.remove();
    canvas = null;
  }

  context = null;
  columns = [];
  activeContainer = null;
}
