import { join, dirname } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";

/**
 * @name createFiles
 * @param {string | object} content - The template code of the files which have to be generated. It can be a string or an object.
 * @param {string} path - The path in which the files need to be generated.
 * @param {string} ROOT_DIR - The root directory of the instance of regolith running.
 * @remarks Creates multiple files using the content as the template code in the specified path and the ROOT_DIR.
 */
export const createFiles = (content, path, ROOT_DIR) => {
	let output;

	if (typeof content === "string") {
		output = content;
	} else {
		output = JSON.stringify(content, null, 4);
	}

	const outputPath = join(ROOT_DIR, ".regolith", "tmp", path);

	if (existsSync(outputPath)) {
		console.error(`❌ This file already exists: ${path}`);

		return;
	}

	const outputDirectory = dirname(outputPath);

	mkdirSync(outputDirectory, { recursive: true });
	writeFileSync(outputPath, output, { flag: "w" });
};
