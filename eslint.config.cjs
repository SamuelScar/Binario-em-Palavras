// Configuração Flat do ESLint (v9+), equivalente ao .eslintrc.json adicionado.
// Usa "globals" se estiver instalado; caso contrário, aplica um conjunto mínimo
// de globais para browser/Node para evitar falsos positivos.

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = (() => {
  let browser = {};
  let node = {};
  try {
    // Opcional: instale com `npm i -D globals` para cobrir todos os globais
    // suportados por ESLint de forma automática.
    const globals = require('globals');
    browser = globals.browser;
    node = globals.node;
  } catch {
    // Fallback mínimo (sem dependências): cobre globais comuns usados no projeto.
    browser = {
      window: true,
      document: true,
      navigator: true,
      localStorage: true,
      sessionStorage: true,
      console: true,
      setTimeout: true,
      clearTimeout: true,
      setInterval: true,
      clearInterval: true,
      CustomEvent: true,
      fetch: true,
      Request: true,
      Response: true,
      Headers: true,
      AudioContext: true,
      webkitAudioContext: true,
      performance: true,
      bootstrap: true,
    };
    node = {
      module: true,
      require: true,
      process: true,
      __dirname: true,
      __filename: true,
      console: true,
    };
  }

  return [
    {
      files: ['**/*.js'],
      ignores: ['node_modules/**', 'dist/**', 'build/**', '.vercel/**'],
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        globals: browser,
      },
      rules: {
        'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
        'no-console': 'off',
        eqeqeq: ['warn', 'smart'],
      },
    },
    {
      files: ['api/**/*.js'],
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'script', // CommonJS
        globals: node,
      },
      rules: {},
    },
  ];
})();

module.exports = config;

