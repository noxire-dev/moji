import { AuthProvider, ThemeProvider, NavigationLoadingProvider } from "@/app/providers";
import { NavigationLoader } from "@/components/NavigationLoader";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moji - Workspace-Centric Productivity",
  description: "A focused workspace for your todos and notes",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <NavigationLoadingProvider>
              <NavigationLoader />
              {children}
            </NavigationLoadingProvider>
          </AuthProvider>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(var(--card) / 0.92)',
                border: '1px solid hsl(var(--border) / 0.7)',
                color: 'hsl(var(--foreground))',
                borderRadius: '12px',
                padding: '10px 14px',
                boxShadow: '0 12px 28px hsl(0 0% 0% / 0.28)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
