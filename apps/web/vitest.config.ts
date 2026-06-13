import path from "node:path";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		server: {
			deps: {
				inline: ["@mui/material", "@mui/icons-material", "react-transition-group"],
			},
		},
		deps: {
			optimizer: {
				web: {
					include: ["@mui/material", "@mui/icons-material", "react-transition-group"],
				},
			},
		},
		setupFiles: "./vitest.setup.ts",
	},
});
