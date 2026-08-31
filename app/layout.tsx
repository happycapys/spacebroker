import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://space-brokers-staking.bpmorgan87.chatgpt.site"),
  title: "Space Brokers",
  description: "A classified alien community exploring encounters, theories, the space economy and the mysteries beyond Earth.",
  openGraph: { title: "Space Brokers", description: "The truth is in the files.", type: "website", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "Space Brokers", description: "The truth is in the files.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
