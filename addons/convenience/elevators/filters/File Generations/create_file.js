import { join, dirname } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";

/**
 * @name createFile
 * @param {string | object} content - The template code of the file which have to be generated. It can be a string or an object.
 * @param {string} path - The path in which the file need to be generated.
 * @param {string} ROOT_DIR - The root directory of the instance of regolith running.
 * @remarks Creates a file using the content as the template code in the specified path and the ROOT_DIR.
 */
export const createFile = (content, path, ROOT_DIR) => {
	const typeofContent = typeof content;
	const typeofPath = typeof path;
	const typeofROOT_DIR = typeof ROOT_DIR;

	let output;

	if (typeofContent === "string") {
		output = content;
	} else if (typeofContent === "object") {
		output = JSON.stringify(content, null, 4);
	} else {
		throw new TypeError(`❌ Expected type "string" or "object" in content parameter, but received ${typeofContent}`);
	}

	if (typeofPath !== "string") {
		throw new TypeError(`❌ Expected type "string" in path parameter, but received ${typeofPath}`);
	}
	if (typeofROOT_DIR !== "string") {
		throw new TypeError(`❌ Expected type "string" in ROOT_DIR parameter, but received ${typeofROOT_DIR}`);
	}

	const outputPath = join(ROOT_DIR, ".regolith", "tmp", path);

	if (existsSync(outputPath)) {
		throw new Error(`❌ This file already exists: ${path}`);
	}

	const outputDirectory = dirname(outputPath);

	mkdirSync(outputDirectory, { recursive: true });
	writeFileSync(outputPath, output, { flag: "w" });
};
