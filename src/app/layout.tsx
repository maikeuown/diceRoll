import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The 100-Dice Gauntlet",
  description: "Drop 100 dice. Climb the leaderboard. Return tomorrow.",
  openGraph: {
    title: "The 100-Dice Gauntlet",
    description: "Drop 100 dice. Climb the leaderboard. Return tomorrow.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full bg-[#0a0a0f]">{children}</body>
    </html>
  );
}
