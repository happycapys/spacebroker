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
          image: item.display_image_url || item.image_url || item.image || "",
          url: item.opensea_url || `https://opensea.io/item/robinhood/${collectionContract}/${id}`,
        }];
      }));
      cursor = String(payload.next ?? "");
      if (!cursor) break;
    }

    return json(200, { nfts, source: "opensea" });
  } catch (error) {
    return json(502, { error: "OpenSea wallet scan unavailable", detail: error instanceof Error ? error.message : "Unknown error" });
  }
};
