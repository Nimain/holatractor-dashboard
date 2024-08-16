import "../globals.css";
import { ReactNode } from "react";
import ReduxWrapper from "@/components/wrappers/ReduxWrapper";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{fontFamily: 'ARIALCUSTOMFONTS'}}>
        <ReduxWrapper>
        {children}
        </ReduxWrapper>
        </body>
    </html>
  );
}
