import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cortex — Knowledge Management",
  description: "ระบบบริหารความรู้จากโค้ด",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
