import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "Математика по ступенькам — диагностика 1–11 классов",
    description: "Диагностика по математике для 1–11 классов, которая помогает выбрать подходящий уровень.",
    openGraph: {
      title: "Математика по ступенькам",
      description: "Диагностика знаний по математике для 1–11 классов.",
      images: [{ url: "/og.png", width: 1600, height: 900, alt: "Математика по ступенькам" }],
    },
    twitter: { card: "summary_large_image", title: "Математика по ступенькам", images: ["/og.png"] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
