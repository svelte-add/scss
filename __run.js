import { walk } from "estree-walker";
import { Comment } from "postcss";
import { addImport, findImport, getConfigObject, getPreprocessArray, getSveltePreprocessArgs } from "../../ast-tools.js";
import { globalStylesheetCssPath, globalStylesheetCssRelativePath, globalStylesheetCssRelativeVitePath, globalStylesheetScssPath, globalStylesheetScssRelativePath, globalStylesheetScssRelativeVitePath, stylesHint } from "./stuff.js";

/**
 * @param {import("../../ast-io.js").RecastAST} svelteConfigAst
 * @param {boolean} cjs
 * @returns {import("../../ast-io.js").RecastAST}
 */
const updateSvelteConfig = (svelteConfigAst, cjs) => {
	const sveltePreprocessImports = findImport({ cjs, package: "svelte-preprocess", typeScriptEstree: svelteConfigAst });
	let sveltePreprocessImportedAs = cjs ? sveltePreprocessImports.require : sveltePreprocessImports.default;

	// Add a svelte-preprocess import if it's not there
	if (!sveltePreprocessImportedAs) {
		sveltePreprocessImportedAs = "preprocess";
		addImport({ require: sveltePreprocessImportedAs, cjs, default: sveltePreprocessImportedAs, package: "svelte-preprocess", typeScriptEstree: svelteConfigAst });
	}

	const configObject = getConfigObject({ cjs, typeScriptEstree: svelteConfigAst });

	const preprocessArray = getPreprocessArray({ configObject });

	getSveltePreprocessArgs({ preprocessArray, sveltePreprocessImportedAs });

	return svelteConfigAst;
};

/** @type {import("../../index.js").AdderRun<import("./__metadata.js").Options>} */
export const run = async ({ environment, install, updateCss, updateJavaScript, updateSvelte }) => {
	if (environment.packageType === "module")
		await updateJavaScript({
			path: "/svelte.config.js",
			async script({ typeScriptEstree }) {
				return {
					typeScriptEstree: updateSvelteConfig(typeScriptEstree, false),
				};
			},
		});
	else
		await updateJavaScript({
			path: "/svelte.config.cjs",
			async script({ typeScriptEstree }) {
				return {
					typeScriptEstree: updateSvelteConfig(typeScriptEstree, true),
				};
			},
		});

	await updateCss({
		path: globalStylesheetCssPath,
		async style({ postcss: appCss }) {
			await updateCss({
				path: globalStylesheetScssPath,
				async style({ postcss: appScss }) {
					appScss.prepend(appCss);

					appScss.prepend(
						new Comment({
							text: stylesHint,
						})
					);

					return {
						postcss: appScss,
					};
				},
			});

			return {
				exists: false,
			};
		},
	});

	/**
	 * @param {object} param0
	 * @param {import("../../ast-io.js").RecastAST} param0.typeScriptEstree
	 * @param {string[]} param0.inputs
	 * @param {string} param0.output
	 */
	const updateOrAddAppStylesImport = ({ typeScriptEstree, inputs, output }) => {
		/** @type {import("estree").ImportDeclaration | undefined} */
		let appStylesImport;

		walk(typeScriptEstree, {
			enter(node) {
				if (node.type !== "ImportDeclaration") return;

				/** @type {import("estree").ImportDeclaration} */
				// prettier-ignore
				const importDeclaration = (node)

				if (typeof importDeclaration.source.value !== "string") return;

				if (!inputs.includes(importDeclaration.source.value)) return;

				appStylesImport = importDeclaration;
			},
		});

		if (!appStylesImport) {
			appStylesImport = {
				type: "ImportDeclaration",
				source: {
					type: "Literal",
					value: output,
				},
				specifiers: [],
			};
			typeScriptEstree.program.body.unshift(appStylesImport);
		}

		appStylesImport.source.value = output;
	};

	if (environment.kit)
		await updateSvelte({
			path: "/src/routes/__layout.svelte",

			async markup({ posthtml }) {
				const slot = posthtml.some((node) => typeof node !== "string" && typeof node !== "number" && node.tag === "slot");

				if (!slot) posthtml.push("\n", { tag: "slot" });

				return {
					posthtml,
				};
			},

			async script({ lang, typeScriptEstree }) {
				updateOrAddAppStylesImport({
					typeScriptEstree,
					inputs: [globalStylesheetCssRelativePath],
					output: globalStylesheetScssRelativePath,
				});

				return {
					lang,
					typeScriptEstree,
				};
			},
		});
	else {
		await updateJavaScript({
			path: "/src/main.js",
			async script({ exists, typeScriptEstree }) {
				if (!exists) return { exists: false };

				updateOrAddAppStylesImport({
					typeScriptEstree,
					inputs: [globalStylesheetCssRelativeVitePath],
					output: globalStylesheetScssRelativeVitePath,
				});
				return { typeScriptEstree };
			},
		});

		await updateJavaScript({
			path: "/src/main.ts",
			async script({ exists, typeScriptEstree }) {
				if (!exists) return { exists: false };

				updateOrAddAppStylesImport({
					typeScriptEstree,
					inputs: [globalStylesheetCssRelativeVitePath],
					output: globalStylesheetScssRelativeVitePath,
				});
				return { typeScriptEstree };
			},
		});
	}

	await install({ package: "sass" });
	await install({ package: "svelte-preprocess" });
};
