import { globalStylesheetScssRelativePath, globalStylesheetScssRelativeVitePath } from "./stuff.js";

/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`sass` is installed",
		async detector({ environment }) {
			return "sass" in environment.dependencies || "sass" in environment.devDependencies;
		},
	},
	{
		description: "`svelte-preprocess` is set up in `svelte.config.js`",
		async detector({ readFile }) {
			const js = await readFile({ path: "/svelte.config.js" });
			const cjs = await readFile({ path: "/svelte.config.cjs" });

			/** @param {string} text */
			const preprocessIsProbablySetup = (text) => {
				if (!text.includes("svelte-preprocess")) return false;
				if (!text.includes("preprocess:")) return false;

				return true;
			};

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
		description: "The main file (`src/routes/__layout.svelte` for SvelteKit, `src/main.js` or `src/main.ts` for Vite) imports `src/app.scss`",
		async detector({ environment, readFile }) {
			if (environment.kit) {
				const { text } = await readFile({ path: "/src/routes/__layout.svelte" });

				return text.includes(globalStylesheetScssRelativePath);
			}

			const ts = await readFile({ path: "/src/main.ts" });
			if (ts.exists) return ts.text.includes(globalStylesheetScssRelativeVitePath);

			const js = await readFile({ path: "/src/main.js" });
			return js.text.includes(globalStylesheetScssRelativeVitePath);
		},
	},
];
