import { phrases, dictionary, biblicalPhrases } from "./data/phrases.js";
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../css/themes.css';


// Seleciona os elementos da página
const binaryInput = document.getElementById("binaryInput");
const textInput = document.getElementById("textInput");
const dictionaryEl = document.getElementById("dictionary");
const dictionarySearch = document.getElementById("dictionarySearch");
const phrasesEl = document.getElementById("phrases");
const clearButton = document.getElementById("clearButton");
const biblicalPhrasesContainer = document.getElementById("biblicalPhrasesContainer");
document.addEventListener("DOMContentLoaded", () => {

  let icon = "info";
  let title = "Ciência e Fé: Explorando o Mundo Digital Através do Binário"
  let message = `Este conversor é uma ferramenta educativa desenvolvida para demonstrar, de forma simples e intuitiva, como os computadores interpretam e processam informações através do sistema binário. Com ele, os usuários podem visualizar como textos comuns são convertidos em sequências de zeros e uns, facilitando a compreensão do funcionamento dos sistemas digitais.  
                Este é um protótipo em desenvolvimento e pode conter bugs. A iniciativa busca promover o aprendizado sobre tecnologia e seus princípios, tornando o conhecimento acessível a todos.`;

  showAlert(title, message, icon, true);
  initThemeChanger(); // iniciar o trocador de temas

});


function initThemeChanger(selectId = "theme-selector") {

  const themeSelect = document.getElementById(selectId);

  function clearOldThemeClasses() { // limpar temas
    Array.from(document.body.classList).forEach(theme => {
      if (theme == 'dark' || theme.startsWith('theme-')) {
        document.body.classList.remove(theme);
      }
    });
  }

  function ensureBaseBodyClasses() {
    if (!document.body.classList.contains('bg-custom-page')) {
      document.body.classList.add('bg-custom-page');
    }
    if (!document.body.classList.contains('p-3')) {
      document.body.classList.add('p-3');
    }
  }

  function setTheme(themeValue) {
    
    clearOldThemeClasses();
    if (themeValue && themeValue != 'default') {
      document.body.classList.add(themeValue);
    }

    ensureBaseBodyClasses();

    sessionStorage.setItem('theme', themeValue || 'default');
    if(themeSelect){
      themeSelect.value = themeValue || 'default';
    } 
  }


  const savedTheme = sessionStorage.getItem('theme') || 'default';
  
  setTheme(savedTheme);
  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      setTheme(themeSelect.value);
    });
  }

}


function textToBinary(text) {
  return text
    .split("")
    .map((char) => dictionary[char] || "")
    .join(" ");
}

function binaryToText(binary) {
  const reversedDict = Object.fromEntries(
    Object.entries(dictionary).map(([k, v]) => [v, k])
  );
  return binary
    .split(" ")
    .map((bin) => reversedDict[bin] || "")
    .join("");
}

binaryInput.addEventListener("input", () => {
  textInput.value = binaryToText(binaryInput.value);
});
textInput.addEventListener("input", () => {
  binaryInput.value = textToBinary(textInput.value);
});

[binaryInput, textInput].forEach((input) => {
  input.addEventListener("keypress", (e) => {
    if (input.id === "binaryInput" && !["0", "1", " "].includes(e.key)) {
      e.preventDefault();
      alert("Apenas 0, 1 e espaços são permitidos!");
    }
  });
});

dictionarySearch.addEventListener("input", () => {
  const search = dictionarySearch.value.toLowerCase();
  const filtered = Object.entries(dictionary).filter(([char]) =>
    char.toLowerCase().includes(search)
  );

  dictionaryEl.innerHTML = filtered
    .map(([char, bin]) => 
      `<button type="button" class="fs-4 fw-bold text-center btn-custom-secondary list-group-item list-group-item-action" onclick="addToTextInput('${char}')">${char} &nbsp;&nbsp;⇒&nbsp;&nbsp; ${bin}</button>`
    )
    .join("");
});
dictionarySearch.dispatchEvent(new Event("input"));

window.addToTextInput = function(char) {
  textInput.value += char;
  binaryInput.value = textToBinary(textInput.value);
};

phrases.forEach((phrase) => {
  const li = document.createElement("button");
  li.classList.add("list-group-item", "list-group-item-action", "btn-custom-secondary", "text-center", "fw-bold", "fs-4");
  li.textContent = phrase;

  li.addEventListener("click", () => {
    textInput.value += (textInput.value ? " " : "") + phrase;
    binaryInput.value = textToBinary(textInput.value);
  });

  phrasesEl.appendChild(li);
});

clearButton.addEventListener("click", () => {
  textInput.value = "";
  binaryInput.value = "";

  clearButton.classList.add("btn-success");
  clearButton.textContent = "Limpando...";

  setTimeout(() => {
    const texto = document.createElement("strong");
    const icon = document.createElement("i");
    console.log("aqui");
    debugger
    texto.textContent = "Limpar ";
    icon.classList.add("bi", "bi-stars");

    clearButton.classList.remove("btn-success");
    clearButton.textContent = "";
    clearButton.appendChild(texto);
    clearButton.appendChild(icon);
  }, 300);
});


if (biblicalPhrasesContainer) {
  biblicalPhrasesContainer.innerHTML = "";
  biblicalPhrases.forEach((phrase) => {
    const li = document.createElement("li");
    li.classList.add("list-group-item");
    li.textContent = phrase;
    biblicalPhrasesContainer.appendChild(li);
  });
}

document.querySelector(".btn-pulsante").addEventListener("click", function() {
  this.classList.remove("btn-pulsante");
});

function showAlert(title, text, icon = "info", backgroud = false) {

  if(backgroud){
    mainContent.classList.add("blurred");

    Swal.fire({
      title: title,
      text: text,
      icon: icon,
      allowOutsideClick: false,
      confirmButtonText: "Entendido!",
      backdrop: "rgba(0,0,0,0.5)",
       width: "70%"
    }).then(() => {
      mainContent.classList.remove("blurred");
    });

  }else{
    Swal.fire({
      title: title,
      text: text,
      icon: icon,
      allowOutsideClick: false,
      confirmButtonText: "Ok!",   
    });
  }
}
