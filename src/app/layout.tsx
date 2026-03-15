import type { Metadata } from "next";
import { JetBrains_Mono, Outfit, Fira_Code } from "next/font/google";
import { Nav } from "@/components/layout";
import { Footer } from "@/components/layout";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
});

export const metadata: Metadata = {
  title: "Blockchain Visualizer",
  description:
    "Open-Source-Lernplattform: Bitcoin- und Blockchain-Technologie interaktiv verstehen — von Hashing bis zur Schlüsselableitung.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${jetbrainsMono.variable} ${outfit.variable} ${firaCode.variable} antialiased`}
      >
        <Nav />
        <main className="min-h-screen pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
