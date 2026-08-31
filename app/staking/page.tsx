"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function StakingRedirect() {
  useEffect(() => { window.location.replace("/#staking"); }, []);
  return <main className="redirect-screen"><p>REDIRECTING TO THE MOTHERSHIP STAKING TERMINAL…</p><Link href="/#staking">OPEN STAKING TERMINAL →</Link></main>;
}
