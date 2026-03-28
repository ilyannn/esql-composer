import { gzipSync } from "node:zlib";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BUILD_DIR = "build";
const ASSETS_DIR = join(BUILD_DIR, "assets");
const INDEX_HTML_PATH = join(BUILD_DIR, "index.html");

const INITIAL_JS_BUDGET = {
  raw: 1100 * 1024,
  gzip: 350 * 1024,
};

const INITIAL_CSS_BUDGET = {
  raw: 10 * 1024,
  gzip: 4 * 1024,
};

const CHUNK_BUDGETS = {
  index: { raw: 100 * 1024, gzip: 35 * 1024 },
  "react-vendor": { raw: 180 * 1024, gzip: 60 * 1024 },
  chakra: { raw: 450 * 1024, gzip: 150 * 1024 },
  vendor: { raw: 195 * 1024, gzip: 60 * 1024 },
  bedrock: { raw: 180 * 1024, gzip: 60 * 1024 },
  "data-vendor": { raw: 20 * 1024, gzip: 6 * 1024 },
  WktRenderer: { raw: 6 * 1024, gzip: 3 * 1024 },
};

const formatKiB = (bytes) => `${(bytes / 1024).toFixed(2)} KiB`;

const parseReferencedAssets = (html) => {
  const matches = html.matchAll(
    /(?:src|href)="[^"]*\/assets\/([^"]+\.(?:js|css))"/g,
  );

  return new Set(Array.from(matches, (match) => match[1]));
};

const readAssetInfo = (fileName) => {
  const path = join(ASSETS_DIR, fileName);
  const contents = readFileSync(path);

  return {
    fileName,
    raw: statSync(path).size,
    gzip: gzipSync(contents).length,
    extension: fileName.endsWith(".css") ? "css" : "js",
  };
};

const sumSizes = (assets) =>
  assets.reduce(
    (totals, asset) => ({
      raw: totals.raw + asset.raw,
      gzip: totals.gzip + asset.gzip,
    }),
    { raw: 0, gzip: 0 },
  );

const checkBudget = (label, actual, budget) => {
  const failures = [];

  if (actual.raw > budget.raw) {
    failures.push(
      `${label} raw size ${formatKiB(actual.raw)} exceeds budget ${formatKiB(
        budget.raw,
      )}`,
    );
  }

  if (actual.gzip > budget.gzip) {
    failures.push(
      `${label} gzip size ${formatKiB(actual.gzip)} exceeds budget ${formatKiB(
        budget.gzip,
      )}`,
    );
  }

  return failures;
};

const html = readFileSync(INDEX_HTML_PATH, "utf8");
const referencedAssets = Array.from(parseReferencedAssets(html)).sort();
const assetInfos = referencedAssets.map(readAssetInfo);
const allAssetInfos = readdirSync(ASSETS_DIR)
  .filter((fileName) => /\.(js|css)$/.test(fileName))
  .sort()
  .map(readAssetInfo);

console.log("Bundle budget report");
for (const asset of assetInfos) {
  console.log(
    `- ${asset.fileName}: ${formatKiB(asset.raw)} raw / ${formatKiB(
      asset.gzip,
    )} gzip`,
  );
}

const initialJavaScript = assetInfos.filter((asset) => asset.extension === "js");
const initialCss = assetInfos.filter((asset) => asset.extension === "css");

const failures = [
  ...checkBudget("Initial JS", sumSizes(initialJavaScript), INITIAL_JS_BUDGET),
  ...checkBudget("Initial CSS", sumSizes(initialCss), INITIAL_CSS_BUDGET),
];

for (const [chunkName, budget] of Object.entries(CHUNK_BUDGETS)) {
  const matchingAssets = allAssetInfos
    .filter((asset) => asset.fileName.startsWith(`${chunkName}-`))
    .sort((left, right) => right.raw - left.raw);

  if (matchingAssets.length === 0) {
    failures.push(`Expected chunk "${chunkName}" was not found in build output`);
    continue;
  }

  failures.push(
    ...checkBudget(`Chunk ${chunkName}`, matchingAssets[0], budget),
  );
}

if (failures.length > 0) {
  console.error("\nBundle size check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("\nBundle size check passed.");
