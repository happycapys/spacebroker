"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (value: string[]) => void) => void;
  removeListener?: (event: string, listener: (value: string[]) => void) => void;
};

declare global {
  interface Window { ethereum?: EthereumProvider; }
}

const links = {
  opensea: "https://opensea.io/collection/spacebrokers",
  explorer: "https://robinhoodchain.blockscout.com/token/0xea35558af012ab6e75f72b7ec946970982587af6",
  x: "https://x.com/spacebrokers_",
  discord: "https://discord.gg/2696H6XJH",
};

const collectionContract = "0xea35558af012ab6e75f72b7ec946970982587af6";
const spacexContract = "0x68fa48b1c2fe52b3d776e1953e0e782b5044ce28";
const blockscoutApi = "https://robinhoodchain.blockscout.com/api/v2";
const robinhoodRpc = "https://rpc.mainnet.chain.robinhood.com";

const floorListings = [
  { id: "766", price: "0.001 ETH", image: "https://i2c.seadn.io/robinhood/0xea35558af012ab6e75f72b7ec946970982587af6/175afaa86690547801ff96d0fa9a54/21175afaa86690547801ff96d0fa9a54.png?w=1000", url: "https://opensea.io/item/robinhood/0xea35558af012ab6e75f72b7ec946970982587af6/766" },
  { id: "1018", price: "0.001 ETH", image: "https://i2c.seadn.io/robinhood/0xea35558af012ab6e75f72b7ec946970982587af6/0d508293f1dd23bd240704d8211840/d70d508293f1dd23bd240704d8211840.png?w=1000", url: "https://opensea.io/item/robinhood/0xea35558af012ab6e75f72b7ec946970982587af6/1018" },
  { id: "1062", price: "0.001 ETH", image: "https://i2c.seadn.io/robinhood/0xea35558af012ab6e75f72b7ec946970982587af6/77b8f59ed041365a277615897ba62a/de77b8f59ed041365a277615897ba62a.png?w=1000", url: "https://opensea.io/item/robinhood/0xea35558af012ab6e75f72b7ec946970982587af6/1062" },
  { id: "819", price: "0.001 ETH", image: "https://i2c.seadn.io/robinhood/0xea35558af012ab6e75f72b7ec946970982587af6/7ab2464110ecc943aa8a1742e04eb0/b67ab2464110ecc943aa8a1742e04eb0.png?w=1000", url: "https://opensea.io/item/robinhood/0xea35558af012ab6e75f72b7ec946970982587af6/819" },
];

type OwnedNft = { id: string; name: string; image: string; url?: string };
type MarketData = {
  floor: { display: string; value?: number | null; currency?: string } | null;
  spacex: { priceEth: number | null; change24h: number | null; symbol: string; url?: string } | null;
  updatedAt?: string;
};
type NftMetadata = { name?: string; image?: string; image_url?: string };
type BlockscoutNftItem = {
  id?: string | number;
  token_id?: string | number;
  token_address?: string;
  image_url?: string;
  metadata?: NftMetadata;
  token?: { address_hash?: string; address?: string };
  token_instance?: { id?: string | number; image_url?: string; metadata?: NftMetadata };
};

const ipfsToHttp = (value?: string) => {
  if (!value) return "";
  return value.startsWith("ipfs://") ? `https://${value.slice(7).split("/")[0]}.ipfs.w3s.link/${value.slice(7).split("/").slice(1).join("/")}`.replace(/\/$/, "") : value;
};

const imageCandidates = (value: string) => {
  const ipfsPath = value.startsWith("ipfs://") ? value.slice(7) : value.includes("/ipfs/") ? value.split("/ipfs/")[1] : "";
  if (!ipfsPath) return [value].filter(Boolean);
  const [cid, ...rest] = ipfsPath.split("/");
  const suffix = rest.length ? `/${rest.join("/")}` : "";
  return [`https://${cid}.ipfs.w3s.link${suffix}`, `https://dweb.link/ipfs/${cid}${suffix}`, `https://gateway.pinata.cloud/ipfs/${cid}${suffix}`, value].filter((item, index, all) => item && all.indexOf(item) === index);
};

const decodeAbiString = (hex: string) => {
  const clean = hex.replace(/^0x/, "");
  if (clean.length < 128) return "";
  const offset = Number(BigInt(`0x${clean.slice(0, 64)}`)) * 2;
  const length = Number(BigInt(`0x${clean.slice(offset, offset + 64)}`));
  const data = clean.slice(offset + 64, offset + 64 + length * 2);
  return new TextDecoder().decode(Uint8Array.from(data.match(/.{1,2}/g) ?? [], (byte) => Number.parseInt(byte, 16)));
};

const readMetadata = async (uri: string, id: string): Promise<OwnedNft> => {
  try {
    if (uri.startsWith("data:application/json;base64,")) {
      const metadata = JSON.parse(atob(uri.split(",")[1]));
      return { id, name: metadata.name || `Space Broker #${id}`, image: ipfsToHttp(metadata.image) };
    }
    const response = await fetch(ipfsToHttp(uri));
    const metadata = await response.json();
    return { id, name: metadata.name || `Space Broker #${id}`, image: ipfsToHttp(metadata.image || metadata.image_url) };
  } catch {
    return { id, name: `Space Broker #${id}`, image: "" };
  }
};

const robinhoodCall = async (data: string) => {
  const response = await fetch(robinhoodRpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: collectionContract, data }, "latest"] }),
  });
  const payload = await response.json() as { result?: string; error?: { message?: string } };
  if (!payload.result) throw new Error(payload.error?.message || "Robinhood RPC call failed");
  return payload.result;
};

const formatWallet = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

const formatEthPrice = (value?: number | null) => value === null || value === undefined || !Number.isFinite(value)
  ? "SYNCING"
  : `${value.toLocaleString(undefined, { maximumSignificantDigits: 6, maximumFractionDigits: 18 })} ETH`;

function Brand() {
  return <a className="brand" href="#top" aria-label="Space Brokers home">
    <img src="/space-brokers-logo-neon.png" alt="Space Brokers" />
  </a>;
}

function NftArtwork({ nft, className = "" }: { nft: OwnedNft; className?: string }) {
  const candidates = useMemo(() => imageCandidates(nft.image), [nft.image]);
  const [candidate, setCandidate] = useState(0);
  if (!candidates.length || candidate >= candidates.length) return <span className={`nft-no-image ${className}`}>METADATA<br />UNAVAILABLE</span>;
  return <img className={className} src={candidates[candidate]} alt={nft.name} onError={() => setCandidate((value) => value + 1)} />;
}

function MarketTicker({ market }: { market: MarketData }) {
  const spacexPrice = formatEthPrice(market.spacex?.priceEth);
  const floorPrice = market.floor?.currency === "ETH" ? market.floor.display : "0.001 ETH";
  const change = market.spacex?.change24h;
  const items = [
    { label: "SPACE BROKERS FLOOR", value: floorPrice, href: links.opensea },
    { label: "SPACEX TOKEN", value: spacexPrice, href: market.spacex?.url ?? `https://etherscan.io/token/${spacexContract}` },
    { label: "SPACEX 24H CHANGE", value: change === null || change === undefined ? "SYNCING" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`, tone: change !== null && change !== undefined && change < 0 ? "down" : "up" },
    { label: "CREW SUPPLY", value: "2,222" },
    { label: "NETWORK", value: "ROBINHOOD CHAIN" },
    { label: "REWARD ASSET", value: "SPCXx / ETH" },
  ];
  const loop = [...items, ...items];
  return <div className="market-ticker" aria-label="Live Space Brokers market telemetry"><div className="ticker-track">{loop.map((item, index) => {
    const content = <><small>{item.label}</small><b className={item.tone}>{item.value}</b><i>◆</i></>;
    return item.href ? <a key={`${item.label}-${index}`} href={item.href} target="_blank" rel="noreferrer">{content}</a> : <span key={`${item.label}-${index}`}>{content}</span>;
  })}</div></div>;
}

function AudioToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = async () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); return; }
    audioRef.current.volume = 0.22;
    try { await audioRef.current.play(); setPlaying(true); } catch { setPlaying(false); }
  };

  return <div className={`audio-module ${playing ? "is-playing" : ""}`}>
    <audio ref={audioRef} src="/black-signal-archive.mp3" loop preload="none" />
    <button onClick={toggle} aria-pressed={playing}>
      <span className="equalizer" aria-hidden="true"><i /><i /><i /><i /></span>
      <span><small>SHIP AMBIENCE</small><b>{playing ? "ONLINE" : "OFFLINE"}</b></span>
    </button>
  </div>;
}

function StakingTerminal({ market }: { market: MarketData }) {
  const [wallet, setWallet] = useState("");
  const [chain, setChain] = useState("");
  const [message, setMessage] = useState("Connect your wallet to begin the crew scan.");
  const [connecting, setConnecting] = useState(false);
  const [mode, setMode] = useState<"stake" | "unstake">("stake");
  const [ownedNfts, setOwnedNfts] = useState<OwnedNft[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  const networkLabel = useMemo(() => {
    if (!chain) return "NOT DETECTED";
    if (chain === "0x1") return "ETHEREUM";
    if (chain === "0x1237") return "ROBINHOOD CHAIN";
    if (chain === "0xb626") return "ROBINHOOD TESTNET";
    return `CHAIN ${Number.parseInt(chain, 16)}`;
  }, [chain]);

  useEffect(() => {
    const updateAccounts = (accounts: string[]) => {
      const next = accounts[0] ?? "";
      setWallet(next);
      if (!next) { setOwnedNfts([]); setSelected([]); }
      setMessage(next ? "Wallet link established. Crew indexing activates with the staking contract." : "Wallet disconnected. Reconnect to access the dock.");
    };
    window.ethereum?.on?.("accountsChanged", updateAccounts);
    return () => window.ethereum?.removeListener?.("accountsChanged", updateAccounts);
  }, []);

  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;

    const scan = async () => {
      setScanning(true);
      setMessage("Scanning OpenSea and the Space Brokers collection contract…");
      try {
        const mediaResponse = await fetch(`/api/wallet-nfts?wallet=${encodeURIComponent(wallet)}`);
        if (!mediaResponse.ok) throw new Error("OpenSea media route unavailable");
        const media = await mediaResponse.json() as { nfts?: OwnedNft[] };
        if (cancelled) return;
        const nfts = media.nfts ?? [];
        setOwnedNfts(nfts);
        setMessage(nfts.length ? `${nfts.length} Space Broker${nfts.length === 1 ? "" : "s"} loaded with verified OpenSea media.` : "No Space Brokers were found in this wallet on Robinhood Chain.");
        return;
      } catch {
        // Non-Netlify deployments continue through the onchain index below.
      }
      try {
        const indexedItems: BlockscoutNftItem[] = [];
        let nextUrl = `${blockscoutApi}/addresses/${wallet}/nft?type=ERC-721`;
        for (let page = 0; page < 25 && nextUrl; page += 1) {
          const response = await fetch(nextUrl);
          if (!response.ok) throw new Error("Explorer scan unavailable");
          const data = await response.json() as { items?: BlockscoutNftItem[]; next_page_params?: Record<string, string | number> | null };
          indexedItems.push(...(data.items ?? []));
          if (!data.next_page_params) { nextUrl = ""; break; }
          const params = new URLSearchParams({ type: "ERC-721", ...Object.fromEntries(Object.entries(data.next_page_params).map(([key, value]) => [key, String(value)])) });
          nextUrl = `${blockscoutApi}/addresses/${wallet}/nft?${params}`;
        }
        const matches: OwnedNft[] = indexedItems.flatMap((item) => {
          const token = item.token ?? {};
          const instance = item.token_instance ?? item;
          const address = String(token.address_hash ?? token.address ?? item.token_address ?? "").toLowerCase();
          if (address !== collectionContract) return [];
          const id = String(instance.id ?? item.id ?? item.token_id ?? "");
          const metadata = instance.metadata ?? item.metadata ?? {};
          return [{ id, name: metadata.name || `Space Broker #${id}`, image: ipfsToHttp(metadata.image || metadata.image_url || instance.image_url || item.image_url) }];
        });
        if (cancelled) return;
        setOwnedNfts(matches);
        setMessage(matches.length ? `${matches.length} Space Broker${matches.length === 1 ? "" : "s"} detected and ready for selection.` : "No Space Brokers were found in this wallet on Robinhood Chain.");
      } catch {
        try {
          const addressWord = wallet.replace(/^0x/, "").padStart(64, "0");
          const balanceHex = await robinhoodCall(`0x70a08231${addressWord}`);
          const balance = Number(BigInt(balanceHex));
          const ids = await Promise.all(Array.from({ length: Math.min(balance, 2222) }, async (_, index) => {
            const indexWord = index.toString(16).padStart(64, "0");
            const result = await robinhoodCall(`0x2f745c59${addressWord}${indexWord}`);
            return BigInt(result).toString();
          }));
          const nfts = await Promise.all(ids.map(async (id) => {
            const idWord = BigInt(id).toString(16).padStart(64, "0");
            const result = await robinhoodCall(`0xc87b56dd${idWord}`);
            return readMetadata(decodeAbiString(result), id);
          }));
          if (cancelled) return;
          setOwnedNfts(nfts);
          setMessage(nfts.length ? `${nfts.length} Space Broker${nfts.length === 1 ? "" : "s"} detected and ready for selection.` : "No Space Brokers were found in this wallet on Robinhood Chain.");
        } catch {
          if (!cancelled) setMessage("The collection index is still syncing. Try the crew scan again in a moment.");
        }
      } finally { if (!cancelled) setScanning(false); }
    };
    scan();
    return () => { cancelled = true; };
  }, [wallet, chain]);

  const toggleNft = (id: string) => {
    if (mode !== "stake") return;
    setSelected((current) => current.includes(id) ? current.filter((tokenId) => tokenId !== id) : [...current, id]);
  };

  const focusedNft = ownedNfts.find((nft) => nft.id === selected.at(-1)) ?? ownedNfts[0];

  const connect = async () => {
    if (!window.ethereum) {
      setMessage("No browser wallet detected. Install or open a compatible wallet, then try again.");
      return;
    }
    setConnecting(true);
    setMessage("Requesting cockpit clearance…");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
      setWallet(accounts[0] ?? "");
      setChain(chainId);
      setMessage(accounts[0] ? "Wallet link established. Crew indexing activates with the staking contract." : "No wallet account was selected.");
    } catch {
      setMessage("Connection was cancelled. No permissions were changed.");
    } finally { setConnecting(false); }
  };

  return <section className="terminal-shell" aria-label="Space Brokers staking terminal">
    <div className="terminal-topline"><span><i /> ORBITAL STAKING TERMINAL</span><b>STATUS // PRE-FLIGHT</b></div>
    <div className="terminal-grid">
      <div className="dock-panel">
        <div className="panel-heading">
          <div><small>MODULE 01</small><h2>CREW DEPLOYMENT</h2></div>
          <div className="mode-switch" aria-label="Staking action">
            <button className={mode === "stake" ? "active" : ""} onClick={() => { setMode("stake"); setSelected([]); }}>STAKE</button>
            <button className={mode === "unstake" ? "active" : ""} onClick={() => { setMode("unstake"); setSelected([]); }}>UNSTAKE</button>
          </div>
        </div>
        <div className={`crew-scanner ${wallet ? "linked" : ""}`}>
          <div className="scanner-lines" aria-hidden="true" />
          <div className="crew-visual">
            <span className="target-ring ring-a" /><span className="target-ring ring-b" />
            {focusedNft?.image ? <NftArtwork key={focusedNft.id} nft={focusedNft} /> : <div className="scanner-empty"><b>{scanning ? "SCANNING" : "NO NFT SELECTED"}</b><small>{wallet ? "AWAITING COLLECTION DATA" : "CONNECT WALLET"}</small></div>}
            <div className="scan-beam" />
          </div>
          <div className="scan-copy">
            <small>{wallet ? "WALLET LINKED" : "CREW SCAN LOCKED"}</small>
            <strong>{wallet ? formatWallet(wallet) : "NO WALLET DETECTED"}</strong>
            <p>{message}</p>
            <div className="wallet-readout"><span>NETWORK</span><b>{networkLabel}</b></div>
            <a className="contract-link" href={links.explorer} target="_blank" rel="noreferrer">CONTRACT {formatWallet(collectionContract)} ↗</a>
          </div>
        </div>
        {wallet && <div className="nft-bay">
          <div className="nft-bay-heading"><span><small>WALLET CREW</small><b>{mode === "stake" ? "AVAILABLE TO STAKE" : "STAKED CREW"}</b></span><em>{scanning ? "SCANNING…" : `${ownedNfts.length} DETECTED`}</em></div>
          {scanning ? <div className="nft-loading"><i /><span>READING COLLECTION CONTRACT</span></div>
            : mode === "unstake" ? <div className="nft-empty"><strong>STAKING CONTRACT NOT LINKED</strong><span>Staked crew will appear here once the staking contract is supplied.</span></div>
            : ownedNfts.length ? <div className="nft-grid">{ownedNfts.map((nft) => <button key={nft.id} className={selected.includes(nft.id) ? "selected" : ""} onClick={() => toggleNft(nft.id)} aria-pressed={selected.includes(nft.id)}>
              <span className="nft-image">{nft.image ? <NftArtwork nft={nft} /> : <span className="nft-no-image">METADATA<br />UNAVAILABLE</span>}</span><span className="nft-name"><b>{nft.name}</b><small>TOKEN #{nft.id}</small></span><i>{selected.includes(nft.id) ? "✓" : "+"}</i>
            </button>)}</div>
            : <div className="nft-empty"><strong>NO CREW DETECTED</strong><span>This wallet does not currently hold NFTs from the linked Space Brokers contract.</span></div>}
        </div>}
        <div className="selection-bar">
          <span><small>SELECTED CREW</small><strong>{selected.length}</strong></span>
          <span><small>ACTION</small><strong>{mode.toUpperCase()}</strong></span>
          <span><small>EST. RATE</small><strong>— SPACEX / DAY</strong></span>
        </div>
        {!wallet
          ? <button className="primary-action" onClick={connect} disabled={connecting}>{connecting ? "ESTABLISHING LINK…" : "CONNECT WALLET"}<span>→</span></button>
          : <button className="primary-action calibrated" disabled>{selected.length ? `${selected.length} SELECTED — STAKING CONTRACT REQUIRED` : "SELECT CREW TO PREPARE STAKING"}<span>⌁</span></button>}
        <p className="action-note">No transaction can be submitted until the verified staking contract, reward rate and eligible network are published.</p>
      </div>
      <aside className="rewards-panel">
        <div className="panel-heading compact"><div><small>MODULE 02</small><h2>REWARD CORE</h2></div><span className="pulse-label"><i /> IDLE</span></div>
        <div className="token-orb" aria-label="SpaceX reward token display"><span className="orb-orbit"><i /></span><div><small>REWARD TOKEN</small><strong>SPACEX</strong><b>{formatEthPrice(market.spacex?.priceEth)}</b></div></div>
        <div className="reward-balance"><small>CLAIMABLE REWARDS</small><strong>0.00 <span>SPACEX</span></strong><p>Rewards begin accruing after an eligible Space Broker is successfully deployed.</p></div>
        <dl className="reward-stats">
          <div><dt>ACTIVE CREW</dt><dd>0</dd></div><div><dt>BASE OUTPUT</dt><dd>PENDING</dd></div>
          <div><dt>MULTIPLIER</dt><dd>—</dd></div><div><dt>NEXT CLAIM</dt><dd>NOT ACTIVE</dd></div>
        </dl>
        <button className="claim-button" disabled>CLAIM TO WALLET</button>
        <p className="token-warning">SpaceX rewards refer to a third-party crypto token. They are not SpaceX shares and do not imply affiliation with SpaceX.</p>
      </aside>
    </div>
  </section>;
}

function OpenSeaFloor({ market }: { market: MarketData }) {
  const floorPrice = market.floor?.currency === "ETH" ? market.floor.display : "0.001 ETH";
  return <div className="opensea-floor">
    <div className="floor-top"><span><i /> OPENSEA FLOOR ITEMS</span><a href={links.opensea} target="_blank" rel="noreferrer">VIEW ALL ↗</a></div>
    <div className="floor-listings">{floorListings.map((listing) => <a key={listing.id} href={listing.url} target="_blank" rel="noreferrer" className="floor-listing">
      <span className="listing-image"><img src={listing.image} alt={`Space Broker #${listing.id} listed on OpenSea`} /></span>
      <span className="listing-data"><small>SPACE #{listing.id}</small><b>{listing.price}</b><em>BUY NOW ↗</em></span>
    </a>)}</div>
    <div className="floor-readout"><small>SPACE BROKERS COLLECTION</small><strong>FLOOR // {floorPrice}</strong><p>Genuine Space Brokers listings linked to their individual OpenSea pages. Live floor telemetry refreshes through the private market feed.</p><a href={links.opensea} target="_blank" rel="noreferrer">OPEN LIVE COLLECTION ↗</a></div>
    <div className="floor-contract"><small>COLLECTION CONTRACT</small><b>{collectionContract}</b></div>
  </div>;
}

function MissionBrief({ market }: { market: MarketData }) {
  return <section className="brief-section" id="mission-brief">
    <div className="brief-visual"><OpenSeaFloor market={market} /></div>
    <div className="brief-copy">
      <small>WHY STAKE?</small><h2>PUT YOUR BROKERS<br /><span>ON ACTIVE DUTY.</span></h2>
      <p>Staking turns your Space Brokers into working crew. While deployed, eligible NFTs accrue SpaceX token rewards that can be claimed to the connected wallet.</p>
      <div className="brief-points">
        <article><b>BASE ACCRUAL</b><p>Every eligible staked broker starts from the published mission rate.</p><span>01</span></article>
        <article><b>RARITY SIGNAL</b><p>Rarity-based multipliers can reward higher-tier crew once the final table is confirmed.</p><span>02</span></article>
        <article><b>FLEET POWER</b><p>Holding and deploying more brokers can unlock a larger fleet multiplier.</p><span>03</span></article>
      </div>
    </div>
  </section>;
}

function ProtocolStatus() {
  return <section className="status-section" id="protocol-status">
    <header className="section-header"><div><small>PRE-LAUNCH DISCLOSURE</small><h2>NO BLACK BOXES.</h2></div><p>The dock stays in pre-flight mode until every critical detail is ready for holders to verify.</p></header>
    <div className="status-grid">
      <article className="status-card ready"><div><span>INTERFACE</span><b>ONLINE</b></div><h3>Staking command centre</h3><p>Wallet linking, reward readouts and the complete holder journey are in position.</p></article>
      <article className="status-card ready"><div><span>COLLECTION</span><b>LINKED</b></div><h3>Space Brokers contract</h3><p>The wallet scanner now reads owned NFTs from {formatWallet(collectionContract)} on Robinhood Chain.</p></article>
      <article className="status-card pending"><div><span>STAKING + ECONOMY</span><b>CALIBRATING</b></div><h3>Deployment and reward rules</h3><p>The separate staking contract, base emissions, rarity bonuses and fleet tiers will be published together.</p></article>
    </div>
    <div className="safety-strip"><strong>MISSION RULE</strong><p>Never sign through an unannounced link. The official staking address will be posted on this site, X and Discord.</p><span>VERIFICATION REQUIRED</span></div>
  </section>;
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [market, setMarket] = useState<MarketData>({ floor: { display: "0.001 ETH", value: 0.001, currency: "ETH" }, spacex: null });

  useEffect(() => {
    let cancelled = false;
    const loadMarket = async () => {
      try {
        const response = await fetch("/api/market");
        if (!response.ok) throw new Error("Private market feed unavailable");
        const payload = await response.json() as MarketData;
        if (!cancelled) setMarket((current) => ({ floor: payload.floor ?? current.floor, spacex: payload.spacex ?? current.spacex, updatedAt: payload.updatedAt }));
      } catch {
        try {
          const response = await fetch(`https://api.dexscreener.com/token-pairs/v1/ethereum/${spacexContract}`);
          const pairs = await response.json() as Array<{ priceNative?: string; priceChange?: { h24?: number }; liquidity?: { usd?: number }; baseToken?: { symbol?: string }; quoteToken?: { symbol?: string }; url?: string }>;
          const pair = pairs
            .filter((item) => ["ETH", "WETH"].includes(item.quoteToken?.symbol?.toUpperCase() ?? ""))
            .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
          if (!cancelled && pair) setMarket((current) => ({ ...current, spacex: { priceEth: Number(pair.priceNative), change24h: pair.priceChange?.h24 ?? null, symbol: pair.baseToken?.symbol ?? "SPCXx", url: pair.url } }));
        } catch { /* static floor snapshot remains visible */ }
      }
    };
    loadMarket();
    const timer = window.setInterval(loadMarket, 60_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  return <main id="top">
    <header className="site-header">
      <Brand />
      <nav className={mobileOpen ? "open" : ""} aria-label="Primary navigation">
        <a href="#staking" onClick={() => setMobileOpen(false)}>STAKING DOCK</a><a href="#mission-brief" onClick={() => setMobileOpen(false)}>MISSION BRIEF</a><a href="#protocol-status" onClick={() => setMobileOpen(false)}>SYSTEM STATUS</a>
      </nav>
      <div className="header-links"><a href={links.x} target="_blank" rel="noreferrer">X ↗</a><a href={links.discord} target="_blank" rel="noreferrer">DISCORD ↗</a></div>
      <button className="menu-button" aria-label="Toggle navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? "×" : "☰"}</button>
    </header>
    <MarketTicker market={market} />
    <section className="cockpit-hero" id="staking">
      <div className="starfield" aria-hidden="true" />
      <div className="hero-copy"><img className="hero-brand-logo" src="/space-brokers-logo-neon.png" alt="Space Brokers" /><small>MOTHERSHIP // STAKING PROTOCOL</small><h1>DEPLOY YOUR CREW.<br /><span>EARN SPACEX.</span></h1><p>Welcome aboard the Mothership. Stake eligible Space Brokers, build your fleet multiplier and claim SpaceX token rewards from one onboard command centre.</p><div className="hero-meta"><span><i /> PROTOCOL: PRE-FLIGHT</span><span><i /> REWARD: SPACEX</span><span><i /> CREW: 2,222</span></div></div>
      <StakingTerminal market={market} />
    </section>
    <MissionBrief market={market} /><ProtocolStatus />
    <section className="final-call"><div><small>HOLDER TRANSMISSION</small><h2>THE CREW IS MINTED.<br /><span>NOW PUT THEM TO WORK.</span></h2><p>Follow the official channels for the verified contract, emissions table and activation time.</p></div><div className="final-actions"><a className="bright-link" href={links.discord} target="_blank" rel="noreferrer">JOIN MISSION CONTROL ↗</a><a href={links.opensea} target="_blank" rel="noreferrer">VIEW COLLECTION ↗</a></div></section>
    <footer><Brand /><p>Space Brokers is an independent NFT project. SpaceX token rewards are not shares or financial advice.</p><div><a href={links.opensea} target="_blank" rel="noreferrer">OPENSEA ↗</a><a href={links.x} target="_blank" rel="noreferrer">X ↗</a><a href={links.discord} target="_blank" rel="noreferrer">DISCORD ↗</a></div></footer>
    <AudioToggle />
  </main>;
}
