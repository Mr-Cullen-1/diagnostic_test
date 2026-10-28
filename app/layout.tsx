import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matematika diagnostikasi | Junior",
  description: "Junior IT Academy: matematika bo‘yicha qisqa kirish diagnostikasi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uz"><body>{children}</body></html>;
}
