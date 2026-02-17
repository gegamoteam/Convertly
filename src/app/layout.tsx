import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: {
    default: "Convertly - Free & Private File Converter",
    template: "%s | Convertly",
  },
  description:
    "Convert files instantly in your browser. 100% private — no uploads, no servers, no data collection. Supports images, documents, audio, video, and data formats. By Gegamo Team.",
  keywords: [
    "file converter",
    "online converter",
    "image converter",
    "pdf converter",
    "private file conversion",
    "local file converter",
    "free converter",
    "browser converter",
    "no upload converter",
    "batch file converter",
    "multi file converter",
  ],
  authors: [{ name: "Gegamo Team" }],
  creator: "Gegamo Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://convertly.app",
    siteName: "Convertly",
    title: "Convertly - Free & Private File Converter",
    description:
      "Convert files instantly in your browser. 100% private — no uploads, no servers, no data collection.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Convertly - Free & Private File Converter",
    description:
      "Convert files instantly in your browser. 100% private — no uploads, no servers, no data collection.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
