import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-display", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--f-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Foothill Commons", template: "%s | Foothill Commons" },
  description: "A community for BYU students: groups, course circles, alumni connections, events and chat.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
