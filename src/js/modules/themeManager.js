const DEFAULT_THEME = "default";
const MATRIX_THEME_VALUE = "matrix";
const MATRIX_THEME_CLASS = "theme-matrix";
const THEME_PREFIX = "theme-";
const BASE_BODY_CLASSES = ["bg-custom-page", "p-3"];
const DATA_THEME_ATTR = "data-theme";

let trackedThemeSelect = null;
let trackedThemeOptions = [];
let trackedThemeToggle = null;
let matrixRainModule = null;
let matrixRainModulePromise = null;
let shouldRunMatrixEffect = false;
let isMatrixEffectActive = false;
let currentThemeValue = DEFAULT_THEME;

/**
 * Remove classes de tema anteriores do body, preservando as classes base.
 */
function clearThemeClasses() {
  document.body.classList.forEach((className) => {
    if (className === "dark" || className.startsWith(THEME_PREFIX)) {
      document.body.classList.remove(className);
    }
  });
}

/**
 * Garante que o body mantenha as classes necessárias para o layout padrão.
 */
function ensureBaseClasses() {
  BASE_BODY_CLASSES.forEach((className) => {
    if (!document.body.classList.contains(className)) {
      document.body.classList.add(className);
    }
  });
}

/**
 * Aplica o tema selecionado ao body do documento.
 * @param {string} themeName - Classe de tema ou "default" para os estilos base.
 */
export function applyTheme(themeName) {
  const value = themeName || DEFAULT_THEME;

  if (value === currentThemeValue) {
    setThemeAttribute(value);
    manageMatrixEffect(value);
    ensureBaseClasses();
    sessionStorage.setItem("theme", value);
    return;
  }

  clearThemeClasses();

  const themeClass = resolveThemeClass(value);

  if (themeClass) {
    document.body.classList.add(themeClass);
  }

  ensureBaseClasses();
  setThemeAttribute(value);
  manageMatrixEffect(value);
  sessionStorage.setItem("theme", value);
  currentThemeValue = value;
}

/**
 * Configura o controle de temas via elemento select. A escolha do usuário é
 * salva em sessionStorage e reaplicada ao recarregar a página.
 * @param {{ selectId?: string }} [options] - Objeto de configuração.
 */
export function initThemeManager(options = {}) {
  const {
    selectId = "theme-selector",
    optionSelector = "[data-theme-option]",
    toggleSelector = "[data-theme-toggle]",
  } = options;

  const themeSelect = selectId ? document.getElementById(selectId) : null;
  const themeOptions = optionSelector
    ? Array.from(document.querySelectorAll(optionSelector))
    : [];
  const themeToggle = toggleSelector
    ? document.querySelector(toggleSelector)
    : null;
  trackedThemeSelect = themeSelect;
  trackedThemeOptions = themeOptions;
  trackedThemeToggle = themeToggle;
  const savedTheme = sessionStorage.getItem("theme") || DEFAULT_THEME;

  applyTheme(savedTheme);
  syncThemeSelect(themeSelect, savedTheme);
  updateThemeOptions(themeOptions, savedTheme);
  updateThemeToggle(themeToggle, savedTheme, themeOptions);

  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.addEventListener("change", (event) => {
      const { value } = event.target;

      applyTheme(value);
      updateThemeOptions(themeOptions, value);
      updateThemeToggle(themeToggle, value, themeOptions);
    });
  }

  if (themeOptions.length) {
    themeOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const value = getThemeValue(option);

        applyTheme(value);
        syncThemeSelect(themeSelect, value);
        updateThemeOptions(themeOptions, value);
        updateThemeToggle(themeToggle, value, themeOptions);
      });
    });
  }
}

function resolveThemeClass(themeName) {
  if (!themeName || themeName === DEFAULT_THEME) {
    return null;
  }

  if (themeName === MATRIX_THEME_VALUE) {
    return MATRIX_THEME_CLASS;
  }

  if (themeName === "dark") {
    return "dark";
  }

  return themeName;
}

function sanitizeThemeKey(themeName) {
  if (!themeName) {
    return DEFAULT_THEME;
  }

  if (themeName === MATRIX_THEME_VALUE) {
    return MATRIX_THEME_VALUE;
  }

  if (themeName === DEFAULT_THEME) {
    return DEFAULT_THEME;
  }

  if (themeName.startsWith(THEME_PREFIX)) {
    return themeName.slice(THEME_PREFIX.length);
  }

  return themeName;
}

function setThemeAttribute(themeName) {
  const root = document.documentElement;

  if (!root) {
    return;
  }

  const sanitized = sanitizeThemeKey(themeName);

  if (!sanitized || sanitized === DEFAULT_THEME) {
    root.removeAttribute(DATA_THEME_ATTR);
    return;
  }

  root.setAttribute(DATA_THEME_ATTR, sanitized);
}

function manageMatrixEffect(themeName) {
  const sanitized = sanitizeThemeKey(themeName);
  shouldRunMatrixEffect = sanitized === MATRIX_THEME_VALUE;

  if (shouldRunMatrixEffect) {
    startMatrixEffect();
    return;
  }

  stopMatrixEffect();
}

function startMatrixEffect() {
  if (isMatrixEffectActive) {
    return;
  }

  if (matrixRainModule) {
    try {
      matrixRainModule.init({ container: document.body });
      isMatrixEffectActive = true;
    } catch (error) {
      console.error("ThemeManager: falha ao iniciar efeito Matrix.", error);
      isMatrixEffectActive = false;
    }
    return;
  }

  if (!matrixRainModulePromise) {
    matrixRainModulePromise = import("./matrixRain.js")
      .then((module) => {
        matrixRainModule = module;

        if (!shouldRunMatrixEffect) {
          return;
        }

        module.init({ container: document.body });
        isMatrixEffectActive = true;
      })
      .catch((error) => {
        console.error("ThemeManager: não foi possível carregar matrixRain.js.", error);
        isMatrixEffectActive = false;
      })
      .finally(() => {
        matrixRainModulePromise = null;
      });
  }
}

function stopMatrixEffect() {
  if (matrixRainModulePromise) {
    matrixRainModulePromise
      .then((module) => {
        if (shouldRunMatrixEffect) {
          return;
        }

        if (typeof module.cleanup === "function") {
          module.cleanup();
          isMatrixEffectActive = false;
        }
      })
      .catch(() => {
        // Ignora erros de limpeza após o carregamento do módulo.
      });
  }

  if (matrixRainModule && typeof matrixRainModule.cleanup === "function") {
    try {
      matrixRainModule.cleanup();
    } catch (error) {
      console.error("ThemeManager: falha ao limpar efeito Matrix.", error);
    }
  }

  isMatrixEffectActive = false;
}

function syncThemeSelect(themeSelect, value) {
  if (themeSelect && themeSelect.value !== value) {
    themeSelect.value = value;
  }
}

function updateThemeOptions(themeOptions, activeTheme) {
  if (!themeOptions.length) {
    return;
  }

  themeOptions.forEach((option) => {
    const value = getThemeValue(option);
    const isActive = value === activeTheme;

    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-pressed", String(isActive));
  });
}

function updateThemeToggle(themeToggle, activeTheme, themeOptions) {
  if (!themeToggle) {
    return;
  }

  const rawLabel = resolveThemeLabel(themeOptions, activeTheme);
  const friendlyLabel = formatThemeLabel(rawLabel);
  const description = `Selecionar tema (atual: ${friendlyLabel})`;

  themeToggle.setAttribute("aria-label", description);

  updateThemeTogglePopover(themeToggle, friendlyLabel);
}

function updateThemeTogglePopover(themeToggle, currentThemeLabel) {
  if (!themeToggle || typeof bootstrap === "undefined" || !bootstrap.Popover) {
    return;
  }

  const baseContent =
    themeToggle.dataset.themePopoverBaseContent ||
    themeToggle.getAttribute("data-theme-popover-content") ||
    "Clique para escolher outra combinação de cores.";

  const friendlyLabel = formatThemeLabel(currentThemeLabel);
  const popoverContent = `Tema atual: ${friendlyLabel}. ${baseContent}`;

  themeToggle.dataset.themePopoverBaseContent = baseContent;
  themeToggle.dataset.themePopoverContent = popoverContent;

  const existing = bootstrap.Popover.getInstance(themeToggle);

  if (existing) {
    existing.dispose();
  }

  bootstrap.Popover.getOrCreateInstance(themeToggle, {
    trigger: "hover focus",
    placement: "bottom",
    container: "body",
    title: "",
    content: popoverContent,
  });

  if (!themeToggle.dataset.themePopoverListenersAttached) {
    themeToggle.addEventListener("show.bs.dropdown", () => {
      const instance = bootstrap.Popover.getInstance(themeToggle);
      instance?.hide();
    });

    themeToggle.dataset.themePopoverListenersAttached = "true";
  }
}

function resolveThemeLabel(themeOptions, themeValue) {
  const activeOption = themeOptions.find(
    (option) => getThemeValue(option) === themeValue,
  );

  if (!activeOption) {
    return themeValue;
  }

  return (
    activeOption.dataset.themeLabel ||
    activeOption.textContent.trim() ||
    themeValue
  );
}

function getThemeValue(option) {
  return option.dataset.themeOption || option.value || "";
}

function formatThemeLabel(label) {
  if (!label) {
    return "";
  }

  if (label.startsWith(THEME_PREFIX)) {
    return label
      .slice(THEME_PREFIX.length)
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return label;
}

export function getActiveTheme() {
  return sessionStorage.getItem("theme") || DEFAULT_THEME;
}

export function setTheme(themeName) {
  const value = themeName || DEFAULT_THEME;

  applyTheme(value);
  syncThemeSelect(trackedThemeSelect, value);
  updateThemeOptions(trackedThemeOptions, value);
  updateThemeToggle(trackedThemeToggle, value, trackedThemeOptions);
}

if (typeof window !== "undefined") {
  window.ThemeManager = window.ThemeManager || {};
  window.ThemeManager.setTheme = setTheme;
  window.ThemeManager.getActiveTheme = getActiveTheme;
}
