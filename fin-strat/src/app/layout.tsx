import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FloatingThemeToggle } from "@/components/layout/floating-theme-toggle";
import { siteConfig } from "@/config/site";
import "../styles/themes.css";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <FloatingThemeToggle />
        </Providers>
      </body>
    </html>
  );
}
