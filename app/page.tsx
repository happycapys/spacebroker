"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

type OwnedNft = { id: string; name: string; image: string; url?: string };
type FloorListing = { id: string; price: string; image: string; url: string };
type MarketData = {
  floor: { display: string; value?: number | null; currency?: string } | null;
  listings?: FloorListing[];
  spacex: { priceUsd: number | null; change24h: number | null; symbol: string; url?: string } | null;
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

type Article = { eyebrow: string; title: string; body: string[]; sourceLabel: string; sourceUrl: string };

const signals = [
  { tag: "ORBIT CONFIRMED", date: "AUG 16", title: "Rocket Lab-built platforms reach orbit for Globalstar", copy: "Eight spacecraft platforms are now supporting a new direct-to-device communications constellation.", body: ["Rocket Lab says eight satellite platforms it built for MDA Space successfully reached orbit on 15 August. The spacecraft are part of a Globalstar low-Earth-orbit constellation intended to support direct-to-device and IoT communications.", "The launch matters beyond rockets: it shows how spacecraft manufacturing, satellite components and orbital communications combine into one commercial infrastructure chain."], sourceLabel: "READ THE ROCKET LAB UPDATE", sourceUrl: "https://www.rocketlabusa.com/updates/rocket-lab-satellite-platforms-built-for-mda-space-successfully-reach-orbit-supporting-globalstar-direct-to-device-communications-services/" },
  { tag: "NETWORK DEPLOYMENT", date: "AUG 05", title: "AST SpaceMobile launches BlueBird 11, 12 and 13", copy: "Three next-generation satellites have joined the push for broadband to ordinary phones from orbit.", body: ["AST SpaceMobile says BlueBird 11, 12 and 13 launched from Cape Canaveral on 5 August aboard a Falcon 9. The company is building a space-based cellular broadband network designed to connect standard mobile devices.", "The mission is an important deployment step, but the investment story still depends on successful commissioning, regulatory access, commercial partnerships and the cost of completing the constellation."], sourceLabel: "VIEW THE AST SPACEMOBILE MISSION PAGE", sourceUrl: "https://ast-science.com/next-gen-bluebird/" },
  { tag: "DEFENCE CONTRACT", date: "AUG 17", title: "Rocket Lab joins the Space Force NITE-STAR programme", copy: "The company can now compete for work under a test-and-training contract with a $981 million ceiling.", body: ["Rocket Lab has been onboarded to the U.S. Space Force's NITE-STAR programme, making it eligible to compete for future task orders supporting space test and training infrastructure.", "The headline ceiling is not revenue already awarded to Rocket Lab. It is the maximum potential value of the wider programme, so future task-order wins—not the ceiling alone—will determine the commercial impact."], sourceLabel: "READ THE ROCKET LAB ANNOUNCEMENT", sourceUrl: "https://www.rocketlabusa.com/updates/new-blog-posrocket-lab-onboarded-to-u-s-space-forces-981m-nite-star-program-to-advance-space-test-and-training-infrastructure-program/" },
];

const files = [
  { code: "FILE 001", status: "DOCUMENTED", title: "The Tic Tac Encounter", body: ["In November 2004, personnel attached to the USS Nimitz carrier group reported unusual aerial objects during training off Southern California. One of the three Navy videos later released by the Pentagon is associated with that period.", "The Department of Defense confirmed that the circulating footage was authentic Navy video and officially released it in 2020. Authentic military footage is not, by itself, proof of extraterrestrial technology; the object shown remains unidentified in the public record."], sourceLabel: "OPEN THE OFFICIAL DOD RELEASE", sourceUrl: "https://www.defense.gov/News/Releases/release/article/2165713/statement-by-the-department-of-defense-on-the-release-of-historical-navy-videos/" },
  { code: "FILE 014", status: "WITNESS ACCOUNT", title: "Rendlesham Forest", body: ["In December 1980, U.S. Air Force personnel stationed near RAF Woodbridge and RAF Bentwaters reported unusual lights in Rendlesham Forest. Lieutenant Colonel Charles Halt's memorandum became the central official document connected to the incident.", "The UK National Archives holds the Halt memo and later Ministry of Defence correspondence. The material documents that reports were made; it does not establish an extraterrestrial explanation, and proposed explanations remain disputed."], sourceLabel: "EXPLORE THE UK NATIONAL ARCHIVES", sourceUrl: "https://www.nationalarchives.gov.uk/explore-the-collection/explore-by-time-period/postwar/ufo-reports/" },
  { code: "FILE 051", status: "UNVERIFIED", title: "The Reverse-Engineering Programme", body: ["Claims that governments possess and secretly reverse-engineer recovered non-human craft have been repeated in testimony, interviews and popular culture. Publicly available claims have not produced independently verifiable hardware or data demonstrating extraterrestrial origin.", "The U.S. All-domain Anomaly Resolution Office says its historical review found no empirical evidence that the government or private companies had reverse-engineered extraterrestrial technology. That conclusion does not settle every allegation, but it means the programme remains an unverified claim—not an established fact."], sourceLabel: "READ THE AARO RECORDS", sourceUrl: "https://www.aaro.mil/UAP-Records/" },
];

function ArticleModal({ article, onClose }: { article: Article; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={onClose} role="presentation"><article className="article-modal" role="dialog" aria-modal="true" aria-labelledby="article-title" onMouseDown={(event) => event.stopPropagation()}>
    <button className="modal-close" onClick={onClose} aria-label="Close article">×</button><p>{article.eyebrow}</p><h2 id="article-title">{article.title}</h2>{article.body.map((paragraph) => <p className="article-body" key={paragraph}>{paragraph}</p>)}<a href={article.sourceUrl} target="_blank" rel="noreferrer">{article.sourceLabel} ↗</a><small>Source opens in a new tab. Space Brokers separates sourced records from speculation.</small>
  </article></div>;
}


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

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 12_000) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { window.clearTimeout(timer); }
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
    const response = await fetchWithTimeout(ipfsToHttp(uri), { cache: "no-store" });
    const metadata = await response.json();
    return { id, name: metadata.name || `Space Broker #${id}`, image: ipfsToHttp(metadata.image || metadata.image_url) };
  } catch {
    return { id, name: `Space Broker #${id}`, image: "" };
  }
};

const robinhoodCall = async (data: string) => {
  const response = await fetchWithTimeout(robinhoodRpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: collectionContract, data }, "latest"] }),
  });
  const payload = await response.json() as { result?: string; error?: { message?: string } };
  if (!payload.result) throw new Error(payload.error?.message || "Robinhood RPC call failed");
  return payload.result;
};

const formatWallet = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

const formatUsdPrice = (value?: number | null) => value === null || value === undefined || !Number.isFinite(value)
  ? "SYNCING"
  : `$${value.toLocaleString(undefined, { maximumSignificantDigits: 6, maximumFractionDigits: 12 })}`;

function Brand() {
  return <a className="brand" href="/" aria-label="Space Brokers home">
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
  const spacexPrice = formatUsdPrice(market.spacex?.priceUsd);
  const floorPrice = market.floor?.currency === "ETH" ? market.floor.display : "0.001 ETH";
  const change = market.spacex?.change24h;
  const items = [
    { label: "SPACE BROKERS FLOOR", value: floorPrice, href: links.opensea },
    { label: "SPACEX TOKEN", value: spacexPrice, href: market.spacex?.url ?? `https://etherscan.io/token/${spacexContract}` },
    { label: "SPACEX 24H CHANGE", value: change === null || change === undefined ? "SYNCING" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`, tone: change !== null && change !== undefined && change < 0 ? "down" : "up" },
    { label: "CREW SUPPLY", value: "2,222" },
    { label: "NETWORK", value: "ROBINHOOD CHAIN" },
    { label: "SEASON 1 REWARD", value: "TO BE ANNOUNCED" },
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
  const [message, setMessage] = useState("Staking is under construction. Wallet connection will open when Season 1 launches.");
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
        const mediaResponse = await fetchWithTimeout(`/api/wallet-nfts?wallet=${encodeURIComponent(wallet)}`, {}, 15_000);
        if (!mediaResponse.ok) throw new Error("OpenSea media route unavailable");
        const media = await mediaResponse.json() as { nfts?: OwnedNft[] };
        if (cancelled) return;
        const nfts = media.nfts ?? [];
        setOwnedNfts(nfts);
        setMessage(nfts.length ? `${nfts.length} Space Broker${nfts.length === 1 ? "" : "s"} loaded with verified OpenSea media.` : "No Space Brokers were found in this wallet on Robinhood Chain.");
        setScanning(false);
        return;
      } catch {
        // Non-Netlify deployments continue through the onchain index below.
      }
      try {
        const indexedItems: BlockscoutNftItem[] = [];
        let nextUrl = `${blockscoutApi}/addresses/${wallet}/nft?type=ERC-721`;
        for (let page = 0; page < 25 && nextUrl; page += 1) {
          const response = await fetchWithTimeout(nextUrl);
          if (!response.ok) throw new Error("Explorer scan unavailable");
          const data = await response.json() as { items?: BlockscoutNftItem[]; next_page_params?: Record<string, string | number> | null };
          indexedItems.push(...(data.items ?? []));
          if (!data.next_page_params) { nextUrl = ""; break; }
          const params = new URLSearchParams({ type: "ERC-721", ...Object.fromEntries(Object.entries(data.next_page_params).map(([key, value]) => [key, String(value)])) });
          nextUrl = `${blockscoutApi}/addresses/${wallet}/nft?${params}`;
        }
        const indexedMatches: OwnedNft[] = indexedItems.flatMap((item) => {
          const token = item.token ?? {};
          const instance = item.token_instance ?? item;
          const address = String(token.address_hash ?? token.address ?? item.token_address ?? "").toLowerCase();
          if (address !== collectionContract) return [];
          const id = String(instance.id ?? item.id ?? item.token_id ?? "");
          const metadata = instance.metadata ?? item.metadata ?? {};
          return [{ id, name: metadata.name || `Space Broker #${id}`, image: "" }];
        });
        if (cancelled) return;
        if (!indexedMatches.length) {
          setOwnedNfts([]);
          setMessage("No Space Brokers were found in this wallet on Robinhood Chain.");
          return;
        }
        setMessage(`${indexedMatches.length} holdings found. Refreshing current on-chain artwork…`);
        const refreshed: OwnedNft[] = [];
        for (let start = 0; start < indexedMatches.length; start += 12) {
          const batch = await Promise.all(indexedMatches.slice(start, start + 12).map(async (nft) => {
            try {
              const idWord = BigInt(nft.id).toString(16).padStart(64, "0");
              const result = await robinhoodCall(`0xc87b56dd${idWord}`);
              return { ...await readMetadata(decodeAbiString(result), nft.id), url: nft.url };
            } catch { return nft; }
          }));
          if (cancelled) return;
          refreshed.push(...batch);
          setOwnedNfts([...refreshed]);
        }
        setMessage(`${refreshed.length} Space Broker${refreshed.length === 1 ? "" : "s"} refreshed from current contract metadata.`);
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

  return <section className="terminal-shell is-building" aria-label="Space Brokers staking terminal preview" aria-disabled="true">
    <div className="terminal-topline"><span><i /> ORBITAL STAKING TERMINAL</span><b>STATUS // UNDER CONSTRUCTION</b></div>
    <div className="construction-notice" role="status">
      <span aria-hidden="true">⚠</span>
      <div><strong>STAKING IS UNDER CONSTRUCTION</strong><p>This terminal is a preview only. Wallet connection, staking and claims are not live yet. Season 1 launch details will be announced on X and Discord.</p></div>
      <b>COMING SOON</b>
    </div>
    <div className="terminal-grid">
      <div className="dock-panel">
        <div className="panel-heading">
          <div><small>MODULE 01</small><h2>CREW DEPLOYMENT</h2></div>
          <div className="mode-switch" aria-label="Staking action">
            <button className={mode === "stake" ? "active" : ""} disabled onClick={() => { setMode("stake"); setSelected([]); }}>STAKE</button>
            <button className={mode === "unstake" ? "active" : ""} disabled onClick={() => { setMode("unstake"); setSelected([]); }}>UNSTAKE</button>
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
          {mode === "unstake" ? <div className="nft-empty"><strong>STAKING CONTRACT NOT LINKED</strong><span>Staked crew will appear here once the staking contract is supplied.</span></div>
            : ownedNfts.length ? <div className="nft-grid">{ownedNfts.map((nft) => <button key={nft.id} className={selected.includes(nft.id) ? "selected" : ""} onClick={() => toggleNft(nft.id)} aria-pressed={selected.includes(nft.id)}>
              <span className="nft-image">{nft.image ? <NftArtwork nft={nft} /> : <span className="nft-no-image">METADATA<br />UNAVAILABLE</span>}</span><span className="nft-name"><b>{nft.name}</b><small>TOKEN #{nft.id}</small></span><i>{selected.includes(nft.id) ? "✓" : "+"}</i>
            </button>)}</div>
            : scanning ? <div className="nft-loading"><i /><span>READING COLLECTION CONTRACT</span></div>
            : <div className="nft-empty"><strong>NO CREW DETECTED</strong><span>This wallet does not currently hold NFTs from the linked Space Brokers contract.</span></div>}
        </div>}
        <div className="selection-bar">
          <span><small>SELECTED CREW</small><strong>{selected.length}</strong></span>
          <span><small>ACTION</small><strong>{mode.toUpperCase()}</strong></span>
          <span><small>EST. RATE</small><strong>PENDING</strong></span>
        </div>
        {!wallet
          ? <button className="primary-action calibrated" onClick={connect} disabled>{connecting ? "ESTABLISHING LINK…" : "STAKING UNDER CONSTRUCTION"}<span>⌁</span></button>
          : <button className="primary-action calibrated" disabled>{selected.length ? `${selected.length} SELECTED — STAKING CONTRACT REQUIRED` : "SELECT CREW TO PREPARE STAKING"}<span>⌁</span></button>}
        <p className="action-note">No transaction can be submitted until the verified staking contract, reward rate and eligible network are published.</p>
      </div>
      <aside className="rewards-panel">
        <div className="panel-heading compact"><div><small>MODULE 02</small><h2>REWARD CORE</h2></div><span className="pulse-label"><i /> IDLE</span></div>
        <div className="token-orb" aria-label="Season 1 reward token display"><span className="orb-orbit"><i /></span><div><small>REWARD TOKEN</small><strong>TBA</strong><b>SEASON 1</b></div></div>
        <div className="reward-balance"><small>CLAIMABLE REWARDS</small><strong>0.00 <span>TBA</span></strong><p>Rewards begin accruing after an eligible Space Broker is successfully deployed.</p></div>
        <dl className="reward-stats">
          <div><dt>ACTIVE CREW</dt><dd>0</dd></div><div><dt>BASE OUTPUT</dt><dd>PENDING</dd></div>
          <div><dt>MULTIPLIER</dt><dd>—</dd></div><div><dt>NEXT CLAIM</dt><dd>NOT ACTIVE</dd></div>
        </dl>
        <button className="claim-button" disabled>CLAIM TO WALLET</button>
        <p className="token-warning">The final Season 1 reward asset and allocation will be announced before staking opens.</p>
      </aside>
    </div>
  </section>;
}

function AbductionGame() {
  const initialTargets = [
    { id: 1, kind: "cow", x: 15, points: 100, speed: .18 }, { id: 2, kind: "human", x: 38, points: 200, speed: -.25 },
    { id: 3, kind: "agent", x: 63, points: 400, speed: .32 }, { id: 4, kind: "file", x: 84, points: 750, speed: -.14 },
  ];
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [seconds, setSeconds] = useState(60);
  const [detection, setDetection] = useState(0);
  const [beam, setBeam] = useState(false);
  const [ufoX, setUfoX] = useState(50);
  const [targets, setTargets] = useState(initialTargets);
  const [missiles, setMissiles] = useState<{ id: number; x: number; age: number }[]>([]);
  const [searchX, setSearchX] = useState(8);
  const [liftingId, setLiftingId] = useState<number | null>(null);
  const [message, setMessage] = useState("SURVIVE 60 SECONDS. AVOID THE DEFENCES.");
  const [gameOver, setGameOver] = useState(false);
  const [escaped, setEscaped] = useState(false);
  const invulnerableUntil = useRef(0);
  const spawnTick = useRef(0);

  const damage = useCallback((reason: string) => {
    if (Date.now() < invulnerableUntil.current || gameOver || escaped) return;
    invulnerableUntil.current = Date.now() + 1100;
    setMessage(`${reason} — SHIELD LOST`);
    setDetection(20);
    setLives((value) => { const next = value - 1; if (next <= 0) setGameOver(true); return Math.max(0, next); });
  }, [escaped, gameOver]);

  const abduct = useCallback(() => {
    if (beam || gameOver || escaped) return;
    if (seconds === 0) {
      if (Math.abs(ufoX - 50) <= 10) { setEscaped(true); setMessage("MISSION COMPLETE — UFO ESCAPED"); }
      else setMessage("REACH THE GREEN ESCAPE PORTAL");
      return;
    }
    setBeam(true);
    const hit = [...targets].sort((a, b) => Math.abs(a.x - ufoX) - Math.abs(b.x - ufoX))[0];
    if (!hit || Math.abs(hit.x - ufoX) > 9) {
      setMessage("NO TARGET IN BEAM — REPOSITION UFO");
      window.setTimeout(() => setBeam(false), 420);
      return;
    }
    setLiftingId(hit.id); setScore((value) => value + hit.points);
    setDetection((value) => Math.min(100, value + ({ cow: 10, human: 16, agent: 24, file: 32 }[hit.kind] || 12)));
    setMessage(`${hit.kind.toUpperCase()} ACQUIRED +${hit.points}`);
    window.setTimeout(() => {
      setTargets((current) => current.map((item) => item.id === hit.id ? { ...item, id: Date.now(), x: 10 + Math.round(Math.random() * 80), speed: -item.speed } : item));
      setLiftingId(null); setBeam(false);
    }, 650);
  }, [beam, escaped, gameOver, seconds, targets, ufoX]);

  useEffect(() => {
    if (gameOver || escaped || seconds === 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [escaped, gameOver, seconds]);

  useEffect(() => {
    if (gameOver || escaped) return;
    const tick = window.setInterval(() => {
      const difficulty = 1 + (60 - seconds) / 45;
      setTargets((current) => current.map((item) => ({ ...item, x: item.x + item.speed * difficulty < 5 ? 94 : item.x + item.speed * difficulty > 95 ? 6 : item.x + item.speed * difficulty })));
      setSearchX((value) => value >= 92 ? 8 : value + .65 * difficulty);
      spawnTick.current += 1;
      if (seconds > 0 && spawnTick.current >= Math.max(13, 28 - Math.floor((60 - seconds) / 4))) {
        spawnTick.current = 0;
        setMissiles((current) => [...current.slice(-4), { id: Date.now(), x: 10 + Math.round(Math.random() * 80), age: 0 }]);
      }
      setMissiles((current) => current.map((missile) => ({ ...missile, age: missile.age + 1 })).filter((missile) => missile.age < 28));
    }, 100);
    return () => window.clearInterval(tick);
  }, [escaped, gameOver, seconds]);

  useEffect(() => {
    if (gameOver || escaped || seconds === 0) return;
    if (missiles.some((missile) => missile.age >= 19 && missile.age <= 22 && Math.abs(missile.x - ufoX) < 7)) damage("MISSILE IMPACT");
    if (Math.abs(searchX - ufoX) < 7) setDetection((value) => Math.min(100, value + 3));
    else setDetection((value) => Math.max(0, value - 2));
  }, [damage, escaped, gameOver, missiles, searchX, seconds, ufoX]);

  useEffect(() => { if (detection >= 100) damage("DETECTION MAXIMUM"); }, [damage, detection]);

  const resetGame = () => {
    setScore(0); setLives(3); setSeconds(60); setDetection(0); setBeam(false); setUfoX(50); setTargets(initialTargets);
    setMissiles([]); setSearchX(8); setLiftingId(null); setMessage("SURVIVE 60 SECONDS. AVOID THE DEFENCES."); setGameOver(false); setEscaped(false); spawnTick.current = 0;
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.code === "Space") { event.preventDefault(); abduct(); }
      if (event.key === "ArrowLeft") setUfoX((value) => Math.max(8, value - 6));
      if (event.key === "ArrowRight") setUfoX((value) => Math.min(92, value + 6));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [abduct]);

  const spotted = Math.abs(searchX - ufoX) < 7 && seconds > 0 && !gameOver && !escaped;

  return <div className="game-shell">
    <div className="game-hud"><span>SCORE {String(score).padStart(6, "0")}</span><span>LIVES {"◆".repeat(lives)}{"◇".repeat(3 - lives)}</span><span>{seconds > 0 ? `ESCAPE ${seconds}s` : "PORTAL OPEN"}</span></div>
    <div className="game-sky">
      <div className="pixel-star s1" /><div className="pixel-star s2" /><div className="pixel-star s3" />
      <div className={`ufo ${Date.now() < invulnerableUntil.current ? "damaged" : ""}`} style={{ left: `${ufoX}%` }}><span /><i /></div>
      <div className={`beam ${beam ? "active" : ""}`} style={{ left: `${ufoX}%` }} />
      <div className={`searchlight ${spotted ? "spotted" : ""}`} style={{ left: `${searchX}%` }}><i /></div>
      {spotted && <div className="turret-fire" style={{ left: `${searchX}%`, transform: `translateX(-50%) rotate(${(ufoX - searchX) * .55}deg)` }}><i /><i /><i /></div>}
      {missiles.map((missile) => missile.age < 8
        ? <div className="strike-warning" style={{ left: `${missile.x}%` }} key={missile.id}><span>!</span></div>
        : <div className="missile-rise" style={{ left: `${missile.x}%`, top: `${300 - (missile.age - 8) * 18}px` }} key={missile.id}><i /></div>)}
      {targets.map((item) => <div key={item.id} className={`game-target target-${item.kind} ${liftingId === item.id ? "lift" : ""}`} style={{ left: `${item.x}%` }}><span /><b /><i /></div>)}
      {seconds === 0 && !gameOver && <div className="escape-portal" />}
      <div className="horizon"><i /><i /><i /><i /><i /></div>
      {(gameOver || escaped) && (
        <div className={`game-result ${escaped ? "success" : ""}`}>
          <strong>{escaped ? "MISSION COMPLETE" : "UFO DOWN"}</strong>
          <small>{escaped ? "PORTAL REACHED" : "THE SIGNAL FOUND YOU"}</small>
          <span>FINAL SCORE {score}</span>
          <div className="game-result-actions">
            <button onClick={resetGame}>PLAY AGAIN</button>
            <button className="share-score" onClick={() => {
              const text = `I scored ${score} points in Abduction Brokers by @spacebrokers_ 👽🛸 Can you beat my score?`;
              const url = `${window.location.origin}${window.location.pathname}#abduction`;
              window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
            }}>SHARE SCORE ON X ↗</button>
          </div>
        </div>
      )}
    </div>
    <div className="game-controls">
      <button onClick={() => setUfoX((v) => Math.max(8, v - 7))} aria-label="Move UFO left">◀</button>
      <button className="abduct" onClick={abduct}>{seconds === 0 ? "ESCAPE" : "ABDUCT"}</button>
      <button onClick={() => setUfoX((v) => Math.min(92, v + 7))} aria-label="Move UFO right">▶</button>
    </div><div className={`detection-row ${spotted ? "spotted" : ""}`}><span>{spotted ? "SPOTTED — MOVE!" : "DETECTION"}</span><div><i style={{ width: `${detection}%` }} /></div><b>{detection}%</b></div><div className="target-key"><span>COW 100</span><span>HUMAN 200</span><span>AGENT 400</span><span>FILE 750</span></div><p className="game-message">{message}</p>
  </div>;
}


function OpenSeaFloor({ market }: { market: MarketData }) {
  const floorPrice = market.floor?.currency === "ETH" ? market.floor.display : "0.001 ETH";
  const listings = market.listings ?? [];
  return <div className="opensea-floor">
    <div className="floor-top"><span><i /> OPENSEA FLOOR ITEMS</span><a href={links.opensea} target="_blank" rel="noreferrer">VIEW ALL ↗</a></div>
    <div className="floor-listings">{listings.length ? listings.map((listing) => <a key={listing.id} href={listing.url} target="_blank" rel="noreferrer" className="floor-listing">
      <span className="listing-image">{listing.image ? <img src={listing.image} alt={`Space Broker #${listing.id} currently listed on OpenSea`} /> : <span className="nft-no-image">LIVE IMAGE<br />SYNCING</span>}</span>
      <span className="listing-data"><small>SPACE #{listing.id}</small><b>{listing.price}</b><em>BUY NOW ↗</em></span>
    </a>) : <div className="floor-live-empty"><strong>LIVE LISTINGS SYNCING</strong><span>OpenSea’s current floor items will appear here when the market feed responds.</span></div>}</div>
    <div className="floor-readout"><small>SPACE BROKERS COLLECTION</small><strong>FLOOR // {floorPrice}</strong><p>Genuine Space Brokers listings linked to their individual OpenSea pages. Live floor telemetry refreshes through the private market feed.</p><a href={links.opensea} target="_blank" rel="noreferrer">OPEN LIVE COLLECTION ↗</a></div>
    <div className="floor-contract"><small>COLLECTION CONTRACT</small><b>{collectionContract}</b></div>
  </div>;
}

function CollectionBrief({ market }: { market: MarketData }) {
  return <section className="brief-section" id="collection">
    <div className="brief-visual"><OpenSeaFloor market={market} /></div>
    <div className="brief-copy reward-guide">
      <small>STAKING // REWARD POWER</small><h2>RARITY. FLEET.<br /><span>MISSION.</span></h2>
      <p>Your ongoing reward power is calculated from rarity × active fleet size. Complete your chosen mission to unlock an additional duration bonus.</p>
      <div className="reward-rules">
        <article className="reward-rule">
          <h3><span aria-hidden="true">👽</span> RARITY</h3>
          <dl><div><dt>Designated 1/1s</dt><dd>5×</dd></div><div><dt>Rank #11–199</dt><dd>3×</dd></div><div><dt>Rank #200–800</dt><dd>2×</dd></div><div><dt>Rank #801–1500</dt><dd>1.5×</dd></div><div><dt>Rank #1501–2222</dt><dd>1×</dd></div></dl>
        </article>
        <article className="reward-rule">
          <h3><span aria-hidden="true">🛸</span> ACTIVE FLEET</h3>
          <dl><div><dt>1–10 deployed</dt><dd>1×</dd></div><div><dt>11–30 deployed</dt><dd>1.5×</dd></div><div><dt>31–60 deployed</dt><dd>2×</dd></div><div><dt>61+ deployed</dt><dd>3×</dd></div></dl>
        </article>
        <article className="reward-rule mission-rule">
          <h3><span aria-hidden="true">⏳</span> MISSION BONUS</h3>
          <dl><div><dt>30 days</dt><dd>+10%</dd></div><div><dt>60 days</dt><dd>+25%</dd></div><div><dt>90 days</dt><dd>+50%</dd></div></dl>
        </article>
      </div>
      <p className="reward-footnote"><strong>BASE REWARDS ACCRUE WEEKLY.</strong> NFTs remain in your wallet during soft staking. If one is sold or transferred, it stops earning and its unfinished mission bonus is lost.</p>
    </div>
  </section>;
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [market, setMarket] = useState<MarketData>({ floor: { display: "0.001 ETH", value: 0.001, currency: "ETH" }, listings: [], spacex: null });

  useEffect(() => {
    let cancelled = false;
    const loadMarket = async () => {
      try {
        const response = await fetch("/api/market");
        if (!response.ok) throw new Error("Private market feed unavailable");
        const payload = await response.json() as MarketData;
        if (!cancelled) setMarket((current) => ({ floor: payload.floor ?? current.floor, listings: payload.listings ?? [], spacex: payload.spacex ?? current.spacex, updatedAt: payload.updatedAt }));
      } catch {
        try {
          const response = await fetch(`https://api.dexscreener.com/token-pairs/v1/ethereum/${spacexContract}`);
          const pairs = await response.json() as Array<{ priceUsd?: string; priceChange?: { h24?: number }; liquidity?: { usd?: number }; baseToken?: { symbol?: string }; url?: string }>;
          const pair = [...pairs].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
          if (!cancelled && pair) setMarket((current) => ({ ...current, spacex: { priceUsd: Number(pair.priceUsd), change24h: pair.priceChange?.h24 ?? null, symbol: pair.baseToken?.symbol ?? "SPCXx", url: pair.url } }));
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
        <a href="#mission" onClick={() => setMobileOpen(false)}>THE MISSION</a>
        <a href="#signals" onClick={() => setMobileOpen(false)}>SIGNAL FEED</a>
        <a href="#classified" onClick={() => setMobileOpen(false)}>CLASSIFIED</a>
        <a href="#abduction" onClick={() => setMobileOpen(false)}>ABDUCTION</a>
        <a href="#staking" onClick={() => setMobileOpen(false)}>STAKING</a>
      </nav>
      <div className="header-links"><a href={links.x} target="_blank" rel="noreferrer">X ↗</a><a href={links.discord} target="_blank" rel="noreferrer">DISCORD ↗</a></div>
      <button className="menu-button" aria-label="Toggle navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? "×" : "☰"}</button>
    </header>

    <MarketTicker market={market} />

    <section className="community-hero" id="mission">
      <div className="starfield" aria-hidden="true" />
      <div className="community-copy">
        <small>PUBLIC TRANSMISSION // ACCESS GRANTED</small>
        <h1>SPACE HAS ENTERED<br /><span>THE PORTFOLIO.</span></h1>
        <p>Space Brokers is a classified community for alien believers, sceptics, night-sky watchers and holders—exploring encounters, theories, hidden files and humanity’s future beyond Earth.</p>
        <div className="community-actions">
          <a className="primary-link" href={links.discord} target="_blank" rel="noreferrer">ENTER THE COMMUNITY ↗</a>
          <a href={links.opensea} target="_blank" rel="noreferrer">VIEW COLLECTION ↗</a>
        </div>
        <div className="community-modules">
          <span><b>01</b> FOLLOW THE SIGNAL</span><span><b>02</b> OPEN THE FILES</span><span><b>03</b> FLY THE UFO</span>
        </div>
      </div>
      <div className="community-visual">
        <img src="/space-brokers-collection.gif" alt="Animated selection of Space Brokers agents" />
        <div className="scan-beam" aria-hidden="true" />
        <div className="visual-readout"><small>AGENT ARCHIVE</small><b>MULTIPLE IDENTITIES DETECTED</b></div>
      </div>
    </section>

    <CollectionBrief market={market} />

    <section className="intel-section signals-section" id="signals">
      <header className="section-header"><div><small>03 // SIGNAL FEED</small><h2>LATEST FROM <span>ORBIT.</span></h2></div><p>Verified developments from the companies and technologies pushing humanity further into space.</p></header>
      <div className="signal-list">{signals.map((signal, index) => <button className="signal-entry" key={signal.title} onClick={() => setActiveArticle({ eyebrow: `${signal.tag} // ${signal.date}`, title: signal.title, body: signal.body, sourceLabel: signal.sourceLabel, sourceUrl: signal.sourceUrl })}>
        <span className="signal-number">0{index + 1}</span><span className="signal-copy"><small>{signal.tag} · {signal.date}</small><b>{signal.title}</b><p>{signal.copy}</p></span><i>↗</i>
      </button>)}</div>
    </section>

    <section className="intel-section classified-section" id="classified">
      <div className="classified-visual"><img src="/classified-file.png" alt="Pixel classified alien file" /><span>AUTHORISED PERSONNEL ONLY</span></div>
      <div className="classified-copy">
        <small>04 // CLASSIFIED ARCHIVE</small><h2>THE TRUTH IS<br /><span>IN THE FILES.</span></h2>
        <p>Documented encounters, witness accounts and theories—clearly separated by evidence level. Explore the strange without pretending every claim is fact.</p>
        <div className="file-list">{files.map((file) => <button key={file.code} onClick={() => setActiveArticle({ eyebrow: `${file.code} // ${file.status}`, title: file.title, body: file.body, sourceLabel: file.sourceLabel, sourceUrl: file.sourceUrl })}>
          <span><small>{file.code}</small><em>{file.status}</em></span><b>{file.title}</b><i>→</i>
        </button>)}</div>
      </div>
    </section>

    <section className="intel-section abduction-section" id="abduction">
      <header className="section-header"><div><small>05 // ARCADE MISSION</small><h2>ABDUCTION <span>BROKERS.</span></h2></div><p>Move the UFO, abduct targets, dodge missiles and searchlights, then reach the portal before your shields are gone.</p></header>
      <AbductionGame />
    </section>

    <section className="cockpit-hero staking-zone" id="staking">
      <div className="starfield" aria-hidden="true" />
      <header className="section-header staking-heading"><div><small>06 // MOTHERSHIP UTILITY</small><h2>DEPLOY YOUR <span>CREW.</span></h2></div><p>Rarity, active fleet size and mission duration will determine reward power when Season 1 opens.</p></header>
      <p className="staking-intro"><strong>Staking is currently under construction.</strong> This terminal is a preview; wallet connection, staking and claims are not live yet.</p>
      <StakingTerminal market={market} />
    </section>

    <section className="final-call"><div><small>HOLDER TRANSMISSION</small><h2>LOOK UP.<br /><span>QUESTION EVERYTHING.</span></h2><p>The Mothership is more than staking. Join the alien conversation, open the files and help decide what we investigate next.</p></div><div className="final-actions"><a className="bright-link" href={links.discord} target="_blank" rel="noreferrer">JOIN MISSION CONTROL ↗</a><a href={links.opensea} target="_blank" rel="noreferrer">VIEW COLLECTION ↗</a></div></section>

    <footer><Brand /><p>Built for those who still look up. Space-market content is not financial advice.</p><div><a href={links.opensea} target="_blank" rel="noreferrer">OPENSEA ↗</a><a href={links.x} target="_blank" rel="noreferrer">X ↗</a><a href={links.discord} target="_blank" rel="noreferrer">DISCORD ↗</a></div></footer>
    <AudioToggle />
    {activeArticle && <ArticleModal article={activeArticle} onClose={() => setActiveArticle(null)} />}
  </main>;
}
