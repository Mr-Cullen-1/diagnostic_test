import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matematika diagnostikasi | Junior",
  description: "Junior IT Academy: matematika bo‘yicha qisqa kirish diagnostikasi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <head>
        {/* Sinov sahifasi uchun shrift. LMS da Roboto xost sahifadan keladi (komponent o‘zi hech narsa yuklamaydi). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;800;900&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
