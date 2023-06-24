import { getViteConfigFilePath } from "../../adder-tools.js";
import { extension } from "./stuff.js";

export const name = "SCSS";

export const emoji = "🕶";

export const usageMarkdown = ['You can write SCSS syntax in the `style lang="scss"` blocks in Svelte files.', 'You can write SCSS syntax in the `src/variables.scss` file.\n\n  Variables and mixins written here are automatically available to all other SCSS files and `style lang="scss"` blocks in Svelte files without needing to import this file.', "You can write SCSS syntax in the `src/app.scss` file.\n\n  This is your global stylesheet because it will be active on every page of your site."];

/** @type {import("../..").Gatekeep} */
export const gatekeep = async () => {
	return { able: true };
};

/** @typedef {{}} Options */

/** @type {import("../..").AdderOptions<Options>} */
export const options = {};

/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`sass` is installed",
		async detector({ folderInfo }) {
			return "sass" in folderInfo.allDependencies;
		},
	},
	{
		description: "`vitePreprocess` is set up for SCSS in `svelte.config.js`",
		async detector({ readFile }) {
			/** @param {string} text */
			const preprocessIsProbablySetup = (text) => {
				if (!text.includes("vitePreprocess")) return false;

				return true;
			};

			const js = await readFile({ path: "/svelte.config.js" });
			const cjs = await readFile({ path: "/svelte.config.cjs" });

			if (js.exists) {
				return preprocessIsProbablySetup(js.text);
			} else if (cjs.exists) {
				return preprocessIsProbablySetup(cjs.text);
			}

			return false;
		},
	},
	{
		description: "`src/app.scss` exists",
		async detector({ readFile }) {
			const scss = await readFile({ path: "/src/app.scss" });

			return scss.exists;
		},
	},
	{
		description: "`src/variables.scss` exists",
		async detector({ readFile }) {
			const scss = await readFile({ path: "/src/variables.scss" });

			return scss.exists;
		},
	},
	{
		description: "Vite is set up to automatically import variables.scss",
		async detector({ folderInfo, readFile }) {
			/** @param {string} text */
			const preprocessIsProbablySetup = (text) => {
				if (!text.includes("additionalData")) return false;
				if (!text.includes("@use")) return false;
				if (!text.includes("src/variables.scss")) return false;

				return true;
			};

			const vite = await readFile({ path: `/${getViteConfigFilePath(folderInfo)}` });

			if (preprocessIsProbablySetup(vite.text)) return true;

			return false;
		},
	},
	{
		description: "The main file (`src/routes/+layout.svelte` for SvelteKit, `src/main.js` or `src/main.ts` for Vite) imports `src/app.scss`",
		async detector({ folderInfo, readFile }) {
			if (folderInfo.kit) {
				const { text } = await readFile({ path: "/src/routes/+layout.svelte" });

				return text.includes(`../app.${extension}`);
			}

			const ts = await readFile({ path: "/src/main.ts" });
			if (ts.exists) return ts.text.includes(`./app.${extension}`);

			const js = await readFile({ path: "/src/main.js" });
			return js.text.includes(`./app.${extension}`);
		},
	},
];
