import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s · dev-telemetry",
    default: "dev-telemetry — telemetria para devs",
  },
  description:
    "Painel pessoal de performance técnica: commits, PRs e análise de produtividade com IA.",
  applicationName: "dev-telemetry",
  openGraph: {
    type: "website",
    title: "dev-telemetry — telemetria para devs",
    description:
      "Painel pessoal de performance técnica: commits, PRs e análise de produtividade com IA.",
  },
  twitter: {
    card: "summary",
    title: "dev-telemetry",
    description: "Painel pessoal de performance técnica com análise IA.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
