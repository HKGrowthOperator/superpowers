import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magical Wall — Agent-Cockpit",
  description: "Live-Cockpit für KI-Automationen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
