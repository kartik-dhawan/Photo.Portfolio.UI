import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/store/StoreProvider";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import SocialLinks from "@/components/SocialLinks";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kartik Dhawan",
  description: "Photography and videography portfolio by Kartik",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-mono bg-black text-white">
        <StoreProvider>
          <MobileNav />
          <div className="flex min-h-screen">
            <aside className="hidden md:flex flex-col w-64 shrink-0 px-8 pt-12 pb-8 sticky top-0 h-screen overflow-y-auto border-r border-zinc-800/50">
              <Sidebar />
            </aside>
            <main className="flex-1 md:pt-0 pt-14">
              {children}
            </main>
          </div>
          <SocialLinks />
        </StoreProvider>
      </body>
    </html>
  );
}
