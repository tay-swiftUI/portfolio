import type { Metadata } from "next";
import { Radley, Abhaya_Libre, Playfair_Display } from "next/font/google";
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

const radley = Radley({
  variable: "--font-radley",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const abhaya = Abhaya_Libre({
  variable: "--font-abhaya",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="en" className={`${nouvelle.variable} ${radley.variable} ${abhaya.variable} ${playfair.variable}`}>
      <body
        className="min-h-screen"
        style={{ fontFamily: "var(--font-nouvelle), -apple-system, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
