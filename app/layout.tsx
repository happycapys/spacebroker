import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Space Brokers Staking",
  description: "Deploy your Space Brokers crew and earn SpaceX token rewards from the Mothership staking terminal.",
  openGraph: { title: "Space Brokers Staking", description: "Deploy your crew. Earn SpaceX.", type: "website", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "Space Brokers Staking", description: "Deploy your crew. Earn SpaceX.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
