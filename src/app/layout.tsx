import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oakridge MUN Check-in",
  description: "Local prototype for Oakridge MUN delegate registration check-in.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${montserrat.variable}`}>
      <body className="min-h-screen font-sans bg-navy text-warm-white">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
