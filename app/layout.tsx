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
    title: "Diagnostics",
    description: "Junior IT Academy diagnostic tests for Mathematics and English.",
    openGraph: {
      title: "Diagnostics | Junior IT Academy",
      description: "Find the right starting point in Mathematics and English with Junior IT Academy.",
      siteName: "Junior IT Academy",
      images: [{ url: "/posters/poster-01.png", width: 1672, height: 941, alt: "Junior IT Academy diagnostics" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Diagnostics | Junior IT Academy",
      description: "Find the right starting point in Mathematics and English with Junior IT Academy.",
      images: ["/posters/poster-01.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
