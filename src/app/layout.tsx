import type { Metadata } from "next";
import "./globals.css";
import { RainbowKitProviderWrapper } from "@/providers/rainbowkit-provider";

export const metadata: Metadata = {
  title: "Polymarket Trader",
  description: "Trade prediction markets on Polymarket",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" data-gptw="">
        <RainbowKitProviderWrapper>{children}</RainbowKitProviderWrapper>
      </body>
    </html>
  );
}
