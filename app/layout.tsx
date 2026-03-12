import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "代診調整くん",
  description: "医局内の代診依頼・調整アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geist.className} min-h-screen`}>
        <Nav />
        <main className="max-w-6xl mx-auto px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
