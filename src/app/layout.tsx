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
  title: "Flying Feathers",
  description: "Flying Feathers Badminton Club - Tournament Management System",
  icons: {
    icon: '/flying-feathers-logo.png',
    shortcut: '/flying-feathers-logo.png',
    apple: '/flying-feathers-logo.png',
  },
  openGraph: {
    title: "Flying Feathers",
    description: "Flying Feathers Badminton Club - Tournament Management System",
    images: ['/flying-feathers-logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Flying Feathers",
    description: "Flying Feathers Badminton Club - Tournament Management System",
    images: ['/flying-feathers-logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
