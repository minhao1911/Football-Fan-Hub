import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss({ optimize: false })],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-query"],
    preserveSymlinks: false,
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
        warn(warning);
      },
    },
  },
  server: {
    port: 5001,
    host: "0.0.0.0",
  },
  optimizeDeps: {
    include: ["@tanstack/react-query", "react", "react-dom"],
  },
  define: {
    "import.meta.env.BASE_URL": JSON.stringify("./"),
    "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_CLERK_PUBLISHABLE_KEY ?? "",
    ),
    "import.meta.env.VITE_CLERK_PROXY_URL": JSON.stringify(
      process.env.VITE_CLERK_PROXY_URL ?? "",
    ),
  },
});
