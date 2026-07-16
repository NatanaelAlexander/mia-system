import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  Fira_Code,
  Geist_Mono,
  Inter,
  JetBrains_Mono,
  Merriweather,
  Montserrat,
  Outfit,
  Source_Code_Pro,
} from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { StyleThemeProvider } from "@/providers/style-theme-provider";
import { UI_STYLE_COOKIE } from "@/lib/themes/cookies";
import { resolveAppStyleId } from "@/lib/themes/registry";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MIA System",
  description: "Sistema de gestión interna y portal de tickets",
  icons: {
    icon: "/login/team_prime_dg.PNG",
    apple: "/login/team_prime_dg.PNG",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const styleId = resolveAppStyleId(cookieStore.get(UI_STYLE_COOKIE)?.value);

  return (
    <html
      lang="es"
      className={`${geistMono.variable} ${jetbrainsMono.variable} ${inter.variable} ${merriweather.variable} ${outfit.variable} ${firaCode.variable} ${montserrat.variable} ${sourceCodePro.variable} dark h-full antialiased`}
      data-style={styleId}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <StyleThemeProvider initialStyleId={styleId}>
            <AuthProvider>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </StyleThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
