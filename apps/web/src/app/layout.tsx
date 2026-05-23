import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Hanken_Grotesk,
  JetBrains_Mono,
} from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { PwaRegister } from "@/components/pwa-register";
import { CookieBanner } from "@/components/cookie-banner";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--ff-display",
  weight: ["600", "700", "800"],
});
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--ff-sans",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--ff-mono",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  applicationName: "MAX SNCF",
  title: "MAX SNCF",
  description: "Gerez votre abonnement MAX Actif TGV INOUI",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MAX SNCF",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the notch / home indicator; safe-area insets reclaim the space.
  viewportFit: "cover",
  // Product decision: disable pinch/focus zoom in the app. Belt-and-suspenders
  // with the 16px min font-size on inputs in globals.css.
  maximumScale: 1,
  userScalable: false,
  // Resize the layout (not just the visual viewport) when the keyboard opens.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#292524" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
          <PwaRegister />
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
