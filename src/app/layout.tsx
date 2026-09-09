import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoonWave — Minimal Full-Screen Cinematic Music",
  description:
    "An atmospheric, peaceful full-screen music sanctuary streaming ambient soundscapes paired with slow-zooming scenic landscapes.",
  keywords: [
    "cinematic music",
    "ambient soundscape",
    "relaxing music",
    "peaceful landscapes",
    "focus music",
    "ken burns",
  ],
  authors: [{ name: "MoonWave" }],
};

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full w-full overflow-hidden bg-black text-white"
    >
      <body className="h-full w-full overflow-hidden bg-black select-none antialiased">
        {children}
      </body>
    </html>
  );
}
