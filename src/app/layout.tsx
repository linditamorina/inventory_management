import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "../providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventory Management",
  description: "Smart Inventory System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* SHTUAM: h-screen dhe overflow-hidden për të bllokuar scroll-in global */}
      <body className={`${inter.className} h-screen overflow-hidden bg-white`}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}