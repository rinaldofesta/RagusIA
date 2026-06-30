import type { Metadata } from "next";
import { Spectral, Spectral_SC, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});
const spectralSC = Spectral_SC({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-spectral-sc",
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RagusIA — Intelligenza civica",
  description:
    "Un archivio che pensa — non un assistente che improvvisa. Intelligenza civica per il Comune di Ragusa, con ogni risposta tracciata alla fonte.",
};

const PHOSPHOR = "https://unpkg.com/@phosphor-icons/web@2.1.1/src";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="it"
      className={`${spectral.variable} ${spectralSC.variable} ${hanken.variable} ${mono.variable}`}
    >
      <head>
        <link rel="stylesheet" href={`${PHOSPHOR}/regular/style.css`} />
        <link rel="stylesheet" href={`${PHOSPHOR}/thin/style.css`} />
        <link rel="stylesheet" href={`${PHOSPHOR}/bold/style.css`} />
        <link rel="stylesheet" href={`${PHOSPHOR}/fill/style.css`} />
        <link rel="stylesheet" href={`${PHOSPHOR}/duotone/style.css`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
