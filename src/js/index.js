import { phrases, dictionary, biblicalPhrases } from "./data/phrases.js";
import { initThemeManager } from "./modules/themeManager.js";
import { textToBinary, binaryToText } from "./modules/converter.js";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import * as bootstrap from "bootstrap";
import "../css/themes.css";

// Torna os componentes do Bootstrap acessíveis a scripts não-modulares.
window.bootstrap = bootstrap;

document.addEventListener("DOMContentLoaded", initializeApplication);

/**
 * Orquestra a inicialização da interface assim que o DOM estiver pronto.
 */
function initializeApplication() {
  const elements = getDomElements();
  const counterController = createAnimatedBinaryCounter(elements.characterCounter);
  const context = { ...elements, counterController };

  setAppLoadingState(true);
  initThemeManager();
  showStartupAlert(elements.mainContent);
  setupConverters(context);
  setupBinaryValidation(context);
  setupDictionary(context);
  populateQuickPhrases(context);
  populateBiblicalPhrases(context);
  setupClearButton(context);
  setupPulseButton(context);
  setupFeedbackForm();
  setAppLoadingState(false);
}

/**
 * Centraliza as referências de DOM utilizadas no módulo.
 * @returns {{binaryInput: HTMLTextAreaElement|null, textInput: HTMLTextAreaElement|null, dictionaryEl: HTMLElement|null, dictionarySearch: HTMLInputElement|null, phrasesEl: HTMLElement|null, clearButton: HTMLButtonElement|null, biblicalPhrasesContainer: HTMLElement|null, mainContent: HTMLElement|null, pulseButton: HTMLButtonElement|null}}
 */
function getDomElements() {
  return {
    binaryInput: document.getElementById("binaryInput"),
    textInput: document.getElementById("textInput"),
    dictionaryEl: document.getElementById("dictionary"),
    dictionarySearch: document.getElementById("dictionarySearch"),
    phrasesEl: document.getElementById("phrases"),
    clearButton: document.getElementById("clearButton"),
    biblicalPhrasesContainer: document.getElementById("biblicalPhrasesContainer"),
    mainContent: document.getElementById("mainContent"),
    pulseButton: document.querySelector(".btn-pulsante"),
    characterCounter: document.querySelector("[data-binary-counter]"),
  };
}

/**
 * Alterna o estado de carregamento inicial entre skeleton e conteúdo real.
 * @param {boolean} isLoading - Quando true mantém o skeleton visível.
 */
function setAppLoadingState(isLoading) {
  const body = document.body;
  const mainContent = document.getElementById("mainContent");
  const skeleton = document.getElementById("loadingSkeleton");

  if (body) {
    body.dataset.appLoading = String(isLoading);
  }

  if (mainContent) {
    mainContent.setAttribute("aria-busy", String(isLoading));
  }

  if (skeleton) {
    if (isLoading) {
      skeleton.hidden = false;
      skeleton.setAttribute("aria-hidden", "false");
    } else {
      skeleton.hidden = true;
      skeleton.setAttribute("aria-hidden", "true");
    }
  }
}

const FEEDBACK_STORAGE_KEY = "binario:feedbackType";
const FEEDBACK_MAX_LENGTH = 1000;
function setupFeedbackForm() {
  const form = document.getElementById("feedbackForm");

  if (!form) {
    return;
  }

  const typeRadios = Array.from(form.querySelectorAll("[data-feedback-radio]"));
  const submitButton = form.querySelector("[data-feedback-submit]");
  const submitText = form.querySelector("[data-feedback-submit-text]");
  const mailtoLink = form.querySelector("[data-feedback-mailto]");
  const messageField = form.querySelector('[data-feedback-field="message"]');
  const nameField = form.querySelector('[data-feedback-field="name"]');
  const emailField = form.querySelector('[data-feedback-field="email"]');
  const counterEl = form.querySelector("[data-feedback-counter]");
  const errorEl = form.querySelector("[data-feedback-error]");
  const statusEl = form.querySelector("[data-feedback-status]");

  let currentType = getStoredFeedbackType() || "suggestion";

  function setStoredFeedbackType(type) {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, type);
    } catch {
      // Ignora falhas de armazenamento
    }
  }

  function getStoredFeedbackType() {
    try {
      return localStorage.getItem(FEEDBACK_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function updateCounter() {
    if (!counterEl || !messageField) {
      return;
    }
    const length = (messageField.value || "").length;
    counterEl.textContent = `${length}/${FEEDBACK_MAX_LENGTH}`;
  }

  function setActiveType(type) {
    currentType = type;
    typeRadios.forEach((radio) => {
      radio.checked = radio.value === type;
    });
    setStoredFeedbackType(type);
  }

  function setStatusMessage(message, variant = "muted") {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message || "";
    statusEl.className = `feedback-status mt-3 text-${variant}`;
  }

  function showFieldError(message) {
    if (!errorEl) {
      return;
    }
    errorEl.textContent = message || "";
  }

  setActiveType(currentType);
  updateCounter();
  showFieldError("");
  setStatusMessage("");

  typeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) {
        return;
      }
      const type = radio.value || "suggestion";
      setActiveType(type);
      if (messageField) {
        messageField.focus();
      }
    });
  });

  if (messageField) {
    messageField.addEventListener("input", () => {
      updateCounter();
      if (messageField.value.trim().length > 0) {
        showFieldError("");
      }
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatusMessage("");

    if (!messageField || !emailField) {
      return;
    }

    const trimmedMessage = messageField.value.trim();
    const trimmedEmail = emailField.value.trim();

    if (!trimmedMessage) {
      showFieldError("Descreva o bug ou sugestão antes de enviar.");
      messageField.focus();
      return;
    }

    emailField.value = trimmedEmail;
    emailField.setCustomValidity("");

    if (!trimmedEmail) {
      emailField.setCustomValidity("Informe um e-mail para que possamos retornar o contato.");
      emailField.reportValidity();
      emailField.focus();
      setStatusMessage("Informe um e-mail válido antes de enviar.", "danger");
      return;
    }

    if (!emailField.checkValidity()) {
      emailField.reportValidity();
      emailField.focus();
      setStatusMessage("Verifique o e-mail digitado e tente novamente.", "danger");
      return;
    }

    const payload = {
      type: currentType,
      name: nameField ? nameField.value.trim() : "",
      email: trimmedEmail,
      message: trimmedMessage,
      page: window.location.href,
      userAgent: navigator.userAgent,
    };

    disableSubmit();

    try {
      const response = await fetch("/api/send-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar feedback");
      }

      await response.json();

      await showAlert({
        title: "Obrigado pelo feedback!",
        text: "Recebemos sua mensagem e iremos analisá-la com carinho.",
        icon: "success",
        confirmButtonText: "Fechar",
      });

      form.reset();
      updateCounter();
      showFieldError("");
      setStatusMessage("Feedback enviado com sucesso. Obrigado!", "success");
      setActiveType(currentType); // Reaplica estado visual
      if (messageField) {
        messageField.focus();
      }
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      showFieldError("Não foi possível enviar agora. Tente novamente ou use o botão de e-mail.");
      setStatusMessage("Envio falhou. Caso o problema persista, utilize o e-mail.", "danger");
      if (mailtoLink) {
        mailtoLink.focus();
      }
      await showAlert({
        title: "Ops! Algo deu errado",
        text: "Não conseguimos enviar sua mensagem. Você pode tentar novamente ou enviar diretamente por e-mail.",
        icon: "error",
        confirmButtonText: "Entendi",
      });
    } finally {
      enableSubmit();
    }
  });

  function disableSubmit() {
    if (!submitButton || !submitText) {
      return;
    }
    submitButton.setAttribute("disabled", "disabled");
    submitButton.setAttribute("aria-disabled", "true");
    submitText.textContent = "Enviando...";
  }

  function enableSubmit() {
    if (!submitButton || !submitText) {
      return;
    }
    submitButton.removeAttribute("disabled");
    submitButton.removeAttribute("aria-disabled");
    submitText.textContent = "Enviar feedback";
  }
}

/**
 * Exibe o alerta introdutório utilizado ao iniciar a aplicação.
 * @param {HTMLElement|null} mainContent - Contêiner que recebe o efeito de desfoque.
 */
function showStartupAlert(mainContent) {
  const title = "Ciência e Fé: Explorando o Mundo Digital Através do Binário";
  const message = `Este conversor é uma ferramenta educativa desenvolvida para demonstrar, de forma simples e intuitiva, como os computadores interpretam e processam informações através do sistema binário. Com ele, os usuários podem visualizar como textos comuns são convertidos em sequências de zeros e uns, facilitando a compreensão do funcionamento dos sistemas digitais.
Este é um protótipo em desenvolvimento e pode conter bugs. A iniciativa busca promover o aprendizado sobre tecnologia e seus princípios, tornando o conhecimento acessível a todos.`;

  showAlert({
    title,
    text: message,
    icon: "info",
    confirmButtonText: "Entendido!",
    shouldBlur: true,
    target: mainContent,
    backdrop: "rgba(0,0,0,0.5)",
    width: "70%",
  });
}

/**
 * Cria o controlador do contador animado de caracteres convertidos.
 * @param {HTMLElement|null} container - Elemento raiz do contador.
 * @returns {{update(value: number): void}} Controlador com API de atualização.
 */
function createAnimatedBinaryCounter(container) {
  if (!container) {
    return {
      update() {},
    };
  }

  const binaryEl = container.querySelector("[data-counter-binary]");
  const decimalEl = container.querySelector("[data-counter-decimal]");
  const srEl = container.querySelector("[data-counter-sr]");
  const reduceMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener() {}, removeEventListener() {}, addListener() {} };
  let prefersReducedMotion = Boolean(reduceMotionQuery.matches);
  let currentValue = Number.parseInt(container.dataset.counterValue || "0", 10) || 0;
  let pendingTimeoutId = null;

  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener("change", (event) => {
      prefersReducedMotion = event.matches;
    });
  } else if (reduceMotionQuery.addListener) {
    reduceMotionQuery.addListener((event) => {
      prefersReducedMotion = event.matches;
    });
  }

  const formatBinary = (value) => {
    const safeValue = Math.max(0, Math.floor(value));
    const binaryString = safeValue.toString(2);
    const paddedLength = Math.max(4, Math.ceil(binaryString.length / 4) * 4);
    const paddedBinary = binaryString.padStart(paddedLength, "0");
    return paddedBinary.replace(/(.{4})/g, "$1 ").trim();
  };

  const render = (value) => {
    const safeValue = Math.max(0, Math.floor(value));

    if (binaryEl) {
      binaryEl.textContent = `${formatBinary(safeValue)}\u2082`;
    }

    if (decimalEl) {
      decimalEl.textContent = `(${safeValue})`;
    }

    if (srEl) {
      const label = safeValue === 1 ? "caractere convertido" : "caracteres convertidos";
      srEl.textContent = `${safeValue} ${label}`;
    }

    container.dataset.counterValue = String(safeValue);
  };

  const buildAnimationFrames = (start, target) => {
    if (start === target) {
      return [];
    }

    const frames = [];
    const direction = target > start ? 1 : -1;
    let value = start;
    let step = 1;

    while (value !== target && frames.length < 12) {
      value += direction * step;

      if ((direction > 0 && value > target) || (direction < 0 && value < target)) {
        value = target;
      }

      frames.push(value);
      const remaining = Math.abs(target - value);

      if (remaining === 0) {
        break;
      }

      step = Math.min(step * 2, remaining);
    }

    if (frames[frames.length - 1] !== target) {
      frames.push(target);
    }

    return frames;
  };

  const stopAnimation = () => {
    if (pendingTimeoutId) {
      window.clearTimeout(pendingTimeoutId);
      pendingTimeoutId = null;
    }

    container.classList.remove("conversion-stats--counting");
  };

  const playFrames = (frames) => {
    if (!frames.length) {
      stopAnimation();
      return;
    }

    const interval = Math.max(48, 260 / frames.length);
    let frameIndex = 0;

    const tick = () => {
      currentValue = frames[frameIndex];
      render(currentValue);
      frameIndex += 1;

      if (frameIndex < frames.length) {
        pendingTimeoutId = window.setTimeout(tick, interval);
      } else {
        pendingTimeoutId = window.setTimeout(() => {
          container.classList.remove("conversion-stats--counting");
          pendingTimeoutId = null;
        }, 140);
      }
    };

    tick();
  };

  render(currentValue);

  return {
    update(nextValue) {
      const numericValue = Number(nextValue);
      const targetValue = Number.isFinite(numericValue) ? Math.max(0, Math.floor(numericValue)) : 0;

      if (prefersReducedMotion) {
        stopAnimation();
        currentValue = targetValue;
        render(currentValue);
        return;
      }

      if (targetValue === currentValue) {
        render(currentValue);
        return;
      }

      stopAnimation();
      container.classList.add("conversion-stats--counting");
      const frames = buildAnimationFrames(currentValue, targetValue);
      playFrames(frames);
    },
  };
}

/**
 * Configura a sincronização entre os campos de texto e binário.
 * @param {{binaryInput: HTMLTextAreaElement|null, textInput: HTMLTextAreaElement|null, counterController?: {update(value: number): void}}} elements - Elementos de DOM relevantes.
 */
function setupConverters({ binaryInput, textInput, counterController = { update() {} } }) {
  if (!binaryInput || !textInput) {
    return;
  }

  binaryInput.addEventListener("input", (event) => {
    const convertedText = binaryToText(event.target.value);
    textInput.value = convertedText;
    counterController.update(convertedText.length);
  });

  textInput.addEventListener("input", (event) => {
    const value = event.target.value;
    binaryInput.value = textToBinary(value);
    counterController.update(value.length);
  });

  counterController.update(textInput.value.length);
}

/**
 * Adiciona validação ao campo binário para impedir caracteres inválidos.
 * @param {{binaryInput: HTMLTextAreaElement|null}} elements - Elementos de DOM relevantes.
 */
function setupBinaryValidation({ binaryInput }) {
  if (!binaryInput) {
    return;
  }

  binaryInput.addEventListener("keypress", (event) => {
    if (!["0", "1", " "].includes(event.key)) {
      event.preventDefault();
      alert("Apenas 0, 1 e espaços são permitidos!");
    }
  });
}

/**
 * Monta a lista dinâmica do dicionário com base na pesquisa do usuário.
 * @param {{dictionaryEl: HTMLElement|null, dictionarySearch: HTMLInputElement|null, textInput: HTMLTextAreaElement|null, binaryInput: HTMLTextAreaElement|null, counterController?: {update(value: number): void}}} elements - Elementos de DOM relevantes.
 */
function setupDictionary({
  dictionaryEl,
  dictionarySearch,
  textInput,
  binaryInput,
  counterController = { update() {} },
}) {
  if (!dictionaryEl || !dictionarySearch || !textInput || !binaryInput) {
    return;
  }

  const renderDictionary = () => {
    const query = dictionarySearch.value.toLowerCase();
    const fragment = document.createDocumentFragment();

    Object.entries(dictionary)
      .filter(([character]) => character.toLowerCase().includes(query))
      .forEach(([character, binary]) => {
        fragment.appendChild(
          createDictionaryButton(character, binary, textInput, binaryInput, counterController),
        );
      });

    dictionaryEl.innerHTML = "";
    dictionaryEl.appendChild(fragment);
  };

  dictionarySearch.addEventListener("input", renderDictionary);
  renderDictionary();
}

/**
 * Cria um botão representando uma entrada do dicionário.
 * @param {string} character - Caractere exibido.
 * @param {string} binary - Representação binária.
 * @param {HTMLTextAreaElement} textInput - Área de texto que recebe o caractere.
 * @param {HTMLTextAreaElement} binaryInput - Área de texto que recebe o binário convertido.
 * @param {{update(value: number): void}} counterController - Controlador do contador animado.
 * @returns {HTMLButtonElement} Botão configurado.
 */
function createDictionaryButton(
  character,
  binary,
  textInput,
  binaryInput,
  counterController = { update() {} },
) {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "fs-4 fw-bold text-center btn-custom-secondary list-group-item list-group-item-action";
  button.innerHTML = `${character} &nbsp;&nbsp;⇒&nbsp;&nbsp; ${binary}`;
  button.addEventListener("click", () => {
    textInput.value += character;
    binaryInput.value = textToBinary(textInput.value);
    counterController.update(textInput.value.length);
  });

  return button;
}

/**
 * Preenche o painel de frases rápidas com botões que inserem textos pré-definidos.
 * @param {{phrasesEl: HTMLElement|null, textInput: HTMLTextAreaElement|null, binaryInput: HTMLTextAreaElement|null, counterController?: {update(value: number): void}}} elements - Elementos de DOM relevantes.
 */
function populateQuickPhrases({ phrasesEl, textInput, binaryInput, counterController = { update() {} } }) {
  if (!phrasesEl || !textInput || !binaryInput) {
    return;
  }

  const fragment = document.createDocumentFragment();

  phrases.forEach((phrase) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "list-group-item list-group-item-action btn-custom-secondary text-center fw-bold fs-4";
    button.textContent = phrase;
    button.addEventListener("click", () => {
      textInput.value += (textInput.value ? " " : "") + phrase;
      binaryInput.value = textToBinary(textInput.value);
      counterController.update(textInput.value.length);
    });

    fragment.appendChild(button);
  });

  phrasesEl.innerHTML = "";
  phrasesEl.appendChild(fragment);
}

/**
 * Preenche a lista de frases bíblicas.
 * @param {{biblicalPhrasesContainer: HTMLElement|null}} elements - Elementos de DOM relevantes.
 */
function populateBiblicalPhrases({ biblicalPhrasesContainer }) {
  if (!biblicalPhrasesContainer) {
    return;
  }

  const fragment = document.createDocumentFragment();

  biblicalPhrases.forEach((phrase) => {
    const listItem = document.createElement("li");
    listItem.className = "list-group-item";
    listItem.textContent = phrase;
    fragment.appendChild(listItem);
  });

  biblicalPhrasesContainer.innerHTML = "";
  biblicalPhrasesContainer.appendChild(fragment);
}

/**
 * Define o comportamento do botão limpar, incluindo o estado temporário de carregamento.
 * @param {{clearButton: HTMLButtonElement|null, textInput: HTMLTextAreaElement|null, binaryInput: HTMLTextAreaElement|null, counterController?: {update(value: number): void}}} elements - Elementos de DOM relevantes.
 */
function setupClearButton({ clearButton, textInput, binaryInput, counterController = { update() {} } }) {
  if (!clearButton || !textInput || !binaryInput) {
    return;
  }

  const defaultContent = clearButton.innerHTML;

  clearButton.addEventListener("click", () => {
    textInput.value = "";
    binaryInput.value = "";
    counterController.update(0);

    clearButton.classList.add("btn-success");
    clearButton.textContent = "Limpando...";

    setTimeout(() => {
      clearButton.classList.remove("btn-success");
      clearButton.innerHTML = defaultContent;
    }, 300);
  });
}

/**
 * Remove a animação pulsante após o primeiro clique no botão de destaque.
 * @param {{pulseButton: HTMLButtonElement|null}} elements - Elementos de DOM relevantes.
 */
function setupPulseButton({ pulseButton }) {
  if (!pulseButton) {
    return;
  }

  pulseButton.addEventListener("click", () => {
    pulseButton.classList.remove("btn-pulsante");
  });
}

/**
 * Função de apoio ao SweetAlert2 que exibe um alerta com desfoque opcional.
 * @param {{title: string, text: string, icon?: import("sweetalert2").SweetAlertIcon, confirmButtonText?: string, shouldBlur?: boolean, target?: HTMLElement|null, backdrop?: string, width?: string}} config - Configuração do modal.
 * @returns {Promise<import("sweetalert2").SweetAlertResult<any>>} Promessa do SweetAlert2.
 */
function showAlert(config) {
  const {
    title,
    text,
    icon = "info",
    confirmButtonText = "Ok!",
    shouldBlur = false,
    target = null,
    backdrop,
    width,
  } = config;

  const swalOptions = {
    title,
    text,
    icon,
    allowOutsideClick: false,
    confirmButtonText,
  };

  if (backdrop) {
    swalOptions.backdrop = backdrop;
  }

  if (width) {
    swalOptions.width = width;
  }

  if (shouldBlur && target) {
    target.classList.add("blurred");
  }

  return Swal.fire(swalOptions).finally(() => {
    if (shouldBlur && target) {
      target.classList.remove("blurred");
    }
  });
}
