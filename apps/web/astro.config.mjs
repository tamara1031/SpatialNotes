import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	trailingSlash: "always",
	integrations: [react()],
	vite: {
		server: {
			proxy: {
				"/api": {
					target: "http://127.0.0.1:8080",
					changeOrigin: true,
				},
			},
		},
		resolve: {
			alias: {
				// Handle workspace aliases if necessary, but pnpm usually handles it
			},
		},
		// Required for Wasm support in Vite
		build: {
			target: "esnext",
		},
	},
});
