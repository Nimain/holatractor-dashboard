import "../globals.css";
import React, { ReactNode } from "react";
import ReduxWrapper from "./_components/ReduxWrapper";
import { GoogleOAuthProvider } from '@react-oauth/google';

const AuthenticationLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Poppins" }} className="w-full min-h-screen">
        <GoogleOAuthProvider clientId="316072302761-qn635is55ki0ons7rk7rshbtlhb1ovkn.apps.googleusercontent.com">
        <ReduxWrapper>
        {children}
        </ReduxWrapper>
        </GoogleOAuthProvider>
        </body>
    </html>
  );
};

export default AuthenticationLayout;
