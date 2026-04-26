import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "MeQ - Emotional Skills Assessment",
  description: "A child-friendly emotional skills assessment for ages 5-11",
  // Strip Referer header on outbound navigations. Belt-and-braces alongside
  // history.replaceState on the login page: prevents a student's login code
  // (when present in the URL via QR scan) from leaking to third-party hosts
  // they navigate to from inside the app.
  referrer: "no-referrer",
  manifest: "/manifest.json",
  // iOS Safari uses these to make "Add to Home Screen" produce a real app
  // entry with our icon and full-screen chrome rather than a Safari shortcut.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MeQ",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4A90D9",
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
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
