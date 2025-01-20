const fs = require("fs");
const path = require("path");
const DIRECTORY = "data/gametests/";

if (!fs.existsSync(DIRECTORY + "extra_files"))
  return console.log("No extra files, skipping step");

/**
 * Source: https://stackoverflow.com/a/22185855/6459649
 * Look ma, it's cp -R.
 * @param {string} src  The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
var copyRecursiveSync = function (src, dest) {
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(function (childItemName) {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

console.log("Copying extra files");
copyRecursiveSync(DIRECTORY + "extra_files", "./");
