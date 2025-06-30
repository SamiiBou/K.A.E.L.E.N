import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import { LanguageProvider } from '@/contexts/LanguageContext';

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
      <head>
        {process.env.NODE_ENV === 'development' && (
          <script 
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof window !== 'undefined') {
                  try {
                    const script = document.createElement('script');
                    script.src = '/node_modules/eruda/eruda.js';
                    script.onerror = function() {
                      // Fallback to CDN if local version fails
                      const fallbackScript = document.createElement('script');
                      fallbackScript.src = 'https://cdn.jsdelivr.net/npm/eruda@3.4.3/eruda.min.js';
                      fallbackScript.onload = function() { 
                        if (typeof eruda !== 'undefined') {
                          eruda.init(); 
                        }
                      };
                      document.head.appendChild(fallbackScript);
                    };
                    script.onload = function() { 
                      if (typeof eruda !== 'undefined') {
                        eruda.init(); 
                      }
                    };
                    document.head.appendChild(script);
                  } catch (e) {
                    console.warn('Eruda failed to load:', e);
                  }
                }
              `
            }}
          />
        )}
      </head>
      <MiniKitProvider>
        <LanguageProvider>
          <body className={`${geist.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased`}>
            {children}
          </body>
        </LanguageProvider>
      </MiniKitProvider>
    </html>
  );
}
