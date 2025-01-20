const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const RUN_DIRECTORY = process.cwd();

const DIRECTORIES = [
	path.join(RUN_DIRECTORY, "BP"),
	path.join(RUN_DIRECTORY, "RP")
];
const EXCLUDE_PATHS = [
	path.join(RUN_DIRECTORY, "BP", "scripts", "main.js")
];

const jsFiles = [];

/**
 * @name collectFiles
 * @param {string} directory - The directory in which the files need to be searched.
 * @param {string[]} [excludePaths=[]] - An optional parameter for the file paths to be excluded from being collected.
 * @remarks Collects the files with .js extension and push it to jsFiles array.
 */
const collectFiles = (directory, excludePaths = []) => {
	const files = fs.readdirSync(directory, { withFileTypes: true });

	for (const file of files) {
		const filePath = path.join(directory, file.name);

		if (file.isDirectory()) {
			collectFiles(filePath, EXCLUDE_PATHS);
		} else if (".js" === path.extname(file.name) && !excludePaths.includes(filePath)) {
			jsFiles.push(filePath);
		}
	}
};

/**
 * @name runFile
 * @param {string} filePath - The path of the file which needs to be executed.
 * @returns {Promise<void>} - A Promise that resolves if the file is executed successfully, otherwise rejects if there is an error.
 * @remarks Runs the file in the specified file path.
 */
const runFile = (filePath) => {
	return new Promise((resolve, reject) => {
		const command = `node "${filePath}"`;
		const options = {
			env: { ...process.env, RUN_DIRECTORY }
		};

		exec(command, options, (error) => {
			if (error) {
				console.error(`❌ Failed to run: ${filePath}`);

				reject(error);
			} else {
				resolve();
			}
		});
	});
};

/**
 * @name removeFile
 * @param {string} filePath - The path of the file which needs to be removed.
 * @returns {Promise<void>} - A Promise that resolves if the file is removed successfully, otherwise rejects if there is an error.
 * @remarks Removes the file in the specified file path.
 */
const removeFile = (filePath) => {
	return new Promise((resolve, reject) => {
		fs.unlink(filePath, (error) => {
			if (error) {
				console.error(`❌ Failed to remove: ${filePath}`);

				reject(error);
			} else {
				resolve();
			}
		});
	});
};

(async () => {
	try {
		if (!process.env.ROOT_DIR) {
			throw new Error("❌ This file can only be run by using Regolith");
		}

		for (const directory of DIRECTORIES) {
			if (fs.existsSync(directory)) {
				collectFiles(directory, EXCLUDE_PATHS);
			}
		}

		for (const file of jsFiles) {
			await runFile(file);
			await removeFile(file);
		}
	} catch (error) {
		console.error("❌ Error occurred while running the filter:", error);
	}
})();
