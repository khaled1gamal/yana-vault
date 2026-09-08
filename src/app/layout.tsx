import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Yana’s Digital Time Capsule",
    template: "%s · Time Capsule",
  },
  description: "A private digital vault that stays sealed until her 18th birthday at midnight, Asia/Manila.",
  applicationName: "Yana Vault",
  appleWebApp: {
    capable: true,
    title: "Yana Vault",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Yana’s Digital Time Capsule",
    description: "Private. Sealed. Unlocking at 18 — Asia/Manila midnight.",
    type: "website",
    locale: "en_PH",
  },
  twitter: {
    card: "summary",
    title: "Yana’s Digital Time Capsule",
    description: "A sealed vault. Not even the UI is trusted to open it.",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#07071a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${cormorant.variable} h-full dark`}>
      <body className="flex min-h-full flex-col antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
