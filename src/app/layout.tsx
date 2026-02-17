import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/context/Provider";
import { ExchangeProvider } from "@/context/ExchangeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuantivaHQ",
  description: "Trade with Intelligence. Automate with Confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} bg-[--color-background] text-[--color-foreground]`}
        suppressHydrationWarning
      >
        <div className="min-h-screen bg-black">
          <Providers>
            {children}
          </Providers>
        </div>
        <ExchangeProvider>
          <Providers>
          <div className="min-h-screen bg-black">
            {children}
          </div>
          </Providers>
        </ExchangeProvider>
      </body>
    </html>
  );
}
