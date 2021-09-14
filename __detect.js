import { extension } from "./stuff.js";

/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`sass` is installed",
		async detector({ folderInfo }) {
			return "sass" in folderInfo.allDependencies;
		},
	},
	{
		description: "`svelte-preprocess` is set up for SCSS in `svelte.config.js`",
		async detector({ readFile }) {
			/** @param {string} text */
			const preprocessIsProbablySetup = (text) => {
				if (!text.includes("svelte-preprocess")) return false;
				if (!text.includes("preprocess:")) return false;
				if (!text.includes("scss")) return false;
				if (!text.includes("prependData")) return false;

				return true;
			};
			
			const js = await readFile({ path: "/svelte.config.js" });
			const cjs = await readFile({ path: "/svelte.config.cjs" });

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
		async detector({ readFile }) {
			/** @param {string} text */
			const preprocessIsProbablySetup = (text) => {
				if (!text.includes("additionalData")) return false;
				if (!text.includes("@import")) return false;
				if (!text.includes("src/variables.scss")) return false;

				return true;
			};

			const js = await readFile({ path: "/svelte.config.js" });
			const cjs = await readFile({ path: "/svelte.config.cjs" });
			const vite = await readFile({ path: "/vite.config.js" });

			if (preprocessIsProbablySetup(js.text)) return true;
			if (preprocessIsProbablySetup(cjs.text)) return true;
			if (preprocessIsProbablySetup(vite.text)) return true;

			return false;
		},
	},
	{
		description: "The main file (`src/routes/__layout.svelte` for SvelteKit, `src/main.js` or `src/main.ts` for Vite) imports `src/app.scss`",
		async detector({ folderInfo, readFile }) {
			if (folderInfo.kit) {
				const { text } = await readFile({ path: "/src/routes/__layout.svelte" });

				return text.includes(`../app.${extension}`);
			}

			const ts = await readFile({ path: "/src/main.ts" });
			if (ts.exists) return ts.text.includes(`./app.${extension}`);

			const js = await readFile({ path: "/src/main.js" });
			return js.text.includes(`./app.${extension}`);
		},
	},
];
