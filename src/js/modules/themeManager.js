/**
 * Gerenciamento de temas da aplicação (padrão, dark e Matrix), incluindo
 * sincronização com controles de UI, atributo data-theme e efeito visual Matrix.
 * As funções expostas mantêm compatibilidade com chamadas existentes.
 * @module ThemeManager
 */
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
/**
 * Aplica o tema selecionado ao documento e sincroniza UI/estado persistente.
 * Não altera contratos públicos nem classes externas além das previstas.
 * @param {string} themeName Nome do tema (por exemplo: "default", "dark", "matrix" ou classes iniciadas por "theme-").
 * @returns {void}
 */
export function applyTheme(themeName) {
  const value = themeName || DEFAULT_THEME;

  if (value === currentThemeValue) {
    setThemeAttribute(value);
    manageMatrixEffect(value);
    ensureBaseClasses();
    persistTheme(value);
    notifyThemeChange(value);
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
  persistTheme(value);
  currentThemeValue = value;
  notifyThemeChange(value);
}

/**
 * Configura o controle de temas via elemento select. A escolha do usuário é
 * salva em sessionStorage e reaplicada ao recarregar a página.
 * @param {{ selectId?: string }} [options] - Objeto de configuração.
 */
/**
 * Inicializa o gerenciador de temas, conectando select/opções/toggle da interface.
 * Persiste a seleção (exceto Matrix) via sessionStorage e reidrata ao carregar.
 * @param {{ selectId?: string, optionSelector?: string, toggleSelector?: string }} [options]
 * @returns {void}
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
  const storedTheme = sessionStorage.getItem("theme");
  const savedTheme =
    storedTheme && storedTheme !== MATRIX_THEME_VALUE ? storedTheme : DEFAULT_THEME;

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

/**
 * Resolve a classe CSS correspondente a um valor de tema.
 * @param {string} themeName Valor lógico do tema.
 * @returns {string|null} Classe a aplicar no body ou null para o tema padrão.
 */
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

/**
 * Normaliza o valor do tema para uso no atributo data-theme.
 * @param {string} themeName
 * @returns {string}
 */
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

/**
 * Define ou remove o atributo data-theme no elemento root do documento.
 * @param {string} themeName
 * @returns {void}
 */
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

/**
 * Inicia ou encerra o efeito Matrix conforme o tema ativo.
 * @param {string} themeName
 * @returns {void}
 */
function manageMatrixEffect(themeName) {
  const sanitized = sanitizeThemeKey(themeName);
  shouldRunMatrixEffect = sanitized === MATRIX_THEME_VALUE;

  if (shouldRunMatrixEffect) {
    startMatrixEffect();
    return;
  }

  stopMatrixEffect();
}

/**
 * Emite evento personalizado notificando mudança de tema.
 * @param {string} themeName
 * @returns {void}
 */
function notifyThemeChange(themeName) {
  const sanitized = sanitizeThemeKey(themeName);
  const detail = { theme: sanitized };
  document.dispatchEvent(new CustomEvent("binario:theme-change", { detail }));
}

/**
 * Carrega sob demanda e inicializa o efeito visual Matrix.
 * Respeita preferência já ativa para evitar múltiplas inicializações.
 * @returns {void}
 */
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

/**
 * Interrompe o efeito visual Matrix e remove listeners associados.
 * Opera de forma idempotente quando o módulo ainda estiver carregando.
 * @returns {void}
 */
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

/**
 * Mantém o elemento select sincronizado com o tema ativo.
 * @param {HTMLSelectElement|null} themeSelect
 * @param {string} value
 */
function syncThemeSelect(themeSelect, value) {
  if (themeSelect && themeSelect.value !== value) {
    themeSelect.value = value;
  }
}

/**
 * Atualiza estado visual de botões/opções de tema.
 * @param {HTMLElement[]} themeOptions Lista de botões/opções.
 * @param {string} activeTheme Tema ativo.
 */
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

/**
 * Ajusta rótulos ARIA e popover do controle de seleção de tema.
 * @param {HTMLElement|null} themeToggle
 * @param {string} activeTheme
 * @param {HTMLElement[]} themeOptions
 */
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

/**
 * Recria o Popover do Bootstrap com o rótulo do tema atual.
 * Evita vazamento mantendo uma única instância por gatilho.
 * @param {HTMLElement|null} themeToggle
 * @param {string} currentThemeLabel
 */
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

/**
 * Deriva rótulo amigável a partir dos botões de tema.
 * @param {HTMLElement[]} themeOptions
 * @param {string} themeValue
 * @returns {string}
 */
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

/**
 * Obtém o valor lógico do tema de um botão/opção.
 * @param {HTMLElement} option
 * @returns {string}
 */
function getThemeValue(option) {
  return option.dataset.themeOption || option.value || "";
}

/**
 * Formata um rótulo de tema (ex.: "theme-vintage" -> "Vintage").
 * @param {string} label
 * @returns {string}
 */
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

/**
 * Obtém o tema persistido, padronizando para "default" quando for Matrix.
 * @returns {string}
 */
export function getActiveTheme() {
  const stored = sessionStorage.getItem("theme");
  if (!stored || stored === MATRIX_THEME_VALUE) {
    return DEFAULT_THEME;
  }
  return stored;
}

/**
 * API pública para alterar o tema e sincronizar UI relacionada.
 * @param {string} themeName
 * @returns {void}
 */
export function setTheme(themeName) {
  const value = themeName || DEFAULT_THEME;

  applyTheme(value);
  syncThemeSelect(trackedThemeSelect, value);
  updateThemeOptions(trackedThemeOptions, value);
  updateThemeToggle(trackedThemeToggle, value, trackedThemeOptions);
}

/**
 * Persiste o tema selecionado no sessionStorage, exceto Matrix.
 * @param {string} themeName
 */
function persistTheme(themeName) {
  if (themeName && themeName !== MATRIX_THEME_VALUE) {
    sessionStorage.setItem("theme", themeName);
  } else {
    sessionStorage.removeItem("theme");
  }
}

if (typeof window !== "undefined") {
  window.ThemeManager = window.ThemeManager || {};
  window.ThemeManager.setTheme = setTheme;
  window.ThemeManager.getActiveTheme = getActiveTheme;
}
