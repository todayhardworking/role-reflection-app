import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { UserContextProvider } from "@/context/UserContext";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Role Reflection App",
  description: "A simple role reflection experience built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-white text-slate-900">
        <UserContextProvider>{children}</UserContextProvider>
        <Footer />
      </body>
    </html>
  );
}
