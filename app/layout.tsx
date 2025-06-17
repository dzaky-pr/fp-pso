import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Book Library",
  description:
    "A book library project for the DevOps course in the System and Operations Development class by Darrell Valentino, Viera Tito Virgiawan, Frans Nicklaus, and Dzaky Rifai.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-b from-white to-blue-50 dark:from-zinc-900 dark:to-zinc-800 text-text-color dark:text-white transition-colors duration-300`}
      >
        {children}
      </body>
    </html>
  );
}
