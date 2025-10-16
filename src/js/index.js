import { phrases, dictionary, biblicalPhrases } from "./data/phrases.js";
import { initThemeManager } from "./modules/themeManager.js";
import { textToBinary, binaryToText } from "./modules/converter.js";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../css/themes.css";

document.addEventListener("DOMContentLoaded", initializeApplication);

/**
 * Orquestra a inicialização da interface assim que o DOM estiver pronto.
 */
function initializeApplication() {
  const elements = getDomElements();

  initThemeManager();
  showStartupAlert(elements.mainContent);
  setupConverters(elements);
  setupBinaryValidation(elements);
  setupDictionary(elements);
  populateQuickPhrases(elements);
  populateBiblicalPhrases(elements);
  setupClearButton(elements);
  setupPulseButton(elements);
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
  };
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
 * Configura a sincronização entre os campos de texto e binário.
 * @param {{binaryInput: HTMLTextAreaElement|null, textInput: HTMLTextAreaElement|null}} elements - Elementos de DOM relevantes.
 */
function setupConverters({ binaryInput, textInput }) {
  if (!binaryInput || !textInput) {
    return;
  }

  binaryInput.addEventListener("input", (event) => {
    textInput.value = binaryToText(event.target.value);
  });

  textInput.addEventListener("input", (event) => {
    binaryInput.value = textToBinary(event.target.value);
  });
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
 * @param {{dictionaryEl: HTMLElement|null, dictionarySearch: HTMLInputElement|null, textInput: HTMLTextAreaElement|null, binaryInput: HTMLTextAreaElement|null}} elements - Elementos de DOM relevantes.
 */
function setupDictionary({ dictionaryEl, dictionarySearch, textInput, binaryInput }) {
  if (!dictionaryEl || !dictionarySearch || !textInput || !binaryInput) {
    return;
  }

  const renderDictionary = () => {
    const query = dictionarySearch.value.toLowerCase();
    const fragment = document.createDocumentFragment();

    Object.entries(dictionary)
      .filter(([character]) => character.toLowerCase().includes(query))
      .forEach(([character, binary]) => {
        fragment.appendChild(createDictionaryButton(character, binary, textInput, binaryInput));
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
 * @returns {HTMLButtonElement} Botão configurado.
 */
function createDictionaryButton(character, binary, textInput, binaryInput) {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "fs-4 fw-bold text-center btn-custom-secondary list-group-item list-group-item-action";
  button.innerHTML = `${character} &nbsp;&nbsp;⇒&nbsp;&nbsp; ${binary}`;
  button.addEventListener("click", () => {
    textInput.value += character;
    binaryInput.value = textToBinary(textInput.value);
  });

  return button;
}

/**
 * Preenche o painel de frases rápidas com botões que inserem textos pré-definidos.
 * @param {{phrasesEl: HTMLElement|null, textInput: HTMLTextAreaElement|null, binaryInput: HTMLTextAreaElement|null}} elements - Elementos de DOM relevantes.
 */
function populateQuickPhrases({ phrasesEl, textInput, binaryInput }) {
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
 * @param {{clearButton: HTMLButtonElement|null, textInput: HTMLTextAreaElement|null, binaryInput: HTMLTextAreaElement|null}} elements - Elementos de DOM relevantes.
 */
function setupClearButton({ clearButton, textInput, binaryInput }) {
  if (!clearButton || !textInput || !binaryInput) {
    return;
  }

  const defaultContent = clearButton.innerHTML;

  clearButton.addEventListener("click", () => {
    textInput.value = "";
    binaryInput.value = "";

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
