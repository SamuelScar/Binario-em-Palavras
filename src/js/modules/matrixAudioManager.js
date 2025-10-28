/**
 * matrixAudioManager.js
 * ---------------------------------------------------------------------------
 * Controla a paisagem sonora exclusiva do tema Matrix: trilha de fundo
 * gerada proceduralmente e efeitos curtos inspirados em interfaces digitais.
 * A ativação depende do consentimento do usuário e da seleção do tema Matrix.
 * ---------------------------------------------------------------------------
 */

const STORAGE_KEY = "binario:matrixAudioPreferences";
const EFFECT_COOLDOWN_MS = 140;
const BACKGROUND_TRACK_URL = "/audio/matrix-theme.mp3";
const DEFAULT_STATE = {
  consent: false,
  backgroundEnabled: false,
  effectsEnabled: true,
};
const BACKGROUND_TARGET_GAIN = 0.22;
const OSCILLATOR_GAIN_SCALE = 0.8;
const ICON_CLASSES = {
  background: {
    active: "bi-music-note-beamed",
    inactive: "bi-ban",
  },
  effects: {
    active: "bi-volume-up",
    inactive: "bi-volume-mute",
  },
};

let audioContext = null;
let masterGain = null;
let backgroundGain = null;
let effectsGain = null;
let backgroundGraph = null;
let backgroundBuffer = null;
let state = { ...DEFAULT_STATE };
let isThemeActive = false;
let dom = { container: null, toggleButton: null, effectsToggle: null };
const effectCooldowns = new Map();

/**
 * Inicializa o gerenciador de áudio com referências de DOM opcionais.
 * @param {{container?: HTMLElement|null, toggleButton?: HTMLButtonElement|null, effectsToggle?: HTMLButtonElement|null}} [elements]
 * @returns {{playEffect(type: string): void, toggle(force?: boolean): Promise<void>, syncTheme(isMatrix: boolean): void}}
 */
export function initMatrixAudioManager(elements = {}) {
  dom = {
    container: elements.container ?? null,
    toggleButton: elements.toggleButton ?? null,
    effectsToggle: elements.effectsToggle ?? null,
  };

  loadState();
  bindDomEvents();
  updateDomState();

  document.addEventListener("binario:theme-change", handleThemeChange);

  return {
    playEffect,
    toggle: toggleBackground,
    syncTheme: (isMatrix) => {
      handleThemeChange({ detail: { theme: isMatrix ? "matrix" : "default" } });
    },
  };
}

/**
 * Carrega preferências persistidas do usuário.
 */
function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      state = {
        ...DEFAULT_STATE,
        ...parsed,
      };
    }
  } catch {
    state = { ...DEFAULT_STATE };
  }
}

/**
 * Salva preferências atuais no armazenamento local.
 */
function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora espacos privados ou falhas de escrita.
  }
}

/**
 * Atualiza o estado visual dos controles.
 */
function updateDomState() {
  const backgroundActive = isMatrixAudioActive();
  const audioSupported = isAudioSupported();

  if (dom.container) {
    dom.container.dataset.matrixAudioActive = String(backgroundActive);
    dom.container.dataset.matrixAudioAvailable = String(isThemeActive && audioSupported);
  }

  if (dom.toggleButton) {
    const disabled = !isThemeActive || !audioSupported;
    const active = !disabled && backgroundActive;
    syncToggleButton(dom.toggleButton, ICON_CLASSES.background, { active, disabled });
    dom.toggleButton.setAttribute("aria-label", getBackgroundAriaLabel(active, disabled));
    updatePopover(dom.toggleButton, getBackgroundPopoverMessage(active, disabled));
  }

  if (dom.effectsToggle) {
    const audioReady = isThemeActive && audioSupported && state.consent;
    const disabled = !audioReady;
    const active = !disabled && Boolean(state.effectsEnabled);
    syncToggleButton(dom.effectsToggle, ICON_CLASSES.effects, { active, disabled });
    dom.effectsToggle.setAttribute("aria-label", getEffectsAriaLabel(active, disabled));
    updatePopover(dom.effectsToggle, getEffectsPopoverMessage(active, disabled));
  }
}

function syncToggleButton(button, iconMap, { active, disabled }) {
  if (!button) {
    return;
  }

  if (typeof button.disabled === "boolean") {
    button.disabled = disabled;
  }
  button.setAttribute("aria-disabled", String(disabled));
  button.setAttribute("aria-pressed", String(active));
  button.classList.toggle("is-active", active);

  const icon = button.querySelector("[data-matrix-icon]");
  if (icon) {
    icon.classList.remove(iconMap.active, iconMap.inactive);
    icon.classList.add(active ? iconMap.active : iconMap.inactive);
  }
}

function getBackgroundAriaLabel(isActive, isDisabled) {
  if (!isAudioSupported()) {
    return "Trilha Matrix indisponível: navegador sem suporte.";
  }

  if (!isThemeActive) {
    return "Trilha Matrix disponível apenas com o tema Matrix ativo.";
  }

  return isActive ? "Desativar trilha de fundo Matrix" : "Ativar trilha de fundo Matrix";
}

function getBackgroundPopoverMessage(isActive, isDisabled) {
  if (!isAudioSupported()) {
    return "Seu navegador não suporta a trilha de fundo Matrix.";
  }

  if (!isThemeActive) {
    return "Selecione o tema Matrix para liberar a trilha de fundo.";
  }

  if (!state.backgroundEnabled || !isActive) {
    return "Clique para ativar a trilha de fundo Matrix.";
  }

  return "Clique para desativar a trilha de fundo Matrix.";
}

function getEffectsAriaLabel(isEnabled, isDisabled) {
  if (!isAudioSupported()) {
    return "Efeitos Matrix indisponíveis: navegador sem suporte.";
  }

  if (!isThemeActive) {
    return "Efeitos Matrix disponíveis apenas quando o tema Matrix está ativo.";
  }

  if (!state.consent) {
    return "Ative a trilha Matrix para liberar os efeitos sonoros.";
  }

  return isEnabled ? "Desativar efeitos sonoros Matrix" : "Ativar efeitos sonoros Matrix";
}

function getEffectsPopoverMessage(isEnabled, isDisabled) {
  if (!isAudioSupported()) {
    return "Seu navegador não suporta os efeitos sonoros Matrix.";
  }

  if (!isThemeActive) {
    return "Selecione o tema Matrix para liberar os efeitos sonoros.";
  }

  if (!state.consent) {
    return "Ative a trilha Matrix antes de controlar os efeitos sonoros.";
  }

  return isEnabled ? "Clique para desativar os efeitos sonoros Matrix." : "Clique para ativar os efeitos sonoros Matrix.";
}

function updatePopover(trigger, message) {
  if (!trigger) {
    return;
  }

  trigger.setAttribute("data-bs-content", message);

  const popoverInstance = window.bootstrap?.Popover?.getInstance(trigger);
  if (popoverInstance && typeof popoverInstance.setContent === "function") {
    popoverInstance.setContent({ ".popover-body": message });
  }
}

/**
 * Garante que o contexto de áudio e nós principais existam.
 * @returns {Promise<AudioContext|null>}
 */
async function ensureContext() {
  if (!isAudioSupported()) {
    return null;
  }

  if (!audioContext) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextConstructor({ latencyHint: "interactive" });

    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(audioContext.destination);

    backgroundGain = audioContext.createGain();
    backgroundGain.gain.value = 0;
    backgroundGain.connect(masterGain);

    effectsGain = audioContext.createGain();
    effectsGain.gain.value = 0.72;
    effectsGain.connect(masterGain);
  }

  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch {
      return null;
    }
  }

  return audioContext;
}

/**
 * Verifica suporte básico do Web Audio API.
 * @returns {boolean}
 */
function isAudioSupported() {
  return Boolean(window.AudioContext || window.webkitAudioContext);
}

/**
 * Verifica se a trilha de fundo pode estar ativa.
 * @returns {boolean}
 */
function isMatrixAudioActive() {
  return Boolean(isThemeActive && state.consent && state.backgroundEnabled && backgroundGraph);
}

/**
 * Vincula eventos aos elementos de interface.
 */
function bindDomEvents() {
  if (dom.toggleButton) {
    dom.toggleButton.addEventListener("click", () => {
      toggleBackground();
    });
  }

  if (dom.effectsToggle) {
    dom.effectsToggle.addEventListener("click", () => {
      if (dom.effectsToggle.disabled) {
        return;
      }
      state.effectsEnabled = !state.effectsEnabled;
      persistState();
      updateDomState();
    });
  }
}

/**
 * Trata a mudança de tema emitida pelo ThemeManager.
 * @param {CustomEvent<{theme: string}>} event
 */
function handleThemeChange(event) {
  const { theme } = event.detail || {};
  isThemeActive = theme === "matrix";

  if (!isThemeActive) {
    fadeOutBackground();
  } else {
    state.consent = true;
    state.backgroundEnabled = true;
    state.effectsEnabled = true;
    persistState();
    void ensureContext().then(() => startBackgroundPad());
  }

  updateDomState();
}

/**
 * Ativa ou desativa a trilha de fundo conforme escolha do usuário.
 * @param {boolean} [force] - Valor opcional forçado.
 * @returns {Promise<void>}
 */
async function toggleBackground(force) {
  if (!isThemeActive) {
    state.backgroundEnabled = false;
    updateDomState();
    return;
  }

  if (typeof force === "boolean") {
    state.backgroundEnabled = force;
  } else {
    state.backgroundEnabled = !state.backgroundEnabled;
  }

  if (state.backgroundEnabled) {
    state.consent = true;
    const context = await ensureContext();
    if (!context) {
      state.backgroundEnabled = false;
      updateDomState();
      return;
    }
    await startBackgroundPad();
  } else {
    fadeOutBackground();
  }

  persistState();
  updateDomState();
}

/**
 * Inicia uma trilha ambiente procedural usando Web Audio.
 */
async function loadBackgroundBuffer() {
  if (backgroundBuffer || !audioContext) {
    return backgroundBuffer;
  }

  try {
    const response = await fetch(BACKGROUND_TRACK_URL, { cache: "force-cache" });
    if (!response.ok) {
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    backgroundBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.warn("MatrixAudio: não foi possível carregar a trilha externa.", error);
    backgroundBuffer = null;
  }

  return backgroundBuffer;
}

async function startBackgroundPad() {
  if (!isThemeActive || !state.consent || !state.backgroundEnabled) {
    return false;
  }

  if (!audioContext) {
    return false;
  }

  if (backgroundGraph) {
    // Já existe uma trilha ativa; apenas certifica o fade-in.
    const now = audioContext.currentTime;
    backgroundGain.gain.setTargetAtTime(BACKGROUND_TARGET_GAIN, now, 1.4);
    return true;
  }

  const buffer = await loadBackgroundBuffer();

  if (buffer) {
    startBufferLoop(buffer);
    return true;
  }

  startProceduralPad();
  return true;
}

function startBufferLoop(buffer) {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(1600, now);
  filter.connect(backgroundGain);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = buffer.duration;
  source.connect(filter);
  source.start(now + 0.1);

  backgroundGain.gain.cancelScheduledValues(now);
  backgroundGain.gain.setTargetAtTime(BACKGROUND_TARGET_GAIN, now + 0.1, 1.4);

  backgroundGraph = { type: "buffer", filter, source };
  updateDomState();
}

function startProceduralPad() {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.6;
  filter.frequency.setValueAtTime(1200, now);
  filter.connect(backgroundGain);

  const lfo = audioContext.createOscillator();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(0.12, now);

  const lfoGain = audioContext.createGain();
  lfoGain.gain.setValueAtTime(420, now);
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start(now);

  const oscillators = [118, 186, 243].map((freq, index) => {
    const osc = audioContext.createOscillator();
    osc.type = index === 0 ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(freq, now);
    const detune = (index - 1) * 8;
    osc.detune.setValueAtTime(detune, now);

    const oscGain = audioContext.createGain();
    oscGain.gain.setValueAtTime(0, now);
    const targetGain = Math.max(0, (0.09 - index * 0.015) * OSCILLATOR_GAIN_SCALE);
    oscGain.gain.linearRampToValueAtTime(targetGain, now + 2.2);

    const delay = audioContext.createDelay(2.5);
    delay.delayTime.setValueAtTime(0.45 + index * 0.18, now);

    const feedback = audioContext.createGain();
    feedback.gain.setValueAtTime(0.28, now);
    delay.connect(feedback).connect(delay);

    osc.connect(oscGain).connect(filter);
    osc.connect(oscGain).connect(delay).connect(filter);
    osc.start(now + index * 0.35);

    return { oscillator: osc, gain: oscGain, delay, feedback };
  });

  backgroundGain.gain.cancelScheduledValues(now);
  backgroundGain.gain.setTargetAtTime(BACKGROUND_TARGET_GAIN, now + 0.1, 1.6);

  backgroundGraph = { type: "procedural", filter, lfo, lfoGain, oscillators };
  updateDomState();
}

/**
 * Realiza fade out e encerra a trilha de fundo.
 */
function fadeOutBackground() {
  if (!audioContext || !backgroundGraph) {
    return;
  }

  const now = audioContext.currentTime;

  backgroundGain.gain.cancelScheduledValues(now);
  backgroundGain.gain.setTargetAtTime(0, now, 0.8);

  if (backgroundGraph.type === "buffer") {
    const { source, filter } = backgroundGraph;
    try {
      source.stop(now + 1.0);
      source.disconnect();
    } catch {
      // Source já finalizado.
    }

    try {
      filter.disconnect();
    } catch {
      // Filter já desmontado.
    }
  } else if (backgroundGraph.type === "procedural") {
    const { filter, lfo, oscillators } = backgroundGraph;

    oscillators.forEach(({ oscillator, gain, delay, feedback }) => {
      gain.gain.setTargetAtTime(0, now, 0.6);
      try {
        oscillator.stop(now + 1.4);
        delay.disconnect();
        feedback.disconnect();
      } catch {
        // Oscillator já finalizado.
      }
    });

    try {
      lfo.stop(now + 1.2);
      filter.disconnect();
    } catch {
      // Grafo já desmontado.
    }
  }

  backgroundGraph = null;
  updateDomState();
}

/**
 * Toca efeitos curtos inspirados em sons digitais.
 * @param {string} type
 */
async function playEffect(type) {
  if (!isThemeActive || !state.effectsEnabled || !state.consent) {
    return;
  }

  const nowMs = performance.now();
  const cooldown = effectCooldowns.get(type) ?? 0;
  if (nowMs - cooldown < EFFECT_COOLDOWN_MS) {
    return;
  }
  effectCooldowns.set(type, nowMs);

  const context = await ensureContext();

  if (!context || !effectsGain) {
    return;
  }

  const now = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(700, now);
  filter.Q.value = 6;

  osc.connect(filter).connect(gain).connect(effectsGain);

  const envelopeAttack = 0.025;
  const envelopeRelease = 0.18;

  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.45, now + envelopeAttack);
  gain.gain.setTargetAtTime(0, now + envelopeAttack, envelopeRelease);

  switch (type) {
    case "type":
      osc.type = "square";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.setTargetAtTime(460, now, 0.12);
      filter.frequency.setValueAtTime(820, now);
      filter.Q.setValueAtTime(4.2, now);
      break;
    case "clear":
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.42);
      filter.frequency.setValueAtTime(420, now);
      break;
    case "insert":
      osc.type = "square";
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.setTargetAtTime(860, now, 0.18);
      break;
    case "toggle":
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.setTargetAtTime(520, now, 0.12);
      filter.frequency.setValueAtTime(520, now);
      break;
    case "effect":
      osc.type = "square";
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.3);
      break;
    default:
      osc.type = "triangle";
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.32);
      break;
  }

  osc.start(now);
  osc.stop(now + 0.5);
}
