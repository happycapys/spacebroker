const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
    "access-control-allow-origin": "*",
  },
  body: JSON.stringify(body),
});

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const formatPrice = (price) => {
  if (!price) return null;
  const decimals = asNumber(price.decimals) ?? 18;
  const raw = asNumber(price.value ?? price.current?.value);
  if (raw === null) return null;
  const value = raw / (10 ** decimals);
  const currency = String(price.currency ?? price.current?.currency ?? "ETH").toUpperCase();
  if (!["ETH", "WETH"].includes(currency)) return null;
  return { value, currency: "ETH", display: `${value.toLocaleString(undefined, { maximumSignificantDigits: 5 })} ETH` };
};

export const handler = async () => {
  const apiKey = process.env.OPENSEA_API_KEY;
  const headers = apiKey ? { accept: "application/json", "x-api-key": apiKey } : { accept: "application/json" };

  try {
    const requests = [
      fetch("https://api.dexscreener.com/token-pairs/v1/ethereum/0x68fa48b1c2fe52b3d776e1953e0e782b5044ce28", { headers: { accept: "application/json" } }),
      apiKey ? fetch("https://api.opensea.io/api/v2/listings/collection/spacebrokers/best?limit=4", { headers }) : Promise.resolve(null),
      apiKey ? fetch("https://api.opensea.io/api/v2/collections/spacebrokers/stats", { headers }) : Promise.resolve(null),
    ];
    const [dexResponse, listingsResponse, statsResponse] = await Promise.all(requests);
    const pairs = dexResponse?.ok ? await dexResponse.json() : [];
    const pair = (Array.isArray(pairs) ? pairs : [])
      .filter((item) => ["ETH", "WETH"].includes(String(item.quoteToken?.symbol ?? "").toUpperCase()))
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];

    const listingsData = listingsResponse?.ok ? await listingsResponse.json() : {};
    const listings = listingsData.listings ?? listingsData.orders ?? [];
    const lowestListing = listings[0] ?? null;
    let floor = formatPrice(lowestListing?.price);

    const statsData = statsResponse?.ok ? await statsResponse.json() : {};
    const total = statsData.total ?? statsData.stats ?? {};
    if (!floor) {
      const value = asNumber(total.floor_price ?? total.floorPrice);
      if (value !== null) {
        const currency = String(total.floor_price_symbol ?? total.floorPriceSymbol ?? "ETH").toUpperCase();
        if (["ETH", "WETH"].includes(currency)) floor = { value, currency: "ETH", display: `${value.toLocaleString(undefined, { maximumSignificantDigits: 5 })} ETH` };
      }
    }

    return json(200, {
      floor,
      spacex: pair ? {
        priceEth: asNumber(pair.priceNative),
        change24h: asNumber(pair.priceChange?.h24),
        liquidityUsd: asNumber(pair.liquidity?.usd),
        symbol: pair.baseToken?.symbol ?? "SPCXx",
        url: pair.url,
      } : null,
      updatedAt: new Date().toISOString(),
      openseaConnected: Boolean(apiKey && (listingsResponse?.ok || statsResponse?.ok)),
    });
  } catch (error) {
    return json(502, { error: "Market telemetry unavailable", detail: error instanceof Error ? error.message : "Unknown error" });
  }
};
