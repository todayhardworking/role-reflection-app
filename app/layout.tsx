import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { SharedLayout } from "@/components/SharedLayout";
import { UserProvider } from "@/context/UserContext";
import { RouteGuard } from "@/components/RouteGuard";

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
      <body>
        <UserProvider>
          <RouteGuard>
            <SharedLayout>{children}</SharedLayout>
          </RouteGuard>
        </UserProvider>
      </body>
    </html>
  );
}
