import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [["list"], ["html", { open: "never" }]],
	use: {
		baseURL: "http://localhost:4321", // Use Astro dev server
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: [
		{
			command: "pnpm --filter web dev",
			url: "http://localhost:4321",
			cwd: "../../",
			reuseExistingServer: true,
		},
		{
			command: "bash ./seed_db_playwright.sh",
			port: 8080,
			cwd: "../../",
			reuseExistingServer: true,
		},
	],
});
