import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AirSign — a conversation window",
    template: "%s · AirSign",
  },
  description:
    "AirSign frames the gist of a short signing capture for the signer to confirm, then speaks it. The other person's reply appears as large live captions. Gist, not translation; not a replacement for a human interpreter.",
  applicationName: "AirSign",
  keywords: [
    "communication window",
    "communication helper",
    "live captions",
    "accessibility",
    "limited vocabulary",
  ],
  openGraph: {
      title: "AirSign — a conversation window",
    description:
      "A short sign capture becomes a cautious AI gist for the signer to confirm, with spoken output and live reply captions. Gist, not translation. Not a substitute for a human interpreter.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#07080b",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark-neon"
      className={`dark ${inter.variable} ${atkinson.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('airsign:theme');if(t){document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t!=='light');}}catch(e){}",
          }}
        />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
