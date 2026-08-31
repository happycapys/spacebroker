const collectionSlug = "spacebrokers";
const collectionContract = "0xea35558af012ab6e75f72b7ec946970982587af6";
const maxTokenId = 2_222;
const oneOfOneIds = new Set([608, 624, 665, 695, 1050, 1452, 1527, 1701, 1728, 2194, 2208]);

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  },
  body: JSON.stringify(body),
});

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const requestOpenSea = async (url, apiKey) => {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const apiResponse = await fetch(url, {
        headers: { accept: "application/json", "x-api-key": apiKey },
        signal: AbortSignal.timeout(8_000),
      });
      if (apiResponse.ok) return apiResponse.json();
      lastError = new Error(`OpenSea returned ${apiResponse.status}`);
      if (apiResponse.status !== 429 && apiResponse.status < 500) break;
    } catch (error) {
      lastError = error;
    }
    await delay(350 * (attempt + 1));
  }
  throw lastError ?? new Error("OpenSea request failed");
};

const readRank = (nft) => {
  const value = nft?.rarity?.rank ?? nft?.rarity_rank ?? nft?.rank;
  const rank = Number(value);
  return Number.isInteger(rank) && rank >= 1 && rank <= maxTokenId ? rank : null;
};

const toRow = (nft, fallbackId) => {
  const tokenId = Number(nft?.identifier ?? nft?.token_id ?? fallbackId);
  if (!Number.isInteger(tokenId) || tokenId < 1 || tokenId > maxTokenId) return null;
  return {
    tokenId,
    rank: readRank(nft),
    designatedOneOfOne: oneOfOneIds.has(tokenId),
  };
};

const listPage = async (cursor, apiKey) => {
  const params = new URLSearchParams({ limit: "200" });
  if (cursor) params.set("next", cursor);
  const payload = await requestOpenSea(
    `https://api.opensea.io/api/v2/collection/${collectionSlug}/nfts?${params}`,
    apiKey,
  );
  return {
    rows: (payload.nfts ?? []).map((nft) => toRow(nft)).filter(Boolean),
    next: String(payload.next ?? ""),
  };
};

const detailBatch = async (ids, apiKey) => {
  const rows = [];
  for (let offset = 0; offset < ids.length; offset += 3) {
    const group = ids.slice(offset, offset + 3);
    const resolved = await Promise.all(group.map(async (tokenId) => {
      const payload = await requestOpenSea(
        `https://api.opensea.io/api/v2/chain/robinhood/contract/${collectionContract}/nfts/${tokenId}`,
        apiKey,
      );
      return toRow(payload.nft ?? payload, tokenId);
    }));
    rows.push(...resolved.filter(Boolean));
    if (offset + 3 < ids.length) await delay(180);
  }
  return rows;
};

export const handler = async (event) => {
  const apiKey = process.env.OPENSEA_API_KEY;
  if (!apiKey) return response(503, { error: "OpenSea connection is not configured on Netlify." });

  try {
    const mode = String(event.queryStringParameters?.mode ?? "list");
    if (mode === "list") {
      const cursor = String(event.queryStringParameters?.cursor ?? "");
      return response(200, await listPage(cursor, apiKey));
    }

    if (mode === "details") {
      const ids = String(event.queryStringParameters?.ids ?? "")
        .split(",")
        .filter(Boolean)
        .map(Number);
      if (ids.length === 0 || ids.length > 12 || ids.some((id) => !Number.isInteger(id) || id < 1 || id > maxTokenId)) {
        return response(400, { error: "Invalid token ID batch." });
      }
      return response(200, { rows: await detailBatch(ids, apiKey) });
    }

    return response(400, { error: "Invalid snapshot mode." });
  } catch (error) {
    return response(502, { error: error instanceof Error ? error.message : "Snapshot request failed." });
  }
};
