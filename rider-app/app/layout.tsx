import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import clerkAppearance from '../lib/clerkAppearance';
import { SpaceshipLayerWrapper } from "./components/SpaceshipLayerWrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DriveMe | Viajes Interestelares",
  description: "Tu app de viajes con estilo galáctico. Viaja a cualquier rincón de la galaxia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html
        lang="es"
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <SpaceshipLayerWrapper />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
