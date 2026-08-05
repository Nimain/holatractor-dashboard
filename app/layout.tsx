import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Holatractor Dashboard",
  description: "Holatractor Agriculture & Fleet Management",
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
