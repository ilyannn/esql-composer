import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/esql-composer/",
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("@anthropic-ai/sdk")) {
            return "anthropic";
          }

          if (id.includes("@aws-sdk/client-bedrock-runtime")) {
            return "bedrock";
          }

          if (id.includes("/ol/")) {
            return "openlayers";
          }

          if (id.includes("@chakra-ui") || id.includes("@emotion")) {
            return "chakra";
          }

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("scheduler")
          ) {
            return "react-vendor";
          }

          if (
            id.includes("lodash") ||
            id.includes("moment") ||
            id.includes("axios") ||
            id.includes("js-yaml")
          ) {
            return "data-vendor";
          }

          return "vendor";
        },
      },
    },
  },
});
