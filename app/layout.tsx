import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Space Brokers",
  description: "Classified alien agents following the companies and technologies shaping humanity's future in space.",
  openGraph: { title: "Space Brokers", description: "The market is bigger than Earth.", type: "website", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "Space Brokers", description: "The market is bigger than Earth.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
