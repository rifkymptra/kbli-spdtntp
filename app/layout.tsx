import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cari KBLI SPDT-NTP",
  description: "Aplikasi pencarian komoditas Survei Penyempurnaan Diagram Timbang Nilai Tukar Petani BPS Kabupaten Garut.",
  icons: {
    // Mengarahkan icon tab langsung ke file logo BPS Anda
    icon: "/bps_logo.webp", 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}