export default {
	"**/*.{js,jsx,ts,tsx,mjs,cjs}": ["pnpm eslint --fix --"],

	"**/*.{json,md,html,css,scss,js,jsx,ts,tsx,mjs,cjs,yaml,yml}": ["pnpm prettier --write --ignore-unknown --log-level warn --"],
};