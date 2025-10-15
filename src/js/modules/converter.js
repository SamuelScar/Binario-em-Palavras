/**
 * Utilidades para converter entre texto legível e cadeias binárias.
 * Todas as funções são puras e esperam que o dicionário seja fornecido pelo chamador.
 */

const reverseDictionaryCache = new WeakMap();

/**
 * Constrói (ou recupera do cache) o dicionário invertido no qual os binários
 * apontam novamente para os caracteres originais.
 * @param {Record<string, string>} dictionary - Mapa de caracteres para cadeias binárias.
 * @returns {Record<string, string>} Dicionário invertido.
 */
function getReverseDictionary(dictionary) {
  if (!reverseDictionaryCache.has(dictionary)) {
    const reversed = Object.fromEntries(
      Object.entries(dictionary).map(([character, binary]) => [binary, character]),
    );
    reverseDictionaryCache.set(dictionary, reversed);
  }

  return reverseDictionaryCache.get(dictionary);
}

/**
 * Converte texto comum em uma sequência binária usando o dicionário fornecido.
 * Caracteres desconhecidos são ignorados para manter o comportamento anterior.
 * @param {string} text - Texto a ser convertido.
 * @param {Record<string, string>} dictionary - Mapa de caracteres para cadeias binárias.
 * @returns {string} Cadeia de binários separados por espaços.
 */
export function textToBinary(text, dictionary) {
  return text
    .split("")
    .map((character) => dictionary[character] || "")
    .filter(Boolean)
    .join(" ");
}

/**
 * Converte uma sequência binária de volta em texto usando o dicionário fornecido.
 * Sequências não reconhecidas são ignoradas.
 * @param {string} binary - Cadeia binária separada por espaços.
 * @param {Record<string, string>} dictionary - Mapa de caracteres para cadeias binárias.
 * @returns {string} Texto decodificado.
 */
export function binaryToText(binary, dictionary) {
  const reversedDictionary = getReverseDictionary(dictionary);

  return binary
    .trim()
    .split(/\s+/)
    .map((binaryChunk) => reversedDictionary[binaryChunk] || "")
    .join("");
}
