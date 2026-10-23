import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Holatractor Dashboard",
  description: "Holatractor Agriculture & Fleet Management",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "'Inter', sans-serif" }} className="antialiased min-h-screen bg-slate-50">
        {children}
      </body>
    </html>
  );
}
