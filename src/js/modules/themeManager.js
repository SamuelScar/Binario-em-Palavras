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
  const { selectId = "theme-selector" } = options;
  const themeSelect = document.getElementById(selectId);
  const savedTheme = sessionStorage.getItem("theme") || DEFAULT_THEME;

  applyTheme(savedTheme);

  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.addEventListener("change", (event) => {
      applyTheme(event.target.value);
    });
  }
}
