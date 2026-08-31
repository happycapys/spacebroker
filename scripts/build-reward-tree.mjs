import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { concatHex, encodeAbiParameters, getAddress, keccak256 } from "viem";

const [inputArg, outputArg = "public/season-1-rewards.json"] = process.argv.slice(2);

if (!inputArg) {
  console.error("Usage: node scripts/build-reward-tree.mjs <cumulative-entitlements.json> [output.json]");
  process.exit(1);
}

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);
const payload = JSON.parse(await readFile(inputPath, "utf8"));
const entries = Array.isArray(payload) ? payload : payload.entitlements;

if (!Array.isArray(entries) || entries.length === 0) {
  throw new Error("The entitlement file must contain a non-empty array");
}

const normalized = entries.map((entry) => {
  const account = getAddress(entry.account);
  const cumulativeAmount = BigInt(entry.cumulativeAmount);
  if (cumulativeAmount < 0n) throw new Error(`Negative entitlement for ${account}`);
  const encoded = encodeAbiParameters(
    [{ type: "address" }, { type: "uint256" }],
    [account, cumulativeAmount],
  );
  const leaf = keccak256(concatHex([keccak256(encoded)]));
  return { account, cumulativeAmount, leaf };
});

const accounts = new Set(normalized.map((entry) => entry.account.toLowerCase()));
if (accounts.size !== normalized.length) throw new Error("Each account may appear only once");

normalized.sort((a, b) => a.leaf.localeCompare(b.leaf));

const layers = [normalized.map((entry) => entry.leaf)];
while (layers.at(-1).length > 1) {
  const current = layers.at(-1);
  const next = [];
  for (let index = 0; index < current.length; index += 2) {
    const left = current[index];
    const right = current[index + 1];
    if (!right) {
      next.push(left);
      continue;
    }
    next.push(left <= right ? keccak256(concatHex([left, right])) : keccak256(concatHex([right, left])));
  }
  layers.push(next);
}

const proofFor = (leafIndex) => {
  const proof = [];
  let index = leafIndex;
  for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex += 1) {
    const layer = layers[layerIndex];
    const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
    if (siblingIndex < layer.length) proof.push(layer[siblingIndex]);
    index = Math.floor(index / 2);
  }
  return proof;
};

const totalAllocation = normalized.reduce((sum, entry) => sum + entry.cumulativeAmount, 0n);
const output = {
  generatedAt: new Date().toISOString(),
  merkleRoot: layers.at(-1)[0],
  totalAllocation: totalAllocation.toString(),
  claims: Object.fromEntries(normalized.map((entry, index) => [entry.account.toLowerCase(), {
    account: entry.account,
    cumulativeAmount: entry.cumulativeAmount.toString(),
    proof: proofFor(index),
  }])),
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  output: outputPath,
  accounts: normalized.length,
  merkleRoot: output.merkleRoot,
  totalAllocation: output.totalAllocation,
}, null, 2));
