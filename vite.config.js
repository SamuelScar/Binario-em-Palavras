export default {
  root: "public", // 🔹 Mantém a pasta "public" como raiz do projeto
  build: {
    outDir: "../dist", // 🔹 Salva a build fora de "public/", diretamente na raiz do projeto
    emptyOutDir: true, // 🔹 Apaga arquivos antigos antes de criar novos
  },
  publicDir: "../public", // 🔹 Mantém os arquivos estáticos de "public/" acessíveis
  server: {
    watch: {
      usePolling: true,
    },
    open: true,
  },
};
