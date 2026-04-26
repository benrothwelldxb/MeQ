import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "MeQ - Emotional Skills Assessment",
  description: "A child-friendly emotional skills assessment for ages 8-11",
  // Strip Referer header on outbound navigations. Belt-and-braces alongside
  // history.replaceState on the login page: prevents a student's login code
  // (when present in the URL via QR scan) from leaking to third-party hosts
  // they navigate to from inside the app.
  referrer: "no-referrer",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MeQ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
