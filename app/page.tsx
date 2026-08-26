"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const assets = [
  { ticker: "SPCXx", name: "SpaceX xStock", type: "TOKENIZED EQUITY · ETHEREUM", division: "Mothership", allocation: 30, description: "Tokenized exposure linked to SpaceX, the launch and satellite company behind Starship and Starlink.", tone: "green", color: "#68ff14" },
  { ticker: "RKLBx", name: "Rocket Lab USA xStock", type: "TOKENIZED EQUITY · ETHEREUM", division: "Launch Systems", allocation: 20, description: "Tokenized exposure to Rocket Lab's launch vehicles, spacecraft and mission systems.", tone: "cyan", color: "#22dff3" },
  { ticker: "ASTSx", name: "AST SpaceMobile xStock", type: "TOKENIZED EQUITY · ETHEREUM", division: "Orbital Network", allocation: 16, description: "Tokenized exposure to a satellite network designed to connect ordinary mobile phones from orbit.", tone: "violet", color: "#9368ff" },
  { ticker: "LUNRx", name: "Intuitive Machines xStock", type: "TOKENIZED EQUITY · ETHEREUM", division: "Lunar Operations", allocation: 14, description: "Tokenized exposure to lunar landers, Moon missions and communications infrastructure.", tone: "orange", color: "#ff823e" },
  { ticker: "RDWx", name: "Redwire Corporation xStock", type: "TOKENIZED EQUITY · ETHEREUM", division: "Space Infrastructure", allocation: 10, description: "Tokenized exposure to spacecraft hardware, solar arrays and in-space manufacturing systems.", tone: "blue", color: "#4592ff" },
  { ticker: "PLx", name: "Planet Labs PBC xStock", type: "TOKENIZED EQUITY · ETHEREUM", division: "Earth Intelligence", allocation: 10, description: "Tokenized exposure to Earth-observation satellites, imagery and planetary data.", tone: "gold", color: "#ffd15a" },
];

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

function TransmissionTicker() {
  const messages = [
    "PUBLIC TRANSMISSION // WHITELIST PHASE COMPLETE",
    "COLLECTION ACCESS // OPEN TO ALL EARTHLINGS",
    "MISSION CONTROL // FOLLOW THE SPACE ECONOMY",
    "BLACK SIGNAL // ARCHIVE FREQUENCY ACQUIRED",
  ];
  const [messageIndex, setMessageIndex] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const message = messages[messageIndex];
    const complete = typed.length === message.length;
    const timer = window.setTimeout(() => {
      if (complete) {
        setTyped("");
        setMessageIndex((value) => (value + 1) % messages.length);
      } else {
        setTyped(message.slice(0, typed.length + 1));
      }
    }, complete ? 1900 : 42);
    return () => window.clearTimeout(timer);
  }, [messageIndex, typed]);

  return <section className="transmission-ticker" aria-label="Live Space Brokers transmission">
    <div className="ticker-code"><span /> SB-OPEN</div>
    <div className="ticker-terminal"><i>›</i><strong>{typed}</strong><b aria-hidden="true" /></div>
    <div className="ticker-signal"><span>LIVE</span><i /><i /><i /><i /></div>
  </section>;
}

function AudioToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggleAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    audio.volume = 0.32;
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  return <div className={`audio-control ${playing ? "playing" : ""}`}>
    <audio ref={audioRef} src="/black-signal-archive.mp3" loop preload="none" />
    <button onClick={toggleAudio} aria-pressed={playing} aria-label={`${playing ? "Turn off" : "Turn on"} background music`}>
      <span className="audio-bars" aria-hidden="true"><i /><i /><i /><i /></span>
      <span><small>BLACK SIGNAL ARCHIVE</small><b>AUDIO {playing ? "ON" : "OFF"}</b></span>
    </button>
  </div>;
}

function PortfolioUniverse() {
  const defaults = assets.map((asset) => asset.allocation);
  const [allocations, setAllocations] = useState(defaults);
  const total = allocations.reduce((sum, value) => sum + value, 0);

  const changeAllocation = (changedIndex: number, requested: number) => {
    setAllocations((current) => {
      const next = [...current];
      const target = Math.max(0, Math.min(60, requested));
      let difference = target - current[changedIndex];
      if (difference === 0) return current;
      next[changedIndex] = target;

      const others = current.map((_, index) => index).filter((index) => index !== changedIndex)
        .sort((a, b) => difference > 0 ? next[b] - next[a] : next[a] - next[b]);
      let remaining = Math.abs(difference);
      while (remaining > 0) {
        let moved = false;
        for (const index of others) {
          if (difference > 0 && next[index] > 0) { next[index] -= 1; remaining -= 1; moved = true; }
          if (difference < 0 && next[index] < 60) { next[index] += 1; remaining -= 1; moved = true; }
          if (remaining === 0) break;
        }
        if (!moved) break;
      }
      next[changedIndex] += difference > 0 ? -remaining : remaining;
      return next;
    });
  };

  return <div className="universe-builder">
    <div className="universe-panel">
      <div className="card-top"><span>YOUR PORTFOLIO UNIVERSE</span><b>INTERACTIVE</b></div>
      <div className="universe">
        <div className="orbit-ring ring-1" /><div className="orbit-ring ring-2" /><div className="orbit-ring ring-3" />
        <div className="sb-sun"><span>MOTHERSHIP</span><i>MISSION CORE</i></div>
        {assets.map((asset, index) => <div className={`allocation-planet planet-${index}`} key={asset.ticker} style={{ width: `${28 + allocations[index] * 2.35}px`, height: `${28 + allocations[index] * 2.35}px`, backgroundColor: asset.color, boxShadow: `0 0 ${12 + allocations[index]}px ${asset.color}55` }}>
          <b>{asset.ticker}</b><span>{allocations[index]}%</span>
        </div>)}
      </div>
      <div className="universe-total"><span>TOTAL ALLOCATION</span><strong>{total}%</strong><i>LOCKED</i></div>
    </div>
    <div className="allocator-panel">
      <div className="card-top"><span>BUILD YOUR UNIVERSE</span><b>100% TOTAL</b></div>
      <p className="allocator-help">Move any slider. Its planet grows or shrinks, while the other allocations automatically rebalance to keep your universe at exactly 100%.</p>
      <div className="allocation-controls">{assets.map((asset, index) => <label key={asset.ticker} title={asset.description}>
        <span className="asset-swatch" style={{ background: asset.color }} /><span className="control-name"><b>{asset.name}</b><small>{asset.ticker} · ETHEREUM</small></span><output>{allocations[index]}%</output>
        <input type="range" min="0" max="60" step="1" value={allocations[index]} onChange={(event) => changeAllocation(index, Number(event.target.value))} style={{ accentColor: asset.color }} aria-label={`${asset.name} allocation`} />
      </label>)}</div>
      <button className="reset-universe" onClick={() => setAllocations(defaults)}>RESET TO MISSION DEFAULT</button>
      <p className="allocator-note">Concept planner only—this does not buy, hold or sell tokens. xStocks availability and eligibility vary by country.</p>
    </div>
  </div>;
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
      {(gameOver || escaped) && <div className={`game-result ${escaped ? "success" : ""}`}><strong>{escaped ? "MISSION COMPLETE" : "UFO DOWN"}</strong><span>{escaped ? `FINAL SCORE ${score}` : "THE SIGNAL FOUND YOU"}</span><button onClick={resetGame}>PLAY AGAIN</button></div>}
    </div>
    <div className="game-controls">
      <button onClick={() => setUfoX((v) => Math.max(8, v - 7))} aria-label="Move UFO left">◀</button>
      <button className="abduct" onClick={abduct}>{seconds === 0 ? "ESCAPE" : "ABDUCT"}</button>
      <button onClick={() => setUfoX((v) => Math.min(92, v + 7))} aria-label="Move UFO right">▶</button>
    </div><div className={`detection-row ${spotted ? "spotted" : ""}`}><span>{spotted ? "SPOTTED — MOVE!" : "DETECTION"}</span><div><i style={{ width: `${detection}%` }} /></div><b>{detection}%</b></div><div className="target-key"><span>COW 100</span><span>HUMAN 200</span><span>AGENT 400</span><span>FILE 750</span></div><p className="game-message">{message}</p>
  </div>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  return <main>
    <header className="site-header">
      <a className="mini-brand" href="#top"><span>SPACE</span><b>BROKERS</b></a>
      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">MENU</button>
      <nav className={menuOpen ? "open" : ""} onClick={() => setMenuOpen(false)}>
        <a href="#about">THE MISSION</a><a href="#mission">MISSION CONTROL</a><a href="#signals">SIGNAL FEED</a><a href="#classified">CLASSIFIED</a><a href="#abduction">ABDUCTION</a>
        <a className="mobile-social" href="https://opensea.io/collection/spacebrokers" target="_blank" rel="noreferrer">OPENSEA ↗</a>
        <a className="mobile-social" href="https://x.com/spacebrokers_" target="_blank" rel="noreferrer">X ↗</a>
        <a className="mobile-social" href="https://discord.gg/2696H6XJH" target="_blank" rel="noreferrer">DISCORD ↗</a>
      </nav>
      <div className="header-socials">
        <a href="https://x.com/spacebrokers_" target="_blank" rel="noreferrer" aria-label="Space Brokers on X">X</a>
        <a href="https://discord.gg/2696H6XJH" target="_blank" rel="noreferrer">DISCORD</a>
        <a className="marketplace-link" href="https://opensea.io/collection/spacebrokers" target="_blank" rel="noreferrer">VIEW ON OPENSEA ↗</a>
      </div>
    </header>

    <section className="hero" id="top">
      <div className="stars" aria-hidden="true" />
      <div className="hero-copy">
        <p className="eyebrow"><span /> PUBLIC TRANSMISSION // ACCESS GRANTED</p>
        <h1>THE MARKET IS<br /><em>BIGGER THAN EARTH.</em></h1>
        <p className="lead">A pixel-agent collection, space-economy intelligence network and playable classified universe built for everyone watching what comes next.</p>
        <div className="hero-actions"><a className="primary" href="https://opensea.io/collection/spacebrokers" target="_blank" rel="noreferrer">VIEW COLLECTION ↗</a><a className="secondary" href="https://discord.gg/2696H6XJH" target="_blank" rel="noreferrer">JOIN DISCORD ↗</a></div>
        <div className="hero-stats"><div><strong>OPEN</strong><span>PUBLIC PHASE</span></div><div><strong>132+</strong><span>CREATED TRAITS</span></div><div><strong>24/7</strong><span>SIGNAL ACCESS</span></div></div>
      </div>
      <div className="hero-art">
        <img className="collection-reel" src="/space-brokers-collection.gif" alt="Animated selection of Space Brokers NFT characters" />
        <div className="scan-line" aria-hidden="true" />
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
        <div className="agent-tag">AGENT ARCHIVE // ROTATING<br /><b>MULTIPLE IDENTITIES DETECTED</b></div>
      </div>
    </section>

    <TransmissionTicker />

    <section className="section about" id="about">
      <div className="section-heading"><p>01 // THE MISSION</p><h2>MORE THAN A <span>PROFILE PICTURE.</span></h2><small>The whitelist was only the first transmission. The wider Space Brokers universe is now open.</small></div>
      <div className="mission-grid">
        <article><span>01</span><h3>OWN AN AGENT</h3><p>Each Space Broker is assembled from hand-built pixel traits spanning species, outfits, eyewear, headwear and classified accessories.</p></article>
        <article><span>02</span><h3>FOLLOW THE ECONOMY</h3><p>Explore the companies, infrastructure and technologies shaping launch, satellites, lunar operations and the wider space economy.</p></article>
        <article><span>03</span><h3>ENTER THE ARCHIVE</h3><p>Read sourced space signals, open evidence-labelled conspiracy files and compete in the UFO Abduction arcade mission.</p></article>
      </div>
      <div className="collection-brief">
        <div><p>THE COLLECTION</p><h3>CLASSIFIED AGENTS.<br />PUBLIC MISSION.</h3></div>
        <ul><li>Original 32×32 pixel artwork</li><li>Trait-rich alien identities</li><li>Holder-led community access</li><li>Future Mothership ecosystem</li></ul>
        <a className="primary" href="https://opensea.io/collection/spacebrokers" target="_blank" rel="noreferrer">OPEN COLLECTION ↗</a>
      </div>
    </section>

    <section className="section mission" id="mission">
      <div className="section-heading"><p>02 // MISSION CONTROL</p><h2>BUILD YOUR <span>ONCHAIN UNIVERSE.</span></h2><small>Allocate across space-themed tokenized equities available through the xStocks ecosystem on Ethereum.</small></div>
      <PortfolioUniverse />
    </section>

    <section className="section signals" id="signals">
      <div className="section-heading row"><div><p>03 // SIGNAL FEED</p><h2>LATEST FROM <span>ORBIT.</span></h2></div><small>VERIFIED SOURCE LINKS</small></div>
      <div className="signal-list">{signals.map((signal, i) => <button className="signal-entry" key={signal.title} onClick={() => setActiveArticle({ eyebrow: `${signal.tag} // ${signal.date}`, title: signal.title, body: signal.body, sourceLabel: signal.sourceLabel, sourceUrl: signal.sourceUrl })}><div className="signal-no">0{i + 1}</div><div><span>{signal.tag} · {signal.date}</span><h3>{signal.title}</h3><p>{signal.copy}</p></div><b>↗</b></button>)}</div>
    </section>

    <section className="section classified" id="classified">
      <div className="file-visual"><img src="/classified-file.png" alt="Pixel classified folder" /></div>
      <div className="file-copy"><p>04 // CLASSIFIED ARCHIVE</p><h2>THE TRUTH IS<br /><span>IN THE FILES.</span></h2><p>Documented encounters, witness accounts and theories—clearly separated by evidence level. Explore the strange without pretending every claim is fact.</p><div className="file-list">{files.map((file) => <button key={file.code} onClick={() => setActiveArticle({ eyebrow: `${file.code} // ${file.status}`, title: file.title, body: file.body, sourceLabel: file.sourceLabel, sourceUrl: file.sourceUrl })}><span>{file.code}<i>{file.status}</i></span><b>{file.title}</b><em>→</em></button>)}</div></div>
    </section>

    <section className="section abduction-section" id="abduction"><div className="section-heading"><p>05 // UFO ABDUCTION</p><h2>COLLECT THE SPECIMENS.<br /><span>ESCAPE THE SIGNAL.</span></h2><small>Abduct moving targets, dodge missiles and searchlights, then reach the portal before your three shields are gone.</small></div><AbductionGame /></section>
    <section className="final-cta"><p>TRANSMISSION // 0051</p><h2>THEY WATCH THE SKY.<br /><span>WE WATCH THE MARKET.</span></h2><div><a className="primary" href="https://opensea.io/collection/spacebrokers" target="_blank" rel="noreferrer">EXPLORE ON OPENSEA ↗</a><a className="secondary" href="https://discord.gg/2696H6XJH" target="_blank" rel="noreferrer">JOIN THE DISCORD ↗</a></div></section>
    <footer><a className="mini-brand" href="#top"><span>SPACE</span><b>BROKERS</b></a><p>Built for the space economy. Not financial advice.</p><div><a href="https://opensea.io/collection/spacebrokers" target="_blank" rel="noreferrer">OPENSEA ↗</a><a href="https://x.com/spacebrokers_" target="_blank" rel="noreferrer">X ↗</a><a href="https://discord.gg/2696H6XJH" target="_blank" rel="noreferrer">DISCORD ↗</a></div></footer>
    <AudioToggle />
    {activeArticle && <ArticleModal article={activeArticle} onClose={() => setActiveArticle(null)} />}
  </main>;
}
