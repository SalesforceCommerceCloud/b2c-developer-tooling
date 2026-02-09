import fs from "fs";
import path from "path";

const extRoot = process.cwd(); // run from packages/b2c-vs-extension
const sdkPkgJsonSrc = path.resolve(extRoot, "..", "b2c-tooling-sdk", "package.json");

const sdkPkgJsonDest = path.resolve(
  extRoot,
  "node_modules",
  "@salesforce",
  "b2c-tooling-sdk",
  "package.json"
);

fs.mkdirSync(path.dirname(sdkPkgJsonDest), { recursive: true });
fs.copyFileSync(sdkPkgJsonSrc, sdkPkgJsonDest);

console.log("Copied:", sdkPkgJsonDest);
