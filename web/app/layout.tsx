import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Roboto, Geist_Mono } from "next/font/google";
import "./globals.css";
import { resolveThemeClass, THEME_COOKIE } from "@/lib/theme";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeCookieSync } from "@/components/theme-cookie-sync";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HR Hub - Employee Management System",
  description: "Advanced Employee Management System built with Next.js",
  icons: {
    icon: "/hrhub.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const preference = cookieStore.get(THEME_COOKIE)?.value;
  const prefersDark =
    headerStore.get("sec-ch-prefers-color-scheme") === "dark";
  const themeClass = resolveThemeClass(preference, prefersDark);

  return (
    <html
      lang="en"
      className={themeClass}
      suppressHydrationWarning
      style={{ colorScheme: themeClass }}
    >
      <body
        className={`${roboto.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeCookieSync />
          <AuthProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
