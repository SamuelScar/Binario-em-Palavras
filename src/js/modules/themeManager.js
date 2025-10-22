const DEFAULT_THEME = "default";
const THEME_PREFIX = "theme-";
const BASE_BODY_CLASSES = ["bg-custom-page", "p-3"];

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
  clearThemeClasses();

  if (themeName && themeName !== DEFAULT_THEME) {
    document.body.classList.add(themeName);
  }

  ensureBaseClasses();
  sessionStorage.setItem("theme", themeName || DEFAULT_THEME);
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
