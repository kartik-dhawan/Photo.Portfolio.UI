import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat, Sarina } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/store/StoreProvider";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import OnboardingForm from "@/components/OnboardingForm";
import Footer from "@/components/Footer";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-display",
  subsets: ["latin"],
});

const sarina = Sarina({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://kartikdhawan.com");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Portfolio",
    template: "%s",
  },
  description: "Photography and videography portfolio",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${caveat.variable} ${sarina.variable} h-full antialiased`}>
      <GoogleAnalytics />
      <body className="min-h-full font-mono bg-black text-white">
        <StoreProvider>
          <OnboardingForm />
          {children}
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
