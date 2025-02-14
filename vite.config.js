export default {
    root: "public",
    build: {
      outDir: "../dist",
      emptyOutDir: true,
    },
    server: {
      watch: {
        usePolling: true,
      },
      open: true,
    },
  };
  