import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mendonça Fit — Corrida & evolução",
  description: "Registre suas corridas, acompanhe ritmo e evolução de peso.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" suppressHydrationWarning><body className="antialiased">{children}<Toaster richColors position="top-center" /></body></html>;
}
