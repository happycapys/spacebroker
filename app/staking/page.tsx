"use client";

import { useEffect } from "react";

export default function StakingRedirect() {
  useEffect(() => { window.location.replace("/#staking"); }, []);
  return <main className="redirect-screen"><p>REDIRECTING TO THE MOTHERSHIP STAKING TERMINAL…</p><a href="/#staking">OPEN STAKING TERMINAL →</a></main>;
}

