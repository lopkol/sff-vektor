// Install Radix main styles
import "@radix-ui/themes/styles.css";

// Add app globals style (like Tailwind)
import "./globals.css";

// next
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

// Theming
import ReactQueryProvider from "@/components/react-query-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/components/auth-provider";
import { UserProvider } from "@/components/user-provider";

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
  description: "",
  robots: "noindex",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ReactQueryProvider>
              <AuthProvider>
                <UserProvider>
                  <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>{children}</SidebarInset>
                  </SidebarProvider>
                </UserProvider>
              </AuthProvider>
            </ReactQueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
