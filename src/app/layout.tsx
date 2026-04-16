import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const nouvelle = localFont({
  src: [
    { path: "../fonts/NNNouvelleGroteskSTD-Thin.otf", weight: "100" },
    { path: "../fonts/NNNouvelleGroteskSTD-Light.otf", weight: "300" },
    { path: "../fonts/NNNouvelleGroteskSTD-Normal.otf", weight: "400" },
    { path: "../fonts/NNNouvelleGroteskSTD-Medium.otf", weight: "500" },
    { path: "../fonts/NNNouvelleGroteskSTD-Bold.otf", weight: "700" },
  ],
  variable: "--font-nouvelle",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Taylor Breitzman — Design Engineer",
  description: "Design engineer building design systems, iOS apps, and interactive experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nouvelle.variable} ${playfair.variable}`}>
      <body
        className="min-h-screen"
        style={{ fontFamily: "var(--font-nouvelle), -apple-system, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
