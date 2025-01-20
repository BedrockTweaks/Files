import { join, dirname } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";

/**
 * @name createFile
 * @param {string | object} content - The content to write to the file. 
 *   - If a string is provided, it is written directly.
 *   - If an object is provided, it is converted into a formatted JSON string.
 * @param {string} path - The relative file path (within the packs directory where resource pack or behavior pack folder exists) in which the file needs to be created.
 * @param {string} ROOT_DIR - The root directory in which the instance of Regolith is running.
 * @remarks Creates a file with the specified content at the specified path in the Regolith export directory.
 * 
 * @throws {TypeError} If "content" parameter is not a string or an object.
 * @throws {TypeError} If "path" parameter is not a string.
 * @throws {TypeError} If "ROOT_DIR" parameter is not a string.
 * @throws {Error} If a file already exists at the target path.
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
