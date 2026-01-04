import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10B981",
};

export const metadata: Metadata = {
  title: "DevOps Dashboard",
  description:
    "Monitor all your projects in one place - Vercel, GitHub Actions, Supabase",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DevOps",
  },
  metadataBase: new URL("https://devops-dashboard-pi.vercel.app"),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://devops-dashboard-pi.vercel.app",
    siteName: "DevOps Dashboard",
    title: "DevOps Dashboard",
    description: "Monitor all your projects in one place - Vercel, GitHub Actions, Supabase",
  },
  twitter: {
    card: "summary",
    title: "DevOps Dashboard",
    description: "Monitor all your projects in one place",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
