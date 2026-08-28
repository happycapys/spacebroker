const collectionContract = "0xea35558af012ab6e75f72b7ec946970982587af6";

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "private, max-age=30",
    "access-control-allow-origin": "*",
  },
  body: JSON.stringify(body),
});

const metadataUrl = (value = "") => value.startsWith("ipfs://")
  ? `https://${value.slice(7).split("/")[0]}.ipfs.w3s.link/${value.slice(7).split("/").slice(1).join("/")}`.replace(/\/$/, "")
  : value;

const refreshMetadata = async (nft) => {
  if (!nft.metadataUrl) return nft;
  try {
    if (nft.metadataUrl.startsWith("data:application/json;base64,")) {
      const metadata = JSON.parse(Buffer.from(nft.metadataUrl.split(",")[1], "base64").toString("utf8"));
      return { ...nft, name: metadata.name || nft.name, image: metadata.image || metadata.image_url || nft.image };
    }
    const response = await fetch(metadataUrl(nft.metadataUrl), {
      headers: { accept: "application/json", "cache-control": "no-cache" },
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) return nft;
    const metadata = await response.json();
    return { ...nft, name: metadata.name || nft.name, image: metadata.image || metadata.image_url || nft.image };
  } catch { return nft; }
};

export const handler = async (event) => {
  const wallet = String(event.queryStringParameters?.wallet ?? "").trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) return json(400, { error: "Invalid wallet address" });

  const apiKey = process.env.OPENSEA_API_KEY;
  if (!apiKey) return json(503, { error: "OpenSea connection is not configured" });

  try {
    const nfts = [];
    let cursor = "";
    for (let page = 0; page < 15; page += 1) {
      const params = new URLSearchParams({ collection: "spacebrokers", limit: "200" });
      if (cursor) params.set("next", cursor);
      const response = await fetch(`https://api.opensea.io/api/v2/chain/robinhood/account/${wallet}/nfts?${params}`, {
        headers: { accept: "application/json", "x-api-key": apiKey },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`OpenSea returned ${response.status}`);
      const payload = await response.json();
      const items = payload.nfts ?? [];
      nfts.push(...items.flatMap((item) => {
        const contract = String(item.contract ?? item.contract_address ?? "").toLowerCase();
        if (contract && contract !== collectionContract) return [];
        const id = String(item.identifier ?? item.token_id ?? "");
        if (!id) return [];
        return [{
          id,
          name: item.name || `Space Broker #${id}`,
          image: item.image_url || item.display_image_url || item.image || "",
          metadataUrl: item.metadata_url || item.metadata?.url || "",
          url: item.opensea_url || `https://opensea.io/item/robinhood/${collectionContract}/${id}`,
        }];
      }));
      cursor = String(payload.next ?? "");
      if (!cursor) break;
    }

    const imageCounts = nfts.reduce((counts, nft) => {
      if (nft.image) counts.set(nft.image, (counts.get(nft.image) ?? 0) + 1);
      return counts;
    }, new Map());
    const refreshed = await Promise.all(nfts.map((nft) => !nft.image || (imageCounts.get(nft.image) ?? 0) > 2 ? refreshMetadata(nft) : nft));
    return json(200, {
      nfts: refreshed.map((nft) => ({ id: nft.id, name: nft.name, image: nft.image, url: nft.url })),
      source: "opensea-current-metadata",
    });
  } catch (error) {
    return json(502, { error: "OpenSea wallet scan unavailable", detail: error instanceof Error ? error.message : "Unknown error" });
  }
};
