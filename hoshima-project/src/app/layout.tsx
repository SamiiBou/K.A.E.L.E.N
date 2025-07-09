import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Eruda from '@/components/Eruda';

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
             title: "Hoshima - K.A.E.L.E.N",
     description: "Challenge the impossible with K.A.E.L.E.N, the Master of Ceremonies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <MiniKitProvider>
        <LanguageProvider>
          <body className={`${geist.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased`}>
            {/* <Eruda /> */}
            {children}
          </body>
        </LanguageProvider>
      </MiniKitProvider>
    </html>
  );
}
