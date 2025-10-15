/**
 * Utilidades para converter entre texto e cadeias binárias utilizando UTF-8.
 * As funções são puras e não dependem de dicionários externos.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const BYTE_REGEX = /^[01]{8}$/;

/**
 * Converte texto para a sequência de bytes UTF-8 representados em binário.
 * @param {string} text - Texto a ser convertido.
 * @returns {string} Cadeia de bytes em binário separados por espaço.
 */
export function textToBinary(text = "") {
  if (!text) {
    return "";
  }

  const bytes = encoder.encode(text);
  return Array.from(bytes, (byte) => byte.toString(2).padStart(8, "0")).join(" ");
}

/**
 * Converte uma sequência de bytes binários (UTF-8) em texto.
 * Bytes que não forem válidos (não 8 dígitos ou contendo caracteres diferentes de 0/1)
 * são ignorados para manter compatibilidade com o comportamento anterior.
 * @param {string} binary - Cadeia de bytes binários separados por espaço.
 * @returns {string} Texto decodificado.
 */
export function binaryToText(binary = "") {
  const cleaned = binary.trim();

  if (!cleaned) {
    return "";
  }

  const bytes = cleaned
    .split(/\s+/)
    .filter((chunk) => BYTE_REGEX.test(chunk))
    .map((chunk) => parseInt(chunk, 2));

  if (!bytes.length) {
    return "";
  }

  return decoder.decode(new Uint8Array(bytes));
}
