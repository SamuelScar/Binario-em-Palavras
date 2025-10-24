(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var docEl = doc.documentElement;
  var panel = doc.getElementById('acc-panel');
  var toggle = doc.getElementById('acc-toggle');
  var backdrop = doc.getElementById('acc-backdrop');
  var title = doc.getElementById('acc-panel-title');
  var themeToggleControl = doc.querySelector('[data-theme-toggle]');
  var themeOptionControls = doc.querySelectorAll('[data-theme-option]');
  var focusableSelector = 'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var raf = window.requestAnimationFrame || function (callback) {
    return setTimeout(callback, 16);
  };
  var isPanelOpen = false;
  var hideTimeoutId = null;
  var uiState = {
    underlineLinks: false,
    actionStates: {},
    colorMode: null,
    themeLocked: false,
    previousTheme: null
  };
  var EPSILON = 0.0001;
  var DEFAULT_THEME = 'default';
  var THEME_PREFIX = 'theme-';
  var MATRIX_THEME_VALUE = 'matrix';
  var MATRIX_THEME_CLASS = 'theme-matrix';
  var DATA_THEME_ATTR = 'data-theme';
  var THEME_BASE_CLASSES = ['bg-custom-page', 'p-3'];
  var COLOR_MODE_CLASSES = {
    grayscale: 'acc-mode--grayscale',
    'high-contrast': 'acc-mode--high-contrast',
    'negative-contrast': 'acc-mode--negative-contrast',
    'light-background': 'acc-mode--light-background'
  };
  var COLOR_MODE_ACTIONS = Object.keys(COLOR_MODE_CLASSES);
  var THEME_LOCK_MESSAGE = 'Desative o modo de cor para alterar o tema.';

  function getActiveThemeValue() {
    try {
      if (window.ThemeManager && typeof window.ThemeManager.getActiveTheme === 'function') {
        return window.ThemeManager.getActiveTheme();
      }
    } catch (error) {
      console.warn('Painel de acessibilidade: não foi possível obter o tema ativo.', error);
    }

    try {
      var storedTheme = sessionStorage.getItem('theme');
      if (storedTheme) {
        return storedTheme;
      }
    } catch (storageError) {
      console.warn('Painel de acessibilidade: acesso ao sessionStorage indisponível.', storageError);
    }

    var detectedTheme = DEFAULT_THEME;
    body.classList.forEach(function (className) {
      if (className === 'dark' || className.indexOf(THEME_PREFIX) === 0) {
        detectedTheme = className;
      }
    });

    return detectedTheme || DEFAULT_THEME;
  }

  function applyThemeValue(theme) {
    var nextTheme = theme || DEFAULT_THEME;

    try {
      if (window.ThemeManager && typeof window.ThemeManager.setTheme === 'function') {
        window.ThemeManager.setTheme(nextTheme);
        return;
      }
    } catch (error) {
      console.warn('Painel de acessibilidade: não foi possível aplicar o tema via ThemeManager.', error);
    }

    forceApplyTheme(nextTheme);
  }

  function forceApplyTheme(theme) {
    clearThemeClassesFromBody();

    if (theme && theme !== DEFAULT_THEME) {
      var themeClass = resolveThemeClass(theme);
      if (themeClass) {
        body.classList.add(themeClass);
      }
    }

    ensureThemeBaseClasses();
    setThemeAttribute(theme);

    try {
      sessionStorage.setItem('theme', theme || DEFAULT_THEME);
    } catch (error) {
      console.warn('Painel de acessibilidade: falha ao persistir tema no sessionStorage.', error);
    }

    updateThemeControlsFallback(theme || DEFAULT_THEME);
  }

  function clearThemeClassesFromBody() {
    var classesToRemove = [];
    body.classList.forEach(function (className) {
      if (className === 'dark' || className.indexOf(THEME_PREFIX) === 0) {
        classesToRemove.push(className);
      }
    });

    classesToRemove.forEach(function (className) {
      body.classList.remove(className);
    });
  }

  function resolveThemeClass(theme) {
    if (!theme || theme === DEFAULT_THEME) {
      return null;
    }

    if (theme === MATRIX_THEME_VALUE) {
      return MATRIX_THEME_CLASS;
    }

    if (theme === 'dark') {
      return 'dark';
    }

    return theme;
  }

  function sanitizeThemeKey(theme) {
    if (!theme) {
      return DEFAULT_THEME;
    }

    if (theme === MATRIX_THEME_VALUE) {
      return MATRIX_THEME_VALUE;
    }

    if (theme === DEFAULT_THEME) {
      return DEFAULT_THEME;
    }

    if (theme.indexOf(THEME_PREFIX) === 0) {
      return theme.slice(THEME_PREFIX.length);
    }

    return theme;
  }

  function setThemeAttribute(theme) {
    if (!docEl) {
      return;
    }

    var sanitized = sanitizeThemeKey(theme);

    if (!sanitized || sanitized === DEFAULT_THEME) {
      docEl.removeAttribute(DATA_THEME_ATTR);
      return;
    }

    docEl.setAttribute(DATA_THEME_ATTR, sanitized);
  }

  function ensureThemeBaseClasses() {
    THEME_BASE_CLASSES.forEach(function (className) {
      if (!body.classList.contains(className)) {
        body.classList.add(className);
      }
    });
  }

  function updateThemeControlsFallback(theme) {
    Array.prototype.forEach.call(themeOptionControls, function (option) {
      if (!option) {
        return;
      }
      var optionValue = option.getAttribute('data-theme-option') || option.value || '';
      var isDefaultOption = !optionValue && theme === DEFAULT_THEME;
      var isActive = optionValue === theme || isDefaultOption;
      option.classList.toggle('is-active', isActive);
      option.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (themeToggleControl) {
      var friendlyLabel = formatThemeLabel(theme);
      var description = 'Selecionar tema (atual: ' + friendlyLabel + ')';
      themeToggleControl.setAttribute('aria-label', description);
    }
  }

  function formatThemeLabel(label) {
    if (!label) {
      return DEFAULT_THEME;
    }

    if (label === 'dark') {
      return 'Escuro';
    }

    if (label.indexOf(THEME_PREFIX) === 0) {
      return label
        .slice(THEME_PREFIX.length)
        .split('-')
        .filter(Boolean)
        .map(function (part) {
          return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join(' ');
    }

    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function noop() {}

  if (!panel || !toggle || !backdrop) {
    if (!window.AccessibilityPanel) {
      window.AccessibilityPanel = { open: noop, close: noop, toggle: noop };
    }
    console.warn('Painel de acessibilidade: elementos obrigatórios não encontrados.');
    return;
  }

  var actionButtons = panel.querySelectorAll('[data-action]');
  var closeTriggers = panel.querySelectorAll('[data-acc-close]');
  var buttonMap = {};
  var fontConfig = {
    scale: 1,
    min: 0.8,
    max: 1.5,
    step: 0.1,
    base: parseFloat(window.getComputedStyle(docEl).fontSize) || 16
  };
  var actionHandlers = {
    'font-increase': increaseFont,
    'font-decrease': decreaseFont,
    'underline-links': toggleLinkUnderline,
    grayscale: toggleGrayscale,
    'high-contrast': toggleHighContrast,
    'negative-contrast': toggleNegativeContrast,
    'light-background': toggleLightBackground,
    reset: resetAdjustments
  };

  function getFocusableElements() {
    var nodes = panel.querySelectorAll(focusableSelector);
    return Array.prototype.slice.call(nodes).filter(function (node) {
      return node.offsetParent !== null || panel === node;
    });
  }

  function handleDocumentKeydown(event) {
    if (!isPanelOpen) {
      return;
    }

    var key = event.key || event.keyCode;

    if (key === 'Escape' || key === 'Esc' || key === 27) {
      event.preventDefault();
      closePanel();
      return;
    }

    if (key !== 'Tab' && key !== 9) {
      return;
    }

    var focusable = getFocusableElements();

    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    var active = doc.activeElement;
    var isShift = event.shiftKey;

    if (isShift) {
      if (active === first || !panel.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function runAction(action) {
    var handler = actionHandlers[action];
    if (typeof handler === 'function') {
      handler();
      return;
    }
    var nextState = !uiState.actionStates[action];
    setActionState(action, nextState);
    updateControlsState();
    console.log('[TODO]', action);
  }

  function completeClose() {
    if (hideTimeoutId) {
      clearTimeout(hideTimeoutId);
      hideTimeoutId = null;
    }
    if (isPanelOpen) {
      return;
    }
    panel.hidden = true;
    backdrop.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
  }

  function openPanel() {
    if (isPanelOpen) {
      return;
    }

    hideTogglePopover();

    if (hideTimeoutId) {
      clearTimeout(hideTimeoutId);
      hideTimeoutId = null;
    }

    panel.hidden = false;
    backdrop.hidden = false;
    panel.setAttribute('aria-hidden', 'false');

    raf(function () {
      panel.classList.add('is-open');
      backdrop.classList.add('is-visible');
    });

    body.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    isPanelOpen = true;

    setTimeout(function () {
      if (title) {
        title.focus();
      }
    }, 50);
  }

  function closePanel() {
    if (!isPanelOpen) {
      return;
    }

    panel.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    body.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    isPanelOpen = false;
    panel.setAttribute('aria-hidden', 'true');

    hideTimeoutId = setTimeout(completeClose, 320);

    toggle.focus();
  }

  function togglePanel() {
    if (isPanelOpen) {
      closePanel();
      return;
    }
    openPanel();
  }

  function toggleLinkUnderline() {
    setLinkUnderline(!uiState.underlineLinks);
  }

  function toggleGrayscale() {
    setColorMode('grayscale');
  }

  function toggleHighContrast() {
    setColorMode('high-contrast');
  }

  function toggleNegativeContrast() {
    setColorMode('negative-contrast');
  }

  function toggleLightBackground() {
    setColorMode('light-background');
  }

  function setLinkUnderline(active) {
    uiState.underlineLinks = !!active;
    var links = doc.querySelectorAll('a[href]');
    Array.prototype.forEach.call(links, function (link) {
      if (uiState.underlineLinks) {
        link.classList.add('is-acc-underlined');
      } else {
        link.classList.remove('is-acc-underlined');
      }
    });
    updateControlsState();
  }

  function setColorMode(mode) {
    if (!mode || uiState.colorMode === mode) {
      clearColorMode();
      updateControlsState();
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(COLOR_MODE_CLASSES, mode)) {
      clearColorMode();
      updateControlsState();
      return;
    }

    var currentTheme = getActiveThemeValue();

    if (!uiState.previousTheme) {
      uiState.previousTheme = currentTheme;
    }

    if (uiState.colorMode) {
      removeColorModeClass(uiState.colorMode);
    }

    applyThemeValue(DEFAULT_THEME);

    uiState.colorMode = mode;
    body.classList.add(COLOR_MODE_CLASSES[mode]);
    setThemeControlsLock(true);

    COLOR_MODE_ACTIONS.forEach(function (action) {
      setActionState(action, action === mode);
    });

    updateControlsState();
  }

  function clearColorMode() {
    if (uiState.colorMode) {
      removeColorModeClass(uiState.colorMode);
      uiState.colorMode = null;
    }

    setThemeControlsLock(false);

    var fallbackTheme = uiState.previousTheme || DEFAULT_THEME;
    uiState.previousTheme = null;

    applyThemeValue(fallbackTheme);

    COLOR_MODE_ACTIONS.forEach(function (action) {
      setActionState(action, false);
    });
  }

  function removeColorModeClass(mode) {
    var className = COLOR_MODE_CLASSES[mode];
    if (className) {
      body.classList.remove(className);
    }
  }

  function applyFontScale() {
    var clamped = Math.max(fontConfig.min, Math.min(fontConfig.max, fontConfig.scale));
    fontConfig.scale = clamped;
    var newSize = (fontConfig.base * clamped).toFixed(2) + 'px';
    docEl.style.fontSize = newSize;
  }

  function increaseFont() {
    if (fontConfig.scale >= fontConfig.max) {
      return;
    }
    fontConfig.scale = parseFloat((fontConfig.scale + fontConfig.step).toFixed(2));
    applyFontScale();
    updateControlsState();
  }

  function decreaseFont() {
    if (fontConfig.scale <= fontConfig.min) {
      return;
    }
    fontConfig.scale = parseFloat((fontConfig.scale - fontConfig.step).toFixed(2));
    applyFontScale();
    updateControlsState();
  }

  function resetAdjustments() {
    fontConfig.scale = 1;
    docEl.style.fontSize = '';
    setLinkUnderline(false);
    clearColorMode();

    Object.keys(uiState.actionStates).forEach(function (action) {
      if (action === 'font-increase' || action === 'font-decrease' || action === 'underline-links') {
        return;
      }
      setActionState(action, false);
    });

    updateControlsState();
  }

  function hasActiveAdjustments() {
    if (Math.abs(fontConfig.scale - 1) > EPSILON || uiState.underlineLinks) {
      return true;
    }

    var actions = uiState.actionStates;
    for (var key in actions) {
      if (!Object.prototype.hasOwnProperty.call(actions, key)) {
        continue;
      }
      if (key === 'font-increase' || key === 'font-decrease' || key === 'underline-links') {
        continue;
      }
      if (actions[key]) {
        return true;
      }
    }

    return false;
  }

  function setDisabledState(button, disabled) {
    if (!button) {
      return;
    }
    if (disabled) {
      button.setAttribute('disabled', 'disabled');
      button.setAttribute('aria-disabled', 'true');
    } else {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-disabled');
    }
  }

  function setToggleState(button, active) {
    if (!button) {
      return;
    }
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    if (active) {
      button.classList.add('acc-btn--active');
    } else {
      button.classList.remove('acc-btn--active');
    }
  }

  function setActionState(action, active) {
    uiState.actionStates[action] = !!active;
    setToggleState(buttonMap[action], active);
  }

  function updateControlsState() {
    var increaseBtn = buttonMap['font-increase'];
    var decreaseBtn = buttonMap['font-decrease'];
    var resetBtn = buttonMap.reset;
    var scale = fontConfig.scale;
    var maxReached = scale >= fontConfig.max - EPSILON;
    var minReached = scale <= fontConfig.min + EPSILON;

    setActionState('font-increase', scale > 1 + EPSILON);
    setActionState('font-decrease', scale < 1 - EPSILON);
    setActionState('underline-links', uiState.underlineLinks);
    COLOR_MODE_ACTIONS.forEach(function (action) {
      setActionState(action, uiState.colorMode === action);
    });

    setDisabledState(increaseBtn, maxReached);
    setDisabledState(decreaseBtn, minReached);
    setDisabledState(resetBtn, !hasActiveAdjustments());
  }
  function setThemeControlsLock(locked) {
    if (uiState.themeLocked === locked) {
      return;
    }

    uiState.themeLocked = locked;

    if (themeToggleControl) {
      if (!Object.prototype.hasOwnProperty.call(themeToggleControl.dataset, 'accPrevTitle')) {
        themeToggleControl.dataset.accPrevTitle = themeToggleControl.getAttribute('title') || '';
      }

      if (locked) {
        themeToggleControl.setAttribute('disabled', 'disabled');
        themeToggleControl.setAttribute('aria-disabled', 'true');
        themeToggleControl.setAttribute('title', THEME_LOCK_MESSAGE);
      } else {
        themeToggleControl.removeAttribute('disabled');
        themeToggleControl.removeAttribute('aria-disabled');
        if (themeToggleControl.dataset.accPrevTitle) {
          themeToggleControl.setAttribute('title', themeToggleControl.dataset.accPrevTitle);
        } else {
          themeToggleControl.removeAttribute('title');
        }
      }

      if (!locked) {
        delete themeToggleControl.dataset.accPrevTitle;
      }

      if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
        var togglePopoverInstance = bootstrap.Popover.getInstance(themeToggleControl);
        if (togglePopoverInstance) {
          togglePopoverInstance.hide();
        }
      }
    }

    Array.prototype.forEach.call(themeOptionControls, function (option) {
      if (!option) {
        return;
      }

      if (locked) {
        option.setAttribute('disabled', 'disabled');
        option.setAttribute('aria-disabled', 'true');
      } else {
        option.removeAttribute('disabled');
        option.removeAttribute('aria-disabled');
      }
    });
  }

  function initTogglePopover() {
    if (!toggle || typeof bootstrap === 'undefined' || !bootstrap.Popover) {
      return;
    }

    var contentAttr =
      toggle.getAttribute('data-acc-popover-content') ||
      'Ferramentas de acessibilidade';

    toggle.setAttribute('data-bs-toggle', 'popover');
    toggle.setAttribute('data-bs-trigger', 'hover focus');
    toggle.setAttribute('data-bs-placement', 'right');

    bootstrap.Popover.getOrCreateInstance(toggle, {
      trigger: 'hover focus',
      placement: 'right',
      container: 'body',
      title: '',
      content: contentAttr
    });
  }

  function hideTogglePopover() {
    if (typeof bootstrap === 'undefined' || !bootstrap.Popover) {
      return;
    }

    var instance = bootstrap.Popover.getInstance(toggle);

    if (instance) {
      instance.hide();
    }
  }

  panel.addEventListener('transitionend', function (event) {
    if (event.propertyName === 'transform') {
      completeClose();
    }
  });

  backdrop.addEventListener('transitionend', function (event) {
    if ((event.propertyName === 'opacity' || typeof event.propertyName === 'undefined') && !isPanelOpen) {
      backdrop.hidden = true;
    }
  });

  initTogglePopover();

  toggle.addEventListener('click', function () {
    hideTogglePopover();
    togglePanel();
  });
  backdrop.addEventListener('click', closePanel);

  Array.prototype.forEach.call(closeTriggers, function (button) {
    button.addEventListener('click', closePanel);
  });

  Array.prototype.forEach.call(actionButtons, function (button) {
    var action = button.getAttribute('data-action');
    if (action) {
      buttonMap[action] = button;
    }
    button.addEventListener('click', function (event) {
      var actionName = event.currentTarget.getAttribute('data-action');
      runAction(actionName);
    });
  });

  Object.keys(buttonMap).forEach(function (action) {
    if (action === 'font-increase' || action === 'font-decrease' || action === 'underline-links' || action === 'reset') {
      return;
    }
    setActionState(action, !!uiState.actionStates[action]);
  });

  document.addEventListener('keydown', handleDocumentKeydown);

  panel.setAttribute('aria-hidden', 'true');

  updateControlsState();

  window.AccessibilityPanel = {
    open: openPanel,
    close: closePanel,
    toggle: togglePanel
  };
})();
