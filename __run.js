import { Comment } from "postcss";
import { setupStyleLanguage, updateViteConfig } from "../../adder-tools.js";
import { setDefault, setPropertyValue } from "../../ast-tools.js";
import { extension, stylesHint, variablesHint } from "./stuff.js";

/** @type {import("../..").AdderRun<import("./__info.js").Options>} */
export const run = async ({ folderInfo, install, updateCss, updateJavaScript, updateSvelte }) => {
	const importVariables = '@use "src/variables.scss" as *;';

	await setupStyleLanguage({
		extension,
		folderInfo,
		mutateSveltePreprocessArgs() {},
		stylesHint,
		updateCss,
		updateJavaScript,
		updateSvelte,
	});

	await updateViteConfig({
		mutateViteConfig(viteConfig) {
			const cssConfigObject = setDefault({
				object: viteConfig,
				default: {
					type: "ObjectExpression",
					properties: [],
				},
				property: "css",
			});

			if (cssConfigObject.type !== "ObjectExpression") throw new Error("css in Vite config must be an object");

			const preprocessorOptionsConfigObject = setDefault({
				object: cssConfigObject,
				default: {
					type: "ObjectExpression",
					properties: [],
				},
				property: "preprocessorOptions",
			});

			if (preprocessorOptionsConfigObject.type !== "ObjectExpression") throw new Error("preprocessorOptions in css in Vite config must be an object");

			const scssConfigObject = setDefault({
				object: preprocessorOptionsConfigObject,
				default: {
					type: "ObjectExpression",
					properties: [],
				},
				property: "scss",
			});

			if (scssConfigObject.type !== "ObjectExpression") throw new Error("scss in preprocessorOptions in css in Vite config must be an object");

			setPropertyValue({
				object: scssConfigObject,
				property: "additionalData",
				value: {
					type: "Literal",
					value: importVariables,
				},
			});
		},
		updateJavaScript,
		folderInfo,
	});

	await updateCss({
		path: `/src/variables.${extension}`,
		async style({ postcss }) {
			postcss.prepend(
				new Comment({
					text: variablesHint,
				}),
			);

			return {
				postcss,
			};
		},
	});

	await install({ package: "sass" });

	if (!folderInfo.kit) await install({ package: "@sveltejs/vite-plugin-svelte" });
};
