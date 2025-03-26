export default {
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  publicDir: "public",
  server: {
    watch: {
      usePolling: true,
    },
    open: true,
  },
};
