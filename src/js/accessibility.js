(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var docEl = doc.documentElement;
  var panel = doc.getElementById('acc-panel');
  var toggle = doc.getElementById('acc-toggle');
  var backdrop = doc.getElementById('acc-backdrop');
  var title = doc.getElementById('acc-panel-title');
  var focusableSelector = 'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var raf = window.requestAnimationFrame || function (callback) {
    return setTimeout(callback, 16);
  };
  var isPanelOpen = false;
  var hideTimeoutId = null;
  var uiState = {
    underlineLinks: false,
    actionStates: {}
  };
  var EPSILON = 0.0001;

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

    setDisabledState(increaseBtn, maxReached);
    setDisabledState(decreaseBtn, minReached);
    setDisabledState(resetBtn, !hasActiveAdjustments());
  }

  function initTogglePopover() {
    if (!toggle || typeof bootstrap === 'undefined' || !bootstrap.Popover) {
      return;
    }

    var titleAttr =
      toggle.getAttribute('data-acc-popover-title') || 'Acessibilidade';
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
      title: titleAttr,
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
