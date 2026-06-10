import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { PostHogInit } from "@/components/analytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const DESCRIPTION =
  "Log your training and get a daily readiness score, deload alerts, StrengthLevel-style standards, and an AI coach that reasons from your real numbers.";

export const metadata: Metadata = {
  metadataBase: new URL("https://mydeloadtracker.vercel.app"),
  applicationName: "MyDeloadTracker",
  title: "MyDeloadTracker — AI strength coach that knows when to deload",
  description: DESCRIPTION,
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "MyDeloadTracker — AI strength coach that knows when to deload",
    description: DESCRIPTION,
    url: "/",
    siteName: "MyDeloadTracker",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyDeloadTracker — AI strength coach that knows when to deload",
    description: DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Deload",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0e1016",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        {children}
        <PwaRegister />
        <PostHogInit />
      </body>
    </html>
  );
}
