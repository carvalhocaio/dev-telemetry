import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

import Footer from "@/components/Footer";
import NavBar from "@/components/layout/NavBar";

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s · dev-telemetry",
    default: "dev-telemetry — relatórios diários e linha do tempo de atividade",
  },
  description:
    "Linha do tempo diária de atividades de engenharia e geração de relatórios executivos com IA.",
  applicationName: "dev-telemetry",
  openGraph: {
    type: "website",
    title: "dev-telemetry — relatórios diários e linha do tempo de atividade",
    description:
      "Linha do tempo diária de atividades de engenharia e geração de relatórios executivos com IA.",
  },
  twitter: {
    card: "summary",
    title: "dev-telemetry",
    description:
      "Linha do tempo diária de atividades de engenharia e geração de relatórios executivos com IA.",
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
      className={`dark ${jetBrainsMono.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:border focus:border-accent focus:bg-background focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-accent"
        >
          Pular para o conteúdo
        </a>
        <NavBar />
        <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
