import type { Metadata } from "next";
import { Geist_Mono, Overpass } from "next/font/google";
import "./globals.css";

// Overpass is UMD's approved web substitute for its brand typeface, Interstate
const overpass = Overpass({
  variable: "--font-overpass",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UMD Calendar Feed",
  description: "Subscribe to UMD breaks, finals, and holidays with reminders set the way you like.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${overpass.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
