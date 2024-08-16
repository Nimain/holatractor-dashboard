import "../globals.css";
import React, { ReactNode } from "react";
import ReduxWrapper from "./_components/ReduxWrapper";

const AuthenticationLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body style={{ fontFamily: "ARIALCUSTOMFONTS" }} className="w-full min-h-screen">
        <ReduxWrapper>
        {children}
        </ReduxWrapper>
        </body>
    </html>
  );
};

export default AuthenticationLayout;
