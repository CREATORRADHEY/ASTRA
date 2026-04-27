import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import "./globals.css";
import AstraBackground from "@/components/background/AstraBackground";
import AstraCursor from "@/components/cursor/AstraCursor";
import ScrollProgress from "@/components/ui/ScrollProgress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display / brand font — ancient Roman letterforms, perfect for cosmic themes
const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Astra — Shaped by thought",
  description:
    "A universe of ideas — forming, evolving, and connecting to reality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <AstraBackground />
        <AstraCursor />
        <ScrollProgress />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
