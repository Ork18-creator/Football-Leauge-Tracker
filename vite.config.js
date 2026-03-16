import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const footballApiToken =
    env.FOOTBALL_DATA_API_KEY ?? env.VITE_FOOTBALL_DATA_API_KEY ?? "";

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __HAS_FOOTBALL_API_TOKEN__: JSON.stringify(Boolean(footballApiToken)),
    },
    server: {
      proxy: {
        "/api/football-data": {
          target: "https://api.football-data.org",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/football-data/u, ""),
          headers: footballApiToken
            ? {
                "X-Auth-Token": footballApiToken,
              }
            : undefined,
        },
      },
    },
  };
});
