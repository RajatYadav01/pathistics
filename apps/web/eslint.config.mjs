import globals from "globals";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import base from "@pathistics/eslint-config/base";
import react from "@pathistics/eslint-config/react";

export default defineConfig([
	globalIgnores(["dist", ".turbo", "node_modules"]),
	...base,
	...react,
	{
		files: ["**/*.{ts,tsx}"],
		plugins: {
			"react-refresh": reactRefresh,
		},
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
		rules: {
			"react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
		},
	},
]);
