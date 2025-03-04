// Install Radix main styles
import "@radix-ui/themes/styles.css";

// Add app globals style (like Tailwind)
import "./globals.css";

// next
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Header } from "@/components/Header/Header";
import { NextThemeProvider } from "@/components/ThemeProvider";
// Theming
import { Theme } from "@radix-ui/themes";
import ReactQueryProvider from "./ReactQueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SFFVektor",
  description: "The buddy you'll never have to share your money with",
  robots: "noindex", // TODO: remove this when we want search engine indexation
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextThemeProvider>
          <Theme
            accentColor="mint"
            grayColor="gray"
            panelBackground="solid"
            scaling="100%"
            radius="full"
          >
            <ReactQueryProvider>
              <Header />
              {children}
            </ReactQueryProvider>  
          </Theme>
        </NextThemeProvider>
      </body>
    </html>
  );
}
