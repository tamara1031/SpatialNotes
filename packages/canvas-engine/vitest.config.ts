import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
	},
	resolve: {
		alias: {
			// canvas-wasm requires a Rust/WASM build step that is not available in
			// the test environment. Redirect the import to a lightweight stub so
			// that all test suites can import canvas-engine modules without error.
			"canvas-wasm": resolve(__dirname, "tests/__stubs__/canvas-wasm.ts"),
		},
	},
});
